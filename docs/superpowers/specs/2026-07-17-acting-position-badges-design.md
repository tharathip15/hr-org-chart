# Acting Position Badges Design

**Date:** 2026-07-17
**Status:** Approved for specification review

## Goal

When one employee is assigned to more than one position, clearly mark every non-primary position as `Acting`.

## Scope

- Retain the existing primary-position rule: the first position assigned to an employee is their primary position.
- Derive, rather than persist, the `Acting` state for all other positions assigned to that employee.
- Show the state on Organization Chart cards and in the Position Management list.
- Update automatically after assigning, moving, or unassigning a person from a position.

## Out of Scope

- Adding an `isActing` field to positions, employees, APIs, or the database.
- Allowing a user to choose a different primary position.
- Changing the position hierarchy, assignment workflow, or employee data.

## Design

### State derivation

The existing `OrgHierarchy.isPrimaryEmployeePosition(positions, positionId, employeeId)` helper is the single source for primary-position classification. A position is acting when it has an assigned employee and that helper returns `false`. Vacant positions and employees with only one assigned position do not have an acting state.

Because the state is derived from the current `positions` collection, no migration or persistence change is required. Re-rendering after an assignment change immediately recalculates the badge.

### Presentation

The chart position card renders an `Acting` badge near its existing employment/occupancy metadata when the assigned position is non-primary. The Position Management row renders the same short label alongside its filled/vacant metadata. The badge uses a dedicated CSS class consistent with the existing compact status chips and remains readable at mobile widths.

### Error handling and compatibility

Existing positions that have no employee, invalid employee references, or an employee with one position remain unchanged. The presentation code depends only on the shared primary-position helper and does not mutate state or affect save payloads.

### Testing

- Extend the pure hierarchy utility tests to prove that the first assignment is primary and later assignments are acting candidates.
- Extend the position-first source/UI contract test to require Acting calculation and the chart/list badge markup.
- Run the focused tests before and after implementation, followed by the full Node test suite, JavaScript syntax check, and whitespace check.

## Acceptance Criteria

1. A person with one assigned position does not display `Acting`.
2. A person assigned to two or more positions has no `Acting` badge on the first assigned position.
3. Every other assigned position for that person displays `Acting` on the organization chart and Position Management list.
4. Adding, removing, or changing assignments recalculates the presentation without an API or database change.
5. Existing vacant-seat and hierarchy behavior remains unchanged.
