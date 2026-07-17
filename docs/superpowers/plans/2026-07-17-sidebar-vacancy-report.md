# Sidebar Vacancy Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add accurate employee, position, and vacancy counts to the sidebar and open a detailed vacant-position report by selecting the vacancy statistic.

**Architecture:** Keep the existing client-side `employees` and `positions` state and add one pure summary helper to the existing `EmployeeDirectory` utility. The sidebar and report modal will consume the same summary object so counts and details share one vacancy definition. The modal will use existing overlay/modal conventions and refresh through `renderAll()` after mutations.

**Tech Stack:** Vanilla JavaScript, HTML, CSS, Node.js built-in test runner, Lucide icons.

## Global Constraints

- Do not add data-model changes, API endpoints, persistence changes, dashboard charts, department-level vacancy filtering, or position-assignment changes.
- Count a position as vacant when `getAssignedEmployee(position)` would return no employee, including a missing or stale employee reference.
- Escape all dynamic position titles and departments before inserting them into HTML.
- Keep the vacancy trigger keyboard operable with a visible focus state and an accessible name.
- Preserve the existing employee-directory, position-management, chart, and viewer behavior.
- Follow red-green-refactor: each new behavior starts with a failing focused test, then minimal implementation, then a passing focused test.
- Preserve unrelated dirty-worktree changes; stage only files belonging to this feature in each commit.

## File Map

- Modify `employee-utils.js`: add the pure `EmployeeDirectory.getStaffingSummary(employees, positions)` view-model helper.
- Create `tests/staffing-summary.test.mjs`: test summary calculations plus the HTML/CSS/app integration contract.
- Modify `index.html`: replace the ambiguous two-card sidebar statistics with employee/position/vacancy cards and add the vacancy report modal.
- Modify `style.css`: style the full-width clickable vacancy card, focus state, report body/list, and mobile-safe dimensions.
- Modify `app.js`: consume the shared summary, render the report, wire open/close/Escape behavior, and refresh an open report after `renderAll()`.

---

### Task 1: Add the pure staffing summary model

**Files:**
- Create: `tests/staffing-summary.test.mjs`
- Modify: `employee-utils.js`

**Interfaces:**
- Consumes: arrays of employee records and position records with numeric IDs and nullable `employeeId` values.
- Produces: `EmployeeDirectory.getStaffingSummary(employees, positions)` returning `{ employeeCount, positionCount, vacantCount, vacantPositions }`, where each `vacantPositions` item is `{ id, title, department }` sorted by department and then title.

- [ ] **Step 1: Write the failing summary tests**

Create `tests/staffing-summary.test.mjs` with this test-first contract:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

await import("../employee-utils.js");
const directory = globalThis.EmployeeDirectory;

test("summarizes employees, positions, and sorted vacant positions", () => {
    assert.equal(typeof directory.getStaffingSummary, "function");

    const summary = directory.getStaffingSummary(
        [{ id: 7, name: "Filled" }],
        [
            { id: 12, employeeId: null, title: "Operator", department: "Zeta" },
            { id: 11, employeeId: 7, title: "Director", department: "Alpha" },
            { id: 13, employeeId: 999, title: "Analyst", department: "Alpha" }
        ]
    );

    assert.equal(summary.employeeCount, 1);
    assert.equal(summary.positionCount, 3);
    assert.equal(summary.vacantCount, 2);
    assert.deepEqual(summary.vacantPositions, [
        { id: 13, title: "Analyst", department: "Alpha" },
        { id: 12, title: "Operator", department: "Zeta" }
    ]);
});

test("returns zero counts and a stable empty list for missing collections", () => {
    const summary = directory.getStaffingSummary();
    assert.deepEqual(summary, {
        employeeCount: 0,
        positionCount: 0,
        vacantCount: 0,
        vacantPositions: []
    });
});

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");
```

- [ ] **Step 2: Run the focused tests and confirm the expected red state**

Run: `node --test tests/staffing-summary.test.mjs`

Expected: the first test fails at `typeof directory.getStaffingSummary` because the helper is not exposed yet; no production implementation exists for this feature.

- [ ] **Step 3: Implement the minimal pure helper**

In `employee-utils.js`, add the following before the exported object and expose it from `Object.freeze`:

```javascript
    function getStaffingSummary(employees, positions) {
        const people = Array.isArray(employees) ? employees : [];
        const seats = Array.isArray(positions) ? positions : [];
        const vacantPositions = seats
            .filter(position => {
                if (position?.employeeId === null || position?.employeeId === undefined) return true;
                return !people.some(employee => employee?.id === position.employeeId);
            })
            .map(position => ({
                id: position?.id ?? null,
                title: String(position?.title || "Open Position").trim() || "Open Position",
                department: String(position?.department || "Unassigned").trim() || "Unassigned"
            }))
            .sort((a, b) => {
                const departmentOrder = a.department.localeCompare(b.department);
                return departmentOrder !== 0
                    ? departmentOrder
                    : a.title.localeCompare(b.title);
            });

        return {
            employeeCount: people.length,
            positionCount: seats.length,
            vacantCount: vacantPositions.length,
            vacantPositions
        };
    }

    root.EmployeeDirectory = Object.freeze({
        // existing methods...
        getStaffingSummary
    });
```

Do not mutate either input collection; unresolved employee references must remain vacant.

- [ ] **Step 4: Run the focused tests and confirm green**

Run: `node --test tests/staffing-summary.test.mjs`

Expected: 2 passing tests and 0 failures.

- [ ] **Step 5: Commit the utility and its tests**

```bash
git add employee-utils.js tests/staffing-summary.test.mjs
git commit -m "feat: add staffing summary helper"
```

### Task 2: Add the sidebar trigger and vacancy report markup/styles

**Files:**
- Modify: `tests/staffing-summary.test.mjs`
- Modify: `index.html`
- Modify: `style.css`

**Interfaces:**
- Consumes: the summary contract from Task 1 and the existing modal/overlay CSS conventions.
- Produces: `#vacant-positions-card`, `#total-employees`, `#total-positions`, `#total-vacant-positions`, `#vacancy-report-modal-overlay`, `#vacancy-report-modal`, `#vacancy-report-title`, `#close-vacancy-report-modal`, and `#vacancy-report-list` DOM targets.

- [ ] **Step 1: Write failing markup and style contract tests**

Append these tests to `tests/staffing-summary.test.mjs`:

```javascript
test("defines distinct sidebar statistics and an interactive vacancy card", () => {
    assert.match(htmlSource, /id="total-employees"/);
    assert.match(htmlSource, /id="total-positions"/);
    assert.match(htmlSource, /id="total-vacant-positions"/);
    assert.match(htmlSource, /<button[^>]+id="vacant-positions-card"/);
    assert.match(htmlSource, /aria-controls="vacancy-report-modal"/);
    assert.match(htmlSource, /id="vacancy-report-modal"/);
    assert.match(htmlSource, /id="vacancy-report-modal-overlay"/);
    assert.match(htmlSource, /id="vacancy-report-list"/);
});

test("styles the vacancy statistic as an accessible interactive card", () => {
    assert.match(styleSource, /\.stat-card-action\s*\{/);
    assert.match(styleSource, /\.stat-card-action:focus-visible\s*\{/);
    assert.match(styleSource, /\.stat-card-vacant\s*\{/);
    assert.match(styleSource, /\.vacancy-report-list\s*\{/);
    assert.match(styleSource, /\.vacancy-report-empty\s*\{/);
});
```

- [ ] **Step 2: Run the focused tests and confirm the expected red state**

Run: `node --test tests/staffing-summary.test.mjs`

Expected: the two new tests fail because the current HTML still has the old `total-headcount`/`total-departments` cards and no report modal or related styles.

- [ ] **Step 3: Replace the sidebar statistics and add the report modal**

In `index.html`, replace the existing Statistics contents with:

```html
<div class="stats-grid">
    <div class="stat-card">
        <span class="stat-value" id="total-employees">0</span>
        <span class="stat-label">Employees</span>
    </div>
    <div class="stat-card">
        <span class="stat-value" id="total-positions">0</span>
        <span class="stat-label">Positions</span>
    </div>
    <button type="button" class="stat-card stat-card-action stat-card-vacant" id="vacant-positions-card" aria-controls="vacancy-report-modal" aria-haspopup="dialog" aria-label="View vacant positions">
        <span class="stat-value" id="total-vacant-positions">0</span>
        <span class="stat-label">Vacant positions</span>
        <i data-lucide="arrow-up-right" aria-hidden="true"></i>
    </button>
</div>
```

After the position-management modal, add:

```html
<div class="modal-overlay" id="vacancy-report-modal-overlay"></div>
<div class="modal vacancy-report-modal" id="vacancy-report-modal" role="dialog" aria-modal="true" aria-labelledby="vacancy-report-title">
    <div class="modal-header">
        <h3 id="vacancy-report-title">Vacant positions (0)</h3>
        <button type="button" class="close-btn" id="close-vacancy-report-modal" aria-label="Close vacant position report">
            <i data-lucide="x"></i>
        </button>
    </div>
    <div class="vacancy-report-body">
        <div class="vacancy-report-list" id="vacancy-report-list"></div>
    </div>
</div>
```

- [ ] **Step 4: Add focused styling without changing the sidebar footprint**

Add to `style.css`:

```css
.stat-card-action {
    width: 100%;
    border: 1px solid var(--border-color);
    font: inherit;
    cursor: pointer;
    position: relative;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}

.stat-card-action:hover {
    border-color: var(--accent-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
}

.stat-card-action:focus-visible {
    outline: 3px solid var(--accent-primary);
    outline-offset: 2px;
}

.stat-card-vacant {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas: "value icon" "label icon";
    align-items: center;
    text-align: left;
}

.stat-card-vacant .stat-value { grid-area: value; }
.stat-card-vacant .stat-label { grid-area: label; }
.stat-card-vacant > svg { grid-area: icon; width: 18px; height: 18px; color: var(--accent-primary); }

.vacancy-report-modal {
    width: 520px;
    max-width: 94vw;
}

.vacancy-report-body {
    padding: 20px 24px 24px;
    min-height: 0;
    overflow-y: auto;
}

.vacancy-report-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 62vh;
    overflow-y: auto;
}

.vacancy-report-empty {
    padding: 28px 16px;
    border: 1px dashed var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    text-align: center;
}

@media (max-width: 480px) {
    .vacancy-report-modal { max-width: calc(100vw - 24px); }
    .vacancy-report-body { padding: 16px; }
}
```

Keep the existing `.vacant-report-card`, `.vacant-report-card-title`, and `.vacant-report-card-dept` styles for the dynamically rendered items.

- [ ] **Step 5: Run the focused tests and confirm green**

Run: `node --test tests/staffing-summary.test.mjs`

Expected: 4 passing tests and 0 failures; app wiring tests are intentionally added in Task 3.

- [ ] **Step 6: Commit the markup and styles**

```bash
git add index.html style.css tests/staffing-summary.test.mjs
git commit -m "feat: add vacancy report surface"
```

### Task 3: Connect counts, report rendering, and modal interaction

**Files:**
- Modify: `tests/staffing-summary.test.mjs`
- Modify: `app.js`

**Interfaces:**
- Consumes: `EmployeeDirectory.getStaffingSummary(employees, positions)` and the DOM IDs from Task 2.
- Produces: `renderVacancyReport()`, `openVacancyReportModal()`, and `closeVacancyReportModal()` used by the existing render and event-listener flows.

- [ ] **Step 1: Write failing app integration contract tests**

Append these tests to `tests/staffing-summary.test.mjs`:

```javascript
test("wires sidebar counts and the vacancy report into the app", () => {
    assert.match(appSource, /EmployeeDirectory\.getStaffingSummary\(employees, positions\)/);
    assert.match(appSource, /function renderVacancyReport\(\)/);
    assert.match(appSource, /function openVacancyReportModal\(\)/);
    assert.match(appSource, /function closeVacancyReportModal\(\)/);
    assert.match(appSource, /getElementById\("vacant-positions-card"\)/);
    assert.match(appSource, /getElementById\("close-vacancy-report-modal"\)/);
    assert.match(appSource, /getElementById\("vacancy-report-modal-overlay"\)/);
    assert.match(appSource, /event\.key === "Escape"/);
});

test("refreshes an open vacancy report from renderAll", () => {
    assert.match(appSource, /function renderAll\(\)[\s\S]*?vacancy-report-modal[\s\S]*?renderVacancyReport\(\)/);
});
```

- [ ] **Step 2: Run the focused tests and confirm the expected red state**

Run: `node --test tests/staffing-summary.test.mjs`

Expected: the two new app integration tests fail because `app.js` still writes the old statistic IDs and has no vacancy-report functions or listeners.

- [ ] **Step 3: Use the shared summary in `renderSidebarStats()`**

Replace the existing count implementation with:

```javascript
function renderSidebarStats() {
    const summary = EmployeeDirectory.getStaffingSummary(employees, positions);
    document.getElementById("total-employees").innerText = summary.employeeCount;
    document.getElementById("total-positions").innerText = summary.positionCount;
    document.getElementById("total-vacant-positions").innerText = summary.vacantCount;
    document.getElementById("vacant-positions-card").setAttribute(
        "aria-label",
        `View vacant positions (${summary.vacantCount})`
    );
}
```

Do not keep references to `total-headcount` or `total-departments`, because those IDs no longer describe the displayed metrics.

- [ ] **Step 4: Add report rendering and modal lifecycle functions**

Add these functions near the existing position/employee modal functions:

```javascript
function renderVacancyReport() {
    const summary = EmployeeDirectory.getStaffingSummary(employees, positions);
    const title = document.getElementById("vacancy-report-title");
    const list = document.getElementById("vacancy-report-list");
    title.innerText = `Vacant positions (${summary.vacantCount})`;

    if (summary.vacantCount === 0) {
        list.innerHTML = `<div class="vacancy-report-empty">No vacant positions</div>`;
        return;
    }

    list.innerHTML = summary.vacantPositions.map(position => `
        <div class="vacant-report-card">
            <span class="vacant-report-card-title">${escapeHTML(position.title)}</span>
            <span class="vacant-report-card-dept">${escapeHTML(position.department)}</span>
        </div>
    `).join("");
}

function openVacancyReportModal() {
    document.getElementById("vacancy-report-modal-overlay").classList.add("active");
    document.getElementById("vacancy-report-modal").classList.add("active");
    renderVacancyReport();
    if (window.lucide) window.lucide.createIcons();
    document.getElementById("close-vacancy-report-modal").focus();
}

function closeVacancyReportModal() {
    document.getElementById("vacancy-report-modal-overlay").classList.remove("active");
    document.getElementById("vacancy-report-modal").classList.remove("active");
    document.getElementById("vacant-positions-card").focus();
}
```

- [ ] **Step 5: Wire click, overlay, close, and Escape interactions**

Inside `setupEventListeners()`, add:

```javascript
document.getElementById("vacant-positions-card").addEventListener("click", openVacancyReportModal);
document.getElementById("close-vacancy-report-modal").addEventListener("click", closeVacancyReportModal);
document.getElementById("vacancy-report-modal-overlay").addEventListener("click", closeVacancyReportModal);
document.addEventListener("keydown", event => {
    const modal = document.getElementById("vacancy-report-modal");
    if (event.key === "Escape" && modal?.classList.contains("active")) {
        closeVacancyReportModal();
    }
});
```

In `renderAll()`, refresh the report only when it is open:

```javascript
const vacancyReportModal = document.getElementById("vacancy-report-modal");
if (vacancyReportModal?.classList.contains("active")) {
    renderVacancyReport();
}
```

- [ ] **Step 6: Run focused tests and confirm green**

Run: `node --test tests/staffing-summary.test.mjs`

Expected: 6 passing tests and 0 failures.

- [ ] **Step 7: Commit the app integration**

```bash
git add app.js tests/staffing-summary.test.mjs
git commit -m "feat: wire sidebar vacancy report"
```

### Task 4: Full verification and responsive review

**Files:**
- Verify: `employee-utils.js`, `index.html`, `style.css`, `app.js`, and `tests/staffing-summary.test.mjs`

- [ ] **Step 1: Run the complete automated suite**

Run: `node --test tests/*.test.mjs`

Expected: exit code 0 with all tests passing and no test failures.

- [ ] **Step 2: Run syntax checks for changed JavaScript**

Run: `node --check employee-utils.js`

Expected: no output and exit code 0.

Run: `node --check app.js`

Expected: no output and exit code 0.

- [ ] **Step 3: Verify the UI manually at desktop and mobile widths**

Run the existing local app server, then verify at the default desktop viewport and a 390px-wide viewport:

1. Sidebar shows separate employee, position, and vacancy values.
2. Clicking the vacancy card opens the report with every vacancy title and department.
3. Tab to the vacancy card, press Enter, and confirm the same report opens with a visible focus ring.
4. Close via the X, overlay, and Escape; focus returns to the vacancy card.
5. Change an assignment while the report is open and confirm both its title count and list refresh.
6. With zero vacant positions, confirm the empty state fits without clipping.

- [ ] **Step 4: Inspect the final diff and commit any verification-only fixes**

Run: `git diff --check` and `git status --short`

Expected: no whitespace errors; unrelated pre-existing changes remain unstaged. If a feature fix is needed, repeat the relevant red-green test cycle before committing it.
