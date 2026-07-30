# Org Chart Performance and Position Mutations Design

**Date:** 2026-07-30  
**Status:** Approved for planning  
**Scope:** Production performance, employee photo delivery, position combine/split reliability, and drag responsiveness

## Goal

Make the Production organization chart load materially faster while ensuring that combining or splitting positions is safe for employees who hold two or more positions. The implementation must preserve hierarchy, lifecycle metadata, notes, and saved layouts, and it must not expose Production data to destructive partial updates.

## Current Evidence

- Production displays its first cards in a median of 6.35 seconds and removes the loader in a median of 7.68 seconds.
- `/api/employees` returns about 551 KB decoded and 382 KB over Brotli because 32 employee photos are still embedded as Base64 data URLs.
- Production currently points to deployment `dpl_JAaKeot9PjDvspjQoWvGTCnYzXCS`, which superseded the deployment containing the Blob photo work.
- Production contains 68 positions and 7 employees with multiple assigned positions; one employee holds 3 positions.
- The core hierarchy utility can combine and split more than two positions without creating dangling managers or cycles.
- The current Split UI exposes exactly two titles and new split positions lose lifecycle and layout fields.
- A parent position cannot be dragged onto a same-person descendant because subtree dragging moves the descendant target at the same time.
- Position persistence deletes missing rows before upserting the new payload, and the Combine/Split UI has no rollback when persistence fails.

## Selected Approach

Apply a focused patch to the current architecture. Do not restructure the entire application or change the position-first data model.

### 1. Employee Photo Delivery and Migration

- Keep employee photos in Vercel Blob and store only public Blob URLs in Supabase.
- Anonymous GET responses must never return legacy Base64 photo data.
- Add an idempotent Production migration command that:
  - reads employee rows without deleting any rows;
  - uploads each unique Base64 image through the existing Blob helper;
  - updates only rows whose `photo_url` changed;
  - reports counts without printing employee details or secrets.
- Run the migration with Production environment variables in a temporary environment file outside the repository, then remove that file.
- Deploy the same source state that contains the Blob API code so a later deployment cannot silently restore the legacy response behavior.

### 2. Multi-Position Split

- Replace the fixed two-title Split form with a dynamic list containing at least two title fields.
- Editors can add and remove title fields; the form cannot submit fewer than two non-empty titles.
- `OrgHierarchy.splitPosition()` remains the single mutation implementation and must support any number of titles greater than or equal to two.
- Every created position inherits:
  - department and employee assignment;
  - reporting manager;
  - status, effective date, and status reason;
  - notes and layout style;
  - manual-layout status and per-view manual layouts.
- Each created position receives a deterministic horizontal offset from the source position in the Overall layout and every saved department layout so cards do not overlap.
- Existing direct reports remain attached to the first/primary split position.

### 3. Safe Combine and Split Persistence

- Combine/Split must prepare a candidate position list and persist it before replacing the active in-memory list.
- If persistence fails:
  - the active list and rendered chart remain unchanged;
  - the modal remains available for retry;
  - an error notification is shown.
- The positions API must upsert the candidate rows before deleting rows absent from the candidate payload.
- Empty payload deletion remains supported but must be handled as an explicit empty-chart operation.
- Audit history is written only after all persistence operations succeed.
- This ordering is not a database transaction, but it prevents an upsert failure from deleting the last valid position set.

### 4. Drag-to-Combine Without Breaking Subtree Drag

- Preserve normal subtree movement for layout editing.
- When the dragged position belongs to an employee with other positions, render stationary combine drop zones at the original locations of those same-person positions.
- The drop zones remain fixed while the subtree moves, including when a candidate is a descendant of the dragged position.
- Dropping on a zone opens the existing Combine modal with the zone position and dragged position selected.
- Drop zones are editor-only, are removed on pointer up/cancel, and do not persist any layout coordinates when a combine action is selected.
- The existing Employee Detail Combine action remains available for selecting three or more positions.

### 5. Rendering and Startup Performance

- Start independent API reads concurrently. Employee and position normalization may still be sequenced after both responses resolve.
- Remove decorative fixed waits from initial loading; retain only the short loader fade needed to avoid an abrupt visual transition.
- Build a render context once per render containing:
  - visible positions and IDs;
  - position and employee maps;
  - effective manager IDs;
  - children grouped by effective manager;
  - card elements after DOM creation.
- Reuse this context in card generation and connection drawing instead of repeatedly filtering positions and rebuilding maps.
- During drag, schedule at most one connection redraw per animation frame.
- A final redraw must occur after drag completion, mode switching, resizing, and rendering.

## Error Handling

- Photo migration stops before database updates if any upload fails.
- Position candidate persistence returns failure without committing the candidate to the active chart.
- Drop-zone state is cleared for pointer up, pointer cancel, modal open, and failed drag initialization.
- Split validation identifies blank or duplicate-empty rows without silently dropping the editor below two positions.

## Testing

Regression tests must be written before implementation and observed failing for the intended reason.

- Split tests:
  - split one position into three;
  - preserve lifecycle fields and notes;
  - preserve and offset Overall and department layouts;
  - leave children attached to the primary position.
- Combine tests:
  - combine all positions for a three-position employee;
  - reparent external children;
  - prevent dangling manager references and cycles.
- Drag tests:
  - a same-person descendant is exposed as a stationary combine target;
  - normal subtree IDs remain unchanged for layout dragging;
  - connection redraws are animation-frame throttled.
- Persistence tests:
  - failed candidate persistence leaves the active list unchanged;
  - positions API source performs upsert before deletion.
- Photo tests:
  - anonymous mapping strips Base64;
  - migration updates only changed photo rows;
  - existing Blob URLs are untouched.
- Startup/render tests:
  - independent loaders are initiated concurrently;
  - decorative startup waits are absent.

Run the complete Node test suite and JavaScript syntax checks before deployment.

## Deployment and Verification

1. Confirm the complete intended diff, including the existing uncommitted Blob work.
2. Run all tests and syntax checks.
3. Run the idempotent Production photo migration and verify only aggregate counts.
4. Deploy the verified workspace source to Vercel Production.
5. Confirm the Production alias points to the new deployment.
6. Verify through the browser:
   - anonymous Viewer loads the Overview;
   - employee payload no longer contains Base64 photo data;
   - Current/Future switching works without console errors;
   - an editor can access the Combine/Split controls when authenticated.

## Acceptance Criteria

- Production anonymous employee data contains zero Base64 photo URLs.
- All migrated photos are Blob URLs and no employee rows are deleted by migration.
- The first Overview cards appear materially earlier than the measured 6.35-second baseline.
- Split supports at least three titles in one operation and preserves all defined lifecycle/layout fields.
- Parent-to-descendant same-person combine is possible through a stationary drop zone.
- Combine/Split failure does not replace the active chart state.
- Position upsert completes before removal of obsolete rows.
- The full automated test suite and syntax checks pass.
- Production points to the deployment created from the verified source state.

## Non-Goals

- Rewriting `app.js` into a framework.
- Changing Microsoft identity or role rules.
- Changing the position-first data model.
- Redesigning the organization chart visual language.
- Adding database RPCs or schema migrations solely to create a transactional save operation.
