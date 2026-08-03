# Draggable Connection Routing Design

## Goal

Allow an authorized editor to separate overlapping organization-chart connectors by selecting one reporting line and dragging two routing handles. The adjustment changes presentation only: it must not move cards, combine positions, or change the reporting hierarchy.

## Scope

- Support both Overall View and individual department views.
- Store connector routing independently for Overall View and for each department.
- Allow editing only when the signed-in session can edit and the canvas is unlocked.
- Preserve the current automatic orthogonal route when a connection has no manual routing data.
- Keep Viewer and anonymous sessions read-only and free of editing handles.

## Interaction Design

### Selecting a connection

- Every visible reporting connection has a transparent, enlarged hit path above its visible stroke.
- Clicking or tapping the hit path selects exactly that parent-to-child connection.
- The selected visible line receives an accent highlight and exposes two handles.
- Clicking an empty area, switching views, changing chart mode, closing the current chart, or selecting another connection clears the selection.
- Selecting a line is allowed while the canvas is locked so an editor can inspect it, but its handles and reset actions are disabled.

### Routing handles

Each selected connection exposes two handles:

1. **Branch handle** — dragged horizontally to change where the line fans out beneath the parent.
2. **Lane handle** — dragged vertically to change the horizontal routing lane between parent and child.

Dragging a handle redraws only the chart connectors. It does not start card dragging, canvas panning, annotation editing, or position-combine drop zones. Pointer capture keeps the drag active until pointer-up or pointer-cancel, including when the pointer leaves the handle.

The route remains orthogonal and uses this shape:

1. Start at the center of the parent's bottom edge.
2. Move vertically to the automatic branch depth.
3. Move horizontally to the manually offset branch column.
4. Move vertically to the manually offset lane.
5. Move horizontally to the center of the child's top edge.
6. Move vertically into the child card.

The branch and lane offsets are clamped to finite canvas-safe limits so malformed or extreme data cannot make the route unusable.

### Reset actions

- `Reset Line` removes the selected connection's route in the active view.
- `Reset All Lines` removes every manual connection route in the active view after confirmation.
- Reset does not modify card coordinates, employee assignments, position managers, Overview grouping, lifecycle state, annotations, or routes saved for other views.

## Data Model

Manual connection routes are stored inside the existing position notes envelope on the child position. No table or API schema change is required.

```json
{
  "connectionRoutes": {
    "__overview__": {
      "parentId": 12,
      "branchOffsetX": -80,
      "laneOffsetY": 45
    },
    "ฝ่ายงานบริหารองค์กร": {
      "parentId": 12,
      "branchOffsetX": 110,
      "laneOffsetY": -30
    }
  }
}
```

Rules:

- The storage key is `__overview__` for Overall View and the exact department name for a department view.
- `parentId` identifies the display parent for which the route was created.
- `branchOffsetX` and `laneOffsetY` are relative to the current automatic route, not absolute canvas coordinates.
- Moving either card therefore moves both endpoints while keeping the chosen routing shape.
- A stored route is ignored when its `parentId` no longer equals the child's current effective display parent.
- Overview routes use the stable displayed position IDs after Overview grouping. If grouping changes the displayed edge, the stale route is ignored and the new edge uses automatic routing.
- Missing, invalid, non-finite, or out-of-range route values fall back to automatic routing.

## Components and Data Flow

### Pure routing utility

A focused browser-compatible utility owns:

- view-scope key normalization;
- route normalization and clamping;
- automatic orthogonal route calculation;
- application of branch and lane offsets;
- stale-parent validation;
- immutable set, reset-one, and reset-scope operations.

The utility accepts plain rectangles and route data and returns plain route points. It has no DOM, authentication, storage, or rendering dependencies.

### Rendering

`drawConnections(renderContext)` continues to consume the same display hierarchy as the cards. For each visible edge it:

1. Calculates the existing automatic baseline.
2. Resolves the active view's saved route from the child position.
3. Applies the route only when its saved parent matches the current effective display parent.
4. Renders the visible SVG path.
5. For editable sessions, renders a transparent hit path; for the selected edge, it also renders the two handles.

Only one connection may be selected at a time. SVG editing layers use a higher z-index than the connector stroke but remain below dialogs and global controls.

### Pointer editing

Handle pointer-down captures:

- connection parent and child IDs;
- handle kind;
- active view scope;
- pointer position converted into canvas coordinates;
- the route values before editing.

Pointer movement converts viewport coordinates through the current canvas transform, updates the relevant offset, and schedules at most one connector redraw per animation frame. Pointer-up writes the route to the child position and calls the existing position persistence path once. Pointer-cancel restores the pre-drag route without saving.

### Persistence

Position normalization reads `connectionRoutes` from the notes envelope. `savePositions()` serializes normalized routes alongside the existing layout, lifecycle, Overview-group, and free-text metadata. Backup, import, history snapshots, and API persistence continue to round-trip the complete notes string.

If saving fails, the existing confirmed-position rollback restores the last confirmed route and the UI reports an error. No intermediate pointer-move state is sent to the API.

## Permissions and Locking

- Anonymous users and Viewers see normal connector strokes only.
- Only sessions for which `canEdit` is true receive connector hit paths and selection behavior.
- A locked canvas allows line selection but disables handle dragging, `Reset Line`, and `Reset All Lines`.
- Presentation mode hides connector handles and route-reset controls, even for an Admin.
- Changing permission, lock state, or presentation state while a handle is active cancels the edit safely.

## Performance

- Reuse the current `requestConnectionDraw()` animation-frame throttle.
- Do not rebuild the chart hierarchy during handle movement.
- Do not call `renderAll()` during movement; update SVG connectors only.
- Keep one selected-edge state object and one active handle-drag state object.
- Persist once on pointer-up and reuse the existing tracked position-save promise.

## Error Handling and Edge Cases

- A missing parent card or child card skips the connection safely.
- A parent/child relationship changed since the route was saved ignores the stale route.
- A hidden lifecycle position, collapsed branch, or changed Overview group cannot create a dangling editable handle.
- A route belonging to another department never affects the active department.
- Switching Current/Future Chart clears selection and rebuilds routes from the new display context.
- A pointer-cancel, lost card, or removed edge restores pre-drag route state and clears pointer state.
- Reset-all asks for confirmation because it changes multiple saved presentation values, but remains non-structural and recoverable through history/backup.

## Testing

All behavior changes are developed test-first.

### Pure utility tests

- The automatic horizontal route matches the current parent/bus/child geometry.
- Applying a branch offset changes only the branch column.
- Applying a lane offset changes only the routing lane.
- Moving parent and child rectangles preserves stored offsets.
- A stale parent ID returns the automatic route.
- Route values are finite and clamped.
- Reset-one changes only one view route.
- Reset-scope changes only the active view and leaves other view routes intact.

### Application behavior tests

- Admin plus unlocked canvas renders hit paths and two handles for the selected edge.
- Viewer, anonymous, locked, and presentation states cannot mutate a route.
- Handle pointer movement uses canvas coordinates under zoom and pan.
- Pointer-up saves once; pointer-cancel saves zero times and restores the old route.
- Card drag, canvas pan, Combine, and annotation drag are not triggered by a route handle.
- Route metadata round-trips through normalization, save payloads, backup/import, and history.
- Overview and department routes remain independent.
- Current/Future changes and Overview grouping cannot leave a stale editable edge.

### Browser verification

- Select and manually separate each direct-report line shown in the supplied Corporate Image Manager example.
- Move the parent and one child and confirm the customized route follows the cards.
- Reload and confirm the route persists.
- Confirm a department route does not alter Overall View, and vice versa.
- Confirm `Reset Line` and `Reset All Lines` affect only the current view.
- Confirm Viewer, locked-canvas, and Presentation modes expose no active route handles.
- Confirm no relevant console errors and no visible regression in card dragging, panning, zooming, grouping, or connector highlighting.

## Acceptance Criteria

- An Admin can select one visible reporting line and drag its branch horizontally and its lane vertically.
- The resulting path can be separated from sibling lines in the form demonstrated by the supplied red-line sketch.
- Customized routes persist independently for Overall View and every department view.
- Moving cards preserves the route's relative shape.
- Changing the reporting parent falls back to automatic routing.
- Viewer and anonymous users cannot edit routes.
- Canvas Lock and Presentation mode prevent route mutation.
- Reset actions do not change organization structure or card positions.
- Dragging remains responsive and saves at most once per completed handle drag.
- Automated tests and browser verification pass before deployment.

## Non-Goals

- Free-form drawing or unlimited waypoints.
- Diagonal or curved connector styles.
- Moving connector endpoints away from the card's defined attachment edges.
- Changing reporting relationships by dragging a line.
- Editing multiple connectors simultaneously.
- Adding a database table or a separate connector API.
