# Org Chart Performance and Position Mutations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Production load faster and make multi-position Combine/Split operations preserve metadata, survive persistence failures, and work for parent/descendant positions.

**Architecture:** Keep the position-first model and current static frontend. Add one small pure persistence helper, extend the existing hierarchy and photo helpers, and make focused changes to `app.js`, the position API, and the existing modals. Production photo migration is an idempotent script that updates photo columns only.

**Tech Stack:** Browser JavaScript, Node.js test runner, Vercel Functions, Supabase JS, Vercel Blob, Vercel CLI.

## Global Constraints

- Do not rewrite `app.js` into a framework.
- Do not change Microsoft identity or editor-role rules.
- Do not change the position-first data model or chart visual language.
- Preserve existing uncommitted Blob work and unrelated user changes.
- Write and observe a failing regression test before each production-code change.
- Do not print employee data, tokens, or Production environment values.
- Production photo migration must not delete employee rows.
- Deploy only after the complete suite and syntax checks pass.

---

### Task 1: Complete Blob photo migration support

**Files:**
- Modify: `api/_helpers/photo_storage.js`
- Modify: `api/employees.js`
- Modify: `api/history.js`
- Modify: `api/_helpers/history_helper.js`
- Modify: `api/sync-microsoft.js`
- Modify: `api/upload.js`
- Modify: `app.js`
- Create: `scripts/migrate-employee-photos.mjs`
- Modify: `tests/photo-storage.test.mjs`

**Interfaces:**
- Consumes: `normalizePhotoRows(rows, keyForRow)` and the configured `supabase` client.
- Produces: `getChangedPhotoRows(beforeRows, afterRows)` and an idempotent migration command that prints `{ scanned, changed, remainingBase64 }`.

- [ ] **Step 1: Add a failing changed-row test**

Add to `tests/photo-storage.test.mjs`:

```js
test("getChangedPhotoRows returns only rows with a migrated photo URL", async () => {
  const { getChangedPhotoRows } = await import("../api/_helpers/photo_storage.js");
  const before = [
    { id: 1, photo_url: "data:image/jpeg;base64,YQ==" },
    { id: 2, photo_url: "https://blob.example/existing.jpg" }
  ];
  const after = [
    { id: 1, photo_url: "https://blob.example/new.jpg" },
    { id: 2, photo_url: "https://blob.example/existing.jpg" }
  ];

  assert.deepEqual(getChangedPhotoRows(before, after), [after[0]]);
});
```

- [ ] **Step 2: Verify the new test fails**

Run: `node --test tests/photo-storage.test.mjs`  
Expected: FAIL because `getChangedPhotoRows` is not exported.

- [ ] **Step 3: Implement changed-row selection and migration**

Add this export to `api/_helpers/photo_storage.js`:

```js
export function getChangedPhotoRows(beforeRows, afterRows) {
  const beforeById = new Map((beforeRows || []).map(row => [row.id, row.photo_url || null]));
  return (afterRows || []).filter(row => beforeById.get(row.id) !== (row.photo_url || null));
}
```

Create `scripts/migrate-employee-photos.mjs` so it:

```js
const { data, error } = await supabase.from("employees").select("*").order("id");
if (error) throw error;
const normalized = await normalizePhotoRows(data, row => row.person_id || row.id);
const changedRows = getChangedPhotoRows(data, normalized);
if (changedRows.length) {
  const { error: updateError } = await supabase.from("employees").upsert(changedRows);
  if (updateError) throw updateError;
}
console.log(JSON.stringify({
  scanned: data.length,
  changed: changedRows.length,
  remainingBase64: normalized.filter(row => isDataImageUrl(row.photo_url)).length
}));
```

Retain the existing anonymous-response stripping, Blob upload, Microsoft sync, upload endpoint, and history snapshot changes already present in the working tree.

- [ ] **Step 4: Run targeted tests**

Run: `node --test tests/photo-storage.test.mjs tests/employee-sync.test.mjs tests/microsoft-position-sync.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit the completed Blob work**

```powershell
git add -- api/_helpers/photo_storage.js api/employees.js api/history.js api/_helpers/history_helper.js api/sync-microsoft.js api/upload.js app.js scripts/migrate-employee-photos.mjs tests/photo-storage.test.mjs
git commit -m "fix: migrate employee photos to blob storage"
```

### Task 2: Preserve metadata when splitting into any number of positions

**Files:**
- Modify: `hierarchy-utils.js`
- Modify: `tests/combine-positions.test.mjs`

**Interfaces:**
- Consumes: `OrgHierarchy.splitPosition(sourcePositions, positionId, splitTitles)`.
- Produces: created positions with offset `x`, `y`, and `manualLayouts`, plus copied lifecycle and layout metadata.

- [ ] **Step 1: Add failing three-way metadata tests**

Add a test with a source position containing:

```js
{
  id: 17,
  title: "Combined Manager",
  department: "Operations",
  employeeId: 6,
  managerId: 10,
  status: "future",
  effectiveDate: "2026-10-01",
  statusReason: "Approved plan",
  notes: "Acting",
  layoutStyle: "vertical",
  isManual: true,
  manualLayouts: {
    Sales: { x: 400, y: 500 }
  },
  x: 200,
  y: 300
}
```

Call:

```js
const result = splitPosition(sourcePositions, 17, ["A", "B", "C"]);
```

Assert that two positions are created, each copies lifecycle/layout fields, position B has `x: 460`, its Sales layout has `x: 660`, and existing children still report to position `17`.

- [ ] **Step 2: Verify the test fails for missing metadata**

Run: `node --test tests/combine-positions.test.mjs`  
Expected: FAIL because `effectiveDate`, `statusReason`, `layoutStyle`, and `manualLayouts` are missing on created positions.

- [ ] **Step 3: Copy and offset metadata**

In `splitPosition()`, create helper logic equivalent to:

```js
const offsetLayouts = Object.fromEntries(
  Object.entries(primaryPosition.manualLayouts || {}).map(([scope, coordinates]) => [
    scope,
    {
      x: Number(coordinates?.x || 0) + (i * 260),
      y: Number(coordinates?.y || 0)
    }
  ])
);

const newPos = {
  ...primaryPosition,
  id: maxId,
  title: titles[i],
  x: Number(primaryPosition.x ?? 200) + (i * 260),
  y: Number(primaryPosition.y ?? 150),
  manualLayouts: offsetLayouts
};
```

Do not move existing children away from the primary position.

- [ ] **Step 4: Verify split and hierarchy tests**

Run: `node --test tests/combine-positions.test.mjs tests/hierarchy-utils.test.mjs tests/position-lifecycle.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit split core behavior**

```powershell
git add -- hierarchy-utils.js tests/combine-positions.test.mjs
git commit -m "fix: preserve metadata when splitting positions"
```

### Task 3: Add a dynamic multi-position Split UI

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `style.css`
- Modify: `tests/combine-positions.test.mjs`

**Interfaces:**
- Consumes: `EmployeeDirectory.suggestSplitTitles(title)` and `OrgHierarchy.splitPosition()`.
- Produces: `.split-title-input` rows, `addSplitTitleInput(value)`, and submission of all non-empty rows.

- [ ] **Step 1: Add failing UI contract tests**

Assert the source contains:

```js
assert.match(htmlSource, /id="split-title-inputs"/);
assert.match(htmlSource, /id="btn-add-split-title"/);
assert.match(appSource, /function addSplitTitleInput\(/);
assert.match(appSource, /querySelectorAll\("\.split-title-input"\)/);
assert.doesNotMatch(appSource, /const title1 = input1/);
```

- [ ] **Step 2: Verify the UI contract fails**

Run: `node --test tests/combine-positions.test.mjs`  
Expected: FAIL because the dynamic input container and function do not exist.

- [ ] **Step 3: Implement dynamic title rows**

Replace the two fixed fields with:

```html
<div id="split-title-inputs" class="split-title-inputs"></div>
<button type="button" id="btn-add-split-title" class="btn btn-secondary">
  Add another position
</button>
```

Implement:

```js
function addSplitTitleInput(value = "") {
  const container = document.getElementById("split-title-inputs");
  const row = document.createElement("div");
  row.className = "split-title-row";
  row.innerHTML = `
    <input class="form-input split-title-input" value="${escapeHTML(value)}">
    <button type="button" class="split-title-remove" aria-label="Remove position">×</button>
  `;
  container.appendChild(row);
  updateSplitTitleRows();
}
```

Disable remove buttons when only two rows remain. On modal open, clear the container and add every suggested title, padding to two rows. On submit, read every `.split-title-input`, trim values, reject fewer than two, and pass the entire array to `splitPosition()`.

- [ ] **Step 4: Run UI and full split tests**

Run: `node --test tests/combine-positions.test.mjs tests/position-lifecycle-ui.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit the Split UI**

```powershell
git add -- index.html app.js style.css tests/combine-positions.test.mjs
git commit -m "feat: split positions into multiple seats"
```

### Task 4: Make position candidate persistence failure-safe

**Files:**
- Create: `position-persistence.js`
- Modify: `index.html`
- Modify: `app.js`
- Modify: `api/positions.js`
- Create: `tests/position-persistence.test.mjs`

**Interfaces:**
- Produces: `PositionPersistence.commitCandidate(currentPositions, candidatePositions, persist) -> Promise<{saved:boolean, positions:Array}>`.
- Consumes: a `persist(candidatePositions)` callback returning truthy only after the API write succeeds.

- [ ] **Step 1: Add failing persistence tests**

Test the wished-for helper:

```js
await import("../position-persistence.js");
const current = [{ id: 1, title: "Current" }];
const candidate = [{ id: 1, title: "Changed" }];
const failed = await globalThis.PositionPersistence.commitCandidate(
  current,
  candidate,
  async () => false
);
assert.equal(failed.saved, false);
assert.equal(failed.positions, current);
```

Also read `api/positions.js` and assert:

```js
assert.ok(
  apiSource.indexOf(".upsert(") < apiSource.indexOf(".delete()"),
  "position rows must be upserted before obsolete rows are deleted"
);
```

- [ ] **Step 2: Verify tests fail**

Run: `node --test tests/position-persistence.test.mjs`  
Expected: FAIL because the helper does not exist and API deletion precedes upsert.

- [ ] **Step 3: Implement candidate commit**

Create:

```js
(function attachPositionPersistence(root) {
  async function commitCandidate(currentPositions, candidatePositions, persist) {
    const saved = await persist(candidatePositions);
    return {
      saved: saved === true,
      positions: saved === true ? candidatePositions : currentPositions
    };
  }

  root.PositionPersistence = Object.freeze({ commitCandidate });
})(globalThis);
```

Load it before `app.js`. Refactor `savePositions(candidatePositions = positions)` so the API payload is built from the candidate, and use `commitCandidate()` to replace global `positions` only after success. Combine and Split call `savePositions(result.positions)` without assigning `positions` first.

In `api/positions.js`, for non-empty payloads upsert all candidate rows first, then delete rows not in the payload. Preserve explicit delete-all behavior for an empty payload.

- [ ] **Step 4: Run persistence and mutation tests**

Run: `node --test tests/position-persistence.test.mjs tests/combine-positions.test.mjs tests/employee-directory.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit persistence safety**

```powershell
git add -- position-persistence.js index.html app.js api/positions.js tests/position-persistence.test.mjs
git commit -m "fix: commit position mutations only after save"
```

### Task 5: Add stationary drag-to-combine drop zones

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `style.css`
- Modify: `tests/card-drag-feedback.test.mjs`
- Modify: `tests/overview-layout.test.mjs`

**Interfaces:**
- Produces: `renderCombineDropZones(draggedPosition)`, `clearCombineDropZones()`, and `.combine-drop-zone[data-position-id]`.
- Preserves: `draggedPositionIds = OrgHierarchy.getDescendantPositionIds(...)`.

- [ ] **Step 1: Add failing drop-zone tests**

Assert:

```js
assert.match(htmlSource, /id="combine-drop-zones-overlay"/);
assert.match(appSource, /function renderCombineDropZones\(/);
assert.match(appSource, /function clearCombineDropZones\(/);
assert.match(appSource, /\.combine-drop-zone/);
assert.match(appSource, /getDescendantPositionIds\(positions,\s*draggedId\)/);
```

Add an assertion that drop detection reads the zone position ID rather than requiring the target card to remain stationary.

- [ ] **Step 2: Verify tests fail**

Run: `node --test tests/card-drag-feedback.test.mjs tests/overview-layout.test.mjs`  
Expected: FAIL because the overlay and functions do not exist.

- [ ] **Step 3: Implement stationary zones**

Add a canvas overlay. At drag start:

```js
const candidates = positions.filter(candidate => {
  if (candidate.id === draggedPosition.id) return false;
  const candidateEmployee = getAssignedEmployee(candidate);
  return candidateEmployee && samePerson(draggedEmployee, candidateEmployee);
});
```

For each candidate, capture its current canvas-local card rectangle once and render a fixed dashed drop zone with `data-position-id`. During pointer move, compare the dragged card center with zone rectangles and set `dragDropCombineTargetId`. Clear zones on pointer up, pointer cancel, failed drag start, and immediately before opening the Combine modal.

- [ ] **Step 4: Run drag tests**

Run: `node --test tests/card-drag-feedback.test.mjs tests/overview-layout.test.mjs tests/combine-positions.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit drag behavior**

```powershell
git add -- index.html app.js style.css tests/card-drag-feedback.test.mjs tests/overview-layout.test.mjs
git commit -m "fix: combine parent and descendant positions by drag"
```

### Task 6: Reduce startup and drag rendering work

**Files:**
- Modify: `app.js`
- Modify: `position-lifecycle.js`
- Modify: `tests/overview-layout.test.mjs`
- Create: `tests/startup-performance.test.mjs`

**Interfaces:**
- Produces: `requestConnectionDraw()` and optional prebuilt `positionById` support in `getNearestVisibleManagerId()`.
- Preserves: existing Current/Future visibility and hidden-manager promotion behavior.

- [ ] **Step 1: Add failing performance contract tests**

Assert:

```js
assert.match(appSource, /Promise\.all\(\[\s*loadData\(\),\s*loadPositions/);
assert.match(appSource, /Promise\.all\(\[\s*loadPreferences\(\),\s*loadAnnotations\(\)/);
assert.doesNotMatch(appSource, /setTimeout\(resolve,\s*(250|300|350)\)/);
assert.match(appSource, /function requestConnectionDraw\(/);
assert.match(appSource, /requestAnimationFrame\(\(\) => \{\s*connectionDrawFrame = null/);
```

Extend lifecycle tests to pass a prebuilt `Map` to `getNearestVisibleManagerId()` and verify the same manager result.

- [ ] **Step 2: Verify performance tests fail**

Run: `node --test tests/startup-performance.test.mjs tests/overview-layout.test.mjs tests/position-lifecycle.test.mjs`  
Expected: FAIL because startup is sequential and drag redraw is not throttled.

- [ ] **Step 3: Implement concurrent loading and redraw throttling**

Update `init()` to start employee/position reads together with deferred empty-position fallback, run preferences/annotations together, render immediately, and retain only the loader fade.

Implement:

```js
let connectionDrawFrame = null;
function requestConnectionDraw() {
  if (connectionDrawFrame !== null) return;
  connectionDrawFrame = requestAnimationFrame(() => {
    connectionDrawFrame = null;
    drawConnections();
  });
}
```

Use it during pointer movement and resize. Build `positionById`, `cardById`, `effectiveManagerById`, and `childrenByManager` once inside `drawConnections()`. Pass a prebuilt position map to `PositionLifecycle.getNearestVisibleManagerId()` to avoid rebuilding it for every position.

Pass one render context to `getPositionCardHTML()` so the display positions, IDs, and report flags are not recomputed for each card.

- [ ] **Step 4: Run lifecycle, layout, and startup tests**

Run: `node --test tests/startup-performance.test.mjs tests/overview-layout.test.mjs tests/position-lifecycle.test.mjs tests/chart-mode-reporting.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit performance changes**

```powershell
git add -- app.js position-lifecycle.js tests/overview-layout.test.mjs tests/position-lifecycle.test.mjs tests/startup-performance.test.mjs
git commit -m "perf: reduce overview startup and drag work"
```

### Task 7: Verify, migrate, and deploy Production

**Files:**
- Verify: all modified source and test files
- Temporary outside repository: Production environment file

**Interfaces:**
- Consumes: verified commits, `scripts/migrate-employee-photos.mjs`, and Vercel CLI.
- Produces: migrated Production photo URLs and a Production deployment whose aliases point to the verified source.

- [ ] **Step 1: Verify repository scope**

Run:

```powershell
git status --short
git log --oneline -8
git diff HEAD~7 --stat
```

Confirm no unrelated files are included.

- [ ] **Step 2: Run complete verification**

Run:

```powershell
node --test tests/*.test.mjs
node --check app.js
node --check hierarchy-utils.js
node --check position-persistence.js
node --check scripts/migrate-employee-photos.mjs
```

Expected: zero failed tests and all syntax checks exit 0.

- [ ] **Step 3: Run the idempotent Production photo migration**

Create a task-specific temporary directory outside the repository. Pull Production variables into its `.env.production` without printing the file:

```powershell
$migrationTempRoot = Join-Path ([System.IO.Path]::GetTempPath()) 'hr-org-chart-photo-migration'
New-Item -ItemType Directory -Path $migrationTempRoot -Force | Out-Null
$migrationEnvFile = Join-Path $migrationTempRoot '.env.production'
& 'C:\Users\IT\AppData\Roaming\npm\vercel.cmd' env pull $migrationEnvFile --environment=production --yes
node --env-file=$migrationEnvFile scripts/migrate-employee-photos.mjs
```

Expected aggregate output: `remainingBase64` is `0`. Resolve `$migrationTempRoot`, confirm it starts with `[System.IO.Path]::GetTempPath()`, and remove that exact directory with `Remove-Item -LiteralPath $resolvedMigrationTemp -Recurse -Force`.

- [ ] **Step 4: Deploy Production**

Run with a ten-minute timeout:

```powershell
& 'C:\Users\IT\AppData\Roaming\npm\vercel.cmd' deploy . --prod --yes
```

Record the deployment URL and ID.

- [ ] **Step 5: Confirm alias and browser behavior**

Run Vercel inspect for `https://hr-org-chart-two.vercel.app` and confirm its deployment ID matches Step 4. In the in-app browser, verify Anonymous Viewer, Overview card rendering, Current/Future switching, zero console errors, zero Base64 photo URLs in the anonymous employee payload, and improved time to first cards compared with 6.35 seconds.

- [ ] **Step 6: Report evidence**

Report:

- test totals and syntax-check results;
- migrated/scanned/remaining Base64 counts;
- Production deployment URL and alias;
- measured first-card and loader-ready times;
- Combine/Split acceptance checks;
- any residual risk or deferred non-goal.
