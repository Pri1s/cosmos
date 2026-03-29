## Problem statement

The Stella voice panel currently starts narration automatically whenever the selected node or active lens changes, and the stop control no longer leaves playback stopped in a predictable way. The user wants narration to start only after an explicit click and wants the stop button to work reliably.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Require an explicit user click before Stella narration begins.
  - Make the stop control cancel any active narration and leave the panel idle.
  - Reset the voice panel to a ready state when the narration context changes.
  - Preserve the existing floating-panel layout and transcript rendering.
- Non-goals:
  - Changing narration copy generation.
  - Reworking focus-mode layout.
  - Introducing backend audio or downloadable voice assets.

## Constraints

- Stay within the existing client-only Web Speech API implementation.
- Keep the change scoped to the voice panel, its tests, and its shipped documentation.
- Maintain a graceful fallback when browser speech synthesis is unavailable.

## Relevant files

- `src/components/VoicePanel.jsx`
- `src/utils/voice-speech.js`
- `src/utils/voice-speech.test.js`
- `docs/features/2026-03-29-stella-voice-panel.md`

## Proposed design

- Remove the auto-play effect that starts speech whenever the narration transcript changes.
- Initialize supported browsers in an idle-ready state instead of a queued-live state.
- Add a small narration-session reset path that cancels any active utterance when the selected narration changes and returns the panel to idle.
- Update the voice button copy so the idle state clearly invites manual playback (for example, `Start narration`) and the active state exposes `Stop voice`.

## Interfaces/contracts

- `VoicePanel` keeps the same props and rendering contract.
- Internal speech state values continue to drive the live indicator and button behavior, but the initial supported state becomes `idle` instead of `queued`.

## Risks and edge cases

- Browser `speechSynthesis.cancel()` can fire end/error callbacks asynchronously, so the component needs to tolerate repeated idle transitions.
- Some browsers expose voices after mount; manual playback still needs to use the freshest available voice list.
- Changing nodes or lenses during playback should stop the old narration without automatically starting the next one.

## Validation plan

- Run focused tests for the speech helpers.
- Run `npm run test`.
- Run `npm run lint`.
- Run `npm run build`.
- Manually verify in the browser that the button reads as a manual start action and that stopping playback leaves narration silent.

## Migration notes

No migration is expected.

## Validation performed

- `npm run test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- A targeted browser automation check could not be completed in this session because Playwright could not attach while Chrome reported an existing browser session for its profile.
