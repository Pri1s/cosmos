## Problem statement

The current focus-mode and floating-panel UI still relies heavily on fixed pixel dimensions for panel geometry, spacing, and text sizing. On smaller or narrower viewports that causes overlap, clipping, and text density problems because the containers and their internal content do not scale together.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Replace the main fixed-size panel geometry with viewport-ratio scaling.
  - Make panel typography and spacing scale with screen size.
  - Preserve existing drag/resize interactions and layout behavior.
  - Reduce overlap and clipping across different viewport sizes.
- Non-goals:
  - Redesigning the visual language.
  - Changing app behavior outside responsive layout and sizing.
  - Adding new breakpoints for completely separate mobile layouts.

## Constraints

- Stay within the current React/CSS architecture.
- Keep the focus-mode panel layout deterministic and testable.
- Avoid shrinking panels so far that content becomes unreadable.

## Relevant files

- `src/App.jsx`
- `src/App.css`
- `src/utils/focus-panel-layout.js`
- `src/utils/focus-panel-layout.test.js`
- `src/hooks/useFloatingPanel.js`
- `src/utils/` responsive sizing helper file(s)

## Proposed design

- Introduce a shared viewport-scaling helper used by app layout and focus-mode layout logic.
- Convert floating-panel initial sizes, minimum sizes, render-stage dimensions, gaps, and safe areas to clamped viewport-ratio values.
- Add responsive CSS variables for panel padding, radius, and key text sizes so content scales with the containers.
- Update or add tests for the responsive sizing helpers and focus layout behavior.

## Risks and edge cases

- Excessive scaling down can make the UI feel cramped, so every ratio needs min/max clamps.
- Responsive geometry can subtly shift panel placements and require test updates.
- Different browsers may render wrapped serif headings slightly differently at small sizes.

## Validation plan

- Run `npm run test`.
- Run `npm run lint`.
- Run `npm run build`.
- Manually verify focus mode and floating panels across a few viewport sizes.

## Migration notes

No migration is expected.

## Validation performed

- `npm run test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification was not performed in this session.
