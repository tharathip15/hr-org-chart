# Position-to-Position Hierarchy Design

**Date:** 2026-07-13
**Status:** Approved

## Goal

Make the organizational hierarchy depend on position-to-position relationships so that a position's parent remains stable when employees change, are vacant, or hold multiple positions.

## Scope

- Use `position.managerId` as the only source of truth for the Org Chart hierarchy.
- Make Position Management the clear place to choose a position's parent position.
- Remove employee-based hierarchy editing and stop employee manager data from moving positions.
- Keep employee manager data available for Microsoft sync/history compatibility, but do not use it to render or repair the position hierarchy.
- Show derived reporting information in employee details from the employee's primary assigned position.
- Preserve the existing `employees` and `positions` APIs and database schema.

Out of scope: new position tables, a database migration, Microsoft OAuth changes, payroll or attendance data, bulk import, and redesigning the chart layout algorithm.

## Current Project Context

The application already stores separate employee and position records. Position cards are rendered from `positions`, and each position has `managerId`, `employeeId`, coordinates, layout style, department, and notes. The Position Management modal already contains a `Reports To Position` field, but the employee form still contains an employee-to-employee `Reports To` field. Legacy load and save paths can also derive a position parent from `employee.managerId`, which makes the chart depend on mutable person data.

The implementation must keep the existing position-first chart and persistence paths intact while removing the remaining employee-to-position coupling.

## Data Model

The position hierarchy contract remains:

```text
position.id: integer
position.managerId: nullable integer position id
position.employeeId: nullable integer employee id
```

Rules:

- `managerId === null` means the position is `Top Level`.
- `managerId` must reference an existing position ID.
- A position cannot reference itself.
- A position cannot reference any descendant position.
- Multiple top-level positions are valid.
- A vacant parent position is still a valid parent position.
- `employee.managerId` is not read when rendering, laying out, repairing, or auto-parenting positions.

Employee manager fields may continue to be received from Microsoft Graph and stored for compatibility, but they are not authoritative for the chart. When employee details need a reporting relationship, the UI derives it from the employee's primary assigned position and that position's `managerId`. If the parent position is vacant, the UI shows the parent position and `VACANT`; if the employee has no assigned position, it shows that the reporting relationship is unavailable.

## User Experience

### Position Management

Position Management is the hierarchy editor. The parent-position control displays a stable, disambiguated option label containing:

- Position title
- Department
- Position ID
- Assigned employee name or `VACANT`

The current position and all of its descendants are excluded from the parent options. Clearing the control makes the position `Top Level`.

The position list continues to support selecting a position for editing and adds enough parent information to scan the structure quickly: current parent, assigned employee/vacancy, and child count.

### Employee Form and Details

The editable employee form no longer allows a person to be selected as the manager that defines chart placement. The old control is removed or replaced with a read-only note that the hierarchy is managed by Position Management.

Employee details display the derived parent position rather than treating `employee.managerId` as the chart relationship. Direct reports are derived from child positions of the employee's primary assigned position. Existing dual-position information remains visible, but editing hierarchy still happens only through positions.

### Position Creation and Microsoft Sync

Adding or syncing an employee does not create a position under the employee's Microsoft manager. If the existing auto-alignment path must create a position for an employee without an assigned seat, that new position is created at `Top Level` and can then be assigned through Position Management. Matching an existing vacant position by role and department remains allowed because it does not infer a parent from a person.

## Data Flow

1. Load employees and positions using the existing API endpoints.
2. Normalize position IDs and employee IDs.
3. Repair invalid position references and cycles using the existing hierarchy repair boundary.
4. Render the chart from position roots and `position.managerId` edges.
5. Save parent changes through the existing positions PUT payload.
6. Re-render the chart, Position Management list, collapsed state, and sidebar counts after a successful save.

Saving a position assignment may still link an employee to a seat. It must not rewrite `position.managerId` from the employee's manager field and must not create or delete employee records.

## Validation and Error Handling

- Reject an empty or unrecognized parent-position value when the field is not cleared.
- Reject self-parenting with a visible notification.
- Reject selecting a descendant as the parent with a visible notification.
- Normalize stale or malformed parent IDs to `Top Level` during load and persist the repaired position state when appropriate.
- Preserve localStorage backups and sync-status behavior when the positions API fails.
- Keep deletion behavior: child positions move to the deleted position's parent, the deleted position is removed, and its collapsed preference is cleared.
- Keep viewer restrictions for all mutations.

## Implementation Boundaries

- `app.js`: make position hierarchy the sole chart source, remove employee-manager-to-position inference, update the position parent editor and derived employee detail reporting, and preserve position persistence/error behavior.
- `index.html`: remove or replace the employee form's editable manager selector and clarify the Position Management parent-position control.
- `style.css`: style the parent-position control, hierarchy metadata, and responsive states without clipping existing modal content.
- `hierarchy-utils.js`: extend the shared position hierarchy validation/repair boundary only if a small pure helper is needed for the new tests.
- `tests/`: add focused behavior tests for position-only hierarchy, parent validation, no employee-manager inference, and the updated UI contract.

No API or database migration is required unless implementation verification discovers that an existing deployed endpoint cannot persist the unchanged `managerId` contract.

## Acceptance Criteria

1. The Org Chart hierarchy is determined only by `position.managerId`.
2. A user can select a parent position using stable position identity and see its employee/vacancy status.
3. The parent selector cannot choose the current position or a descendant.
4. Changing an employee's Microsoft manager or editing employee data does not move a position in the chart.
5. A newly created auto-aligned position does not inherit a parent from an employee's manager.
6. Employee details derive reporting information from the assigned position hierarchy.
7. Existing vacant-seat, dual-position, delete-to-vacant, collapse, layout, and persistence behavior remains intact.
8. Position Management is usable at desktop and 390px mobile widths without overlap, clipping, or inaccessible controls.
9. All existing automated tests pass, and new tests cover the position-only contract.

## Verification Plan

- Write focused failing tests before production changes.
- Run the focused hierarchy and position-first tests in the RED and GREEN cycles.
- Run `node --test tests/*.test.mjs` after implementation.
- Run JavaScript syntax checks for changed Vercel Function files and `git diff --check`.
- Run `npx vercel dev` and use the in-app Browser against the local Vercel instance to create a temporary parent and child position, change the parent, verify the chart edge follows the position ID, and verify an employee manager change does not move the edge.
- Check desktop and 390px mobile Position Management screenshots for modal bounds, readable parent options, and no overlapping controls.
