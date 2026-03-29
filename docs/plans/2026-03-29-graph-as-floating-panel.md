## Problem statement

The node graph still reads like the page background even after the other UI surfaces became floating windows. That weakens the panel-based visual language and makes the graph feel less intentional as its own workspace.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Present the graph area as its own floating panel.
  - Measure the graph panel so the canvas and overlays position against the panel bounds.
  - Preserve existing search, detail, and focus-mode behavior inside that panel.
- Non-goals:
  - Making the graph panel draggable or resizable.
  - Reworking the graph data or force behavior.

## Relevant files

- `src/App.jsx`
- `src/App.css`
- `src/components/BrainMap.jsx`
- `src/components/DetailPanel.jsx`

## Proposed design

- Add an inset, rounded, glassy graph surface to the app layout.
- Track the graph panel’s rendered size with `ResizeObserver`.
- Feed measured width and height into the force-graph canvas and detail panel positioning.

## Validation plan

- Run `npm run lint`.
- Run `npm run build`.
- Manually verify graph panel layout and overlay positioning.

## Validation performed

- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification not performed in this session.
