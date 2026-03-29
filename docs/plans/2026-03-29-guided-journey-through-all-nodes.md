## Problem statement

Cosmos currently offers a short fixed discovery story, but the graph now contains 200 nodes. The user wants a longer-lived guided experience that can walk someone through the entire catalog by recommending the current stop, then several next stops, until every node has been visited.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Replace the short overlay story with a persistent guided journey through all 200 nodes.
  - Keep the traversal deterministic, cluster-based, and resumable across refreshes.
  - Show journey progress, local Stella summaries, and next recommendations directly in the guide panel.
  - Preserve manual graph exploration without silently mutating journey state.
- Non-goals:
  - Reworking the underlying graph structure or NASA sync pipeline.
  - Moving guided narration into Gemini.
  - Auto-opening focus mode for every journey stop.

## Constraints

- Stay within the existing React 19 + Vite client-only architecture.
- Assume the current graph remains hub-and-spoke: mission hubs with exoplanet leaves.
- Keep the journey local and persistent with browser storage only.
- Avoid unrelated refactors in focus-mode rendering, chat transport, or graph drawing.

## Relevant files

- `src/App.jsx`
- `src/App.css`
- `src/components/GuidePanel.jsx`
- `src/hooks/`
- `src/utils/`
- `src/data/graph-data.js`

## Proposed design

- Add a dedicated guided-journey hook backed by pure traversal and persistence utilities.
- Traverse mission clusters in a fixed order, visiting each mission node before its ranked exoplanets.
- Persist journey state with status, current node, active mission, and visited nodes.
- Replace the story CTA and overlay-driven flow with a guide-panel journey card that shows the current stop, progress, recommendations, and controls.
- Keep focus mode opt-in via a `Dive deeper` action, while standard journey advancement stays in map mode.

## Interfaces/contracts

- `useGuidedJourney({ nodes, links, graphRef, setSelectedNode, centerOnNode, enterFocusMode })`
  returns `journey`, `currentNode`, `recommendations`, `start`, `continueTo`, `pause`, `resume`, `restart`, `markVisited`, and `setCurrentFromNode`.
- A guided-journey utility will expose deterministic mission ordering, ranking, traversal, and hydration helpers.
- `GuidePanel` will switch from story props to journey props and render a dedicated journey section.

## Risks and edge cases

- Recommendation behavior near the end of small mission clusters must stay coherent and deterministic.
- Journey state must survive reloads but recover safely from stale or invalid local storage.
- Manual clicks inside the active cluster need an explicit adoption action instead of silently becoming the journey path.
- Journey advancement while the user is in focus mode must return to map mode cleanly when appropriate.

## Validation plan

- Run `npm run test`.
- Run `npm run lint`.
- Run `npm run build`.
- Manually verify start, resume, pause, restart, cluster transitions, and completion flow if possible.

## Migration notes

No backend or data migration is required. The new journey will use its own local storage key and supersede the short story as the primary guided flow.

## Validation performed

- `npm run test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification was not performed in this session.
