# Draggable Connection Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authorized editors select a reporting connector, drag its branch horizontally and its lane vertically, and persist that route independently for Overall View and each department.

**Architecture:** Add one browser-compatible pure utility for route geometry, normalization, immutable scoped updates, permissions, and drag math. Keep DOM rendering and pointer wiring in `app.js`, store normalized `connectionRoutes` in the existing position notes envelope, and reuse the current position save/rollback path and animation-frame connector redraw throttle.

**Tech Stack:** Vanilla JavaScript, SVG paths and circles, Pointer Events, Node.js `node:test`, existing Vercel/Supabase position API.

## Global Constraints

- Reporting relationships, employee assignments, Overview groups, card coordinates, annotations, and lifecycle state must never change when a connector route changes.
- Overall View uses scope key `__overview__`; each department uses its exact department name.
- Store route offsets on the child position as `{ parentId, branchOffsetX, laneOffsetY }` inside `connectionRoutes` in the existing notes envelope.
- Keep offsets relative to the automatic route so customized paths follow moved cards.
- Ignore a stored route when its `parentId` differs from the current effective display parent.
- Anonymous and Viewer sessions cannot select or edit connector routes.
- Locked canvas permits selection but disables drag and reset; Presentation mode exposes no route-editing UI.
- Pointer movement redraws connectors at most once per animation frame and saves exactly once on pointer-up.
- No new dependency, database table, or API endpoint.
- All behavior changes follow RED → GREEN → REFACTOR and receive focused commits.

---

## File Structure

- Create `connection-routing.js`: pure route geometry, data normalization, scoped mutations, capability decisions, and handle-drag calculations exposed as `globalThis.ConnectionRouting`.
- Create `tests/connection-routing.test.mjs`: behavior tests for geometry, offsets, scope isolation, stale parents, clamping, permissions, and drag math.
- Modify `app.js`: position-note round-trip, selected-edge state, SVG rendering, pointer lifecycle, reset actions, view/lock/presentation cleanup, and persistence.
- Modify `index.html`: load the utility and add the compact route-reset toolbar.
- Modify `style.css`: hit targets, selected paths, handles, and route toolbar states.
- Modify `api/_helpers/history_position_mapper.js`: preserve `connectionRoutes` when restoring legacy flattened history snapshots.
- Modify `tests/history-position-roundtrip.test.mjs`: verify route metadata survives raw and legacy snapshot restore.
- Modify `tests/browser-asset-versions.test.mjs`: require `connection-routing.js?v=1` and bump `app.js` to `v=3.18`.

---

### Task 1: Pure connection-routing model

**Files:**
- Create: `connection-routing.js`
- Create: `tests/connection-routing.test.mjs`

**Interfaces:**
- Consumes: plain position-like objects, card rectangles `{ x, y, width, height }`, view names, parent IDs, and pointer coordinates.
- Produces:
  - `ConnectionRouting.getScopeKey(selectedDept): string`
  - `ConnectionRouting.normalizeRoutes(value): Record<string, Route>`
  - `ConnectionRouting.getScopedRoute(routes, scopeKey, parentId): Route | null`
  - `ConnectionRouting.calculateRoute(input): { points, pathData, branchHandle, laneHandle, automatic }`
  - `ConnectionRouting.setScopedRoute(routes, scopeKey, route): Record<string, Route>`
  - `ConnectionRouting.clearScopedRoute(routes, scopeKey): Record<string, Route>`
  - `ConnectionRouting.clearScopeFromPositions(positions, scopeKey): Array<object>`
  - `ConnectionRouting.getCapabilities({ canEdit, locked, presentation }): { selectable, draggable, resettable }`
  - `ConnectionRouting.beginDrag(input): DragState`
  - `ConnectionRouting.updateDrag(dragState, canvasPoint): Route`

- [ ] **Step 1: Write failing route-geometry and scope tests**

Create `tests/connection-routing.test.mjs` and load the wished-for global without allowing a missing module to abort the suite:

```js
import assert from "node:assert/strict";
import { test } from "node:test";

await import(new URL("../connection-routing.js", import.meta.url)).catch(error => {
  if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
});

test("manual offsets separate one horizontal connection from the shared automatic bus", () => {
  assert.equal(typeof globalThis.ConnectionRouting?.calculateRoute, "function");
  const result = globalThis.ConnectionRouting.calculateRoute({
    parentRect: { x: 500, y: 100, width: 200, height: 80 },
    childRect: { x: 900, y: 400, width: 200, height: 80 },
    minChildY: 400,
    layoutStyle: "horizontal",
    parentId: 10,
    route: { parentId: 10, branchOffsetX: 120, laneOffsetY: -35 }
  });

  assert.deepEqual(result.branchHandle, { x: 720, y: 200 });
  assert.deepEqual(result.laneHandle, { x: 720, y: 255 });
  assert.equal(result.pathData, "M 600 180 L 600 200 L 720 200 L 720 255 L 1000 255 L 1000 400");
  assert.equal(result.automatic, false);
});

test("a stale parent route falls back to the automatic path", () => {
  const result = globalThis.ConnectionRouting.calculateRoute({
    parentRect: { x: 500, y: 100, width: 200, height: 80 },
    childRect: { x: 900, y: 400, width: 200, height: 80 },
    minChildY: 400,
    layoutStyle: "horizontal",
    parentId: 11,
    route: { parentId: 10, branchOffsetX: 120, laneOffsetY: -35 }
  });

  assert.equal(result.pathData, "M 600 180 L 600 200 L 600 200 L 600 290 L 1000 290 L 1000 400");
  assert.equal(result.automatic, true);
});

test("route scope updates do not mutate routes saved for another view", () => {
  const source = {
    __overview__: { parentId: 1, branchOffsetX: 40, laneOffsetY: 10 },
    Sales: { parentId: 1, branchOffsetX: -20, laneOffsetY: 30 }
  };
  const updated = globalThis.ConnectionRouting.setScopedRoute(source, "Sales", {
    parentId: 1,
    branchOffsetX: 90,
    laneOffsetY: -15
  });
  const cleared = globalThis.ConnectionRouting.clearScopedRoute(updated, "Sales");

  assert.deepEqual(source.Sales, { parentId: 1, branchOffsetX: -20, laneOffsetY: 30 });
  assert.deepEqual(updated.__overview__, source.__overview__);
  assert.equal(cleared.Sales, undefined);
  assert.deepEqual(cleared.__overview__, source.__overview__);
});
```

Add literal cases for vertical layout (ending at the child's left-center), non-finite values, ±4000 clamping, `__overview__` scope selection, and `clearScopeFromPositions()` preserving unrelated scopes.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
node --test tests/connection-routing.test.mjs
```

Expected: FAIL because `connection-routing.js` and `globalThis.ConnectionRouting.calculateRoute` do not exist.

- [ ] **Step 3: Implement the minimal pure utility**

Create `connection-routing.js` as an IIFE matching existing browser utilities:

```js
(function attachConnectionRouting(root) {
  const OVERVIEW_SCOPE = "__overview__";
  const MAX_OFFSET = 4000;

  function finite(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clampOffset(value) {
    return Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, finite(value)));
  }

  function getScopeKey(selectedDept) {
    return selectedDept === "All" ? OVERVIEW_SCOPE : String(selectedDept || "").trim();
  }

  function normalizeRoute(route) {
    const parentId = Number(route?.parentId);
    if (!Number.isInteger(parentId)) return null;
    return {
      parentId,
      branchOffsetX: clampOffset(route?.branchOffsetX),
      laneOffsetY: clampOffset(route?.laneOffsetY)
    };
  }

  function normalizeRoutes(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).flatMap(([scope, route]) => {
      const normalized = normalizeRoute(route);
      return scope && normalized ? [[scope, normalized]] : [];
    }));
  }

  function getScopedRoute(routes, scopeKey, parentId) {
    const route = normalizeRoutes(routes)[scopeKey];
    return route && route.parentId === Number(parentId) ? route : null;
  }

  function pointsToPathData(points) {
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  }
```

For horizontal layout, calculate `start=(parent center, parent bottom)`, `end=(child center, child top)`, `branchY=startY+20`, and `automaticLaneY=startY+max(20,(minChildY-startY)/2)`. Apply `branchOffsetX` to `startX` and `laneOffsetY` to `automaticLaneY`, returning the six points asserted above. For vertical layout, keep the existing child left-center endpoint and return `start → automatic lane → branch column → child center Y → child left edge` with the same two offset fields.

Add immutable `setScopedRoute`, `clearScopedRoute`, and `clearScopeFromPositions`. Freeze and expose only the named public methods.

- [ ] **Step 4: Add failing capability and handle-drag tests**

Append:

```js
test("editing capabilities distinguish selection from mutation while locked", () => {
  assert.deepEqual(
    globalThis.ConnectionRouting.getCapabilities({ canEdit: true, locked: true, presentation: false }),
    { selectable: true, draggable: false, resettable: false }
  );
  assert.deepEqual(
    globalThis.ConnectionRouting.getCapabilities({ canEdit: false, locked: false, presentation: false }),
    { selectable: false, draggable: false, resettable: false }
  );
  assert.deepEqual(
    globalThis.ConnectionRouting.getCapabilities({ canEdit: true, locked: false, presentation: true }),
    { selectable: false, draggable: false, resettable: false }
  );
});

test("branch and lane handles update only their own offset", () => {
  const baseRoute = { parentId: 10, branchOffsetX: 25, laneOffsetY: -15 };
  const branchDrag = globalThis.ConnectionRouting.beginDrag({
    kind: "branch",
    pointerId: 7,
    startPoint: { x: 100, y: 200 },
    route: baseRoute
  });
  const laneDrag = globalThis.ConnectionRouting.beginDrag({
    kind: "lane",
    pointerId: 8,
    startPoint: { x: 100, y: 200 },
    route: baseRoute
  });

  assert.deepEqual(globalThis.ConnectionRouting.updateDrag(branchDrag, { x: 160, y: 260 }), {
    parentId: 10,
    branchOffsetX: 85,
    laneOffsetY: -15
  });
  assert.deepEqual(globalThis.ConnectionRouting.updateDrag(laneDrag, { x: 160, y: 260 }), {
    parentId: 10,
    branchOffsetX: 25,
    laneOffsetY: 45
  });
});
```

- [ ] **Step 5: Run RED, implement capability/drag methods, then run GREEN**

Run the focused test before and after implementation. Implement `getCapabilities`, `beginDrag`, and `updateDrag` with immutable snapshots and clamped deltas. Expected final result: all `tests/connection-routing.test.mjs` tests PASS.

- [ ] **Step 6: Commit the pure model**

```powershell
git add connection-routing.js tests/connection-routing.test.mjs
git commit -m "feat: add connector routing model"
```

---

### Task 2: Position metadata round-trip

**Files:**
- Modify: `app.js:1514-1571`
- Modify: `app.js:1806-1831`
- Modify: `api/_helpers/history_position_mapper.js:18-35`
- Modify: `tests/history-position-roundtrip.test.mjs:8-120`

**Interfaces:**
- Consumes: `ConnectionRouting.normalizeRoutes(value)` from Task 1.
- Produces: normalized `position.connectionRoutes` and a notes envelope containing `connectionRoutes` on every save.

- [ ] **Step 1: Write failing history round-trip assertions**

Extend the raw notes fixture in `tests/history-position-roundtrip.test.mjs`:

```js
connectionRoutes: {
  __overview__: { parentId: 12, branchOffsetX: -80, laneOffsetY: 45 },
  Logistics: { parentId: 12, branchOffsetX: 110, laneOffsetY: -30 }
},
```

Extend the legacy flattened fixture with the same `connectionRoutes` object and assert it appears unchanged in `JSON.parse(restored.notes)`.

- [ ] **Step 2: Run the history test and confirm RED**

```powershell
node --test tests/history-position-roundtrip.test.mjs
```

Expected: the raw-envelope test still passes, while the legacy flattened restore test FAILS because `connectionRoutes` is not in `LEGACY_NOTE_METADATA_FIELDS`.

- [ ] **Step 3: Preserve legacy history metadata**

Add `"connectionRoutes"` to `LEGACY_NOTE_METADATA_FIELDS` in `api/_helpers/history_position_mapper.js`. Re-run the focused test and expect PASS.

- [ ] **Step 4: Add route parsing and serialization to positions**

In `normalizePosition()` initialize and read routes from both a top-level position and the notes envelope:

```js
let connectionRoutes = ConnectionRouting.normalizeRoutes(position?.connectionRoutes);
// inside successful notes JSON parsing
connectionRoutes = ConnectionRouting.normalizeRoutes(parsed.connectionRoutes ?? connectionRoutes);
// inside the returned normalized position
connectionRoutes,
```

In `savePositions()` add this field to the notes object:

```js
connectionRoutes: ConnectionRouting.normalizeRoutes(p.connectionRoutes),
```

An empty object is intentional so current clients can persist Reset All without resurrecting old routes.

- [ ] **Step 5: Verify persistence behavior**

Run:

```powershell
node --test tests/connection-routing.test.mjs tests/history-position-roundtrip.test.mjs tests/position-persistence.test.mjs
node --check app.js
```

Expected: all tests PASS and syntax check exits 0.

- [ ] **Step 6: Commit metadata persistence**

```powershell
git add app.js api/_helpers/history_position_mapper.js tests/history-position-roundtrip.test.mjs
git commit -m "feat: persist scoped connector routes"
```

---

### Task 3: SVG selection, handles, and reset toolbar

**Files:**
- Modify: `index.html:225-266`
- Modify: `index.html:708-716`
- Modify: `style.css:892-1006`
- Modify: `style.css:3078-3190`
- Modify: `app.js:511-545`
- Modify: `app.js:3445-3536`
- Modify: `tests/browser-asset-versions.test.mjs`

**Interfaces:**
- Consumes: route geometry and `getCapabilities()` from Task 1, normalized position metadata from Task 2, `currentChartRenderContext`, `canEditHr()`, `isLayoutLocked`, and `isPresentationMode`.
- Produces: one selected edge `{ parentId, childId }`, SVG hit paths, two route handles, and toolbar state.

- [ ] **Step 1: Write failing cache-version assertions**

Update `tests/browser-asset-versions.test.mjs`:

```js
test("connection routing utility is loaded once at its initial cache version", () => {
  assert.equal((htmlSource.match(/src="connection-routing\.js\?v=1"/g) || []).length, 1);
});

test("connector editing app script uses cache version 3.18 exactly once", () => {
  assert.equal((htmlSource.match(/src="app\.js\?v=3\.18"/g) || []).length, 1);
  assert.doesNotMatch(htmlSource, /src="app\.js\?v=3\.17"/);
});
```

Replace the existing `v=3.17` assertion rather than keeping both.

- [ ] **Step 2: Run the asset test and confirm RED**

```powershell
node --test tests/browser-asset-versions.test.mjs
```

Expected: FAIL because the utility script is absent and `app.js` is still `v=3.17`.

- [ ] **Step 3: Load the utility and add the route toolbar**

In `index.html`, load the utility immediately before `app.js` and bump the app cache key:

```html
<script src="connection-routing.js?v=1"></script>
<script src="app.js?v=3.18"></script>
```

Inside `#chart-viewport`, after `.annotation-toolbar`, add:

```html
<div class="connection-route-toolbar" id="connection-route-toolbar" aria-label="Connection route controls" hidden>
  <strong>Line</strong>
  <button class="btn btn-secondary" id="btn-reset-connection-route" type="button">Reset Line</button>
  <button class="btn btn-secondary" id="btn-reset-all-connection-routes" type="button">Reset All Lines</button>
</div>
```

- [ ] **Step 4: Render selectable paths and handles**

Add state near existing chart state:

```js
let selectedConnection = null;
let activeConnectionRouteDrag = null;
```

Add helpers with exact responsibilities:

```js
function getConnectionRouteCapabilities() {
  return ConnectionRouting.getCapabilities({
    canEdit: canEditHr(),
    locked: isLayoutLocked,
    presentation: isPresentationMode
  });
}

function getConnectionRouteStoragePosition(childDisplayId) {
  return positions.find(position => position.id === Number(childDisplayId)) || null;
}

function isSelectedConnection(parentId, childId) {
  return selectedConnection?.parentId === Number(parentId)
    && selectedConnection?.childId === Number(childId);
}
```

Refactor only the path-construction portion of `drawConnections()` to call `ConnectionRouting.calculateRoute()`. Keep its existing display-position iteration, effective-manager map, lifecycle filtering, `highlightedConnections`, and SVG bounds.

For each editable edge, append a transparent `.connection-hit-path` with the same `d`, `data-parent-id`, `data-child-id`, `tabindex="0"`, `role="button"`, and an accessible label. For the selected edge, add `.is-selected` to the visible path and append two circles:

```js
createConnectionRouteHandle("branch", routeGeometry.branchHandle, visibleManagerId, positionId);
createConnectionRouteHandle("lane", routeGeometry.laneHandle, visibleManagerId, positionId);
```

Each circle receives `.connection-route-handle`, `.is-branch` or `.is-lane`, and the parent/child IDs.
Set its radius to `9 / currentScale` canvas units so the visible handle remains approximately 18 pixels wide at every supported zoom level.

- [ ] **Step 5: Style hit paths, selection, handles, and toolbar**

Add:

```css
.connection-hit-path {
  fill: none;
  stroke: transparent;
  stroke-width: 18px;
  pointer-events: stroke;
  cursor: pointer;
}

.connection-path.is-selected {
  stroke: var(--accent-primary);
  stroke-width: 4px;
}

.connection-route-handle {
  fill: #ffffff;
  stroke: var(--accent-primary);
  stroke-width: 3px;
  vector-effect: non-scaling-stroke;
  pointer-events: all;
}

.connection-route-handle.is-branch { cursor: ew-resize; }
.connection-route-handle.is-lane { cursor: ns-resize; }
body.layout-locked .connection-route-handle { cursor: not-allowed; opacity: 0.55; }

.connection-route-toolbar {
  position: absolute;
  top: 68px;
  left: 20px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  box-shadow: var(--shadow-md);
}

.connection-route-toolbar[hidden],
body.role-viewer .connection-route-toolbar,
body.presentation-mode .connection-route-toolbar { display: none; }
```

Update the canvas pan guard so `.connection-hit-path`, `.connection-route-handle`, and `.connection-route-toolbar` never start panning.

- [ ] **Step 6: Add selection behavior and toolbar state**

Use event delegation on `svgOverlay` so `drawConnections()` may replace its children without re-registering listeners. Click and keyboard activation set `selectedConnection`, request a redraw, and call:

```js
function updateConnectionRouteToolbar() {
  const toolbar = document.getElementById("connection-route-toolbar");
  const capabilities = getConnectionRouteCapabilities();
  const hasSelection = Boolean(selectedConnection);
  toolbar.hidden = !capabilities.selectable || !hasSelection;
  document.getElementById("btn-reset-connection-route").disabled = !hasSelection || !capabilities.resettable;
  document.getElementById("btn-reset-all-connection-routes").disabled = !capabilities.resettable;
}
```

Clicking empty canvas clears selection before normal panning begins. Keep selection on a locked canvas, but render handles with the disabled appearance and disable reset buttons.

- [ ] **Step 7: Run focused and syntax checks**

```powershell
node --test tests/connection-routing.test.mjs tests/browser-asset-versions.test.mjs
node --check app.js
```

Expected: PASS.

- [ ] **Step 8: Commit SVG selection UI**

```powershell
git add index.html style.css app.js tests/browser-asset-versions.test.mjs
git commit -m "feat: select connector routes on the canvas"
```

---

### Task 4: Handle dragging, scoped reset, and rollback

**Files:**
- Modify: `app.js:2290-2370`
- Modify: `app.js:3445-3536`
- Modify: `app.js:3689-3758`
- Modify: `app.js:6138-6145`
- Test: `tests/connection-routing.test.mjs`

**Interfaces:**
- Consumes: `ConnectionRouting.beginDrag`, `updateDrag`, `setScopedRoute`, `clearScopedRoute`, and `clearScopeFromPositions`; `savePositions(candidatePositions)`; `requestConnectionDraw()`.
- Produces: pointer-safe connector editing and reset operations that persist once and roll back through existing confirmed position state.

- [ ] **Step 1: Add failing movement-invariance and reset-all tests**

Append behavior tests using hand-calculated literals:

```js
test("moving both cards keeps manual route offsets unchanged", () => {
  const input = {
    parentRect: { x: 100, y: 100, width: 200, height: 80 },
    childRect: { x: 500, y: 400, width: 200, height: 80 },
    minChildY: 400,
    layoutStyle: "horizontal",
    parentId: 10,
    route: { parentId: 10, branchOffsetX: 75, laneOffsetY: -25 }
  };
  const before = globalThis.ConnectionRouting.calculateRoute(input);
  const after = globalThis.ConnectionRouting.calculateRoute({
    ...input,
    parentRect: { ...input.parentRect, x: 220, y: 160 },
    childRect: { ...input.childRect, x: 620, y: 460 },
    minChildY: 460
  });

  assert.deepEqual(
    { x: after.branchHandle.x - before.branchHandle.x, y: after.branchHandle.y - before.branchHandle.y },
    { x: 120, y: 60 }
  );
});

test("reset all removes only the active scope from every position", () => {
  const result = globalThis.ConnectionRouting.clearScopeFromPositions([
    { id: 1, connectionRoutes: { __overview__: { parentId: 9, branchOffsetX: 10, laneOffsetY: 20 }, Sales: { parentId: 9, branchOffsetX: 30, laneOffsetY: 40 } } },
    { id: 2, connectionRoutes: { Sales: { parentId: 9, branchOffsetX: 50, laneOffsetY: 60 } } }
  ], "Sales");

  assert.deepEqual(result[0].connectionRoutes, { __overview__: { parentId: 9, branchOffsetX: 10, laneOffsetY: 20 } });
  assert.deepEqual(result[1].connectionRoutes, {});
});
```

Run the focused test and confirm any missing behavior FAILS before editing application code.

- [ ] **Step 2: Convert viewport coordinates to canvas coordinates**

Add:

```js
function getCanvasPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / currentScale,
    y: (clientY - rect.top) / currentScale
  };
}
```

This conversion uses the transformed canvas rectangle, so pan is already included and scale is removed exactly once.

- [ ] **Step 3: Start and update a handle drag**

On delegated `pointerdown` for `.connection-route-handle`:

1. Stop propagation and prevent the compatibility mouse event.
2. Reject when `getConnectionRouteCapabilities().draggable` is false.
3. Resolve the real storage position by `childId`.
4. Resolve the current route or `{ parentId, branchOffsetX: 0, laneOffsetY: 0 }`.
5. Store a structured clone of the child's pre-drag `connectionRoutes`.
6. Call `ConnectionRouting.beginDrag()` with handle kind and canvas point.
7. Capture the pointer on the SVG handle and attach window `pointermove`, `pointerup`, and `pointercancel` listeners.

During pointer move:

```js
const route = ConnectionRouting.updateDrag(activeConnectionRouteDrag.model, getCanvasPoint(event.clientX, event.clientY));
storagePosition.connectionRoutes = ConnectionRouting.setScopedRoute(
  storagePosition.connectionRoutes,
  activeConnectionRouteDrag.scopeKey,
  route
);
requestConnectionDraw();
```

Do not call `renderAll()` or `savePositions()` during movement.

- [ ] **Step 4: Finish or cancel safely**

On pointer-up, clear listeners and pointer capture, clear drag state, then save once:

```js
latestPositionsSavePromise = savePositions();
const saved = await latestPositionsSavePromise;
if (!saved) renderTree();
else requestConnectionDraw();
```

On pointer-cancel, restore the cloned pre-drag `connectionRoutes`, clear drag state, and redraw without saving.

If the selected edge no longer exists in `currentChartRenderContext`, use the same cancel path.

- [ ] **Step 5: Implement scoped Reset Line and Reset All Lines**

`Reset Line` creates a candidate array in which only the selected child receives `clearScopedRoute()`. `Reset All Lines` asks:

```js
window.confirm("Reset all customized connector lines in this view?")
```

and then calls `clearScopeFromPositions(positions, scopeKey)`. Both actions:

- call `requireEditorAction()`;
- reject while layout editing is blocked or Presentation mode is active;
- call `savePositions(candidatePositions)` once;
- keep current positions unchanged when save returns false;
- redraw and update toolbar on success.

- [ ] **Step 6: Run focused tests and syntax check**

```powershell
node --test tests/connection-routing.test.mjs tests/position-persistence.test.mjs
node --check app.js
```

Expected: PASS.

- [ ] **Step 7: Commit drag and reset behavior**

```powershell
git add app.js tests/connection-routing.test.mjs
git commit -m "feat: drag and reset connector routes"
```

---

### Task 5: View lifecycle, permissions, and production-grade verification

**Files:**
- Modify: `app.js:590-680`
- Modify: `app.js:2200-2265`
- Modify: `app.js:2990-3040`
- Modify: department selection handler located by `rg -n "selectedDept =" app.js`
- Modify: `style.css` only if browser QA reveals a handle-size or stacking defect
- Test: `tests/connection-routing.test.mjs`

**Interfaces:**
- Consumes: connector selection/drag state and toolbar update functions from Tasks 3–4.
- Produces: consistent cleanup on mode/view/permission/lock changes and a verified deployable build.

- [ ] **Step 1: Add failing permission matrix tests**

Ensure `tests/connection-routing.test.mjs` contains all four literal capability cases:

```js
assert.deepEqual(ConnectionRouting.getCapabilities({ canEdit: true, locked: false, presentation: false }), { selectable: true, draggable: true, resettable: true });
assert.deepEqual(ConnectionRouting.getCapabilities({ canEdit: true, locked: true, presentation: false }), { selectable: true, draggable: false, resettable: false });
assert.deepEqual(ConnectionRouting.getCapabilities({ canEdit: false, locked: false, presentation: false }), { selectable: false, draggable: false, resettable: false });
assert.deepEqual(ConnectionRouting.getCapabilities({ canEdit: true, locked: false, presentation: true }), { selectable: false, draggable: false, resettable: false });
```

If any case is absent or wrong, run the test and observe RED before correcting the utility.

- [ ] **Step 2: Centralize route-edit cleanup**

Add:

```js
function clearConnectionRouteEditing({ restoreDrag = true } = {}) {
  if (activeConnectionRouteDrag && restoreDrag) {
    activeConnectionRouteDrag.storagePosition.connectionRoutes = activeConnectionRouteDrag.beforeRoutes;
  }
  removeConnectionRoutePointerListeners();
  activeConnectionRouteDrag = null;
  selectedConnection = null;
  updateConnectionRouteToolbar();
  requestConnectionDraw();
}
```

Call it when:

- `selectedDept` changes;
- `setChartMode()` changes Current/Future;
- Presentation mode becomes active;
- authentication changes to Viewer/anonymous;
- rendering discovers that the selected child/parent edge is no longer visible.

When Canvas Lock becomes active during a drag, cancel and restore the drag but retain `selectedConnection`; redraw disabled handles and toolbar controls.

- [ ] **Step 3: Verify Viewer, lock, and Presentation behavior locally**

Start the app:

```powershell
npx.cmd vercel dev
```

Use the browser interaction skill against the local URL and verify:

1. Admin/unlocked: clicking a line highlights it and shows two handles.
2. Branch drag changes only horizontal branch offset.
3. Lane drag changes only vertical lane offset.
4. Card drag after route editing keeps the custom route shape.
5. Reload preserves the route.
6. Overall and department routes remain independent.
7. Lock retains selection but prevents mutation and reset.
8. Presentation hides all connector-editing UI.
9. Viewer/anonymous exposes no selectable hit paths or handles.
10. Reset Line and confirmed Reset All affect only the active view.
11. No card drag, canvas-pan, Combine, or annotation action begins from a route handle.
12. Browser console has no relevant errors.

Restore any test route changes through Reset Line/Reset All before stopping the local server.

- [ ] **Step 4: Run the complete automated verification**

```powershell
npm test
npm run check
git diff --check
```

Expected: every Node test passes, `node --check app.js` exits 0, and `git diff --check` prints nothing.

- [ ] **Step 5: Review the final diff against the approved spec**

```powershell
git diff --stat HEAD~4
git diff HEAD~4 -- connection-routing.js app.js index.html style.css api/_helpers/history_position_mapper.js tests/connection-routing.test.mjs tests/history-position-roundtrip.test.mjs tests/browser-asset-versions.test.mjs
```

Confirm:

- no hierarchy or employee mutation is introduced;
- `savePositions()` is absent from pointer-move;
- route storage is scoped and stale-parent checked;
- Viewer, lock, and Presentation capability decisions match the matrix;
- only the intended asset versions changed.

- [ ] **Step 6: Commit lifecycle and verification fixes**

```powershell
git add app.js style.css tests/connection-routing.test.mjs
git commit -m "fix: harden connector route editing states"
```

If `git status --short` shows no changes after verification, skip this commit rather than creating an empty commit.

- [ ] **Step 7: Prepare deployment handoff**

Record the final commit hash, test count, and local browser results. Deployment to Production requires the user's explicit deployment instruction after implementation review; do not mutate Production connector routes during deployment verification.

---

## Final Acceptance Checklist

- [ ] Admin can select a reporting line and sees exactly two handles.
- [ ] Branch handle changes only horizontal fan-out; lane handle changes only vertical routing level.
- [ ] Routes follow moved cards and persist after reload.
- [ ] Overall and department route data remain independent.
- [ ] A changed manager ignores stale route data.
- [ ] Viewer/anonymous cannot select or edit lines.
- [ ] Locked canvas allows selection but not mutation; Presentation exposes no route UI.
- [ ] Reset actions change route metadata only.
- [ ] One completed drag produces at most one position save.
- [ ] Full Node test suite, syntax check, diff check, and browser QA pass.
