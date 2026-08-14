# Dedicated OPERATION View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated OPERATION chart below Overall View that derives the complete lifecycle-visible subtree of an administrator-selected real position while keeping its layout, routes, annotations, and collapse state independent from every other view.

**Architecture:** Add two small browser utilities: one owns stable chart-scope identifiers and one derives an OPERATION subtree without mutating positions. Extend shared preferences with the selected root and scoped collapse state, then make `app.js` treat OPERATION as a first-class virtual view that reuses the existing chart renderer and editor safeguards. Real employees, positions, reporting lines, and departments remain the only source of truth.

**Tech Stack:** Vanilla JavaScript, browser DOM APIs, Node.js built-in test runner, Vercel Functions, Supabase preferences JSON, existing position notes and annotations persistence.

## Global Constraints

- Use `__operation__` as the in-memory selected-view sentinel; it must never be treated as a real department.
- Use `__operation_current__` and `__operation_future__` as independent storage scope keys.
- Store only `operationRootPositionId`; never duplicate employees, positions, assignments, or reporting relationships.
- Anonymous Viewers can inspect OPERATION but cannot configure its root or mutate chart state.
- Current/Future lifecycle filtering and visible-manager replacement must reuse the existing `PositionLifecycle` and `OrgHierarchy` behavior.
- OPERATION root changes preserve all previously stored layouts, routes, annotations, and collapsed-node scopes.
- Existing Overview and department scope keys and persisted data remain backward compatible.
- Do not deploy to Production until the user explicitly authorizes that deployment after verification.

## File Structure

- Create `chart-view-scope.js`: virtual-view constants, predicates, display labels, and deterministic storage-scope keys.
- Create `operation-view.js`: pure OPERATION root validation, subtree traversal, lifecycle-visible membership, and cycle reporting.
- Modify `connection-routing.js`: delegate route scope selection to `ChartViewScope` while preserving the one-argument API.
- Modify `api/preferences.js`: normalize and persist the Operation Root and scoped collapsed-node IDs.
- Modify `app.js`: load/save preferences, derive OPERATION render context, navigation, independent state, empty states, root configuration, and mutation guards.
- Modify `index.html`: load the new utilities, add the Position Management root action, and bump cache versions.
- Modify `style.css`: OPERATION navigation, empty state, root marker, and root-action styles.
- Create `tests/operation-view.test.mjs`: executable pure-model tests.
- Create `tests/operation-scope.test.mjs`: executable scope and routing compatibility tests.
- Create `tests/operation-preferences.test.mjs`: API and browser-preference contract tests.
- Create `tests/operation-navigation.test.mjs`: sidebar, header, empty-state, and render-context integration tests.
- Create `tests/operation-root-ui.test.mjs`: root configuration, confirmation, authorization, and rollback tests.
- Create `tests/operation-layout.test.mjs`: layout, routes, annotations, collapse state, and structural-action isolation tests.
- Modify `tests/browser-asset-versions.test.mjs`, `tests/combine-positions.test.mjs`, and `tests/silent-sso.test.mjs`: assert the new asset versions without weakening existing checks.

---

### Task 1: Build the Pure OPERATION Subtree Model

**Files:**
- Create: `operation-view.js`
- Create: `tests/operation-view.test.mjs`

**Interfaces:**
- Consumes: arrays of real positions and lifecycle-visible positions plus `rootPositionId`.
- Produces: `OperationView.buildSubtree(allPositions, visiblePositions, rootPositionId)` returning `{ status, rootPosition, realPositionIds, visiblePositions, cyclePositionIds }`.
- Status values: `unconfigured`, `missing`, `hidden`, or `ready`.

- [ ] **Step 1: Write the failing pure-model tests**

Create `tests/operation-view.test.mjs` with a VM loader and these concrete cases:

```js
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../operation-view.js", import.meta.url), "utf8");
const context = vm.createContext({});
vm.runInContext(source, context);
const { buildSubtree } = context.OperationView;

const positions = [
  { id: 1, title: "CEO", managerId: null, department: "Corporate" },
  { id: 2, title: "COO", managerId: 1, department: "Corporate" },
  { id: 3, title: "Logistics Manager", managerId: 2, department: "Logistics" },
  { id: 4, title: "Warehouse Officer", managerId: 3, department: "Warehouse" },
  { id: 5, title: "CMO", managerId: 1, department: "Marketing" }
];

test("collects the selected root and every descendant across departments", () => {
  const result = buildSubtree(positions, positions, 2);
  assert.equal(result.status, "ready");
  assert.deepEqual([...result.realPositionIds], [2, 3, 4]);
  assert.deepEqual(result.visiblePositions.map(position => position.id), [2, 3, 4]);
});

test("keeps visible descendants when an intermediate real position is lifecycle-hidden", () => {
  const visible = positions.filter(position => position.id !== 3);
  const result = buildSubtree(positions, visible, 2);
  assert.equal(result.status, "ready");
  assert.deepEqual(result.visiblePositions.map(position => position.id), [2, 4]);
});

test("reports unconfigured, missing, and mode-hidden roots explicitly", () => {
  assert.equal(buildSubtree(positions, positions, null).status, "unconfigured");
  assert.equal(buildSubtree(positions, positions, 999).status, "missing");
  assert.equal(buildSubtree(positions, positions.filter(position => position.id !== 2), 2).status, "hidden");
});

test("terminates a cycle and returns every reached position once", () => {
  const cyclic = [
    { id: 2, managerId: 4 },
    { id: 3, managerId: 2 },
    { id: 4, managerId: 3 }
  ];
  const result = buildSubtree(cyclic, cyclic, 2);
  assert.deepEqual([...result.realPositionIds], [2, 3, 4]);
  assert.deepEqual([...result.cyclePositionIds].sort((a, b) => a - b), [2, 4]);
});
```

- [ ] **Step 2: Run the tests and verify the expected failure**

Run: `node --test tests/operation-view.test.mjs`

Expected: FAIL because `operation-view.js` or `OperationView.buildSubtree` does not exist.

- [ ] **Step 3: Implement the pure model**

Create `operation-view.js` as an IIFE with no DOM or persistence dependency:

```js
(function attachOperationView(root) {
  function toPositionId(value) {
    if (value === null || value === undefined || value === "") return null;
    const id = Number(value);
    return Number.isInteger(id) ? id : null;
  }

  function buildSubtree(allPositions, visiblePositions, rootPositionId) {
    const all = Array.isArray(allPositions) ? allPositions : [];
    const visible = Array.isArray(visiblePositions) ? visiblePositions : [];
    const rootId = toPositionId(rootPositionId);
    if (rootId === null) return empty("unconfigured");

    const byId = new Map(all.map(position => [toPositionId(position?.id), position]));
    const rootPosition = byId.get(rootId);
    if (!rootPosition) return empty("missing");

    const visibleIds = new Set(visible.map(position => toPositionId(position?.id)));
    if (!visibleIds.has(rootId)) return { ...empty("hidden"), rootPosition };

    const childrenByManager = new Map();
    all.forEach(position => {
      const id = toPositionId(position?.id);
      const managerId = toPositionId(position?.managerId);
      if (id === null || managerId === null) return;
      const children = childrenByManager.get(managerId) || [];
      children.push(id);
      childrenByManager.set(managerId, children);
    });

    const realPositionIds = new Set();
    const cyclePositionIds = new Set();
    const visit = (id, path = new Set()) => {
      if (path.has(id)) {
        cyclePositionIds.add(id);
        return;
      }
      if (realPositionIds.has(id)) return;
      realPositionIds.add(id);
      const nextPath = new Set(path).add(id);
      (childrenByManager.get(id) || []).forEach(childId => {
        if (nextPath.has(childId)) cyclePositionIds.add(id);
        visit(childId, nextPath);
      });
    };
    visit(rootId);

    return {
      status: "ready",
      rootPosition,
      realPositionIds,
      visiblePositions: visible.filter(position => realPositionIds.has(toPositionId(position?.id))),
      cyclePositionIds
    };
  }

  function empty(status) {
    return {
      status,
      rootPosition: null,
      realPositionIds: new Set(),
      visiblePositions: [],
      cyclePositionIds: new Set()
    };
  }

  root.OperationView = Object.freeze({ buildSubtree });
})(globalThis);
```

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/operation-view.test.mjs`

Expected: 4 tests PASS.

- [ ] **Step 5: Commit the pure model**

```powershell
git add -- operation-view.js tests/operation-view.test.mjs
git commit -m "feat: derive operation position subtree"
```

---

### Task 2: Add Stable Virtual-View Scope Keys

**Files:**
- Create: `chart-view-scope.js`
- Create: `tests/operation-scope.test.mjs`
- Modify: `connection-routing.js`
- Modify: `index.html`
- Modify: `tests/browser-asset-versions.test.mjs`

**Interfaces:**
- Produces: `ChartViewScope.OPERATION_VIEW_ID`, `isOverview(viewId)`, `isOperation(viewId)`, `supportsCollapse(viewId)`, `blocksStructuralActions(viewId)`, and `getStorageScopeKey(viewId, chartMode)`.
- Extends: `ConnectionRouting.getScopeKey(selectedView, chartMode = "current")` while preserving all existing one-argument results.

- [ ] **Step 1: Write failing scope tests**

Create `tests/operation-scope.test.mjs` that loads both utilities and asserts:

```js
assert.equal(ChartViewScope.OPERATION_VIEW_ID, "__operation__");
assert.equal(ChartViewScope.getStorageScopeKey("All", "future"), "__overview__");
assert.equal(ChartViewScope.getStorageScopeKey("Sales", "future"), "Sales");
assert.equal(ChartViewScope.getStorageScopeKey("__operation__", "current"), "__operation_current__");
assert.equal(ChartViewScope.getStorageScopeKey("__operation__", "future"), "__operation_future__");
assert.equal(ChartViewScope.supportsCollapse("__operation__"), true);
assert.equal(ChartViewScope.blocksStructuralActions("__operation__"), true);
assert.equal(ConnectionRouting.getScopeKey("__operation__", "future"), "__operation_future__");
assert.equal(ConnectionRouting.getScopeKey("Sales"), "Sales");
```

Update `tests/browser-asset-versions.test.mjs` to require each new script exactly once before `app.js`.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `node --test tests/operation-scope.test.mjs tests/browser-asset-versions.test.mjs`

Expected: FAIL because the scope utility and script tags do not exist.

- [ ] **Step 3: Implement the scope utility and routing delegation**

Create `chart-view-scope.js`:

```js
(function attachChartViewScope(root) {
  const OPERATION_VIEW_ID = "__operation__";
  const OVERVIEW_SCOPE = "__overview__";

  function isOverview(viewId) { return viewId === "All"; }
  function isOperation(viewId) { return viewId === OPERATION_VIEW_ID; }
  function supportsCollapse(viewId) { return isOverview(viewId) || isOperation(viewId); }
  function blocksStructuralActions(viewId) { return isOverview(viewId) || isOperation(viewId); }
  function getStorageScopeKey(viewId, chartMode = "current") {
    if (isOverview(viewId)) return OVERVIEW_SCOPE;
    if (isOperation(viewId)) {
      return chartMode === "future" ? "__operation_future__" : "__operation_current__";
    }
    return String(viewId || "").trim();
  }

  root.ChartViewScope = Object.freeze({
    OPERATION_VIEW_ID,
    isOverview,
    isOperation,
    supportsCollapse,
    blocksStructuralActions,
    getStorageScopeKey
  });
})(globalThis);
```

Change `connection-routing.js` to:

```js
function getScopeKey(selectedView, chartMode = "current") {
  if (root.ChartViewScope?.getStorageScopeKey) {
    return root.ChartViewScope.getStorageScopeKey(selectedView, chartMode);
  }
  return selectedView === "All" ? OVERVIEW_SCOPE : String(selectedView || "").trim();
}
```

Load `chart-view-scope.js?v=1` before `connection-routing.js` and `operation-view.js?v=1` before `app.js`. Keep the existing `app.js?v=3.19` and `style.css?v=4` pins until the integrated app and stylesheet change together in Task 4.

- [ ] **Step 4: Run focused and compatibility tests**

Run: `node --test tests/operation-scope.test.mjs tests/connection-routing.test.mjs tests/browser-asset-versions.test.mjs`

Expected: all tests PASS and every legacy Overview/department route key remains unchanged.

- [ ] **Step 5: Commit the scope boundary**

```powershell
git add -- chart-view-scope.js connection-routing.js index.html tests/operation-scope.test.mjs tests/browser-asset-versions.test.mjs
git commit -m "feat: add operation chart scope keys"
```

---

### Task 3: Persist the Operation Root and Scoped Collapse State

**Files:**
- Create: `tests/operation-preferences.test.mjs`
- Modify: `api/preferences.js`
- Modify: `app.js`
- Modify: `tests/shared-collapse-preferences.test.mjs`
- Modify: `tests/auth.test.mjs`

**Interfaces:**
- Preferences payload becomes `{ collapsedNodeIds, collapsedNodeIdsByScope, layoutLocked, operationRootPositionId }`.
- `collapsedNodeIds` remains the legacy Overview list.
- `collapsedNodeIdsByScope` accepts only `__operation_current__` and `__operation_future__`, each containing unique integer IDs.
- Produces browser helpers `getActiveCollapsedNodes()`, `getOperationCollapseScopeKey()`, and state variable `operationRootPositionId`.

- [ ] **Step 1: Write failing preference contract tests**

Create `tests/operation-preferences.test.mjs` to test the API handler with the existing Supabase mock pattern and assert:

```js
assert.deepEqual(normalizedResponse, {
  collapsedNodeIds: [2, 4],
  collapsedNodeIdsByScope: {
    __operation_current__: [3],
    __operation_future__: [3, 8]
  },
  layoutLocked: true,
  operationRootPositionId: 2
});
```

Add invalid-value coverage: string roots normalize to integers, a non-integer root becomes `null`, duplicate collapse IDs are removed, and an unknown scope such as `Sales` is discarded from `collapsedNodeIdsByScope`.

Add source-contract assertions that `getPreferencesPayload()`, collection snapshots, local fallback, export/import, and restore paths include both new fields.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test tests/operation-preferences.test.mjs tests/shared-collapse-preferences.test.mjs tests/auth.test.mjs`

Expected: FAIL because preferences currently return only Overview collapse IDs and lock state.

- [ ] **Step 3: Extend API normalization**

In `api/preferences.js`, add:

```js
const OPERATION_COLLAPSE_SCOPES = new Set([
  "__operation_current__",
  "__operation_future__"
]);

function normalizeIdList(value) {
  return [...new Set((Array.isArray(value) ? value : [])
    .map(id => parseInt(id, 10))
    .filter(Number.isInteger))].sort((a, b) => a - b);
}

function normalizeCollapsedNodeIdsByScope(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([scope, ids]) =>
    OPERATION_COLLAPSE_SCOPES.has(scope) ? [[scope, normalizeIdList(ids)]] : []
  ));
}

function normalizePositionId(value) {
  if (value === null || value === undefined || value === "") return null;
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}
```

Return default values for GET-with-no-row and normalize the stored JSON:

```js
return {
  collapsedNodeIds: normalizeIdList(value?.collapsedNodeIds),
  collapsedNodeIdsByScope: normalizeCollapsedNodeIdsByScope(value?.collapsedNodeIdsByScope),
  layoutLocked: value?.layoutLocked === true,
  operationRootPositionId: normalizePositionId(value?.operationRootPositionId)
};
```

- [ ] **Step 4: Extend browser preference state and rollback snapshots**

In `app.js`, add:

```js
let operationRootPositionId = null;
let operationCollapsedNodesByScope = new Map();

function getOperationCollapseScopeKey() {
  return ChartViewScope.getStorageScopeKey(selectedDept, chartMode);
}

function getActiveCollapsedNodes() {
  if (!ChartViewScope.isOperation(selectedDept)) return collapsedNodes;
  const scope = getOperationCollapseScopeKey();
  if (!operationCollapsedNodesByScope.has(scope)) {
    operationCollapsedNodesByScope.set(scope, new Set());
  }
  return operationCollapsedNodesByScope.get(scope);
}
```

Make `applyPreferences()` validate the root against integer syntax but retain a missing referenced ID so the UI can show the `missing` state. Make `getPreferencesPayload()` serialize both Operation scope sets in sorted order. Include these fields in `getCollectionSnapshot("preferences")`, restore logic, export/import, localStorage fallback, and confirmed-state rollback.

- [ ] **Step 5: Run preference and full mutation-safety tests**

Run: `node --test tests/operation-preferences.test.mjs tests/shared-collapse-preferences.test.mjs tests/auth.test.mjs tests/employee-directory.test.mjs tests/silent-sso.test.mjs`

Expected: all tests PASS, including editor/CSRF enforcement and rollback behavior.

- [ ] **Step 6: Commit preference persistence**

```powershell
git add -- api/preferences.js app.js tests/operation-preferences.test.mjs tests/shared-collapse-preferences.test.mjs tests/auth.test.mjs
git commit -m "feat: persist operation chart preferences"
```

---

### Task 4: Add OPERATION Navigation, Rendering, and Empty States

**Files:**
- Create: `tests/operation-navigation.test.mjs`
- Modify: `app.js`
- Modify: `style.css`
- Modify: `index.html`
- Modify: `tests/browser-asset-versions.test.mjs`
- Modify: `tests/combine-positions.test.mjs`
- Modify: `tests/silent-sso.test.mjs`
- Modify: `tests/collapse-view-mode.test.mjs`

**Interfaces:**
- Produces: `isOperationView()`, `getOperationRenderState(modePositions)`, and `renderOperationEmptyState(status, rootPosition)`.
- Extends: `buildChartRenderContext()` with `viewKind`, `operationStatus`, `operationRootPosition`, and `operationCyclePositionIds`.
- The ready OPERATION render model uses identity mappings, not Overview grouping.

- [ ] **Step 1: Write failing navigation and render-context tests**

Create `tests/operation-navigation.test.mjs` with source and executable assertions for:

```js
assert.match(appSource, /ChartViewScope\.OPERATION_VIEW_ID/);
assert.match(appSource, /<span>OPERATION<\/span>/);
assert.match(appSource, /Operation Organization/);
assert.match(appSource, /OperationView\.buildSubtree\(positions, modePositions, operationRootPositionId\)/);
assert.match(appSource, /OrgHierarchy\.buildEffectiveManagerByRealId\(positions, operationVisibleIds\)/);
assert.match(appSource, /renderOperationEmptyState\(renderContext\.operationStatus/);
```

Use a VM harness around `renderSidebarDeptList()` to assert the exact item order is Overall, OPERATION, then sorted departments, and the OPERATION badge equals the lifecycle-visible subtree count.

Add empty-state checks for `unconfigured`, `missing`, and `hidden`, including an editor-only `Select Operation Root` button.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test tests/operation-navigation.test.mjs tests/collapse-view-mode.test.mjs tests/browser-asset-versions.test.mjs`

Expected: FAIL because OPERATION is not yet a selectable render view.

- [ ] **Step 3: Add view predicates and the OPERATION render branch**

In `app.js`, add:

```js
function isOverallView() {
  return ChartViewScope.isOverview(selectedDept);
}

function isOperationView() {
  return ChartViewScope.isOperation(selectedDept);
}

function getOperationRenderState(modePositions) {
  return OperationView.buildSubtree(positions, modePositions, operationRootPositionId);
}
```

In `buildChartRenderContext()`, branch before the real-department filter. For a ready Operation state:

```js
const operationVisibleIds = new Set(operationState.visiblePositions.map(position => position.id));
const effectiveManagers = OrgHierarchy.buildEffectiveManagerByRealId(positions, operationVisibleIds);
const identityModel = {
  displayPositions: operationState.visiblePositions,
  realToDisplayId: new Map(operationState.visiblePositions.map(position => [position.id, position.id])),
  membersByDisplayId: new Map(operationState.visiblePositions.map(position => [position.id, [position]])),
  allMembersByDisplayId: new Map(operationState.visiblePositions.map(position => [position.id, [position]])),
  effectiveManagerByDisplayId: new Map(operationState.visiblePositions.map(position => [
    position.id,
    effectiveManagers.get(position.id) ?? null
  ]))
};
```

For non-ready states, return the same map fields with empty collections plus the explicit Operation status and root.

- [ ] **Step 4: Render navigation, header copy, count, and empty states**

Insert the OPERATION sidebar item immediately after Overall:

```html
<li class="department-item operation-item ${isOperationView() ? "active" : ""}"
    data-dept="${ChartViewScope.OPERATION_VIEW_ID}">
  <span>OPERATION</span>
  <span class="department-count">${operationCount}</span>
</li>
```

Update the header so OPERATION shows `Operation Organization` and either the configured root title or a concise configuration message. In `renderTree()`, render an `.operation-empty-state` before layout calculation when status is not `ready`. Editors get a button that calls `openPositionsModal()`; Viewers get explanation text only.

If `operationCyclePositionIds` is non-empty, render the valid cards once. Track a stable warning key from the root ID, chart mode, and sorted cycle IDs; notify an editor only when that key changes, and clear it when leaving OPERATION so returning to the view can surface the unresolved data issue again.

Bump `app.js` from `v=3.19` to `v=3.20` and `style.css` from `v=4` to `v=5`. Update every exact-version assertion in `tests/browser-asset-versions.test.mjs`, `tests/combine-positions.test.mjs`, and `tests/silent-sso.test.mjs`. Add styles for `.operation-item`, `.operation-empty-state`, and its action without changing department-item dimensions.

- [ ] **Step 5: Make collapse controls available in Overview and OPERATION**

Replace Overview-only collapse predicates with `ChartViewScope.supportsCollapse(selectedDept)`. Use `getActiveCollapsedNodes()` in hidden-descendant calculation, toggle, expand-all, and employee focus. Keep department views non-collapsible.

- [ ] **Step 6: Run focused integration tests**

Run: `node --test tests/operation-navigation.test.mjs tests/operation-view.test.mjs tests/collapse-view-mode.test.mjs tests/overview-layout.test.mjs tests/chart-mode-reporting.test.mjs tests/browser-asset-versions.test.mjs tests/combine-positions.test.mjs tests/silent-sso.test.mjs`

Expected: all tests PASS; Overview grouping and real department filtering remain unchanged.

- [ ] **Step 7: Commit the dedicated view**

```powershell
git add -- app.js style.css index.html tests/operation-navigation.test.mjs tests/collapse-view-mode.test.mjs tests/browser-asset-versions.test.mjs tests/combine-positions.test.mjs tests/silent-sso.test.mjs
git commit -m "feat: render dedicated operation chart"
```

---

### Task 5: Add Administrator Operation Root Management

**Files:**
- Create: `tests/operation-root-ui.test.mjs`
- Modify: `index.html`
- Modify: `app.js`
- Modify: `style.css`

**Interfaces:**
- Produces: `setOperationRootPosition(positionId) -> Promise<boolean>`.
- Consumes: selected position ID from `#form-position-id`, `requireEditorAction()`, `savePreferences()`, and confirmed preference rollback.
- Adds: `#btn-set-operation-root` and `.operation-root-badge`.

- [ ] **Step 1: Write failing root-management tests**

Create `tests/operation-root-ui.test.mjs` with a VM harness that verifies:

1. the button is disabled when no position is selected;
2. it is enabled for an editor-selected real position;
3. it is hidden or inert for a Viewer;
4. the confirmation copy names the position;
5. a successful `savePreferences()` updates the root, rerenders the sidebar/list/chart, and returns `true`;
6. a failed save restores the previous root and returns `false`;
7. `renderPositionsList()` marks exactly one row with `OPERATION ROOT`.

Use this result assertion in the save-failure test:

```js
assert.deepEqual(result, {
  returned: false,
  rootAfterSave: 2,
  notifications: ["Could not change the OPERATION root; the previous root was restored."]
});
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `node --test tests/operation-root-ui.test.mjs tests/layout-lock.test.mjs tests/auth.test.mjs`

Expected: FAIL because the root action and UI marker do not exist.

- [ ] **Step 3: Add Position Management controls**

Add this editor action beside existing position actions:

```html
<button type="button" class="btn btn-secondary" id="btn-set-operation-root" disabled>
  <i data-lucide="network"></i>
  Set as Operation Root
</button>
```

Update `resetPositionForm(editId)` to disable the button for a new form, enable it for a real position, and change its text to `Current Operation Root` when the selected ID matches the preference.

In `renderPositionsList()`, add:

```html
${position.id === operationRootPositionId
  ? `<small class="operation-root-badge">OPERATION ROOT</small>`
  : ""}
```

- [ ] **Step 4: Implement confirmed persistence and rollback**

Implement:

```js
async function setOperationRootPosition(positionId) {
  if (!requireEditorAction()) return false;
  const position = positions.find(candidate => candidate.id === Number(positionId));
  if (!position) {
    showNotification("Select a valid position for the OPERATION root.", "error");
    return false;
  }
  if (position.id === operationRootPositionId) return true;
  if (!window.confirm(`Set "${getPositionTitle(position)}" as the OPERATION root?`)) return false;

  const previousRootId = operationRootPositionId;
  operationRootPositionId = position.id;
  const saved = await savePreferences();
  if (!saved) {
    operationRootPositionId = previousRootId;
    showNotification("Could not change the OPERATION root; the previous root was restored.", "error");
    renderAll();
    renderPositionsList();
    return false;
  }

  renderAll();
  renderPositionsList();
  resetPositionForm(position.id);
  showNotification(`OPERATION now starts at ${getPositionTitle(position)}.`, "success");
  return true;
}
```

Wire the button during initialization. Add the button to the existing Viewer-only CSS restrictions and style the root badge as text plus color.

- [ ] **Step 5: Handle deletion of the selected root without silent reassignment**

Do not clear `operationRootPositionId` inside `deletePosition()`. After deletion succeeds, the retained ID intentionally produces the `missing` state so an editor can see what happened and configure a replacement. Add a test proving child reparenting remains unchanged and no new root is selected automatically.

- [ ] **Step 6: Run focused tests**

Run: `node --test tests/operation-root-ui.test.mjs tests/operation-preferences.test.mjs tests/employee-directory.test.mjs tests/layout-lock.test.mjs tests/auth.test.mjs`

Expected: all tests PASS.

- [ ] **Step 7: Commit root management**

```powershell
git add -- index.html app.js style.css tests/operation-root-ui.test.mjs
git commit -m "feat: manage operation root position"
```

---

### Task 6: Isolate OPERATION Layout, Routes, Annotations, and Structural Actions

**Files:**
- Create: `tests/operation-layout.test.mjs`
- Modify: `app.js`
- Modify: `connection-routing.js`
- Modify: `tests/overview-layout.test.mjs`
- Modify: `tests/connection-routing.test.mjs`
- Modify: `tests/chart-mode-reporting.test.mjs`
- Modify: `tests/card-drag-feedback.test.mjs`
- Modify: `tests/combine-positions.test.mjs`
- Modify: `tests/history-position-roundtrip.test.mjs`

**Interfaces:**
- Consumes: `ChartViewScope.getStorageScopeKey(selectedDept, chartMode)` for OPERATION layouts and routes.
- Uses: `selectedDept` plus `chartMode` for annotations, retaining the current annotation schema.
- Uses: `ChartViewScope.blocksStructuralActions(selectedDept)` to prevent Overview and OPERATION drag-combine and chart-level Split/Combine/Overview-group mutations.

- [ ] **Step 1: Write failing state-isolation tests**

Create `tests/operation-layout.test.mjs` and assert these concrete behaviors:

```js
const position = {
  id: 3,
  x: 100,
  y: 200,
  manualLayouts: {
    Sales: { x: 300, y: 400 },
    __operation_current__: { x: 500, y: 600 },
    __operation_future__: { x: 700, y: 800 }
  },
  connectionRoutes: {
    __operation_current__: { parentId: 2, branchOffsetX: 20, laneOffsetY: 30 },
    __operation_future__: { parentId: 2, branchOffsetX: 40, laneOffsetY: 50 }
  }
};
```

Verify Current and Future return different coordinates/routes, a Current drag changes only `manualLayouts.__operation_current__`, Overview still uses `x/y`, and Sales remains unchanged.

Add annotation assertions that OPERATION Current and Future are filtered separately using `department: "__operation__"` plus `chartMode`.

Add collapse assertions that expanding OPERATION Current does not clear OPERATION Future or Overview. Add structural-action assertions that OPERATION does not render combine drop zones or expose chart-level Group/Split/Combine actions.

Extend `tests/history-position-roundtrip.test.mjs` with a position containing both Operation manual-layout and route scopes, then assert history mapping and restoration preserve every value exactly:

```js
manualLayouts: {
  __operation_current__: { x: 500, y: 600 },
  __operation_future__: { x: 700, y: 800 }
},
connectionRoutes: {
  __operation_current__: { parentId: 2, branchOffsetX: 20, laneOffsetY: 30 },
  __operation_future__: { parentId: 2, branchOffsetX: 40, laneOffsetY: 50 }
}
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test tests/operation-layout.test.mjs tests/overview-layout.test.mjs tests/connection-routing.test.mjs tests/chart-mode-reporting.test.mjs tests/card-drag-feedback.test.mjs tests/combine-positions.test.mjs tests/history-position-roundtrip.test.mjs`

Expected: FAIL because manual layout and route lookups do not yet include the Operation mode scope.

- [ ] **Step 3: Centralize the active storage key in app code**

Add:

```js
function getActiveStorageScopeKey() {
  return ChartViewScope.getStorageScopeKey(selectedDept, chartMode);
}
```

Update `getManualPositionCoordinates(position)`:

```js
const coordinates = isOverallView()
  ? (position.isManual ? { x: position.x, y: position.y } : null)
  : position.manualLayouts?.[getActiveStorageScopeKey()];
```

On drag persistence, write `manualLayouts[getActiveStorageScopeKey()]`. Pass `chartMode` to every `ConnectionRouting.getScopeKey(selectedDept, chartMode)` call, including selection, drag, reset-one, and reset-all paths.

- [ ] **Step 4: Keep annotations and collapse state independently scoped**

Keep annotation persistence backward compatible by continuing to store:

```js
{
  department: selectedDept,
  chartMode
}
```

Because OPERATION uses the sentinel department, Current and Future annotations remain isolated without an API migration. Make every collapse mutation operate on `getActiveCollapsedNodes()` and serialize the two Operation sets via Task 3 preferences.

- [ ] **Step 5: Block structural mutation in aggregate views**

Replace drag-combine and chart-level structural checks with:

```js
function chartStructuralActionsAllowed() {
  return !ChartViewScope.blocksStructuralActions(selectedDept) && canEditHr();
}
```

Position Management remains allowed to Split/Combine regardless of the currently selected view. OPERATION card dragging still moves the selected card subtree and persists the Operation-only layout.

- [ ] **Step 6: Run focused state-isolation tests**

Run: `node --test tests/operation-layout.test.mjs tests/overview-layout.test.mjs tests/connection-routing.test.mjs tests/chart-mode-reporting.test.mjs tests/card-drag-feedback.test.mjs tests/combine-positions.test.mjs tests/history-position-roundtrip.test.mjs tests/layout-lock.test.mjs`

Expected: all tests PASS with Overview, OPERATION Current, OPERATION Future, and department state isolated.

- [ ] **Step 7: Commit interaction isolation**

```powershell
git add -- app.js connection-routing.js tests/operation-layout.test.mjs tests/overview-layout.test.mjs tests/connection-routing.test.mjs tests/chart-mode-reporting.test.mjs tests/card-drag-feedback.test.mjs tests/combine-positions.test.mjs tests/history-position-roundtrip.test.mjs
git commit -m "feat: isolate operation chart editing state"
```

---

### Task 7: Verify Backup Compatibility, Browser Behavior, and Release Readiness

**Files:**
- Modify: `tests/operation-preferences.test.mjs`
- Modify: `tests/operation-navigation.test.mjs`
- Modify: `tests/browser-asset-versions.test.mjs`
- Modify: `README.md` only if it already documents chart-view administration; otherwise leave it unchanged.

**Interfaces:**
- No new production interface; this task closes acceptance gaps and proves the implemented interfaces work together.

- [ ] **Step 1: Add final backup and state-transition tests**

Extend the executable tests to prove:

- export includes `operationRootPositionId` and both Operation collapse scopes;
- import restores them without dropping unrelated preferences;
- switching Overall → OPERATION Current → OPERATION Future → department → OPERATION Current restores each scope;
- changing the root leaves old `manualLayouts`, `connectionRoutes`, and annotations untouched;
- a backend preference save failure restores the confirmed root and collapse state;
- anonymous startup can render a configured OPERATION view without making a protected write.

- [ ] **Step 2: Run the full automated suite**

Run: `npm.cmd test`

Expected: every test passes with zero failures, skips, cancellations, or unexpected console errors.

- [ ] **Step 3: Run syntax and diff checks**

Run:

```powershell
npm.cmd run check
git diff --check
git status --short
```

Expected: JavaScript syntax passes, the diff check is clean, and status lists only intended feature files before the final commit.

- [ ] **Step 4: Verify Anonymous Viewer in a real browser**

Start the local Vercel boundary with the repository's documented command. In Microsoft Edge, verify:

1. Continue as Viewer.
2. OPERATION appears directly below Overall.
3. Selecting it shows `Operation Organization`, configured root subtitle, correct count, and the complete cross-department subtree.
4. Current/Future, search, zoom, Fit to Screen, Presentation, expand/collapse, and details work.
5. Viewer cannot drag cards, edit routes/annotations, unlock, or configure the root.
6. Switching views restores independent layouts and annotations.
7. Browser console has no application errors and no failed HR API requests.

- [ ] **Step 5: Verify authenticated Admin in a real browser**

Using Microsoft Admin sign-in, verify:

1. Position Management selects and marks one OPERATION ROOT.
2. Canceling confirmation leaves the root unchanged.
3. Confirming changes the subtree without deleting any position.
4. Card movement, manual route edits, frames, text, and collapse state save independently for Current and Future.
5. Shared Lock blocks every mutation but leaves navigation available.
6. Position Management Split/Combine still works while OPERATION is selected, but chart-card drag never initiates structural Combine.
7. A deleted or lifecycle-hidden root produces the approved explicit empty state.

- [ ] **Step 6: Commit final acceptance coverage**

```powershell
git add -- tests/operation-preferences.test.mjs tests/operation-navigation.test.mjs tests/browser-asset-versions.test.mjs README.md
git commit -m "test: verify operation chart workflows"
```

If `README.md` did not require a change, omit it from `git add`.

- [ ] **Step 7: Prepare the handoff without deploying**

Report the final commit, automated test totals, local browser results, and the Production deployment command that will be run only after explicit authorization:

```powershell
vercel deploy . --prod -y
```

Do not execute that command in this task.
