## Problem statement

The Stella panel now floats in focus mode, but in map mode it still behaves like a reserved right sidebar. That keeps the main graph compressed and breaks the visual consistency of the floating-window interaction model.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Make Stella a floating panel in map mode as well.
  - Let the graph use the full viewport width in map mode.
  - Preserve existing chat behavior, dragging, and resizing.
- Non-goals:
  - Changing focus-mode window behavior.
  - Redesigning the detail panel.

## Relevant files

- `src/App.jsx`
- `src/App.css`
- `src/components/GuidePanel.jsx`

## Proposed design

- Keep the guide panel in floating mode for both map and focus states.
- Remove reserved sidebar width from map sizing logic.
- Let other map overlays position against the full viewport again.

## Validation plan

- Run `npm run lint`.
- Run `npm run build`.
- Manually verify the graph fills the full width while Stella remains draggable/resizable.

## Validation performed

- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification not performed in this session.
