## Problem statement

Floating panels can overlap each other, and the map graph does not currently react to the Stella panel footprint in map mode. That leaves important content hidden beneath UI windows.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Keep floating panels from overlapping by automatically resolving collisions.
  - Make the map viewport shift away from the Stella panel in map mode.
  - Preserve drag/resize behavior for both floating panels.
- Non-goals:
  - Persisting panel layouts across reloads.
  - Rewriting the graph data or force model from scratch.

## Relevant files

- `src/App.jsx`
- `src/components/BrainMap.jsx`
- `src/components/FocusMode.jsx`
- `src/hooks/useFloatingPanel.js`
- `src/utils/floating-panels.js`
- `src/utils/floating-panels.test.js`

## Proposed design

- Lift both floating panel controllers into `App` so their rectangles can be coordinated together.
- Add geometry helpers for overlap detection, collision resolution, and safe viewport center calculation.
- In map mode, compute a safe center outside Stella’s occluding rectangle and pan the graph viewport toward that visible region.

## Validation plan

- Run `npm test`.
- Run `npm run lint`.
- Run `npm run build`.
- Manually verify panel collision handling and graph avoidance in the browser.

## Validation performed

- `npm test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification not performed in this session.
