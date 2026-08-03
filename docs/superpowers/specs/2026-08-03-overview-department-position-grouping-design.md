# Overview and Department Position Grouping Design

**Date:** 2026-08-03
**Status:** Approved for planning
**Scope:** Keep split positions separate in department views while presenting only their originating combined card in Overview

## Goal

Make Overview and department views intentionally different without duplicating or deleting position records:

- Overview presents positions created by one Split operation as one combined card using the title that existed before the split.
- A department view presents every real position separately, including its own reporting lines and saved layout.
- Positions held by the same employee for unrelated reasons are not grouped automatically.
- Combine and Split are structural management actions available from a department view or Position Management, not accidental side effects of dragging cards in Overview.

The target example is PANITPORN YOOSUK: Overview shows one `Logistics and Procurement Manager` card, while the Logistics and Procurement department shows separate `Logistics Manager` and `Procurement Manager` cards.

## Selected Approach

Store explicit Overview-group metadata inside the existing JSON notes envelope for each member position. Build a view-only Overview display model from the real positions at render time. Department views continue to consume the real position list directly.

This approach requires no database table or API schema migration. The existing positions API, audit snapshots, local backup, and JSON export/import continue to transport the notes envelope.

## Data Model

Add these normalized fields to each position:

- `overviewGroupId`: stable identifier shared only by positions from the same Split or explicit Overview-group action.
- `overviewGroupTitle`: title displayed on the combined Overview card.
- `overviewPrimaryPositionId`: real position whose ID, manager, employee, and Overview coordinates represent the group.

`normalizePosition()` reads the fields from the JSON notes envelope. `savePositions()` writes them back beside existing layout, lifecycle, and note fields.

For a new Split:

1. Capture the source title before changing it.
2. Reuse an existing valid group when splitting a member of that group; otherwise create a stable group ID based on the source position ID.
3. Apply the same group ID, original title, and primary position ID to the source and every created position.
4. Keep direct reports on the first split position, as today.
5. Preserve the existing department-layout offsets so the real cards do not overlap in department views.

An Overview group is valid only when it contains at least two positions assigned to the same employee and using the same effective reporting manager. An invalid or incomplete group fails open: its positions render separately rather than hiding information.

## Rendering and Hierarchy

Introduce a pure display-model builder with two outputs:

- `displayPositions`: cards and effective hierarchy used by the selected view.
- `groupMembersByPrimaryId`: the real positions represented by each combined Overview card.

When `selectedDept === "All"`:

- Valid members with the same `overviewGroupId` collapse to the primary position.
- The primary card uses `overviewGroupTitle` but keeps the primary position ID and employee.
- Reports whose real manager is any group member connect to the primary display card.
- Duplicate manager or child edges are removed.
- Positions belonging to the same employee but lacking a matching group ID remain separate.
- Current/Future filtering occurs before presentation grouping. A group appears whenever at least one member is visible in the selected chart mode.

When a department is selected:

- The renderer uses the real filtered positions without Overview grouping.
- Every split position has its own card, title, and department coordinates.
- Department dragging continues to write only `manualLayouts[selectedDept]`.

Sidebar statistics continue to count real positions, not display cards. A grouped Overview may therefore show fewer cards than the Positions statistic.

## Layout Behavior

- The Overview combined card uses the primary position's `x` and `y` coordinates.
- Dragging a combined Overview card applies the same delta to all group members' Overview coordinates. This changes layout only and preserves relative placement if the group is later removed.
- Dragging or arranging a department view never overwrites Overview coordinates.
- Frames, text annotations, zoom, and the saved Overview layout remain unchanged when positions are grouped for display.
- Overview card dragging never opens Combine. The existing same-person combine drop targets are disabled in Overview and remain available only where structural position management is allowed.

## Management Actions

### Split

Split is available to editors from a department view and Position Management. It creates real positions and automatically creates or extends their Overview presentation group. The existing candidate-save behavior remains: the live chart changes only after all candidate positions persist successfully.

### Group in Overview

Add an editor-only `Group in Overview` action for two or more existing positions. It:

- requires the same employee and effective manager;
- asks for the Overview title and primary position;
- writes group metadata only;
- never deletes, merges, or reparents a real position.

This action will be used once for the already-split PANITPORN positions so the desired Overview card appears without recombining the underlying records.

### Ungroup from Overview

Add an editor-only `Ungroup from Overview` action. It clears the three group fields from all current members and leaves every real position, manager relationship, and department layout intact.

### Combine Real Positions

The existing destructive Combine remains a separate, explicitly labelled action. It keeps its confirmation modal, candidate persistence, child reparenting, and rollback behavior. After a successful real Combine, the surviving position has stale Overview-group metadata cleared unless it still belongs to another valid group.

## Employee Details

Clicking an Overview combined card opens the normal employee profile and adds an `Overview group` section listing all represented real titles. Structural Split, Group, Ungroup, and Combine actions are hidden for Viewers. Viewers can still inspect the combined Overview and separate department cards.

## Error Handling

- A failed position save leaves the active chart and modal state unchanged and shows the existing error notification.
- A grouping attempt with different employees, different effective managers, missing positions, or fewer than two members is rejected before persistence.
- Invalid group metadata never suppresses cards; the renderer shows the underlying positions separately.
- Lifecycle filtering cannot produce dangling lines. Effective managers are resolved from real positions, then mapped to the visible group primary.
- Import and legacy records without group fields remain fully backward compatible.

## Testing

Regression tests are written and observed failing before implementation.

### Pure utility tests

- Split assigns identical group metadata to the source and every created position.
- Splitting an existing member extends its valid group.
- Overview groups only positions with the same explicit group ID.
- Unrelated positions held by the same employee remain separate.
- Invalid groups fall back to separate cards.
- Children of every member map to the primary display card without duplicate edges.
- Current/Future visibility cannot hide a visible member or create a dangling manager.

### Persistence and UI tests

- Group metadata round-trips through normalization, notes serialization, backup, and import.
- Department rendering receives the ungrouped real position list.
- Overview rendering receives the grouped display model.
- Overview drag does not activate Combine and applies one layout delta to all members.
- Department drag updates only the selected department layout.
- Group, Ungroup, Split, and Combine are editor-only.
- A failed Group, Ungroup, Split, or Combine save keeps the confirmed state.

### Browser verification

- Overview displays one `Logistics and Procurement Manager` card for PANITPORN.
- The Logistics and Procurement department displays `Logistics Manager` and `Procurement Manager` separately.
- Both department cards show PANITPORN and retain the expected hierarchy.
- Existing Overview frames and annotations remain in place.
- Viewer navigation works and no browser-console errors occur.

Run the complete Node test suite, JavaScript syntax check, and browser interaction flow before deployment.

## Acceptance Criteria

- PANITPORN appears as one combined card in Overview and two real cards in the department view.
- Only positions explicitly linked by one Overview group are collapsed.
- Real position count and underlying records remain unchanged by Group/Ungroup.
- Department and Overview layouts remain independent.
- All children remain visible and have exactly one correct display connection.
- Overview dragging cannot initiate a real Combine.
- Viewer access stays read-only; existing Admin role rules remain unchanged.
- Failed writes never replace the confirmed chart state.
- Full automated and browser verification passes before Production deployment.

## Non-Goals

- Adding a new database table or changing the positions API schema.
- Automatically grouping every position held by the same employee.
- Replacing the position-first hierarchy model.
- Redesigning the chart's visual styling, frames, or presentation controls.
- Changing Microsoft sign-in, role assignment, or Microsoft 365 Sync behavior.
