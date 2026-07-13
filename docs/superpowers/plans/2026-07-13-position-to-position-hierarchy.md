# Position-to-Position Hierarchy Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make \`position.managerId\` the only source of truth for the Org Chart hierarchy and provide a stable position-parent editor independent of employee manager data.

**Architecture:** Keep the existing position-first chart, API, database schema, coordinates, and collapse persistence. Add one pure parent-validation helper to the shared hierarchy utility, use a native position-ID select in Position Management, derive employee reporting details from assigned positions, and remove employee-manager inference from position loading and saving.

**Tech Stack:** Vanilla JavaScript, HTML, CSS, Node.js built-in test runner, existing Vercel/Supabase API, localStorage fallback, and the in-app Browser.

## Global Constraints

- Use \`position.managerId\` as the only source of truth for Org Chart hierarchy.
- Keep \`employee.managerId\` for Microsoft sync/history compatibility but do not use it to render, lay out, repair, or auto-parent positions.
- Preserve the existing \`employees\` and \`positions\` APIs and database schema.
- Keep multiple top-level positions valid.
- Reject self-parenting, descendant-parenting, missing parent IDs, and invalid input.
- Preserve vacant seats, dual-position assignment, delete-to-parent behavior, collapse state, layout style, localStorage backups, sync-status notifications, and viewer restrictions.
- Do not revert unrelated dirty changes already present in \`app.js\); inspect and work with them.
- Use \`apply_patch\` for manual edits.

## File Map

- Modify \`hierarchy-utils.js\` to expose \`validatePositionParent(positions, positionId, parentId)\`.
- Modify \`tests/hierarchy-utils.test.mjs\` for parent validation and cycle edge cases.
- Modify \`app.js\` to remove employee-manager inference, consume the validator, populate the parent select, render parent/child metadata, and derive employee detail reporting from positions.
- Modify \`index.html\` to replace the free-text parent datalist with a position select and remove the editable employee Reports To person selector.
- Modify \`style.css\` for parent help text and responsive Position Management metadata.
- Modify \`tests/position-first-org-chart.test.mjs\` for the position-only contract and UI markup.
- Modify \`tests/employee-directory.test.mjs\` if employee-detail assertions need to document derived position reporting.

---

### Task 1: Add Pure Parent-Position Validation

**Files:**
- Modify: \`hierarchy-utils.js\`
- Modify: \`tests/hierarchy-utils.test.mjs\`

**Interfaces:**
- Consumes: position records with numeric or string \`id\`/\`managerId\`, a current position ID, and a candidate parent ID.
- Produces: \`OrgHierarchy.validatePositionParent(positions, positionId, parentId)\` returning \`{ valid: boolean, reason: string|null }\`.

- [ ] **Step 1: Write the failing tests**

Append tests that assert:
- null parent and an unrelated parent return \`{ valid: true, reason: null }\`;
- self-parenting returns reason \`self\`;
- a descendant parent returns reason \`descendant\`;
- a missing parent returns reason \`missing\`.

Use a three-position chain \`1 -> 2 -> 3\` and an unrelated root \`4\`.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\hierarchy-utils.test.mjs
```

Expected: existing tests pass and the new tests fail because \`validatePositionParent\` is not exported.

- [ ] **Step 3: Implement the minimal helper**

Add \`validatePositionParent\` beside \`repairPositionHierarchy\`. Normalize IDs with \`toInteger\`. Return valid for null parent, missing for absent IDs, self for equal IDs, and walk upward from the candidate parent with a visited set to detect a descendant. Export it from the frozen \`OrgHierarchy\` object.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the same Node test command. Expected: all hierarchy utility tests pass with zero failures.

- [ ] **Step 5: Commit the isolated utility/test change**

```powershell
git add hierarchy-utils.js tests/hierarchy-utils.test.mjs
git diff --cached --check
git commit -m "feat: validate position parent relationships"
```

Before committing, confirm no unrelated \`app.js\` changes are staged.

### Task 2: Remove Employee-Manager Inference From Position Loading and Saving

**Files:**
- Modify: \`app.js\`
- Modify: \`tests/position-first-org-chart.test.mjs\`

**Interfaces:**
- Consumes: \`loadPositions()\`, \`handlePositionFormSubmit(e)\`, and \`OrgHierarchy.validatePositionParent\`.
- Produces: position creation and edits whose \`managerId\` is explicitly selected from a position or is null.

- [ ] **Step 1: Write failing source-contract tests**

Add tests that assert:
- \`loadPositions\` no longer calls \`getPositionManagerIdFromEmployeeManager(employee.managerId, ...)\`;
- the dead employee-manager self-healing block is absent;
- the position form calls \`OrgHierarchy.validatePositionParent\`;
- newly auto-created positions contain \`managerId: null\`.

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\position-first-org-chart.test.mjs
```

Expected: the new contract tests fail because current loading still derives a parent from employee manager data.

- [ ] **Step 3: Change new auto-created positions to top level**

In \`loadPositions\`, keep the existing vacant-position role/department match. In the branch that creates a new position for an unassigned employee, use \`getAutoPositionForPosition(null)\` and set \`managerId: null\`. Remove the dead \`if (false)\` employee-manager self-healing block and delete \`getPositionManagerIdFromEmployeeManager\` if no caller remains.

- [ ] **Step 4: Remove employee-manager synchronization from position save**

In \`handlePositionFormSubmit\`, keep employee assignment validation and the \`employeeId\` link. Remove the block that changes \`employees[empIndex].managerId\` from the selected parent position. Saving a position must persist positions without mutating employee hierarchy fields.

- [ ] **Step 5: Run syntax and focused tests**

```powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check app.js
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\position-first-org-chart.test.mjs
```

Expected: syntax exits 0 and all position-first tests pass.

- [ ] **Step 6: Commit only intended app.js and test hunks**

Inspect both \`git diff -- app.js\` and \`git diff --cached -- app.js\`. Preserve the pre-existing annotation/department dirty hunks. Use \`git add -p app.js\` when possible; if staging cannot isolate them, leave the combined app.js worktree changes uncommitted rather than reverting anything.

### Task 3: Make Position Management a Stable Parent-Position Editor

**Files:**
- Modify: \`index.html\`
- Modify: \`app.js\`
- Modify: \`style.css\`
- Modify: \`tests/position-first-org-chart.test.mjs\`

**Interfaces:**
- Consumes: \`populatePositionFormLookups(excludePositionId)\`, \`resetPositionForm(editId)\`, \`handlePositionFormSubmit(e)\`, \`getPositionOptionLabel(position)\`, and \`getDescendantPositionIds(positionId)\`.
- Produces: \`select#form-position-manager\` whose value is a position ID or empty string, plus parent/child metadata in Position Management rows.

- [ ] **Step 1: Write failing UI contract tests**

Add tests that assert:
- \`form-position-manager\` is a \`select\`, not an input tied to a datalist;
- the markup contains \`Top Level\`;
- lookup code inserts options whose values are position IDs;
- the position list renders parent information and a direct-child count.

- [ ] **Step 2: Run the focused test and verify RED**

Run the position-first test command. Expected: new tests fail because the HTML uses an input/datalist and the list does not render child counts.

- [ ] **Step 3: Replace the parent datalist with a select**

Replace the parent input and datalist with:

```html
<label for="form-position-manager">Reports To Position</label>
<select id="form-position-manager">
    <option value="">Top Level</option>
</select>
<small class="form-help-text">Choose the position this seat reports directly to.</small>
```

Keep employee assignment as a separate seat-to-employee lookup.

- [ ] **Step 4: Populate and restore the select by position ID**

Update \`populatePositionFormLookups\` to clear the select, insert the empty Top Level option, sort eligible positions by title, exclude the current position and all descendants, and use \`String(position.id)\` as option values with \`getPositionOptionLabel(position)\` as visible labels.

Update \`resetPositionForm\` to assign \`String(position.managerId)\` or an empty string. Update \`handlePositionFormSubmit\` to parse the select value, convert empty to null, and call the shared validator. Keep visible notifications for invalid, self, and descendant states.

- [ ] **Step 5: Add child counts and parent metadata**

In \`renderPositionsList\`, compute the number of positions whose \`managerId\` equals the row position ID. Render the parent as \`Reports to <title>\` or \`Top level\`, followed by the number of direct reports. Keep VACANT styling and keyboard-accessible row buttons.

- [ ] **Step 6: Add responsive styles**

Style \`.form-help-text\` with existing secondary text tokens. Give the select full width and the existing form-control border/background. Allow position row metadata to wrap at narrow widths without overlapping the title or employee state.

- [ ] **Step 7: Run focused tests and syntax check**

```powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check app.js
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\position-first-org-chart.test.mjs
```

Expected: zero syntax errors and all focused tests pass.

### Task 4: Derive Employee Reporting Details From Positions

**Files:**
- Modify: \`index.html\`
- Modify: \`app.js\`
- Modify: \`tests/employee-directory.test.mjs\`

**Interfaces:**
- Consumes: \`getPrimaryPositionForEmployee(employeeId)\`, \`getAssignedEmployee(position)\`, \`positions\`, and \`employees\`.
- Produces: employee detail reporting sections derived from assigned position edges; no editable person-based manager selector.

- [ ] **Step 1: Write failing source/UI tests**

Add tests that assert:
- employee markup no longer contains \`form-manager\`;
- employee submit code no longer parses \`form-manager\` or assigns employee manager from a position;
- employee details call \`getPrimaryPositionForEmployee(id)\`, inspect \`primaryPosition.managerId\`, and label the section Reports To Position.

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\employee-directory.test.mjs
```

Expected: new tests fail because the employee form still contains the person-based manager control and details use \`emp.managerId\`.

- [ ] **Step 3: Remove editable person manager control**

Replace the employee form manager field with a read-only note stating that reporting lines are managed from Position Management. Remove manager datalist population, input parsing, employee-manager cycle validation, employee coordinate reparenting, and employee manager assignment from the form flow. Preserve the existing employee \`managerId\` value during local edits unless Microsoft sync independently updates it.

- [ ] **Step 4: Derive employee detail parent and direct reports**

In \`showEmployeeDetails\`, find the employee's primary assigned position, its parent position, and the assigned employee on that parent. Render the parent position title and assigned name or VACANT. Build direct reports from positions whose \`managerId\` equals the primary position ID, rendering vacant positions as well as assigned employees. Do not read \`employee.managerId\` for these sections.

- [ ] **Step 5: Run focused tests and syntax check**

```powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check app.js
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\employee-directory.test.mjs
```

Expected: all employee-directory tests pass and app.js syntax exits 0.

### Task 5: Full Regression and Browser Verification

**Files:**
- Modify tests only if a focused regression exposes a missing contract.
- Do not commit screenshots, reports, traces, or temporary Browser scripts.

**Interfaces:**
- Consumes: the completed position-only hierarchy implementation and all existing tests.
- Produces: verified desktop/mobile behavior and a clean API data state.

- [ ] **Step 1: Run the complete automated suite**

```powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\*.test.mjs
```

Expected: every test passes with zero failures.

- [ ] **Step 2: Run syntax and whitespace checks**

```powershell
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check app.js
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check api\positions.js
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check api\employees.js
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check api\sync-microsoft.js
& 'C:\Users\IT\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m py_compile server.py
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 3: Define the Browser target flow**

The flow under test is: app loads -> open Position Management -> select a child position -> change Reports To Position to another position -> save -> chart connection and row metadata show the new parent -> edit employee data without moving the position edge.

- [ ] **Step 4: Run desktop Browser checks**

Use the available in-app Browser skill. Verify page identity, nonblank content, no framework overlay, no relevant console errors, and a screenshot. Exercise the target flow with a temporary parent/child setup or safe existing fixture, then restore the original data through the existing API/local backup path.

- [ ] **Step 5: Run 390px mobile Browser checks**

Set the viewport to 390x844. Open Position Management and verify modal bounds stay within the viewport, the parent select is reachable, position rows do not overlap, and the list scrolls without trapping the page. Capture evidence outside the repository.

- [ ] **Step 6: Review final diff and status**

```powershell
git diff --stat
git status --short
git diff --check
```

Confirm pre-existing dirty app.js annotation changes were not reverted. Do not claim completion until automated and Browser flow checks pass.
