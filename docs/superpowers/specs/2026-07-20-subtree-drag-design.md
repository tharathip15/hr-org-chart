# Subtree Dragging Design

## Goal

Allow users to drag a position together with every descendant position below it. Moving a manager should preserve the existing relative layout of that manager's children and grandchildren while updating the connecting lines in real time.

## Scope

- A drag starts from one visible position card in the organization chart.
- The dragged position and all descendants reachable through `managerId` move by the same `dx` and `dy`.
- The current view controls persistence scope:
  - Overall view stores coordinates in each position's `x`, `y`, and `isManual` fields.
  - Department views store coordinates in each position's `manualLayouts[selectedDept]` entry.
- Existing collapse behavior, position hierarchy, annotations, and cards outside the dragged subtree remain unchanged.

## Interaction

1. On pointer down, resolve the dragged position and collect its descendant IDs recursively.
2. Capture the rendered coordinates of every subtree member before movement begins.
3. During pointer movement, calculate the dragged root's proposed coordinates from the pointer and existing grab offset.
4. Apply the existing magnetic snap only to the dragged root. Derive the final `dx` and `dy` from the root's snapped coordinates and apply that delta to every captured descendant coordinate.
5. Update each visible card's position and redraw connections on every movement.
6. On pointer up, persist all moved positions in the active view's coordinate storage, release pointer capture, and clear drag state.

## Data Flow

- `getDescendantPositionIds(positionId)` returns the root ID plus all reachable child IDs. It tracks visited IDs so malformed cycles cannot cause an infinite loop.
- Drag state stores the root ID, subtree IDs, and each member's starting rendered coordinates.
- The existing `renderX` and `renderY` values remain the transient render coordinates during the drag.
- Persistence reuses `savePositions()` and the existing Overall/department branching so no database schema or API contract changes are required.

## Edge Cases

- A leaf position moves exactly as it does today.
- Collapsed descendants still move and persist because they are part of the hierarchy even when their cards are not visible.
- A missing or cyclic `managerId` relationship is handled safely by the visited set.
- Snap affects only the root. Children keep their relative spacing and do not independently snap to unrelated positions.
- Dragging in one department view does not overwrite coordinates stored for other department views.

## Testing

- Add source-contract tests for recursive subtree collection and drag state containing the subtree snapshot.
- Add a focused behavior test for a three-level hierarchy: moving the root by a delta moves the child and grandchild by the same delta, while an unrelated position is unchanged.
- Preserve existing tests for manual coordinates, department-specific layouts, and position hierarchy validation.
- Run the full Node test suite, `node --check app.js`, and `git diff --check`.
- Run the rendered drag flow in the local app: drag a manager, confirm descendants move with it, reload, and confirm the saved layout remains intact.

## Non-goals

- No multi-select UI or arbitrary group selection.
- No automatic re-layout of the surrounding organization.
- No changes to reporting relationships or employee assignments.
- No new persistence fields or API endpoints.
