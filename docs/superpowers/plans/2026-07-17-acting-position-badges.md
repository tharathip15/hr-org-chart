# Acting Position Badges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display `Acting` for every non-primary position assigned to an employee who holds multiple positions.

**Architecture:** Keep `OrgHierarchy.isPrimaryEmployeePosition(positions, positionId, employeeId)` as the source of primary-seat truth. Add one UI-only helper in `app.js` that derives whether a filled position is acting, then render it in the organization-chart card and Position Management row. Styling is local to the existing status-chip components; no model, API, or database changes are required.

**Tech Stack:** Vanilla JavaScript, HTML template strings, CSS, Node.js built-in test runner.

## Global Constraints

- The first position in `positions` assigned to an employee remains their primary position.
- All later positions assigned to that employee display `Acting`.
- Do not persist an acting flag or modify API/database payloads.
- Do not show `Acting` on vacant positions or employees assigned to only one position.
- Render the label on chart cards and Position Management rows.
- Preserve the user's existing unrelated dirty changes in `app.js` and `index.html`.
- Use `apply_patch` for source and test edits.

---

## File Structure

- `app.js`: derives acting status from the current positions collection and inserts badge markup in both render surfaces.
- `style.css`: groups chart card status chips and styles the Acting chip/list label.
- `tests/position-first-org-chart.test.mjs`: locks the rendered acting-status contract to the existing shared hierarchy helper.

### Task 1: Derive and Render Acting Position Status

**Files:**
- Modify: `C:/Project/hr-org-chart/tests/position-first-org-chart.test.mjs`
- Modify: `C:/Project/hr-org-chart/app.js` near `getAssignedEmployee`, `getPositionCardHTML`, and `renderPositionsList`
- Modify: `C:/Project/hr-org-chart/style.css` near `.position-card-footer` and `.position-row-meta`

**Interfaces:**
- Consumes: `getAssignedEmployee(position)` and `OrgHierarchy.isPrimaryEmployeePosition(positions, position.id, employee.id)`.
- Produces: `isActingPosition(position): boolean`, plus `position-status-acting` chart markup and `position-row-acting` list markup.

- [ ] **Step 1: Write the failing source/UI contract test**

Append this test to `C:/Project/hr-org-chart/tests/position-first-org-chart.test.mjs`:

```js
test("non-primary assigned positions are rendered as Acting", () => {
    assert.match(appSource, /function isActingPosition\(position\) \{[\s\S]+OrgHierarchy\.isPrimaryEmployeePosition\(positions, position\.id, employee\.id\)/);
    assert.match(appSource, /const isActing = isActingPosition\(position\);/);
    assert.match(appSource, /position-status-acting/);
    assert.match(appSource, /position-row-acting/);
    assert.match(cssSource, /\.position-status-acting/);
    assert.match(cssSource, /\.position-row-acting/);
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\position-first-org-chart.test.mjs
```

Expected: the new test fails because `isActingPosition`, `position-status-acting`, and `position-row-acting` do not yet exist; all prior tests continue to pass.

- [ ] **Step 3: Add the single acting-state helper**

Immediately after `getAssignedEmployee(position)` in `C:/Project/hr-org-chart/app.js`, add:

```js
function isActingPosition(position) {
    const employee = getAssignedEmployee(position);
    return Boolean(employee && !OrgHierarchy.isPrimaryEmployeePosition(positions, position.id, employee.id));
}
```

This makes the existing shared primary-position rule the sole classification source and returns `false` for vacant positions.

- [ ] **Step 4: Render the chart-card badge**

Inside `getPositionCardHTML(position)`, add the following directly after `const isVacant = !employee;`:

```js
const isActing = isActingPosition(position);
```

Replace the existing single filled/vacant status span inside `.position-card-footer` with:

```js
<div class="position-status-group">
    <span class="${isVacant ? "position-status-vacant" : "position-status-filled"}">
        ${isVacant ? "Open Position" : "Filled"}
    </span>
    ${isActing ? `<span class="position-status-acting">Acting</span>` : ""}
</div>
```

Leave the department badge and the existing `Dual` indicator unchanged.

- [ ] **Step 5: Render the Position Management label**

At the beginning of the `sortedPositions.map(position => { ... })` callback in `renderPositionsList()`, add:

```js
const isActing = isActingPosition(position);
```

In the `.position-row-meta` template, keep the employee name and insert this label before the reporting-line `<small>`:

```js
${isActing ? `<small class="position-row-acting">Acting</small>` : ""}
```

The finished metadata order is employee or `VACANT`, optional `Acting`, then the existing `Reports to …` or `Top level` text.

- [ ] **Step 6: Add compact, responsive badge styling**

In `C:/Project/hr-org-chart/style.css`, add:

```css
.position-status-group {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    min-width: 0;
}

.position-status-vacant,
.position-status-filled,
.position-status-acting {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 3px 8px;
    border-radius: var(--radius-full);
    white-space: nowrap;
}

.position-status-acting {
    color: #92400e;
    background-color: #fef3c7;
}

.position-row-acting {
    color: #92400e !important;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}
```

Replace the existing two-selector status-chip rule with the three-selector version shown above; retain the existing vacant and filled color declarations. The existing mobile one-column row layout keeps the label readable without a breakpoint change.

- [ ] **Step 7: Run the focused test to verify GREEN**

Run:

```powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\position-first-org-chart.test.mjs
```

Expected: all tests pass, including `non-primary assigned positions are rendered as Acting`.

- [ ] **Step 8: Commit only the Acting changes**

Review that no unrelated dirty `app.js` or `index.html` hunks are staged. Stage `style.css` and the focused test, then use patch staging for only the new Acting hunks in `app.js`:

```powershell
git add -- style.css tests\position-first-org-chart.test.mjs
git add -p app.js
git diff --cached --check
git diff --cached -- app.js style.css tests\position-first-org-chart.test.mjs
git commit -m "feat: mark secondary positions as acting"
```

Expected: the staged diff contains `isActingPosition`, the two rendering changes, matching CSS, and the test only.

### Task 2: Full Regression Verification

**Files:**
- Verify: `C:/Project/hr-org-chart/tests/*.test.mjs`
- Verify: `C:/Project/hr-org-chart/app.js`
- Verify: `C:/Project/hr-org-chart/style.css`

**Interfaces:**
- Consumes: the committed UI-only acting-state change from Task 1.
- Produces: fresh evidence that existing position, employee, hierarchy, and browser-source contracts remain valid.

- [ ] **Step 1: Run all automated tests**

Run:

```powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\*.test.mjs
```

Expected: every test passes with zero failures.

- [ ] **Step 2: Verify JavaScript syntax and whitespace**

Run:

```powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check app.js
git diff --check
git status --short
```

Expected: the JavaScript syntax check exits 0 and `git diff --check` produces no errors. `git status --short` may still show the user's pre-existing unrelated `app.js` and `index.html` edits.

- [ ] **Step 3: Re-read the acceptance criteria against the final diff**

Run:

```powershell
git show --check --stat --oneline HEAD
git diff -- app.js style.css tests\position-first-org-chart.test.mjs
```

Confirm from the code and test output that one-seat and vacant positions have no badge; the first assigned seat remains primary; subsequent seats display `Acting` in both render surfaces; and no API, database, or assignment payload changed.
