# Feature: Guided Journey Through All Nodes

## Metadata

| Field | Value |
|---|---|
| **Date** | 2026-03-29 |
| **Status** | shipped |
| **Author** | Codex |
| **PR/Commit** | not recorded |
| **ADR** | None |

## Summary

Cosmos now has a persistent guided journey that walks users through the full 200-node catalog instead of a short overlay story. The new flow starts at HARPS, moves mission cluster by mission cluster through deterministic recommendations, tracks visited progress locally, and presents the journey in its own floating panel so Stella’s chat column remains dedicated to conversation.

## Motivation

The previous story flow was a good introduction, but it stopped after a handful of chapters while the actual graph had grown to 200 nodes. This feature makes the guide useful as an ongoing companion rather than a one-time intro, letting users gradually work through the entire atlas without losing their place on refresh.

## Scope

### Included
- A persistent guided-journey hook and traversal utility for all 200 nodes
- Deterministic mission-cluster ordering and exoplanet ranking
- A dedicated guided-journey floating panel with progress, current-stop summary, next recommendations, and controls
- Explicit adoption of manually explored nodes only when they belong to the active mission cluster
- Tests for traversal, persistence, and recommendation rules

### Excluded
- Moving journey narration into Gemini
- Auto-opening focus mode for every stop
- Manual browser polish beyond code/test/build validation in this session

## Implementation

### Files/Systems Touched
- `src/utils/guided-journey.js` — added mission ordering, ranking, persistence hydration, traversal, and summary/recommendation copy
- `src/hooks/useGuidedJourney.js` — added the persistent journey state hook and map-selection synchronization
- `src/App.jsx` — replaced the overlay story flow with the new guided journey integration
- `src/components/GuidePanel.jsx` — reduced Stella’s panel back to chat plus journey CTA
- `src/components/JourneyPanel.jsx` — added the dedicated floating guided journey UI and controls
- `src/App.css` — styled the new floating journey panel and its internal cards
- `src/utils/guided-journey.test.js` — added coverage for ordering, progression, persistence, and manual adoption rules

### Architecture Impact

None. The feature stays entirely client-side and reuses the existing app shell, graph, and Stella panel rather than introducing a backend or a separate navigation subsystem.

### Contracts/Interfaces Changed

- Added `useGuidedJourney({ nodes, links, graphRef, setSelectedNode, centerOnNode })`.
- `GuidePanel` now accepts journey-specific props such as `journey`, `currentJourneyNode`, `journeyRecommendations`, and the journey control callbacks.
- The short overlay story is no longer the primary guided flow in `App`.

### Data Model Changes

Added a local journey state model with `status`, `currentNodeId`, `activeMissionId`, and `visitedNodeIds`, persisted in browser storage under a dedicated journey key.

### Environment/Config Changes

None.

## Migration Steps

No manual migration is required. The new guided journey uses its own local storage key and supersedes the previous short story as the main guided experience.

## Validation Performed

- `npm run test`
- `npm run lint`
- `npm run build`
- Manual browser verification was not performed in this session

## Follow-Up Tasks

- [ ] Manually verify pause/resume, restart, and “Set as current stop” behavior in the browser across map and focus-mode transitions
