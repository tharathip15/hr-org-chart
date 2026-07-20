# Restore Saved Layout and Reliable Card Dragging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every visible position card draggable and make Auto-Arrange restore the latest saved layout without deleting manual coordinates.

**Architecture:** Keep the current position coordinate model and API. Add a small tracked promise around drag saves, use the existing `loadPositions()` fallback path for restore, and make pointer drag state distinguish movement from ordinary card/toggle clicks.

**Tech Stack:** Vanilla JavaScript, Node `node:test`, existing Vercel/Python API endpoints.

## Global Constraints

- Preserve `x`, `y`, `isManual`, and `manualLayouts[selectedDept]` semantics.
- Do not add dependencies or change API payload shapes.
- Keep existing collapse-button click behavior when the pointer does not move.
- Use `apply_patch` for manual edits.

---

### Task 1: Regression tests for reliable drag and saved-layout restore

**Files:**
- Modify: `tests/overview-layout.test.mjs`

- [x] **Step 1: Write the failing tests**

Add assertions for `getDragStartCoordinates(position, card)`, inline card coordinate fallback, pointer cancellation, button-origin drag, `restoreSavedLayout()`, the tracked save promise, and the absence of manual-layout clearing.

- [x] **Step 2: Run the focused test file**

Run `node --test tests/overview-layout.test.mjs`. Expected result: the existing layout tests pass and the two new behavior tests fail because the implementation does not exist yet.

### Task 2: Implement reliable dragging

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add drag-state safeguards**

Track whether the pointer actually moved and which card click should be suppressed after a real drag. Use `pointercancel` with the existing pointerup cleanup.

- [ ] **Step 2: Make drag start resilient**

Allow pointerdown from card controls, resolve start coordinates from transient render values, manual values, or the card's inline `left`/`top`, and clear state if no valid coordinate exists.

- [ ] **Step 3: Preserve click behavior**

Ignore the click generated after a real drag, while allowing an ordinary card click or collapse-button click to continue opening details or toggling collapse.

- [ ] **Step 4: Run the focused layout tests**

Run `node --test tests/overview-layout.test.mjs`. Expected result: all layout tests pass.

### Task 3: Restore the latest saved layout

**Files:**
- Modify: `app.js`
- Modify: `index.html`

- [ ] **Step 1: Track drag save completion**

Store the promise returned by `savePositions()` from drag end so a restore cannot read stale server data.

- [ ] **Step 2: Add `restoreSavedLayout()`**

Await the tracked save, call `loadPositions()` so the API/localStorage fallback supplies the latest persisted state, render the tree, redraw connections, and report success or failure without clearing position fields.

- [ ] **Step 3: Rewire the toolbar action**

Make the existing Auto-Arrange button call the restore function, update its title to describe restoring the saved layout, and disable/restore the button while the async operation runs.

- [ ] **Step 4: Run the focused tests**

Run `node --test tests/overview-layout.test.mjs`. Expected result: all tests pass, including the restore regression test.

### Task 4: Full verification and commit

**Files:**
- Modify: `tests/overview-layout.test.mjs`
- Modify: `app.js`
- Modify: `index.html`

- [ ] **Step 1: Run the full verification suite**

Run `node --check app.js`, `node --test tests/*.test.mjs`, and `git diff --check`. Expected result: syntax passes, all tests pass, and no whitespace errors are reported.

- [ ] **Step 2: Commit the implementation**

Run `git add app.js index.html tests/overview-layout.test.mjs && git commit -m "fix: restore saved layout and improve card dragging"`.
