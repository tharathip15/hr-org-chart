# Annotation Colors And Size Design

## Goal

Allow users to style canvas frames and free text annotations without changing employee, position, or connector data.

## Approved Behavior

- A frame has one selected color used for its border and a subtle tinted fill.
- Free text uses the selected color for its characters.
- A frame keeps its existing corner resize handle for width and height changes.
- Free text exposes a font-size control with a bounded range of 12-48 px.
- Styling changes are undoable, redoable, saved to the existing annotations API, and retained in local storage fallback.
- Existing annotations without style fields use the current visual defaults.

## Data Shape

```js
{
  id: "annot-...",
  type: "frame" | "text",
  x: 0,
  y: 0,
  width: 240,
  height: 160,
  text: "...",
  color: "#4f46e5",
  fontSize: 15
}
```

`width`, `height`, `color`, and `fontSize` remain optional for backward compatibility. Rendering applies defaults when values are absent.

## UI

The existing annotation toolbar gains a color input. When a text annotation is selected it also shows a font-size control. When a frame is selected it shows width and height controls alongside the existing corner resize handle. Controls are enabled only when one annotation is selected.

## Testing

- Add source-level tests for style fields, rendering, selection controls, and persistence.
- Run the full Node test suite, syntax validation, and browser QA for creating/selecting a frame and text, changing color/size, and refreshing.
