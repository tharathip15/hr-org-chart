# Employee Directory and Position Assignment Design

**Date:** 2026-07-13

**Status:** Approved direction, pending implementation-plan review

## Goal

Keep employee records independent from organizational positions so a person who is missing from Microsoft 365 can still be added, searched, and assigned to a planned position later.

## Scope

- Add a dedicated Employee Management surface alongside Position Management.
- Make Add Employee create only an employee record; it must not create a position automatically.
- Keep Position Management as the place where a position is assigned or unassigned to an employee.
- Keep support for one employee assigned to multiple positions.
- Preserve manually added employees during Microsoft sync.
- Merge a manual employee into a Microsoft employee when the email address matches.
- Delete an employee record without deleting positions; all linked positions become vacant.

Out of scope: Microsoft OAuth changes, a new employee database table, payroll fields, attendance features, bulk CSV import, and changes to the existing position hierarchy layout algorithm.

## Current System Context

The existing app already has separate `employees` and `positions` state plus `/api/employees` and `/api/positions` persistence. The org chart renders position cards and joins an assigned employee by `position.employeeId`. The current employee form still creates a position in add mode, which is the coupling to remove.

The Microsoft sync endpoint already retains records that are not Microsoft records and matches existing rows by email or `person_id`. The implementation must preserve that behavior and make the manual-record marker deterministic for records created locally.

## User Experience

### Employee Management

Add an `Employees` action next to `Positions`. It opens an employee management modal with:

- Search by employee name, role, department, or email.
- A count of all employees.
- Each row showing name, role, department, source (`Manual` or `Microsoft`), and assigned-position count.
- An explicit `Unassigned` state when the employee has zero linked positions.
- Add, edit, and delete actions.

The existing employee form is reused for add/edit. In add mode it saves only the employee record. The form keeps name, role, department, manager, contact details, notes, photo, and profile-link fields. A manual record may omit email; it cannot be auto-merged with Microsoft without a matching email.

### Position Assignment

Position Management remains the source of truth for seats. Its employee lookup must include every employee, including Manual and Unassigned records. Saving a position assignment changes only the position link, except that the existing primary-position manager synchronization may update the employee manager field when the assigned seat is the employee's primary seat.

Assigning an already assigned employee is allowed and must preserve the existing multiple-position/Dual behavior. Unassigning leaves the position in place and renders it as `VACANT`.

### Employee Deletion

Deleting an employee requires confirmation. The operation:

1. Removes the employee record.
2. Clears `employeeId` from every linked position.
3. Keeps those positions, their manager links, layout, notes, and department unchanged.
4. Clears employee-level manager references that point to the deleted employee without reparenting the position hierarchy.

The chart must show the retained seats as vacant after deletion.

## Data Contract

Keep the existing `employees` and `positions` tables and API shapes. No new table or schema migration is required.

Use `personId` provenance to classify source:

- Microsoft records use the Microsoft directory identifier returned by sync.
- New local records use a stable `manual-<slug>-<id>` identifier.
- Existing records with no Microsoft directory identifier remain Manual until a matching email is merged.

The client may compute the display source from this provenance; the server must preserve `person_id` during PUT and Microsoft sync.

The position contract remains:

```text
position.employeeId: nullable employee id
position.managerId: nullable position id
```

No employee record is created as a side effect of saving a position, and no position record is created as a side effect of adding an employee.

## Microsoft Sync Rules

- Keep existing Manual records in the merged result even if Microsoft does not return them.
- Match incoming Microsoft users to existing records by normalized email first, then directory identifier.
- When matched, preserve the existing numeric employee id so existing position links remain valid.
- Replace the local `personId` with the Microsoft directory identifier and update Microsoft profile fields.
- Do not create duplicate employee rows for a matching email.
- When there is no email match, create or retain the appropriate Microsoft record independently.
- After sync, positions whose employee IDs still exist remain assigned; retained Manual employees remain selectable in Position Management.

## Error Handling and Safety

- Validate required employee fields before saving.
- Reject invalid employee references when saving a position.
- If deleting an employee fails to save either employees or positions, show a sync error and retain the local backup.
- Keep existing API response shapes and localStorage fallbacks.
- Do not silently delete Manual employees during sync.
- Re-render Employee Management, Position Management, sidebar counts, and the chart after every successful mutation.

## Implementation Boundaries

- `index.html`: add the Employees action and management modal markup.
- `app.js`: separate add-employee persistence from position creation, add employee list rendering/filtering, source and assignment counts, delete/unassign behavior, and employee-management event handlers.
- `style.css`: style the employee management list and responsive modal states using existing modal and form patterns.
- `api/sync-microsoft.js`: preserve and make explicit the email merge/manual-retention rules without changing Microsoft Graph access.
- `tests/`: add behavior tests for no implicit position creation, manual retention/merge, multiple assignment counts, deletion-to-vacant behavior, and the employee-management surface.

## Acceptance Criteria

1. Adding a Manual employee increases the employee count by one and leaves the position count unchanged.
2. The new employee appears in Position Management's employee lookup with source and Unassigned status.
3. Assigning the employee to one or more positions updates the assignment count and the chart cards.
4. A second assignment to the same employee is allowed and shown as a multiple-position state.
5. Deleting the employee leaves every linked position in the position list and marks each as `VACANT`.
6. Microsoft sync keeps unmatched Manual employees.
7. Microsoft sync with a matching email updates the existing employee without changing its numeric id or creating a duplicate.
8. Employee and position management work at desktop and mobile widths without clipped controls or overlapping content.
9. Existing hierarchy, collapse, vacant-seat, and position-layout tests continue to pass.

## Verification Plan

- Run the focused employee-directory tests first and observe the expected RED state before implementation.
- Run `node --test tests/*.test.mjs` after each green cycle.
- Run Node syntax checks for the changed JavaScript and Vercel Function files.
- Use the in-app Browser to verify: add Manual employee -> confirm no new position -> assign from Position Management -> verify multiple assignment -> delete -> verify vacant seats.
- Run `npx vercel dev` and check the local Vercel instance at desktop and a 390px mobile viewport, including modal scrolling and first-viewport controls.
