# Focus Render Panel

Status: completed on 2026-03-29.

## Problem statement

Focus mode still treats the central render as an invisible protected zone instead of a real panel. That makes panel arrangement logic indirect and harder to reason about, and it leaves the center scene visually disconnected from the other floating surfaces.

## Goals and non-goals

### Goals
- Turn the focus render into a real bounded panel with its own rectangle.
- Arrange Stella and the Lens Explorer around that real render panel instead of around an approximate safe area.
- Prevent the floating panels from overlapping the `Back to Map` control.
- Preserve the existing focus hero, lens actions, and panel interactions.
- Add test coverage for the render-panel-based layout.

### Non-goals
- Making the render panel draggable or resizable in this pass.
- Reworking Stella content or lens data.
- Changing map-mode graph behavior.

## Constraints

- Stay within the current React/CSS architecture.
- Keep focus-mode interactions usable on the current 200-node dataset.
- Avoid regressing the map/focus transitions and existing floating-panel behavior.

## Relevant files

- `src/App.jsx`
- `src/App.css`
- `src/components/FocusMode.jsx`
- `src/utils/focus-panel-layout.js`
- `src/utils/focus-panel-layout.test.js`

## Proposed design

- Replace the old protected-rect abstraction with a render-panel rect returned by the focus layout helper.
- Render the focus hero and lens ring inside a dedicated center panel surface.
- Keep the guide and knowledge panels as floating windows, but place them relative to the render panel rect.
- Treat the `Back to Map` control as a top-left keep-out zone for floating panel placement.
- Use panel-safe lens slots inside the render surface so the lens buttons do not overlap the hero card.
- Preserve the current stacked fallback when the viewport cannot support a left/render/right split.

## Interfaces/contracts

- `getFocusPanelLayout` will return `renderRect` in addition to `guideRect` and `knowledgeRect`.
- `FocusMode` will accept the render panel rect and use it for panel-local positioning.

## Risks and edge cases

- Moving the hero and ring into a panel changes their positioning context and could affect the transition animation.
- The render panel must be sized so the lens ring still reads clearly without clipping.
- Narrow viewports still need a stable stacked fallback.

## Validation plan

- `npm run test`
- `npm run lint`
- `npm run build`
- Manual browser verification of focus-mode panel arrangement

## Validation performed

- `npm run test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification not performed in this session.
