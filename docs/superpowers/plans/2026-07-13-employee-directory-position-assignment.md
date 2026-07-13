# Employee Directory and Position Assignment Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Separate employee records from planned positions so Manual employees can be created and assigned later without Microsoft 365 data or implicit position creation.

**Architecture:** Keep the existing employees and positions tables and numeric IDs. Add a small browser-side EmployeeDirectory utility for source classification and assignment summaries, a separate Employee Management modal for employee CRUD, and retain Position Management as the only place that changes position.employeeId. Extract Microsoft matching rules into a server helper so email merge and Manual retention are independently testable.

**Tech Stack:** Vanilla JavaScript, HTML, CSS, Node.js built-in test runner, Vercel serverless API, Supabase, existing SQLite fallback, and the in-app Browser.

## Global Constraints

- Add no new database table or schema migration.
- Preserve numeric employee IDs and position IDs during Microsoft merge and position assignment.
- New local employees use manual-<slug>-<id> as personId; existing person- local IDs remain Manual-compatible.
- Adding an employee must not create a position.
- Saving a position must not create an employee.
- One employee may be assigned to multiple positions.
- Deleting an employee clears only position employeeId links and leaves position records as VACANT.
- Microsoft sync retains unmatched Manual employees and merges matching email addresses without duplicates.
- Use existing modal, form, button, notification, localStorage fallback, and sync-status patterns.
- Do not modify the hierarchy layout algorithm, collapse persistence, or Microsoft Graph permissions.

## File Map

- Create employee-utils.js for pure browser-safe source and assignment helpers exposed as globalThis.EmployeeDirectory.
- Create api/_helpers/employee_merge.js for pure server-side matching and Manual-retention helpers.
- Modify index.html for the Employees action and Employee Management modal/list markup.
- Modify app.js for list rendering, add/edit/delete persistence, source labels, assignment counts, and event wiring.
- Modify style.css for dense responsive employee-management list and modal controls.
- Modify api/sync-microsoft.js to use tested merge helpers.
- Create tests/employee-directory.test.mjs and tests/employee-sync.test.mjs.

---

### Task 1: Add Testable Employee Source and Assignment Utilities

**Files:**
- Create employee-utils.js.
- Create tests/employee-directory.test.mjs.
- Modify index.html to load employee-utils.js before app.js.

**Interfaces:**
- EmployeeDirectory.createManualPersonId(name, id) returns a string.
- EmployeeDirectory.getEmployeeSource(employee) returns manual or microsoft.
- EmployeeDirectory.getAssignmentSummary(employeeId, positions) returns { count, positionIds, status }.
- EmployeeDirectory.createManualEmployee(fields) returns an employee object without position fields.
- EmployeeDirectory.detachEmployeeFromPositions(employeeId, positions) returns copied positions with matching employeeId values cleared.

- [ ] Step 1: Write the failing tests.

~~~js
import { test } from "node:test";
import assert from "node:assert/strict";

await import("../employee-utils.js");
const directory = globalThis.EmployeeDirectory;

test("classifies local and Microsoft employee sources", () => {
    assert.equal(directory.getEmployeeSource({ personId: "manual-jane-12" }), "manual");
    assert.equal(directory.getEmployeeSource({ personId: "person-jane-12" }), "manual");
    assert.equal(directory.getEmployeeSource({ personId: "directory-id-12" }), "microsoft");
});

test("summarizes unassigned and multiple-position employees", () => {
    const positions = [
        { id: 10, employeeId: 4 },
        { id: 11, employeeId: 4 },
        { id: 12, employeeId: null }
    ];
    assert.deepEqual(directory.getAssignmentSummary(4, positions), {
        count: 2, positionIds: [10, 11], status: "assigned"
    });
    assert.deepEqual(directory.getAssignmentSummary(5, positions), {
        count: 0, positionIds: [], status: "unassigned"
    });
});

test("creates manual employees without a position link", () => {
    const employee = directory.createManualEmployee({
        id: 12, name: "Jane Doe", role: "Officer", department: "HR"
    });
    assert.equal(employee.personId, "manual-jane-doe-12");
    assert.equal(Object.hasOwn(employee, "positionId"), false);
});

test("detaches an employee while retaining every position", () => {
    const positions = [
        { id: 20, managerId: null, employeeId: 7, title: "Officer" },
        { id: 21, managerId: 20, employeeId: 7, title: "Acting Officer" }
    ];
    assert.deepEqual(directory.detachEmployeeFromPositions(7, positions), [
        { id: 20, managerId: null, employeeId: null, title: "Officer" },
        { id: 21, managerId: 20, employeeId: null, title: "Acting Officer" }
    ]);
});
~~~

- [ ] Step 2: Run the focused test and verify RED.

Run:

~~~powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\employee-directory.test.mjs
~~~

Expected: FAIL because employee-utils.js and EmployeeDirectory do not exist.

- [ ] Step 3: Implement the minimal utility and load it before app.js.

The browser utility must classify empty, manual-, and person- IDs as Manual, and must return new arrays rather than mutating input positions:

~~~js
(function attachEmployeeDirectory(root) {
    function createManualPersonId(name, id) {
        const slug = String(name || "employee").trim().toLowerCase()
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "employee";
        return `manual-\${slug}-\${id}`;
    }

    function getEmployeeSource(employee) {
        const personId = String(employee?.personId || "").trim().toLowerCase();
        return !personId || personId.startsWith("manual-") || personId.startsWith("person-")
            ? "manual" : "microsoft";
    }

    function getAssignmentSummary(employeeId, positions) {
        const positionIds = (positions || [])
            .filter(position => Number(position.employeeId) === Number(employeeId))
            .map(position => Number(position.id));
        return {
            count: positionIds.length,
            positionIds,
            status: positionIds.length > 0 ? "assigned" : "unassigned"
        };
    }

    function createManualEmployee(fields) {
        return {
            id: fields.id,
            personId: createManualPersonId(fields.name, fields.id),
            name: fields.name,
            role: fields.role,
            department: fields.department,
            managerId: fields.managerId ?? null,
            email: fields.email || "",
            phone: fields.phone || "",
            bio: fields.bio || "",
            photoUrl: fields.photoUrl || "",
            avatarColor: fields.avatarColor || ""
        };
    }

    function detachEmployeeFromPositions(employeeId, positions) {
        return (positions || []).map(position => (
            Number(position.employeeId) === Number(employeeId)
                ? { ...position, employeeId: null }
                : { ...position }
        ));
    }

    root.EmployeeDirectory = Object.freeze({
        createManualPersonId,
        getEmployeeSource,
        getAssignmentSummary,
        createManualEmployee,
        detachEmployeeFromPositions
    });
})(globalThis);
~~~

- [ ] Step 4: Run the focused test and verify all four tests pass.
- [ ] Step 5: Commit the utility.

~~~powershell
git add employee-utils.js tests/employee-directory.test.mjs index.html
git commit -m "feat: add employee source and assignment utilities"
~~~

### Task 2: Build the Employee Management Surface

**Files:**
- Modify index.html beside the existing Positions action and after Position Management markup.
- Modify style.css near existing modal and position-list styles.
- Modify tests/employee-directory.test.mjs.

**Interfaces:**
- Add btn-manage-employees, employee-management-modal, employee-management-modal-overlay, employee-search, employee-list, and employee-summary.
- Add openEmployeeManagementModal(), closeEmployeeManagementModal(), renderEmployeeList(query), and getEmployeeListSearchText(employee).

- [ ] Step 1: Extend the failing contract test.

~~~js
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

test("exposes Employee Management separately from Position Management", () => {
    assert.match(htmlSource, /id="btn-manage-employees"/);
    assert.match(htmlSource, /id="employee-management-modal"/);
    assert.match(htmlSource, /id="employee-search"/);
    assert.match(htmlSource, /id="employee-list"/);
    assert.match(appSource, /function openEmployeeManagementModal\(\)/);
    assert.match(appSource, /function renderEmployeeList\(/);
});
~~~

- [ ] Step 2: Run the employee test and verify the new assertions fail.
- [ ] Step 3: Add the modal markup and responsive styles.

Each employee row is a button with data-employee-id. It shows name, role, department, source, assigned-position count, and Unassigned when count is zero. The list body scrolls independently so the modal remains inside a 390px viewport.

Use existing modal and form tokens. Add employee-row, employee-row-meta, employee-source-badge, employee-assignment-state, and employee-empty-state styles. Keep row action buttons uniquely scoped and keyboard accessible.

- [ ] Step 4: Implement rendering and event wiring.

renderEmployeeList must sort by name, filter case-insensitively by name/role/department/email, call EmployeeDirectory.getEmployeeSource and getAssignmentSummary, and refresh after mutations. Clicking a row opens openEmployeeForm(employee.id); the New Employee action opens openEmployeeForm().

- [ ] Step 5: Run the focused test and node --check app.js. Expected: assertions pass and syntax exits 0.
- [ ] Step 6: Commit the Employee Management surface.

~~~powershell
git add index.html style.css app.js tests/employee-directory.test.mjs
git commit -m "feat: add employee management modal"
~~~

### Task 3: Decouple Add and Edit Employee CRUD from Positions

**Files:**
- Modify app.js in handleFormSubmit, openEmployeeForm, and syncAssignedPositionFromEmployee call sites.
- Modify tests/employee-directory.test.mjs.

**Interfaces:**
- New employee mode persists one employee and leaves positions.length unchanged.
- getNextEmployeeId() returns the next numeric employee ID.
- Position Management remains the only UI that changes position.employeeId.

- [ ] Step 1: Add a regression assertion that the add path uses EmployeeDirectory.createManualEmployee and does not append to positions.
- [ ] Step 2: Run the focused test and verify RED.
- [ ] Step 3: Change handleFormSubmit add mode to create and save only the employee.

The add branch must push newEmployee, call saveData(), refresh Employee Management, and close the form. Remove its getAutoPositionForPosition and positions.push calls. Use EmployeeDirectory.createManualEmployee for new local records. In edit mode, update only employee fields; do not rewrite position title, department, or manager links as a side effect.

- [ ] Step 4: Preserve profile linking and photo compression, then run focused tests and verify GREEN.
- [ ] Step 5: Run the existing position tests to verify position creation and assignment still work through Position Management.
- [ ] Step 6: Commit the CRUD decoupling.

~~~powershell
git add app.js employee-utils.js tests/employee-directory.test.mjs
git commit -m "feat: separate employee records from position creation"
~~~

### Task 4: Add Assignment Counts and Delete-to-Vacant Behavior

**Files:**
- Modify app.js renderEmployeeList and deleteEmployee.
- Modify style.css for source/status row states.
- Modify tests/employee-directory.test.mjs.

**Interfaces:**
- renderEmployeeList(query) shows Manual/Microsoft and assigned/unassigned state.
- deleteEmployee(id) is async and saves both employee and position changes.
- Linked positions keep their IDs, managerId, title, department, layout, and notes.

- [ ] Step 1: Add a failing delete behavior test using EmployeeDirectory.detachEmployeeFromPositions.
- [ ] Step 2: Run the focused test and verify RED.
- [ ] Step 3: Implement deleteEmployee.

The delete flow must confirm, remove the employee, clear matching position employeeId fields with the utility, set employee-level managerId references to null, then await saveData() and savePositions() before re-rendering. Do not reparent position children or delete positions.

- [ ] Step 4: Render assignment counts, source badges, filtered-empty state, and refresh all related surfaces after add/edit/delete.
- [ ] Step 5: Run the focused and full Node test suites; expected result is zero failures.
- [ ] Step 6: Commit deletion and assignment states.

~~~powershell
git add app.js style.css employee-utils.js tests/employee-directory.test.mjs
git commit -m "feat: preserve vacant positions when deleting employees"
~~~

### Task 5: Make Microsoft Retention and Email Merge Explicit and Testable

**Files:**
- Create api/_helpers/employee_merge.js.
- Modify api/sync-microsoft.js.
- Create tests/employee-sync.test.mjs.

**Interfaces:**
- normalizeEmail(value) returns trimmed lowercase email or empty string.
- findExistingEmployee(existingEmployees, microsoftUser) returns an employee or null.
- isManualEmployee(employee, microsoftPersonIds) returns a boolean.

- [ ] Step 1: Write failing server-helper tests.

~~~js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    findExistingEmployee,
    isManualEmployee
} from "../api/_helpers/employee_merge.js";

test("matches Microsoft users to Manual employee by normalized email", () => {
    const existing = [{ id: 900, email: "Jane@Example.com", person_id: "manual-jane-900" }];
    const match = findExistingEmployee(existing, { mail: " jane@example.com " });
    assert.equal(match.id, 900);
});

test("retains Manual employees not returned by Microsoft", () => {
    assert.equal(isManualEmployee({ person_id: "manual-jane-900" }, new Set(["ms-guid-1"])), true);
    assert.equal(isManualEmployee({ person_id: "ms-guid-1" }, new Set(["ms-guid-1"])), false);
});
~~~

Expected initial failure: the helper module and exports are absent.

- [ ] Step 2: Implement the helpers and use email before directory ID for matching.
- [ ] Step 3: Replace the inline map/filter logic in api/sync-microsoft.js with the helpers. Preserve photo retrieval, local numeric IDs, Microsoft field updates, manual rows, delete-and-insert behavior, and response shape.
- [ ] Step 4: Run sync tests and syntax checks.

~~~powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\employee-sync.test.mjs
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check api\_helpers\employee_merge.js
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check api\sync-microsoft.js
~~~

Expected: all sync tests pass and syntax checks exit 0.

- [ ] Step 5: Commit Microsoft merge behavior.

~~~powershell
git add api/_helpers/employee_merge.js api/sync-microsoft.js tests/employee-sync.test.mjs
git commit -m "feat: preserve manual employees during Microsoft sync"
~~~

### Task 6: Integration Verification and Responsive QA

**Files:**
- Modify tests only if a verified regression is found.
- Do not commit screenshots or temporary reports.

**Target flow:** app loads -> open Employees -> add Manual employee -> position count remains unchanged -> assign from Positions -> assign a second position -> delete employee -> both seats remain VACANT.

- [ ] Step 1: Run the complete automated suite and syntax checks.

~~~powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\*.test.mjs
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check app.js
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check api\employees.js
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check api\positions.js
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check api\sync-microsoft.js
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m py_compile server.py
git diff --check
~~~

Expected: all tests pass, syntax checks exit 0, Python compile exits 0, and diff check reports no whitespace errors.

- [ ] Step 2: Start the existing local server at http://127.0.0.1:8000 and run the Browser flow.
- [ ] Step 3: Verify desktop and 390x844 mobile layouts: first-viewport controls, modal bounds, contained list scrolling, no row overlap, no clipped source/status text, and no Browser console errors or warnings.
- [ ] Step 4: Review git status and commit only the verified feature changes.

~~~powershell
git status --short
git diff --check
git commit -am "feat: separate employee directory from positions"
~~~

## Self-Review Checklist

- Task 1 covers source classification, Manual IDs, assignment counts, and deletion detach behavior.
- Tasks 2-4 cover Employee Management UI, no implicit position creation, multiple assignments, and delete-to-vacant behavior.
- Task 5 covers Manual retention and normalized email merge without changing API routes or IDs.
- Task 6 covers the target user flow, desktop/mobile UI, console health, and existing regression suite.
- No task requires a database migration or an unbounded feature expansion.
- All named functions and files are defined before later tasks consume them.

