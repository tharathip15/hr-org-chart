# Dedicated OPERATION View Design

**Date:** 2026-08-14  
**Status:** Approved design, pending implementation plan  
**Scope:** Add a dedicated OPERATION organization-chart view without duplicating employee or position records

## Objective

Add an `OPERATION` entry immediately below `Overall View` in the department sidebar. Opening it displays a full-canvas organization chart rooted at an administrator-selected position, normally the Chief Operating Officer. The view includes every descendant of that position across all departments and hierarchy levels.

OPERATION is a derived view of the existing position hierarchy. It must never create duplicate employees, positions, assignments, or reporting relationships.

## Selected Approach

Implement OPERATION as a first-class virtual chart scope inside the existing single-page application. It reuses the current chart renderer, Current/Future lifecycle filtering, authorization, layout lock, Presentation mode, search, zoom, annotations, and connection-routing systems.

This approach was selected over:

- a synthetic department, which would blur department statistics and risk duplicate membership; and
- a separate application route, which would duplicate chart state and UI behavior without a user benefit.

## Navigation and User Experience

The sidebar order is:

1. `Overall View`
2. `OPERATION`
3. Real departments

The OPERATION item shows the number of lifecycle-visible positions in the selected chart mode. Selecting it opens the full chart workspace and updates the header to:

- title: `Operation Organization`;
- subtitle: the configured root position title; and
- the existing `Current Chart` / `Future Chart` controls.

The configured root card appears at the top of the chart. Every visible descendant reached through position-to-position `Reports To` relationships appears below it, regardless of the employee's or position's department.

Viewer capabilities remain unchanged: anonymous Viewers can open OPERATION, search, pan, zoom, use Presentation mode, expand/collapse nodes, and open details. Only authenticated HR editors can mutate layout, annotations, routes, or root configuration.

## Operation Root Configuration

Store one shared preference named `operationRootPositionId`. It references an existing real position ID and does not depend on an employee name or title text.

Position Management adds an editor-only `Set as Operation Root` action. The selected root is marked with an `OPERATION ROOT` label in the position list and details. Changing the root requires confirmation.

The system preserves saved OPERATION layout data when the root changes. If an administrator later restores the previous root, its compatible saved layout remains available.

If no valid root is configured:

- Viewers see an explanatory empty state: `OPERATION has not been configured yet.`
- Editors see the same explanation and a `Select Operation Root` action that opens Position Management.

If the configured position is missing or unavailable in the selected mode, the UI reports the specific condition instead of silently showing an empty chart. Editors can choose a new root. No hierarchy or layout data is deleted automatically.

## Membership and Hierarchy Rules

OPERATION membership is calculated at render time:

1. Load and normalize the existing position list.
2. Apply the existing Current/Future lifecycle visibility rules.
3. Resolve the configured real root position.
4. Traverse `managerId` relationships from the root and collect every descendant exactly once.
5. Use the existing visible-manager replacement behavior when an intermediate manager is hidden by lifecycle rules.
6. Detect cycles and stop repeated traversal without dropping already valid branches.

The root itself is included in the view and count when visible. Adding a descendant under the root automatically adds it to OPERATION. Reparenting a position outside the subtree automatically removes it from OPERATION without deleting it.

Current and Future views derive their membership independently. A root that is not visible in one mode produces a clear mode-specific empty state; the system does not silently substitute a different structural root.

## Independent View State

OPERATION has independent state from Overview and every real department. It uses stable scope keys for:

- card coordinates;
- manually adjusted connection routes;
- frame annotations;
- text annotations; and
- expanded/collapsed node state.

Current and Future modes are separate OPERATION scopes. A suitable scheme is:

- `Operation::current`
- `Operation::future`

The exact serialized spelling may follow existing scope-normalization conventions, but it must be deterministic and must not collide with `All` or a department name.

Dragging, routing, annotating, or collapsing content in OPERATION must not alter the same position's Overview or department layout. Real position identity, employee assignment, lifecycle state, and reporting lines remain shared because OPERATION is a view, not a copy.

## Shared Controls and Locking

OPERATION reuses the existing controls and permission rules:

- Current/Future switch;
- search and employee focus;
- zoom, pan, and Fit to Screen;
- Presentation mode;
- layout lock;
- undo/redo where supported;
- frame and text annotation controls;
- connection route editing; and
- position/employee detail drawers.

The company-wide shared layout lock applies to OPERATION. A locked chart blocks every OPERATION mutation while keeping navigation and inspection available. Anonymous Viewers can never unlock or mutate the chart.

## Data and Persistence

No new employee or position collection is introduced. The only new business setting is `operationRootPositionId`, persisted through the existing shared-preferences API and included in backup/export and restore/import behavior.

OPERATION coordinates and routes use the existing position notes envelope with a new view scope. OPERATION annotations use the existing annotations API with the new view and mode scope. Existing normalization must preserve unknown compatible scope data during saves and history restoration.

Root changes, layout saves, route saves, and annotation saves retain current candidate-save and rollback semantics: live UI state is committed only after persistence succeeds, and failures restore the last confirmed state.

## Error Handling

- Missing root preference: show the role-appropriate configuration empty state.
- Referenced root deleted: show `The configured OPERATION root no longer exists` and offer reconfiguration to editors.
- Root hidden by lifecycle mode: explain that the root is not visible in Current or Future mode and retain the configured ID.
- Hierarchy cycle: render each valid position at most once, report the data issue to editors, and do not persist an automatic structural rewrite from Viewer mode.
- Save failure: restore confirmed preference/layout/annotation data and show an actionable error.
- Backend outage: apply the existing local fallback behavior without replacing confirmed OPERATION content with an empty response.

## Accessibility and Responsive Behavior

- The OPERATION sidebar item is keyboard reachable and exposes its selected state.
- Empty-state actions have explicit accessible labels.
- `OPERATION ROOT` is conveyed as text, not color alone.
- The dedicated view uses the existing responsive sidebar and chart controls.
- Fit to Screen respects the readable minimum zoom introduced for oversized charts.

## Testing Strategy

Add executable tests for:

1. descendant collection across multiple departments and hierarchy levels;
2. no duplicates or infinite traversal when hierarchy data contains a cycle;
3. Current/Future membership and visible-manager replacement;
4. a hidden or deleted root producing the correct explicit empty state;
5. sidebar order, count, selection, header title, and root subtitle;
6. independent Overview, OPERATION Current, OPERATION Future, and department coordinates;
7. independent annotations, collapse state, and connection routes by scope;
8. Viewer read-only behavior and editor-only root configuration;
9. shared layout lock enforcement;
10. root changes preserving old scoped layout data;
11. backup/import round-tripping the root preference and OPERATION scopes; and
12. save failure rollback for root preference and view mutations.

Browser verification must cover anonymous Viewer and authenticated Admin flows, Current/Future switching, Presentation mode, search, zoom/fit, layout lock, annotations, route editing, and switching repeatedly between Overview, OPERATION, and real departments without state leakage.

## Acceptance Criteria

- `OPERATION` appears directly under `Overall View` and opens a dedicated full-canvas chart.
- An editor can select one real position as the shared Operation Root.
- The view includes the root and all descendants automatically across departments.
- Position changes beneath or outside the root are reflected automatically without copying or deleting records.
- Current and Future modes show lifecycle-correct OPERATION hierarchies.
- OPERATION Current and Future layouts, routes, frames, text, and collapse states remain independent from Overview and departments.
- Viewer, Admin, shared-lock, Presentation, search, and zoom behavior match the existing application rules.
- Missing, hidden, or deleted roots never fail as an unexplained blank chart.
- Existing employee, position, Overview grouping, department layouts, annotations, and reporting relationships are preserved.
- The full automated test suite and browser acceptance checks pass before Production deployment.

## Out of Scope

- Creating an OPERATION department or changing real department assignments.
- Duplicating employee or position records for presentation.
- Maintaining multiple simultaneous Operation Roots.
- Introducing a separate application or URL route.
- Automatically rewriting reporting relationships when the configured root is invalid.
