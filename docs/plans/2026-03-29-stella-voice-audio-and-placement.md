## Problem statement

The new Stella voice panel currently looks like an audio surface but does not produce sound, which breaks the user expectation the UI creates. Its default focus-mode placement is also on the left side under the guide panel, while the user wants it to begin underneath the node/lens panel on the right.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Add audible narration to the Stella voice panel using browser-native capabilities.
  - Make narration start from the voice panel without requiring backend audio infrastructure.
  - Move the default focus-mode placement so the voice panel starts below the node/lens panel.
  - Preserve existing drag/resize behavior.
- Non-goals:
  - Adding server-side audio generation.
  - Building downloadable audio files.
  - Changing map-mode layout.

## Constraints

- Stay client-only.
- Use capabilities available in modern browsers with a reasonable fallback when unavailable.
- Keep the implementation scoped to the voice panel and focus-mode layout.

## Relevant files

- `src/components/VoicePanel.jsx`
- `src/App.jsx`
- `src/App.css`
- `src/utils/focus-panel-layout.js`
- `src/utils/focus-panel-layout.test.js`
- `src/utils/voice-narration.js`
- `src/utils/` voice/speech helper file(s)

## Proposed design

- Use the browser Web Speech API (`speechSynthesis`) to speak the current narration transcript.
- Auto-play narration when the selected node or active lens changes, and expose a stop/replay control in the panel.
- Move the default split-layout arrangement to guide on the left and node panel + voice panel stacked on the right.
- Keep the panel visually “live” only while speech is active or queued.

## Risks and edge cases

- Some browsers or environments may not support speech synthesis or may require user interaction first.
- Voice availability differs by platform.
- Rapid node/lens changes can interrupt currently playing narration.

## Validation plan

- Run `npm run test`.
- Run `npm run lint`.
- Run `npm run build`.
- Manually verify audible narration in the browser and confirm the panel starts under the node panel.

## Migration notes

No migration is expected.

## Validation performed

- `npm run test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification was not performed in this session.
