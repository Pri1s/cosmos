# Focus Panel Overlap

Status: completed on 2026-03-29, updated with a follow-up placement fix on 2026-03-29.

## Problem statement

In focus mode, the floating Stella panel and floating Lens Explorer only avoid colliding with each other. They do not avoid the centered focus hero card and surrounding lens ring, which allows the panels to overlap the primary focus content and degrade readability.

## Goals and non-goals

### Goals
- Prevent the floating panels from overlapping the focus-mode hero and lens zone.
- Bias Stella to the left side of the protected focus area and the Lens Explorer to the right side.
- Preserve existing drag/resize behavior while snapping invalid placements back to safe positions.
- Add automated coverage for the new floating-panel placement helper.

### Non-goals
- Redesigning the focus-mode visual treatment.
- Changing Stella prompts or lens content.
- Persisting panel positions across reloads.

## Constraints

- Keep the change inside the current React/CSS architecture.
- Preserve freeform dragging/resizing when the final position remains safe.
- Avoid regressing map-mode panel behavior.

## Relevant files

- `src/App.jsx`
- `src/utils/focus-panel-layout.js`
- `src/utils/focus-panel-layout.test.js`
- `src/utils/floating-panels.js`
- `src/utils/floating-panels.test.js`

## Proposed design

- Define a protected focus rect in viewport coordinates that approximates the hero card plus lens orbit.
- Add a reusable helper that places a panel around an anchor rect according to a preferred side order.
- On focus-mode entry and viewport changes, auto-place Stella and the Lens Explorer around the protected center zone.
- On drag/resize end in focus mode, resolve collisions against both the other panel and the protected center zone.
- If the viewport cannot support a left/right split, fall back to a deterministic stacked column on the roomier side instead of letting both panels compete for the same band.
- Snap the computed focus-mode rectangles to integer pixels so exact boundary placements do not get misclassified as overlaps.

## Interfaces/contracts

- `floating-panels.js` gains a placement helper for positioning panels around an anchor rect.
- Existing `GuidePanel` and `KnowledgePanel` props remain unchanged.

## Risks and edge cases

- The protected rect is an approximation, so it must be generous enough to cover the hero/lens cluster without pushing panels unnecessarily far away.
- Narrower viewports may force a top/bottom fallback instead of left/right placement.
- Resetting panel positions too often would feel hostile to manual dragging, so auto-placement should happen only at controlled points.

## Validation plan

- `npm run test`
- `npm run lint`
- `npm run build`
- Manual focus-mode check that Stella and Lens Explorer no longer overlap the hero card.

## Validation performed

- `npm run test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification not performed in this session.

## Migration notes

- None.
