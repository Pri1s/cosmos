# Focus Mode Semantic Zoom

## Problem statement

Node selection currently stops at a floating detail panel plus Stella commentary. That works for metadata lookup, but it does not shift the experience into a deeper, single-object understanding mode.

## Goals and non-goals

### Goals
- Add a distinct Focus Mode state for any selected node.
- Animate from the live map into a centered radial “knowledge layer”.
- Generate 4-6 local lenses from existing data and graph neighbors.
- Let users ask Stella for more from a selected lens.

### Non-goals
- Replace the main graph with a second force simulation.
- Rewrite the curated dataset structure.
- Add a backend or new icon library.

## Constraints

- Preserve the dark space visual language.
- Keep the graph mounted and visually present under Focus Mode.
- Hide the floating detail panel during Focus Mode and restore it on exit.
- Add automated coverage for new pure lens logic.

## Relevant files

- `src/App.jsx`
- `src/components/BrainMap.jsx`
- `src/components/GuidePanel.jsx`
- `src/components/DetailPanel.jsx`
- `src/components/FocusMode.jsx`
- `src/utils/focus-lenses.js`
- `src/App.css`

## Proposed design

- Add a view-state machine in `App` with `map`, `enteringFocus`, `focus`, and `exitingFocus`.
- Capture the selected node’s screen position before transition and animate a DOM overlay from that point into a centered hero node.
- Fade and blur the map canvas instead of unmounting it.
- Generate lens content locally from node fields plus adjacent nodes.
- Route local guide events and Stella prompts through `GuidePanel`.

## Interfaces/contracts

- `BrainMap` accepts a presentation mode to suspend interactions outside map mode.
- `GuidePanel` accepts external guide events and a flag that controls map-only auto-comment behavior.
- `getFocusLenses(node, neighbors)` returns an array of lens objects with `id`, `title`, `icon`, `summary`, and `prompt`.

## Risks and edge cases

- Search-driven selection must resolve to the live graph node so the detail panel and focus origin still have coordinates.
- Transition timers must be cleared on rapid enter/exit to avoid stale overlays.
- Nodes with missing mass/radius/temperature still need coherent lens copy.

## Validation plan

- `npm run lint`
- `npm run build`
- `npm run test`
- Manual checks for map click, search entry, lens selection, Stella follow-up, and Back/Escape exit.

## Migration notes

No data migration is required. This is a frontend-only interaction change.
