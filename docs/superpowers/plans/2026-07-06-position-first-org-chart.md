# Position-First Org Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Positions management surface so the org chart is driven by planned positions and can clearly show vacant seats before Microsoft employee data is assigned.

**Architecture:** Keep `employees` as people records and add `positions` as structure records. Render chart cards from positions, using the assigned employee when `employeeId` is set and a `VACANT` state otherwise. Persist positions through a new `/api/positions` endpoint with localStorage fallback.

**Tech Stack:** Plain HTML/CSS/JavaScript frontend, Vercel Functions backed by Supabase, Node built-in tests.

---

### Task 1: Position Data Contract

**Files:**
- Modify: `app.js`
- Create: `tests/position-first-org-chart.test.mjs`

- [ ] Write a failing Node test that requires `positions`, `POSITIONS_API_URL`, `loadPositions`, `savePositions`, `derivePositionsFromEmployees`, and vacant-card rendering strings.
- [ ] Run `node --test tests/position-first-org-chart.test.mjs` and confirm it fails because the position-first contract is missing.
- [ ] Add position state, migration from employees, local fallback, and persistence functions.
- [ ] Run the test and confirm the data contract passes.

### Task 2: Position APIs

**Files:**
- Create: `api/positions.js`
- Modify: `tests/position-first-org-chart.test.mjs`

- [ ] Extend the failing test to require `/api/positions` support from `api/positions.js`.
- [ ] Implement the Vercel/Supabase endpoint that reads/writes a `positions` table and returns `[]` if storage is not ready.
- [ ] Verify the Vercel Function and Node API files pass syntax checks.

### Task 3: Positions UI

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `app.js`
- Modify: `tests/position-first-org-chart.test.mjs`

- [ ] Add a `Positions` button, position management modal, and fields for title, department, manager position, assigned employee, and notes.
- [ ] Add rendering for a scannable positions list with occupied/vacant status.
- [ ] Add add/edit/delete/unassign behavior that persists positions and re-renders the chart.
- [ ] Verify the test contract includes the modal ids and UI functions.

### Task 4: Position-Based Chart Rendering

**Files:**
- Modify: `app.js`
- Modify: `style.css`
- Modify: `tests/position-first-org-chart.test.mjs`

- [ ] Render cards from `positions`, joining assigned employees by `employeeId`.
- [ ] Show `VACANT` on cards with no assigned employee, while retaining title/department.
- [ ] Draw connections using `position.managerId` and keep collapse state on position ids.
- [ ] Keep existing employee detail drawer for occupied cards and open position editor for vacant cards.

### Task 5: Verification

**Files:**
- Test: `tests/position-first-org-chart.test.mjs`
- Test: existing tests under `tests/`

- [ ] Run `node --test tests/*.test.mjs`.
- [ ] Run `node --check app.js`, `node --check api/employees.js`, `node --check api/positions.js`, and existing API syntax checks.
- [ ] Run `npx vercel dev` and verify the Vercel Function `/api/positions` GET/PUT boundary.
- [ ] Open the app in the browser and verify the Positions modal, vacant card, and assignment behavior.
