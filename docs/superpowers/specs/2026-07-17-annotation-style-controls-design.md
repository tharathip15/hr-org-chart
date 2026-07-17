# Annotation Style Controls Design

## Goal

Allow users to style annotations added to the organization chart without changing the existing chart data or annotation workflows.

## User Experience

- Selecting a frame exposes a color swatch and size controls for width and height.
- A frame uses the selected color for its border and a low-opacity version for its fill.
- Selecting free text exposes a color swatch and a font-size control from 12px to 48px.
- Frames remain resizable by dragging the existing corner handle.
- Style changes apply immediately, are saved to the existing annotations API and local backup, and participate in the existing undo/redo history.
- Existing annotations without style fields keep their current appearance through defaults.

## Data Model

Extend annotation records with optional fields:

- `color`: hex color string, default `#4f46e5`.
- `fontSize`: integer pixels for text annotations, default `15`.

Frame `width` and `height` remain the persisted size fields already used by the resize handle. Values are normalized and clamped at render/update time so malformed or old data cannot break the canvas.

## Implementation

- Track the selected annotation id in the existing annotation state.
- Add a compact contextual style control group to the existing annotation toolbar.
- Render controls only when a supported annotation is selected; keep the toolbar usable when nothing is selected.
- Use native color and numeric controls so the feature is keyboard accessible and consistent with the existing UI.
- Apply frame colors through CSS custom properties on each frame and text colors/font sizes through inline styles generated from normalized values.
- Re-render the selected annotation after a style change and call the existing `pushAnnotationHistory()` and `saveAnnotations()` functions.
- Preserve all existing drag, resize, edit, delete, clear, import/export, and persistence behavior.

## Validation

- Add source-level tests for style fields, defaults, contextual controls, clamping, and save/undo wiring.
- Run syntax checks and the full Node test suite.
- Use browser QA to create/select a frame and text annotation, change color and size, resize a frame, refresh, and confirm the values persist without console errors or layout overlap.
