## Problem statement

Cosmos has a functional walkthrough, but it currently teaches interface controls more than it tells a coherent story about exoplanet discovery. The visualization needs a stronger narrative spine that uses the graph itself as the stage and makes the existing first-run experience feel like a guided discovery arc.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Rework the first-run walkthrough into a five-chapter discovery story.
  - Generate chapter copy from the live synced graph data instead of hardcoding stale PRD-era examples.
  - Anchor chapters on stable mission nodes and use focus mode as the finale.
  - Keep the experience local and deterministic, with replay available from Stella.
- Non-goals:
  - Adding an entirely new story subsystem outside the existing tour path.
  - Moving core chapter narration into Gemini.
  - Reworking map rendering, focus lenses, or free-form Stella chat beyond what story integration needs.

## Constraints

- Stay inside the current React 19 + Vite client-only architecture.
- Keep the story resilient to changing synced exoplanet rosters.
- Preserve first-run auto-start behavior while allowing replay.
- Avoid unrelated refactors in the graph, focus mode, or Stella service layer.

## Relevant files

- `src/App.jsx`
- `src/App.css`
- `src/components/GuidePanel.jsx`
- `src/components/TourOverlay.jsx`
- `src/hooks/useTour.js`
- `src/data/tour-steps.js`
- `src/utils/tour-actions.js`
- `src/data/tour-steps.test.js`
- `src/utils/tour-actions.test.js`

## Proposed design

- Generate a five-step discovery story from the current graph data and NASA sync timestamp.
- Replace single walkthrough actions with ordered action arrays so story chapters can center and select the same node.
- Keep chapter narration local and mirror it into Stella’s panel as scripted guide messages.
- Update the overlay from a generic tooltip into a chapter card with a title, body copy, and chapter progress.
- Rename the user-facing replay/start affordances from “tour” to “story”.

## Interfaces/contracts

- `buildStorySteps({ nodes, links, syncedAt })` will return render-ready story chapters.
- Story steps will use `title`, `body`, `narration`, `target`, `tooltipPosition`, `actions[]`, and `delayMs`.
- `useTour` will receive generated steps instead of importing a static constant.
- `executeTourActions(actions, context)` will execute ordered action lists for story chapters.
- `GuidePanel` will expose story-focused labels while keeping the same replay/start role in the app shell.

## Risks and edge cases

- Synced data changes can alter mission counts and world counts between runs, so the story copy must stay data-driven.
- Focus-mode cleanup at story end must return users cleanly to map exploration.
- Spotlight targets can temporarily disappear during map/focus transitions.
- Replay should remain available even after the story completion flag is set.

## Validation plan

- Run `npm run test`.
- Run `npm run lint`.
- Run `npm run build`.
- Manually verify the story flow in the browser if possible, especially the JWST focus finale and replay path.

## Migration notes

No migration is required beyond the updated local storage completion key for the new first-run story.

## Validation performed

- `npm run test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification was not performed in this session.
