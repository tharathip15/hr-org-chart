# Annotation Colors And Size Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent color and size controls for canvas frame and text annotations.

**Architecture:** Keep the existing annotation array and API. Add optional style properties to each annotation, render them inline, and route toolbar changes through the existing history and save functions. Keep backward-compatible defaults for existing records.

**Tech Stack:** Plain JavaScript, HTML, CSS, Node test runner, Codex in-app browser.

## Global Constraints

- Preserve existing employee, position, connector, and annotation records.
- Use existing annotation undo/redo and `/api/annotations` persistence.
- Keep controls keyboard accessible and usable on narrow screens.
- Do not add a dependency.

---

### Task 1: Add failing annotation-style tests

**Files:**
- Modify: `tests/annotation-style.test.mjs`

- [ ] Write tests asserting that annotation defaults, selected annotation state, color input, size input, inline style rendering, and save calls are represented in the app.
- [ ] Run `node --test tests\\annotation-style.test.mjs` and confirm the new assertions fail against the current code.

### Task 2: Add annotation style state and controls

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `app.js`

- [ ] Add a selected annotation id and toolbar controls for color, text font size, frame width, and frame height.
- [ ] Render frames with `color` as border/fill and text with `color` and `fontSize`.
- [ ] Add selection listeners and update controls from the selected object.
- [ ] Apply color and size changes through `pushAnnotationHistory()`, `renderAnnotations()`, and `saveAnnotations()`.
- [ ] Keep existing resize-handle behavior and default values for old records.

### Task 3: Verify behavior

**Files:**
- No additional files.

- [ ] Run `node --check app.js`.
- [ ] Run `node --test tests\\*.test.mjs`.
- [ ] Run `git diff --check`.
- [ ] Use the local browser to create a frame and text, change their styles, refresh, and confirm the values persist with no console errors.

### Task 4: Commit

**Files:**
- Commit the files changed by Tasks 1-3.

- [ ] Run `git add` for only the annotation files and tests.
- [ ] Commit with `feat: style canvas annotations`.
