## Problem statement

The guided journey UI currently renders inside Stella’s chat panel, which causes the journey content to compete with chat messages, the text input, and the mini node card for the same vertical space. In practice the journey card feels like it overlaps the chatbot instead of complementing it.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Move the guided journey UI out of Stella’s chat panel into its own floating panel.
  - Preserve all guided journey controls and progress behavior.
  - Keep Stella’s panel focused on chat plus the header CTA for starting or resuming the journey.
- Non-goals:
  - Reworking guided journey traversal or ranking rules.
  - Changing focus-mode behavior beyond what is needed to keep the new panel visible and usable.

## Constraints

- Stay within the existing floating-panel architecture.
- Avoid regressing journey persistence or chat behavior.
- Keep the change scoped to layout and integration rather than redesigning the journey feature.

## Relevant files

- `src/App.jsx`
- `src/App.css`
- `src/components/GuidePanel.jsx`
- `src/components/JourneyPanel.jsx`

## Proposed design

- Extract the journey UI from `GuidePanel` into a dedicated `JourneyPanel` component.
- Render that component as a floating panel from `App`, with its own drag and resize controls.
- Place the panel away from the chatbot by default, using a left-side lower viewport starting position.
- Leave only the journey start/resume/restart CTA in Stella’s panel header.

## Interfaces/contracts

- `GuidePanel` no longer owns the full journey UI; it only reflects journey status via the header CTA.
- `JourneyPanel` accepts the existing journey state and callbacks plus floating-panel props.
- `App` becomes responsible for rendering and positioning the separate journey panel.

## Risks and edge cases

- The new panel could still overlap other floating panels if the user drags it there manually.
- Focus-mode transitions must not inadvertently hide or reset the journey panel.
- The journey candidate adoption UI still needs to surface correctly outside the chat panel.

## Validation plan

- Run `npm run test`.
- Run `npm run lint`.
- Run `npm run build`.
- Manually verify that the journey panel no longer competes with the chat UI.

## Migration notes

No migration is required. This is a layout refactor of the existing guided journey feature.

## Validation performed

- `npm run test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification was not performed in this session.
