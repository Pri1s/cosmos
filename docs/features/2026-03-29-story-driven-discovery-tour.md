# Feature: Story-Driven Discovery Tour

## Metadata

| Field | Value |
|---|---|
| **Date** | 2026-03-29 |
| **Status** | shipped |
| **Author** | Codex |
| **PR/Commit** | not recorded |
| **ADR** | None |

## Summary

Cosmos now opens with a chapter-based discovery story instead of a control-only walkthrough. The new flow uses the live synced graph data to narrate the evolution of exoplanet science from early detection pipelines through Kepler, TESS, and a JWST focus-mode finale, while preserving replay from Stella’s panel and handing users back to free exploration after the story ends.

## Motivation

The app already had an onboarding tour, but it explained interface affordances more than it used the visualization to tell a coherent story. This feature makes the graph itself the presentation surface, strengthening the planetarium-style framing promised by the product while staying resilient to changing synced exoplanet data.

## Scope

### Included
- Generated story chapters based on the current graph data and NASA sync timestamp
- Ordered walkthrough actions so a chapter can move the camera and select a mission in one step
- Story-focused overlay and Stella replay controls
- Focus-mode JWST finale and supporting tests for story generation and action sequencing

### Excluded
- Moving story narration into Gemini
- Adding a separate story subsystem outside the existing walkthrough path
- Manual browser polish beyond code/test/build validation in this session

## Implementation

### Files/Systems Touched
- `src/data/tour-steps.js` — replaced the static walkthrough data with a live story-step builder
- `src/hooks/useTour.js` — now accepts generated steps, tracks completion for story replay, and cleans up focus-mode endings
- `src/utils/tour-actions.js` — added ordered action execution for multi-action story chapters
- `src/components/TourOverlay.jsx` — upgraded the overlay from tooltip copy to a chapter card
- `src/components/GuidePanel.jsx` — changed user-facing affordances from “tour” to “story”
- `src/App.jsx` — generates and passes live story steps into the walkthrough hook
- `src/data/tour-steps.test.js` and `src/utils/tour-actions.test.js` — added coverage for story generation and ordered actions

### Architecture Impact

None. The feature reuses the existing client-side walkthrough path and keeps narration local instead of introducing a new system boundary.

### Contracts/Interfaces Changed

- `buildStorySteps({ nodes, links, syncedAt })` returns render-ready chapter data.
- Story steps now use `title`, `body`, `narration`, `target`, `tooltipPosition`, `actions[]`, and `delayMs`.
- `useTour` now consumes generated steps instead of importing a fixed walkthrough constant.
- `executeTourActions(actions, context)` executes ordered action lists for a single story chapter.

### Data Model Changes

The walkthrough data shape changed from a static tooltip-oriented list to a generated chapter model derived from live graph data and sync metadata.

### Environment/Config Changes

None.

## Migration Steps

No manual migration is required. The first-run completion flag now uses a story-specific local storage key so returning users can see the new narrative flow.

## Validation Performed

- `npm run test`
- `npm run lint`
- `npm run build`
- Manual browser verification was not performed in this session

## Follow-Up Tasks

- [ ] Manually verify the chapter-card placement and final JWST focus-to-map transition in the browser
