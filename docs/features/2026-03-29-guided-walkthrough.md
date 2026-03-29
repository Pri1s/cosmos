# Feature: Guided Walkthrough

## Metadata

| Field | Value |
|---|---|
| **Date** | 2026-03-29 |
| **Status** | shipped |
| **Author** | Codex |
| **PR/Commit** | not recorded |
| **ADR** | None |

## Summary

Cosmos now ships with a guided walkthrough that introduces the main map, search, node details, Stella, focus mode, knowledge lenses, and floating panels. The walkthrough can auto-start for first-time visitors and can be replayed from Stella’s panel at any time.

## Motivation

The app had grown into a richer exploratory interface, but new users had no structured introduction to the available interactions. A walkthrough closes that gap by giving users a fast, coherent tour of the primary capabilities without adding backend dependencies or a separate onboarding surface.

## Scope

What is included and what is explicitly excluded.

### Included
- Wiring the existing walkthrough hook into the application shell
- Rendering the tour overlay during active walkthrough steps
- Adding a replay entry point in Stella’s panel
- Testing the walkthrough action execution logic

### Excluded
- Changing Stella’s broader chat architecture
- Persisting walkthrough progress mid-tour
- Adding analytics or onboarding completion reporting

## Implementation

### Files/Systems Touched
- `src/App.jsx` — connected walkthrough state, overlay rendering, and Stella coordination
- `src/components/GuidePanel.jsx` — added the replay control for the walkthrough
- `src/hooks/useTour.js` — hardened tour lifecycle/timer handling and state cleanup
- `src/data/tour-steps.js` — refined walkthrough copy for the lenses step
- `src/utils/tour-actions.js` — extracted executable walkthrough actions into a testable utility
- `src/utils/tour-actions.test.js` — added focused Vitest coverage for walkthrough actions
- `src/App.css` — styled the replay control

### Architecture Impact

None. The feature follows the existing client-side React pattern and reuses already-present tour data/components rather than introducing a new subsystem.

### Contracts/Interfaces Changed

- `GuidePanel` now accepts `onStartTour` and `tourActive` props so the app shell can expose and reflect walkthrough state.

### Data Model Changes

None.

### Environment/Config Changes

None.

## Migration Steps

No migration is required.

## Validation Performed

- `npm run test`
- `npm run lint`
- `npm run build`
- Manual browser verification was not performed in this session

## Follow-Up Tasks

- [ ] Manually verify the walkthrough timing and spotlight placement in the browser across map and focus transitions
