# Restore Saved Layout and Reliable Card Dragging

## Goal

Make every visible position card draggable and change Auto-Arrange into a reliable restore action that returns the chart to the latest saved layout.

## Current Root Causes

- Auto-Arrange clears `x`, `y`, `isManual`, and `manualLayouts`, so it intentionally deletes saved manual coordinates.
- Drag start rejects pointerdown events from nested buttons, which makes cards with the collapse control feel non-draggable when the user grabs that area.
- Drag start depends on transient `renderX` and `renderY`; a visible card can still have usable inline DOM coordinates when those values are not available.
- Drag persistence is asynchronous and is not tracked, so a restore action can race the most recent drag save.

## Design

### Restore behavior

The existing Auto-Arrange toolbar button will restore the latest persisted positions by waiting for the latest drag save, loading positions from the API with the existing localStorage fallback, and rendering the active chart. It will not clear manual coordinates or create a new layout. The button copy and notification will describe restoring the saved layout.

### Drag behavior

Position cards remain clickable and their collapse buttons remain usable. Dragging starts from the card surface while the collapse button remains a dedicated click control. A click without movement keeps its existing behavior; a real drag suppresses the follow-up card click. Drag start will fall back to the card's inline `left` and `top` values when transient render coordinates are unavailable. Pointer cancellation will use the same cleanup path as pointerup.

### Persistence

Drag saves will expose a tracked promise. Restore waits for that promise before reloading so the latest drag cannot be replaced by an older API response. Existing overall and department-specific coordinate fields remain unchanged.

## Error Handling

- If the API is unavailable, the existing localStorage position backup remains the restore source.
- Restore always releases the disabled/loading state of its toolbar button.
- Missing or invalid DOM coordinates still abort a drag safely without leaving global drag state active.

## Testing

- Add source-level regression coverage for DOM coordinate fallback, pointer cancellation, button-origin drag, and suppression of accidental click behavior.
- Add source-level coverage proving Auto-Arrange calls the restore flow and no longer clears manual layout fields.
- Run syntax checks, the full Node test suite, and `git diff --check`.
