## Problem statement

Focus mode currently has the main Stella guide panel and a lens explorer panel, but it lacks a dedicated narration surface that feels like Stella is actively telling the story of the selected world or mission. The user wants an additional panel with a voice-broadcast feel rather than another generic info card.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Add a third focus-mode panel dedicated to Stella narration.
  - Make the panel feel like a live voice/broadcast interface.
  - Tie the narration to the selected node and active lens.
  - Keep the panel draggable/resizable like the other floating panels.
  - Update focus-mode layout so the extra panel does not collide with the render stage or existing panels.
- Non-goals:
  - Adding real audio playback or text-to-speech.
  - Reworking the map-mode layout.
  - Changing Gemini request behavior for the main guide chat.

## Constraints

- Stay within the existing client-only React architecture.
- Preserve existing floating-panel interactions and focus-mode transitions.
- Avoid introducing a backend or new environment variables.
- Keep the new narration useful even when the Gemini API key is unavailable.

## Relevant files

- `src/App.jsx`
- `src/App.css`
- `src/components/FocusMode.jsx`
- `src/components/GuidePanel.jsx`
- `src/components/KnowledgePanel.jsx`
- `src/hooks/useFloatingPanel.js`
- `src/utils/focus-panel-layout.js`
- `src/utils/focus-panel-layout.test.js`
- `src/utils/` narration helper file(s)

## Proposed design

- Add a new `VoicePanel` component rendered only in focus mode.
- Generate local narration copy from the selected node, current lens, and nearby nodes so the panel is always populated.
- Style the panel as Stella’s narration channel with a live indicator, waveform treatment, transcript, and compact “signal” metadata.
- Extend focus-mode panel layout to place guide + voice on one side and the lens explorer on the other when space allows, with a stacked fallback for tighter viewports.
- Reuse the floating panel hook so the voice panel matches current drag/resize behavior.

## Interfaces/contracts

- `FocusMode` will receive voice-panel positioning/interaction props.
- `getFocusPanelLayout` will return a `voiceRect` in addition to guide and knowledge panel rects.
- A new narration utility will accept `{ node, lens, neighbors }` and return render-ready narration metadata.

## Risks and edge cases

- A third panel can easily overcrowd shorter viewports.
- Layout interactions can cause overlap regressions if the new panel is not part of the same layout resolver.
- A purely visual voice panel can feel fake if the transcript is too generic, so the generated copy needs to respond clearly to node/lens context.

## Validation plan

- Run `npm run test`.
- Run `npm run lint`.
- Run `npm run build`.
- Manually verify focus mode with exoplanet and mission nodes, including drag/resize behavior and smaller viewport behavior.

## Migration notes

No migration is expected.

## Validation performed

- `npm run test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification was not performed in this session.
