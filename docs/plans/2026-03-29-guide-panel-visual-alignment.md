## Problem statement

The Stella guide panel uses a separate purple-forward chat UI that does not match the darker, cooler, more editorial panel language used elsewhere in Cosmos, especially in focus mode.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Align the guide panel colorway and hierarchy with the rest of the site.
  - Make the header, message stack, node card, chips, and input/footer feel like one cohesive system.
  - Preserve all current Stella behavior and interactions.
- Non-goals:
  - Changing Stella prompts or API behavior.
  - Reworking the focus-mode knowledge panel.
  - Introducing new dependencies or animation systems.

## Constraints

- Keep the change scoped to the existing React and plain CSS architecture.
- Maintain the current desktop split layout.
- Avoid regressions in narrow viewports even though the app is primarily desktop-oriented.

## Relevant files

- `src/components/GuidePanel.jsx`
- `src/App.css`

## Proposed design

- Update the guide panel structure to support a top identity area, a cleaner message rail, a more integrated footer, and better visual grouping.
- Replace the current purple-accented chat styling with cooler blue-tinted accents, subtler borders, darker surfaces, and stronger typographic hierarchy that matches the map/focus panels.
- Restyle the selected-node card and quick chips to feel like compact companion surfaces rather than separate widgets.
- Add responsive behavior so the panel remains usable when the viewport narrows.

## Interfaces/contracts

- `GuidePanel` props remain unchanged.
- Message rendering logic remains unchanged.
- No data shape or API contract changes.

## Risks and edge cases

- Tightening the visual system too much could reduce contrast for long chat messages.
- Footer layout changes could become cramped on smaller widths.
- Style changes must not interfere with scrolling or loading-state rendering.

## Validation plan

- Run `npm run lint`.
- Run `npm run build`.
- Manually confirm the guide panel matches the site chrome more closely and remains usable with and without a selected node.

## Validation performed

- `npm run lint` passed.
- `npm run build` passed.
- Manual browser review not performed in this session.

## Migration notes

- None.
