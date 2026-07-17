# Sidebar Vacancy Report Design

**Date:** 2026-07-17

**Status:** Approved direction, pending implementation-plan review

## Goal

Show an accurate workforce summary in the sidebar and let users open the list of vacant positions by selecting the vacancy statistic itself.

## Scope

- Replace the ambiguous sidebar position count with three distinct statistics: employees, total positions, and vacant positions.
- Make the vacant-position statistic an accessible interactive control; no separate report button is added.
- Open a report modal when the vacancy statistic is selected.
- List every vacant position with its position title and department.
- Show a clear empty state when no positions are vacant.
- Refresh the counts and report contents after every existing employee or position mutation.

Out of scope: data-model changes, new API endpoints, persistence changes, dashboard charts, department-level vacancy filtering, and changes to position-assignment rules.

## Current System Context

The client holds `employees` and `positions` as separate collections. A position is rendered as vacant whenever `getAssignedEmployee(position)` returns no employee. This includes an explicitly unassigned position and a position whose stored employee reference no longer resolves. The sidebar currently labels its position count as headcount, so it does not display the actual number of employee records.

## User Experience

### Sidebar Statistics

The Statistics section keeps its compact two-column grid:

- `Employees`: the total number of employee records in `employees`.
- `Positions`: the total number of planned positions in `positions`.
- `Vacant positions`: the count of positions without a resolved assigned employee.

The first two are informational cards. The vacant-position card spans the grid width so its count, label, and interactive affordance remain easy to read in the narrow sidebar. It is a semantic button with a visible focus state, descriptive accessible label, and no separate action button.

### Vacancy Report Modal

Selecting the vacant-position card opens a modal titled `Vacant positions (N)`. Its scrollable content lists the vacant positions, ordered first by department and then by title. Every list item shows:

- Position title
- Department

When the count is zero, the modal shows an explicit empty state instead of an empty list. The modal follows the existing overlay, close control, Escape, and responsive scrolling patterns used by the application's other modals.

## Data Flow

One small view-model helper will derive the report from the current client state. It will:

1. Take the current `employees` and `positions` collections.
2. Resolve each position with the established assigned-employee lookup.
3. Return employee count, total-position count, and an ordered list of vacant positions.

`renderSidebarStats()` will use this result for all three sidebar counts. Opening the report will derive and render the same result, preventing the modal and sidebar from using competing vacancy definitions.

Existing calls to `renderAll()` already follow data loading, employee saves/deletes, and position saves/deletes. They will therefore refresh the sidebar statistics without new persistence or synchronization logic. If the report is open when a render occurs, its contents will also be refreshed.

## Implementation Boundaries

- `index.html`: add the third statistic as an interactive vacancy card and add the report modal markup.
- `app.js`: add the summary/report derivation, modal rendering and open/close handlers, and refresh behavior.
- `style.css`: add the full-width interactive vacancy-card state, focus style, report-list items, empty state, and mobile-safe modal layout.
- `tests/`: add focused checks for distinct counts, vacancy detection, report structure, and keyboard-accessible interaction.

## Error Handling and Accessibility

- An empty data set displays zero for all counts and a usable empty report.
- A stale `employeeId` is treated as vacant, matching current chart behavior.
- Dynamic position titles and departments are HTML-escaped before insertion in the report.
- The trigger is keyboard operable and has an accessible name that includes the number of vacant positions.
- Existing viewer permissions are unaffected because the feature only reads in-memory state.

## Acceptance Criteria

1. The sidebar separately displays the actual number of employees, total positions, and vacant positions.
2. Selecting the vacancy statistic opens a modal without a separate report button.
3. The modal lists every vacant position with its title and department, sorted by department then title.
4. Positions with no employee or an unresolved employee reference appear as vacant in both the count and report.
5. A zero-vacancy data set renders a clear empty report state.
6. Adding, removing, assigning, or unassigning employees/positions updates the statistics and any open report.
7. The trigger is accessible by keyboard and visibly focused.
8. Existing chart, employee-directory, and position-management tests remain green.

## Verification Plan

- Add a focused failing test for the derived counts and vacancy list before implementation.
- Add source-level behavior tests for the sidebar trigger and report modal, then observe their expected failing state.
- Run the focused test file through each red-green cycle.
- Run `node --test tests/*.test.mjs` and JavaScript syntax validation after the change.
- Verify in a browser at desktop and approximately 390px mobile widths: click and keyboard-open the vacancy card, inspect long lists, close the modal, and confirm the empty state.
