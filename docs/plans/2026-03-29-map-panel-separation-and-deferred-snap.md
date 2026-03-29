## Problem statement

The graph and Stella panel are currently treated as overlapping surfaces in map mode, which makes the chat feel like it is sitting on top of the graph panel. Panel collision handling also happens during drag, which is visually jumpy.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Keep the map panel and Stella panel separate in map mode.
  - Recalculate clamp/snap behavior only after a drag or resize completes.
  - Preserve focus-mode floating windows.
- Non-goals:
  - Making the graph panel draggable.
  - Persisting panel layouts across reloads.

## Relevant files

- `src/App.jsx`
- `src/hooks/useFloatingPanel.js`
- `src/App.css`

## Proposed design

- In map mode, reserve a real lane for Stella by sizing the graph panel from Stella’s x-position instead of letting Stella overlap the graph.
- Defer panel clamping and collision resolution to pointer-up.
- Keep focus-mode panel separation, but only resolve overlaps after drag/resize finishes.

## Revision

- Updated implementation to keep panel sizes stable during map-mode rearrangement.
- The graph panel now flips sides relative to Stella after interaction end instead of shrinking to create room.

## Validation plan

- Run `npm test`.
- Run `npm run lint`.
- Run `npm run build`.
- Manually verify Stella can be moved, then snaps/reflows only after release.

## Validation performed

- `npm test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification not performed in this session.
