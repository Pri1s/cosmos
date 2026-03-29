## Problem statement

Cosmos has tour data, a walkthrough hook, an overlay component, and matching styles, but the feature is not wired into the application shell. Users currently have no guided path through the map, search, node details, Stella, or focus mode.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Connect the existing walkthrough system to the live app.
  - Walk users through the main product capabilities in a stable order.
  - Provide a clear way to replay the walkthrough after the first visit.
  - Add focused tests for the walkthrough control/action logic.
- Non-goals:
  - Redesigning the current tour copy or visual language beyond what is needed for usability.
  - Adding persistence beyond the existing completion flag.
  - Reworking Stella’s broader chat behavior outside tour coordination.

## Constraints

- Stay within the existing React 19 + Vite client-only architecture.
- Preserve current focus-mode and floating-panel behavior.
- Avoid triggering conflicting automatic Stella commentary while the tour is running.
- Keep the diff scoped to the walkthrough feature and its supporting docs/tests.

## Relevant files

- `src/App.jsx`
- `src/App.css`
- `src/components/GuidePanel.jsx`
- `src/components/TourOverlay.jsx`
- `src/hooks/useTour.js`
- `src/data/tour-steps.js`
- `src/utils/` walkthrough helper file(s) if extraction is needed for tests

## Proposed design

- Initialize the walkthrough from `App` using the existing `useTour` hook.
- Render `TourOverlay` above the app while the walkthrough is active.
- Feed the walkthrough the same app actions it needs to drive map selection and focus-mode transitions.
- Add a dedicated “Start tour” control to Stella’s panel so the walkthrough is always discoverable.
- Suppress map-mode auto commentary from Stella during the walkthrough so scripted narration remains coherent.
- Extract walkthrough action execution into a small utility if needed to make behavior directly testable with Vitest.

## Interfaces/contracts

- `GuidePanel` will gain a callback prop for replaying the walkthrough and a flag for whether the walkthrough is active.
- `App` will own walkthrough lifecycle state and pass it into `GuidePanel`.
- Any extracted walkthrough utility will accept injected dependencies rather than reading React state directly.

## Risks and edge cases

- Tour spotlights can fail if selectors target elements that are temporarily unmounted during map/focus transitions.
- Programmatic node/focus actions can race with panel/layout animations.
- Replaying the tour from focus mode must cleanly restore map state before step 1.
- Auto-start should remain resilient if `localStorage` is unavailable.

## Validation plan

- Run `npm run test`.
- Run `npm run lint`.
- Run `npm run build`.
- Manually verify the walkthrough auto-starts on first load, can be replayed from Stella, advances through map/focus states, and finishes cleanly.

## Migration notes

No migration is expected. The feature uses existing client-side state and local storage.

## Validation performed

- `npm run test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification was not performed in this session.
