# Overview and Department Position Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep positions created by one Split separate in department views while rendering one non-destructive combined card for their explicit group in Overview.

**Architecture:** Preserve the real position-first data model and add explicit Overview-group metadata to the existing notes envelope. Add pure hierarchy utilities that create, clear, and render groups, then make `app.js` build one consistent chart render context for cards, layout, collapse, connections, and dragging. Department views use identity display models; Overview alone consumes the grouped display model.

**Tech Stack:** Vanilla JavaScript, DOM APIs, Node.js `node:test`, Vercel Functions, Supabase-backed positions API, existing browser QA harness.

## Global Constraints

- Do not add a database table or change the `/api/positions` schema.
- Do not group positions merely because they have the same employee.
- Keep real position counts, records, lifecycle fields, reporting links, notes, and per-department layouts intact for presentation-only Group/Ungroup actions.
- Keep Overview `x`/`y` coordinates independent from `manualLayouts[selectedDept]`.
- Keep existing Viewer/Admin authorization rules and candidate-save rollback behavior.
- Structural Combine and Split must not be triggered by dragging in Overview.
- Invalid group metadata must show the real cards separately; it must never hide a position.
- Preserve the existing uncommitted Production fixes in the workspace. Review staged diffs before every commit and never discard unrelated changes.

---

## File Map

- `hierarchy-utils.js`: pure Overview-group mutations, Split/Combine metadata behavior, grouped display-model construction, and group-aware drag ID collection.
- `app.js`: metadata normalization/serialization, chart render-context integration, grouped card details, structural-action gating, and save orchestration.
- `index.html`: Overview Group modal and persistent Employee Profile actions.
- `style.css`: Overview Group details, modal, and responsive footer styling.
- `tests/overview-grouping.test.mjs`: pure grouping, validation, display-model, hierarchy-edge, and drag-set regression coverage.
- `tests/combine-positions.test.mjs`: Split/Combine metadata regressions and UI source assertions.
- `tests/overview-layout.test.mjs`: render-context and view-specific drag persistence assertions.
- `tests/card-drag-feedback.test.mjs`: Overview combine-target isolation.
- `tests/position-lifecycle-ui.test.mjs`: metadata serialization and structural-action entry-context assertions.

---

### Task 1: Add Pure Overview Group Mutations and Split Metadata

**Files:**
- Modify: `hierarchy-utils.js:146-261`
- Create: `tests/overview-grouping.test.mjs`
- Modify: `tests/combine-positions.test.mjs:84-176`

**Interfaces:**
- Consumes: position objects with `id`, `employeeId`, `managerId`, and optional Overview-group fields.
- Produces: `OrgHierarchy.groupPositionsForOverview(sourcePositions, memberIds, options)` returning `{ positions, changed, groupId, primaryPosition, error? }`.
- Produces: `OrgHierarchy.ungroupOverviewPositions(sourcePositions, groupId)` returning `{ positions, changed, error? }`.
- Extends: `OrgHierarchy.splitPosition(sourcePositions, positionId, splitTitles)` so every split member receives the same Overview-group metadata.
- Extends: `OrgHierarchy.combinePositions(...)` so stale group metadata is cleared from the surviving real position.

- [ ] **Step 1: Write failing grouping mutation tests**

Create `tests/overview-grouping.test.mjs` with the concrete cases below:

```js
import { test } from "node:test";
import assert from "node:assert/strict";

await import("../hierarchy-utils.js");

const { groupPositionsForOverview, ungroupOverviewPositions } = globalThis.OrgHierarchy;

const sourcePositions = [
  { id: 75, title: "Logistics Manager", employeeId: 75, managerId: 136, department: "Logistics" },
  { id: 183, title: "Procurement Manager", employeeId: 75, managerId: 136, department: "Logistics" },
  { id: 184, title: "HR Manager", employeeId: 75, managerId: 140, department: "HR" }
];

test("groups only explicitly selected compatible positions for Overview", () => {
  const result = groupPositionsForOverview(sourcePositions, [75, 183], {
    title: "Logistics and Procurement Manager",
    primaryPositionId: 75
  });

  assert.equal(result.changed, true);
  const members = result.positions.filter(position => [75, 183].includes(position.id));
  assert.equal(new Set(members.map(position => position.overviewGroupId)).size, 1);
  assert.ok(members.every(position => position.overviewGroupTitle === "Logistics and Procurement Manager"));
  assert.ok(members.every(position => position.overviewPrimaryPositionId === 75));
  assert.equal(result.positions.find(position => position.id === 184).overviewGroupId, undefined);
});

test("rejects a presentation group with different employees or managers", () => {
  const differentEmployee = groupPositionsForOverview(
    [...sourcePositions, { id: 185, title: "Other", employeeId: 90, managerId: 136 }],
    [75, 185],
    { title: "Invalid", primaryPositionId: 75 }
  );
  assert.equal(differentEmployee.changed, false);
  assert.equal(differentEmployee.error, "different_employees");

  const differentManager = groupPositionsForOverview(sourcePositions, [75, 184], {
    title: "Invalid",
    primaryPositionId: 75
  });
  assert.equal(differentManager.changed, false);
  assert.equal(differentManager.error, "different_managers");
});

test("ungroup clears presentation metadata without deleting real positions", () => {
  const grouped = groupPositionsForOverview(sourcePositions, [75, 183], {
    title: "Logistics and Procurement Manager",
    primaryPositionId: 75
  });
  const result = ungroupOverviewPositions(grouped.positions, grouped.groupId);

  assert.equal(result.changed, true);
  assert.deepEqual(result.positions.map(position => position.id), [75, 183, 184]);
  assert.ok(result.positions.every(position => position.overviewGroupId === undefined));
});
```

- [ ] **Step 2: Run the new tests and verify RED**

Run:

```powershell
node --test tests/overview-grouping.test.mjs
```

Expected: FAIL because `groupPositionsForOverview` and `ungroupOverviewPositions` are not exported.

- [ ] **Step 3: Implement minimal immutable mutations**

In `hierarchy-utils.js`, add these helpers:

```js
function clearOverviewMetadata(position) {
  const next = { ...position };
  delete next.overviewGroupId;
  delete next.overviewGroupTitle;
  delete next.overviewPrimaryPositionId;
  return next;
}

function groupPositionsForOverview(sourcePositions, memberIds, options = {}) {
  const positions = Array.isArray(sourcePositions)
    ? sourcePositions.map(position => ({ ...position }))
    : [];
  const ids = [...new Set((memberIds || []).map(toInteger).filter(Number.isInteger))];
  const members = positions.filter(position => ids.includes(toInteger(position.id)));
  const primaryId = toInteger(options.primaryPositionId);
  const title = String(options.title || "").trim();

  if (members.length < 2 || members.length !== ids.length) {
    return { positions, changed: false, error: "need_at_least_two_positions" };
  }
  if (!members.some(position => toInteger(position.id) === primaryId)) {
    return { positions, changed: false, error: "invalid_primary_id" };
  }
  if (!title) return { positions, changed: false, error: "missing_title" };

  const employeeIds = new Set(members.map(position => toInteger(position.employeeId)));
  if (employeeIds.size !== 1 || employeeIds.has(null)) {
    return { positions, changed: false, error: "different_employees" };
  }
  const managerIds = new Set(members.map(position => toInteger(position.managerId)));
  if (managerIds.size !== 1) {
    return { positions, changed: false, error: "different_managers" };
  }

  const existingIds = [...new Set(members.map(position => position.overviewGroupId).filter(Boolean))];
  if (existingIds.length > 1) {
    return { positions, changed: false, error: "conflicting_groups" };
  }
  const groupId = existingIds.length === 1 ? existingIds[0] : `overview-${primaryId}`;
  const selectedIds = new Set(ids);
  const nextPositions = positions.map(position => selectedIds.has(toInteger(position.id))
    ? {
        ...position,
        overviewGroupId: groupId,
        overviewGroupTitle: title,
        overviewPrimaryPositionId: primaryId
      }
    : position
  );

  return {
    positions: nextPositions,
    changed: true,
    groupId,
    primaryPosition: nextPositions.find(position => toInteger(position.id) === primaryId)
  };
}
```

Implement `ungroupOverviewPositions()` with the same clone-first pattern and `clearOverviewMetadata()`.
When one selected member already belongs to a valid group, include every existing member of that group in the update. Reject `conflicting_groups` rather than silently merging two established groups.

- [ ] **Step 4: Add failing Split/Combine metadata tests**

Append to `tests/combine-positions.test.mjs`:

```js
test("split preserves the original title as one explicit Overview group", () => {
  const result = OrgHierarchy.splitPosition([
    { id: 75, title: "Logistics and Procurement Manager", employeeId: 75, managerId: 136 }
  ], 75, ["Logistics Manager", "Procurement Manager"]);

  assert.equal(result.changed, true);
  assert.equal(result.positions.length, 2);
  assert.ok(result.positions.every(position => position.overviewGroupId === "overview-75"));
  assert.ok(result.positions.every(position => position.overviewGroupTitle === "Logistics and Procurement Manager"));
  assert.ok(result.positions.every(position => position.overviewPrimaryPositionId === 75));
});

test("real Combine clears presentation grouping from the survivor", () => {
  const result = OrgHierarchy.combinePositions([
    { id: 75, title: "Logistics Manager", employeeId: 75, managerId: 136, overviewGroupId: "overview-75" },
    { id: 183, title: "Procurement Manager", employeeId: 75, managerId: 136, overviewGroupId: "overview-75" }
  ], 75, [183], { title: "Logistics and Procurement Manager" });

  assert.equal(result.positions.length, 1);
  assert.equal(result.positions[0].overviewGroupId, undefined);
});
```

Run:

```powershell
node --test tests/combine-positions.test.mjs
```

Expected: FAIL because Split does not assign group metadata and Combine does not clear it.

- [ ] **Step 5: Wire group metadata into Split and Combine**

Capture `originalTitle` before `primaryPosition.title` changes. After creating split positions, apply `groupPositionsForOverview()` to the source and created IDs. If the source already belongs to one valid group, extend that group and preserve its title and configured primary ID. In `combinePositions()`, clear the three fields from the survivor before hierarchy repair.

- [ ] **Step 6: Run the focused utility tests**

Run:

```powershell
node --test tests/overview-grouping.test.mjs tests/combine-positions.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 7: Commit the pure data behavior**

Review `git diff -- hierarchy-utils.js tests/overview-grouping.test.mjs tests/combine-positions.test.mjs`, then stage only these paths:

```powershell
git add -- hierarchy-utils.js tests/overview-grouping.test.mjs tests/combine-positions.test.mjs
git diff --cached --check
git commit -m "feat: add explicit overview position groups"
```

---

### Task 2: Persist Group Metadata Through the Existing Notes Envelope

**Files:**
- Modify: `app.js:1512-1560`
- Modify: `app.js:1794-1820`
- Modify: `tests/position-lifecycle-ui.test.mjs`

**Interfaces:**
- Consumes: optional `overviewGroupId`, `overviewGroupTitle`, and `overviewPrimaryPositionId` from raw position fields or parsed notes JSON.
- Produces: normalized in-memory positions with blank metadata represented as `undefined`.
- Produces: position API payload notes JSON containing all three fields only when a group exists.

- [ ] **Step 1: Write failing source-level persistence assertions**

Append to `tests/position-lifecycle-ui.test.mjs`:

```js
test("Overview group metadata round-trips through the position notes envelope", () => {
  assert.match(appSource, /overviewGroupId\s*=\s*String\(parsed\.overviewGroupId/);
  assert.match(appSource, /overviewGroupTitle\s*=\s*String\(parsed\.overviewGroupTitle/);
  assert.match(appSource, /overviewPrimaryPositionId\s*=\s*toNullableInteger\(parsed\.overviewPrimaryPositionId/);
  assert.match(appSource, /overviewGroupId:\s*p\.overviewGroupId/);
  assert.match(appSource, /overviewGroupTitle:\s*p\.overviewGroupTitle/);
  assert.match(appSource, /overviewPrimaryPositionId:\s*p\.overviewPrimaryPositionId/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node --test tests/position-lifecycle-ui.test.mjs
```

Expected: FAIL because the notes parser and serializer do not include group metadata.

- [ ] **Step 3: Extend `normalizePosition()`**

Initialize the three fields from raw input, allow parsed notes JSON to override them, and return them only when valid:

```js
let overviewGroupId = String(position?.overviewGroupId || "").trim();
let overviewGroupTitle = String(position?.overviewGroupTitle || "").trim();
let overviewPrimaryPositionId = toNullableInteger(position?.overviewPrimaryPositionId);

// Inside the parsed-notes block:
overviewGroupId = String(parsed.overviewGroupId ?? overviewGroupId).trim();
overviewGroupTitle = String(parsed.overviewGroupTitle ?? overviewGroupTitle).trim();
overviewPrimaryPositionId = toNullableInteger(
  parsed.overviewPrimaryPositionId ?? overviewPrimaryPositionId
);

// In the returned object:
overviewGroupId: overviewGroupId || undefined,
overviewGroupTitle: overviewGroupTitle || undefined,
overviewPrimaryPositionId: overviewPrimaryPositionId ?? undefined
```

- [ ] **Step 4: Extend `savePositions()` serialization**

Add to the existing notes object:

```js
overviewGroupId: p.overviewGroupId || undefined,
overviewGroupTitle: p.overviewGroupTitle || undefined,
overviewPrimaryPositionId: p.overviewPrimaryPositionId ?? undefined,
```

Keep `text`, lifecycle, manual layout, and layout style fields unchanged.

- [ ] **Step 5: Run focused and full metadata tests**

Run:

```powershell
node --test tests/position-lifecycle-ui.test.mjs tests/combine-positions.test.mjs tests/overview-grouping.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 6: Commit metadata persistence**

Because `app.js` already contains approved uncommitted Production fixes, inspect the entire staged diff before committing:

```powershell
git add -- app.js tests/position-lifecycle-ui.test.mjs
git diff --cached --check
git diff --cached -- app.js tests/position-lifecycle-ui.test.mjs
git commit -m "feat: persist overview group metadata"
```

---

### Task 3: Build a Pure Overview Display Model

**Files:**
- Modify: `hierarchy-utils.js`
- Modify: `tests/overview-grouping.test.mjs`

**Interfaces:**
- Consumes: `OrgHierarchy.buildOverviewDisplayModel(allPositions, visiblePositions, effectiveManagerByRealId)`.
- Produces: `{ displayPositions, realToDisplayId, membersByDisplayId, effectiveManagerByDisplayId }` where the three mappings are `Map` instances.
- A display position representing a group contains `displayTitle` and `overviewGroupMemberIds` but does not mutate a real position.

- [ ] **Step 1: Add failing display-model tests**

Append these cases:

```js
test("Overview collapses an explicit group and leaves unrelated same-person roles separate", () => {
  const all = [
    { id: 75, title: "Logistics Manager", employeeId: 75, managerId: 136, overviewGroupId: "overview-75", overviewGroupTitle: "Logistics and Procurement Manager", overviewPrimaryPositionId: 75 },
    { id: 183, title: "Procurement Manager", employeeId: 75, managerId: 136, overviewGroupId: "overview-75", overviewGroupTitle: "Logistics and Procurement Manager", overviewPrimaryPositionId: 75 },
    { id: 184, title: "HR Manager", employeeId: 75, managerId: 140 }
  ];
  const managers = new Map(all.map(position => [position.id, position.managerId]));
  const model = OrgHierarchy.buildOverviewDisplayModel(all, all, managers);

  assert.deepEqual(model.displayPositions.map(position => position.id), [75, 184]);
  assert.equal(model.displayPositions[0].displayTitle, "Logistics and Procurement Manager");
  assert.deepEqual(model.displayPositions[0].overviewGroupMemberIds, [75, 183]);
  assert.equal(model.realToDisplayId.get(183), 75);
});

test("children of every group member map to one display parent", () => {
  const all = [
    { id: 75, employeeId: 75, managerId: 136, overviewGroupId: "overview-75", overviewGroupTitle: "Combined", overviewPrimaryPositionId: 75 },
    { id: 183, employeeId: 75, managerId: 136, overviewGroupId: "overview-75", overviewGroupTitle: "Combined", overviewPrimaryPositionId: 75 },
    { id: 200, employeeId: 200, managerId: 75 },
    { id: 201, employeeId: 201, managerId: 183 }
  ];
  const managers = new Map(all.map(position => [position.id, position.managerId]));
  const model = OrgHierarchy.buildOverviewDisplayModel(all, all, managers);

  assert.equal(model.effectiveManagerByDisplayId.get(200), 75);
  assert.equal(model.effectiveManagerByDisplayId.get(201), 75);
  assert.equal([...model.effectiveManagerByDisplayId.values()].filter(id => id === 75).length, 2);
});

test("invalid explicit metadata fails open", () => {
  const invalid = [
    { id: 1, employeeId: 10, managerId: null, overviewGroupId: "g", overviewGroupTitle: "Bad", overviewPrimaryPositionId: 1 },
    { id: 2, employeeId: 11, managerId: null, overviewGroupId: "g", overviewGroupTitle: "Bad", overviewPrimaryPositionId: 1 }
  ];
  const model = OrgHierarchy.buildOverviewDisplayModel(invalid, invalid, new Map([[1, null], [2, null]]));
  assert.deepEqual(model.displayPositions.map(position => position.id), [1, 2]);
});

test("a group remains visible when its configured primary is filtered out", () => {
  const all = [
    { id: 75, employeeId: 75, managerId: 136, overviewGroupId: "overview-75", overviewGroupTitle: "Combined", overviewPrimaryPositionId: 75 },
    { id: 183, employeeId: 75, managerId: 136, overviewGroupId: "overview-75", overviewGroupTitle: "Combined", overviewPrimaryPositionId: 75 }
  ];
  const model = OrgHierarchy.buildOverviewDisplayModel(
    all,
    [all[1]],
    new Map([[183, 136]])
  );
  assert.equal(model.displayPositions.length, 1);
  assert.equal(model.displayPositions[0].id, 183);
  assert.equal(model.displayPositions[0].displayTitle, "Combined");
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```powershell
node --test tests/overview-grouping.test.mjs
```

Expected: FAIL because `buildOverviewDisplayModel` is missing.

- [ ] **Step 3: Implement the display-model builder**

Implement these rules in `hierarchy-utils.js`:

1. Group all real positions by non-empty `overviewGroupId`.
2. Accept a group only when it has at least two real members, one employee, one effective manager, one non-empty title, and a configured primary contained in the group.
3. Restrict each valid group to currently visible members.
4. Choose the configured primary when visible; otherwise choose the first visible member as the display representative.
5. Clone the representative with `displayTitle` and sorted `overviewGroupMemberIds`.
6. Map every visible real member to the representative ID.
7. Map each visible real manager through `realToDisplayId` and discard self-edges.
8. Keep ungrouped and invalid-group positions as identity mappings.

Return new arrays and maps; never modify `allPositions` or `visiblePositions`.

- [ ] **Step 4: Run the pure tests**

Run:

```powershell
node --test tests/overview-grouping.test.mjs tests/combine-positions.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 5: Commit the display model**

```powershell
git add -- hierarchy-utils.js tests/overview-grouping.test.mjs
git diff --cached --check
git commit -m "feat: build grouped overview display model"
```

---

### Task 4: Use One Render Context for Cards, Layout, Collapse, and Connections

**Files:**
- Modify: `app.js:2818-3620`
- Modify: `tests/overview-layout.test.mjs`
- Modify: `tests/collapse-view-mode.test.mjs`

**Interfaces:**
- Produces: `buildChartRenderContext()` returning `{ modePositions, realVisiblePositions, displayPositions, displayPositionIds, positionByDisplayId, effectiveManagerByDisplayId, hasReportsByPositionId, membersByDisplayId, realToDisplayId }`.
- Produces: `currentChartRenderContext`, replaced on every `renderTree()`.
- Changes: `calculateInitialCoordinates(renderContext)` and `drawConnections(renderContext = currentChartRenderContext)` consume the same display hierarchy.

- [ ] **Step 1: Write failing render-context assertions**

Add to `tests/overview-layout.test.mjs`:

```js
test("Overview cards, layout, and connections consume one grouped render context", () => {
  assert.match(appSource, /function buildChartRenderContext\(\)/);
  assert.match(appSource, /OrgHierarchy\.buildOverviewDisplayModel\(/);
  assert.match(appSource, /calculateInitialCoordinates\(renderContext\)/);
  assert.match(appSource, /drawConnections\(renderContext = currentChartRenderContext\)/);
  assert.match(appSource, /effectiveManagerByDisplayId/);
  assert.match(appSource, /membersByDisplayId/);
});

test("department views use every real department position", () => {
  assert.match(appSource, /selectedDept === "All"[\s\S]*buildOverviewDisplayModel/);
  assert.match(appSource, /position\.department === selectedDept/);
});

test("sidebar statistics continue to count real positions", () => {
  assert.match(appSource, /EmployeeDirectory\.getStaffingSummary\(employees, positions\)/);
});
```

Extend `tests/collapse-view-mode.test.mjs` to assert that collapsed descendants are derived from `effectiveManagerByDisplayId`, not from a second independent scan of raw positions.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
node --test tests/overview-layout.test.mjs tests/collapse-view-mode.test.mjs
```

Expected: FAIL because the shared render context is absent.

- [ ] **Step 3: Add `buildChartRenderContext()`**

Implement the sequence below:

```js
function buildChartRenderContext() {
  const modePositions = getChartModePositions();
  const realVisiblePositions = selectedDept === "All"
    ? modePositions
    : modePositions.filter(position => position.department === selectedDept);
  const realVisibleIds = new Set(realVisiblePositions.map(position => position.id));
  const realPositionById = new Map(positions.map(position => [Number(position.id), position]));
  const effectiveManagerByRealId = new Map(realVisiblePositions.map(position => [
    position.id,
    getVisibleReportingManagerId(position, realVisibleIds, realPositionById)
  ]));

  const model = selectedDept === "All"
    ? OrgHierarchy.buildOverviewDisplayModel(positions, realVisiblePositions, effectiveManagerByRealId)
    : {
        displayPositions: realVisiblePositions,
        realToDisplayId: new Map(realVisiblePositions.map(position => [position.id, position.id])),
        membersByDisplayId: new Map(realVisiblePositions.map(position => [position.id, [position]])),
        effectiveManagerByDisplayId: new Map(effectiveManagerByRealId)
      };

  // Build positionByDisplayId and hasReportsByPositionId from model output.
  return { modePositions, realVisiblePositions, ...model, positionByDisplayId, hasReportsByPositionId };
}
```

- [ ] **Step 4: Refactor rendering consumers**

- `renderTree()` builds and stores the context once.
- Group-aware collapse traverses `effectiveManagerByDisplayId` and removes display descendants only in Overview.
- `getPositionCardHTML()` reads `displayTitle`, group membership, and report state from the context.
- `calculateInitialCoordinates(renderContext)` lays out `renderContext.displayPositions` and uses `effectiveManagerByDisplayId` for roots and children.
- `drawConnections(renderContext)` iterates the visible display cards and the same manager map; it does not rebuild hierarchy from global `positions`.
- The card click handler keeps the representative real ID and passes it to Employee Details.

- [ ] **Step 5: Run focused tests**

```powershell
node --test tests/overview-grouping.test.mjs tests/overview-layout.test.mjs tests/collapse-view-mode.test.mjs tests/position-lifecycle.test.mjs
```

Expected: all tests PASS, including the existing hidden-manager lifecycle cases.

- [ ] **Step 6: Run syntax validation**

```powershell
node --check app.js
```

Expected: exit code 0.

- [ ] **Step 7: Commit the render-context integration**

```powershell
git add -- app.js tests/overview-layout.test.mjs tests/collapse-view-mode.test.mjs
git diff --cached --check
git commit -m "feat: render overview position groups"
```

---

### Task 5: Isolate Overview Dragging From Structural Combine

**Files:**
- Modify: `hierarchy-utils.js`
- Modify: `app.js:5240-5680`
- Modify: `tests/overview-grouping.test.mjs`
- Modify: `tests/card-drag-feedback.test.mjs`
- Modify: `tests/overview-layout.test.mjs`

**Interfaces:**
- Produces: `OrgHierarchy.getOverviewDragPositionIds(sourcePositions, displayPositionId, memberIds)` returning a deduplicated array containing every group member and each member's descendants.
- Consumes: `currentChartRenderContext.membersByDisplayId` during pointer drag.

- [ ] **Step 1: Write failing group-drag and combine-isolation tests**

Append to `tests/overview-grouping.test.mjs`:

```js
test("group drag includes every member and descendant exactly once", () => {
  const positions = [
    { id: 75, managerId: 136 },
    { id: 183, managerId: 136 },
    { id: 200, managerId: 75 },
    { id: 201, managerId: 183 },
    { id: 202, managerId: 200 }
  ];
  const ids = OrgHierarchy.getOverviewDragPositionIds(positions, 75, [75, 183]);
  assert.deepEqual(ids.sort((a, b) => a - b), [75, 183, 200, 201, 202]);
});
```

Append to `tests/card-drag-feedback.test.mjs`:

```js
test("Overview dragging never renders or opens structural Combine targets", () => {
  assert.match(appSource, /function renderCombineDropZones\(draggedPosition\)[\s\S]*if \(isOverallView\(\)\) return;/);
  assert.match(appSource, /combineTargetId !== null[\s\S]*!isOverallView\(\)/);
});
```

Add an `overview-layout` assertion that group member IDs come from `currentChartRenderContext.membersByDisplayId` before drag starts.

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
node --test tests/overview-grouping.test.mjs tests/card-drag-feedback.test.mjs tests/overview-layout.test.mjs
```

Expected: FAIL because group-aware drag collection and Overview gating are missing.

- [ ] **Step 3: Implement group-aware drag IDs**

In `hierarchy-utils.js`, union `getDescendantPositionIds()` for every member ID and return IDs in stable source-position order.

In `handleCardDragStart()`:

```js
const overviewMembers = isOverallView()
  ? currentChartRenderContext?.membersByDisplayId?.get(draggedId) || []
  : [];
draggedPositionIds = overviewMembers.length > 1
  ? OrgHierarchy.getOverviewDragPositionIds(positions, draggedId, overviewMembers.map(position => position.id))
  : OrgHierarchy.getDescendantPositionIds(positions, draggedId);
```

Continue using the existing DOM-coordinate fallback for hidden group members and the existing candidate-save call on pointer up.

- [ ] **Step 4: Gate structural Combine from Overview**

- Return immediately from `renderCombineDropZones()` when `isOverallView()`.
- Do not call `captureStartingCombineDropTargets()` in Overview.
- Require `!isOverallView()` before `handleCardDragEnd()` opens the Combine modal.
- Keep ordinary Overview dragging, snapping, subtree movement, layout lock, Viewer checks, and save rollback unchanged.

- [ ] **Step 5: Run focused tests and syntax check**

```powershell
node --test tests/overview-grouping.test.mjs tests/card-drag-feedback.test.mjs tests/overview-layout.test.mjs
node --check app.js
```

Expected: all tests PASS and syntax check exits 0.

- [ ] **Step 6: Commit drag isolation**

```powershell
git add -- hierarchy-utils.js app.js tests/overview-grouping.test.mjs tests/card-drag-feedback.test.mjs tests/overview-layout.test.mjs
git diff --cached --check
git commit -m "fix: isolate overview layout dragging"
```

---

### Task 6: Add Editor Group/Ungroup Actions and View-Aware Split/Combine Controls

**Files:**
- Modify: `index.html:425-600`
- Modify: `style.css:2179-2230`
- Modify: `app.js:2560-2610`
- Modify: `app.js:3640-3830`
- Modify: `app.js:4269-4550`
- Modify: `tests/combine-positions.test.mjs`
- Modify: `tests/position-lifecycle-ui.test.mjs`

**Interfaces:**
- Produces: `openOverviewGroupModal(employeeId, selectedPositionIds = [])`.
- Produces: `handleOverviewGroupSubmit()` and `handleOverviewUngroup()` using candidate position lists.
- Changes: `showEmployeeDetails(employeeId, selectedPositionId = null)` preserves which real card was clicked.
- Changes: chart-origin Split and real Combine are allowed only when `selectedDept !== "All"`; Position Management-origin Split remains allowed.

- [ ] **Step 1: Write failing UI source tests**

Add assertions for these exact IDs and entry-point guards:

```js
test("Employee Profile separates Overview grouping from real Combine", () => {
  assert.match(htmlSource, /id="btn-group-overview-positions"/);
  assert.match(htmlSource, /id="btn-ungroup-overview-positions"/);
  assert.match(htmlSource, /id="overview-group-modal"/);
  assert.match(htmlSource, /id="overview-group-title"/);
  assert.match(htmlSource, /id="overview-group-primary"/);
  assert.match(appSource, /function openOverviewGroupModal\(/);
  assert.match(appSource, /OrgHierarchy\.groupPositionsForOverview\(/);
  assert.match(appSource, /OrgHierarchy\.ungroupOverviewPositions\(/);
});

test("chart structural actions are hidden in Overview but Position Management can still Split", () => {
  assert.match(appSource, /selectedDept !== "All"/);
  assert.match(appSource, /source === "position-management"/);
  assert.match(appSource, /showEmployeeDetails\(employee\.id, position\.id\)/);
});
```

- [ ] **Step 2: Run the UI tests and verify RED**

```powershell
node --test tests/combine-positions.test.mjs tests/position-lifecycle-ui.test.mjs
```

Expected: FAIL because Group/Ungroup controls and view-aware entry guards do not exist.

- [ ] **Step 3: Add accessible modal and persistent actions**

In `index.html`:

- Add `Group in Overview` and `Ungroup from Overview` buttons to `.detail-drawer-footer`, initially hidden.
- Add a modal with employee summary, checkboxes for compatible positions, required Overview title, primary-position select, Cancel, and Save buttons.
- Give the modal `role="dialog"`, `aria-modal="true"`, a labelled heading, and a separate overlay.
- Bump `style.css` and `app.js` query-string versions after all UI edits are complete.

Add focused CSS so the structural actions span the footer width on narrow screens and remain hidden for `body.role-viewer`.

- [ ] **Step 4: Preserve selected real position in Employee Details**

Change card clicks to:

```js
showEmployeeDetails(employee.id, position.id);
```

Inside `showEmployeeDetails()`, resolve `selectedPosition` first and use it for Split, group membership, manager, and direct-report sections. Add an `Overview group` section when the selected display card represents multiple real members. List each real title without inventing employee records.

- [ ] **Step 5: Implement Group and Ungroup candidate saves**

`openOverviewGroupModal()` lists positions assigned to the employee that share the selected position's effective manager. `handleOverviewGroupSubmit()` validates two checked positions, a title, and a selected primary, then calls:

```js
const result = OrgHierarchy.groupPositionsForOverview(positions, memberIds, {
  title: overviewTitle,
  primaryPositionId
});
if (!result.changed) {
  showNotification(getOverviewGroupErrorMessage(result.error), "error");
  return;
}
const saved = await savePositions(result.positions);
if (!saved) return;
closeOverviewGroupModal();
renderAll();
requestAnimationFrame(fitToScreen);
```

`handleOverviewUngroup()` obtains the selected position's `overviewGroupId`, builds a candidate with `ungroupOverviewPositions()`, confirms the action, awaits `savePositions(candidate)`, and rerenders only after success.

- [ ] **Step 6: Gate Split and real Combine by entry context**

- Hide Employee Profile Split, Group, Ungroup, and real Combine in Overview.
- Keep department card Split/Group/Ungroup/Combine available to editors.
- Track lifecycle drawer source as `chart` or `position-management`; allow Split from Position Management even while Overview is selected.
- Keep Viewer guards at every mutation entry point, not only in CSS.
- Rename destructive copy to `Combine Real Positions` and state that secondary records are removed.

- [ ] **Step 7: Run focused tests and syntax check**

```powershell
node --test tests/combine-positions.test.mjs tests/position-lifecycle-ui.test.mjs tests/employee-directory.test.mjs
node --check app.js
```

Expected: all tests PASS and syntax check exits 0.

- [ ] **Step 8: Commit management actions**

```powershell
git add -- index.html style.css app.js tests/combine-positions.test.mjs tests/position-lifecycle-ui.test.mjs tests/employee-directory.test.mjs
git diff --cached --check
git commit -m "feat: manage overview presentation groups"
```

---

### Task 7: Full Regression and Browser Verification

**Files:**
- Modify only if a verification failure identifies an in-scope defect.
- Verify: all files changed in Tasks 1-6.

**Interfaces:**
- Consumes: final local application with a mocked Admin session and non-Production write endpoints.
- Produces: test output, browser screenshots, console log check, and a deployment-ready status report.

- [ ] **Step 1: Run the complete automated verification**

```powershell
npm.cmd run verify
git diff --check
```

Expected: all Node tests pass, `node --check app.js` exits 0, and `git diff --check` reports no errors.

- [ ] **Step 2: Start the existing local QA proxy safely**

Use the project's existing local QA harness or a temporary Node server outside the repository. Proxy Production GET requests, return an Admin session from `/api/session`, and keep all PUT/POST/DELETE writes in memory. Do not send mutations to Production.

- [ ] **Step 3: Verify the PANITPORN grouping flow in the browser**

1. Open the Logistics and Procurement department.
2. Open PANITPORN's `Logistics Manager` card.
3. Choose `Group in Overview`.
4. Select IDs `75` and the current `Procurement Manager` position ID from loaded data; do not assume the secondary ID in application logic.
5. Set title to `Logistics and Procurement Manager` and primary to position `75`.
6. Save and verify the mock positions endpoint receives both real positions with identical group metadata.
7. Switch to Overview and verify one PANITPORN card with the combined title.
8. Switch back to the department and verify two PANITPORN cards with the separate titles.

- [ ] **Step 4: Verify hierarchy, layout, and authorization behavior**

- Confirm the four existing direct reports remain visible and connect once to the combined Overview card.
- Drag the grouped Overview card and confirm no Combine modal opens.
- Confirm all group members receive the same Overview delta in the mocked save payload.
- Drag one department card and confirm only `manualLayouts[selectedDept]` changes.
- Reload as Viewer and confirm Group, Ungroup, Split, and Combine controls are absent while both chart views remain navigable.
- Confirm no framework error overlay and no relevant browser console error or warning.

- [ ] **Step 5: Capture evidence and stop the QA environment**

Save screenshots of the grouped Overview and separate department view outside the repository. Finalize browser tabs, stop only the exact QA server PID after validating its process name and listener port, and confirm the port is free.

- [ ] **Step 6: Review the final diff and commit any verification-only fix**

```powershell
git status --short
git diff --check
git log -7 --oneline
```

If Step 1-4 required a code correction, repeat the failing focused test first, apply the smallest fix, rerun `npm.cmd run verify`, and commit only the corrected files with a specific message. If no code correction was needed, do not create an empty commit.

- [ ] **Step 7: Hand off deployment readiness**

Report the exact automated test count, browser interactions performed, screenshots, remaining worktree state, and that Production data was not mutated. Deploy to Production only after the user explicitly requests deployment.
