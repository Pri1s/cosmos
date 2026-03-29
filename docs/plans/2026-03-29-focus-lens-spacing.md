# Focus Lens Spacing

## Problem statement

Focus-mode lens pills can overlap the central hero card when titles are long, especially in the six-lens mission layout. The current fixed percentage slots do not account for pill width or the render panel size, so spacing breaks under real content.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Prevent focus lens pills from overlapping the hero card.
  - Preserve the existing five-lens and six-lens ring composition.
  - Keep all lens pills inside the render panel with a consistent buffer.
- Non-goals:
  - Redesigning focus mode.
  - Changing lens content or ordering.
  - Making the render panel draggable or resizable.

## Constraints

- Keep the change scoped to focus-mode layout.
- Use deterministic math so the layout stays stable across renders.
- Avoid introducing DOM measurement dependencies for this pass.

## Relevant files

- `src/components/FocusMode.jsx`
- `src/utils/` new focus lens layout helper
- `src/utils/` new focus lens layout test

## Proposed design

- Replace the fixed percentage slot positioning with a pure helper that keeps the same directional slot pattern but computes radius from:
  - render panel size
  - an estimated pill size based on title length
  - a central hero keep-out area
- Clamp the computed positions so each pill remains inside the render panel padding.

## Interfaces/contracts

- `FocusMode` will consume derived lens positions instead of calling a local fixed-slot helper.
- The new layout helper will be pure and testable.

## Risks and edge cases

- Size estimation could still be slightly off for unusual text lengths or fonts.
- Very small render panels may force pills closer to the hero than intended.
- Five-lens and six-lens layouts need separate regression coverage.

## Validation plan

- Run `npm run test`.
- Run `npm run lint`.
- Run `npm run build`.
- Manual browser verification if time permits.

## Migration notes

No migration is expected.

## Validation performed

- `npm run test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification was not performed in this session.
