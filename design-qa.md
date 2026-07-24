# Design QA — Position Lifecycle and Current/Future Chart

## Scope

- Selected reference: option 1 lifecycle drawer and Current/Future chart switch.
- Implemented surfaces: chart toolbar, future-position cards, Position Management lifecycle fields, and vacant-position lifecycle drawer.
- Visual comparison: selected reference and a live browser capture at the application's desktop viewport.

## Mandatory comparison passes

- Fonts and typography: passed. Existing Inter/Outfit hierarchy is preserved; lifecycle labels, helper text, and controls remain legible without cramped wrapping.
- Spacing and layout: passed. The timeframe switch sits beside the view heading, the drawer follows the existing slide-over proportions, and form groups use the product's spacing and radius tokens.
- Viewport resilience: passed. Desktop interaction was verified in-browser. Existing tablet/mobile breakpoints stack the chart heading, make the timeframe control full width, collapse two-column forms, and expand the drawer to the viewport width.
- Colors and tokens: passed. Active/future states use the existing indigo palette; Closed uses the established danger red; the lifecycle overlay was reduced to a light scrim to match the selected reference.
- Image quality and asset fidelity: passed. No new raster imagery was required; existing employee photos and avatars remain unchanged.
- Copy and content: passed. Current/Future descriptions, effective-date guidance, and historical-retention copy are concise and consistent.
- Icons: passed. Existing Lucide icon styling is reused for calendar, position, information, archive, and close actions.
- States and interactions: passed. Verified Current/Future switching, creation of a future position, future-only visibility, drawer population, vacant-position closure, removal from both charts after the effective date, and retention in Position Management history.
- Accessibility: passed. Timeframe and status controls expose pressed state, the lifecycle drawer is inert and hidden from assistive technology while closed, inputs have labels, focus indicators are visible, and mobile tap targets are at least 38px high.
- AI shortcut artifacts: passed. No placeholder art, custom SVG illustration, CSS art, or extra status badge was added.

## Automated verification

- `node --check app.js`
- `node --test` — 87 tests passed, 0 failed.

## Result

final result: passed
