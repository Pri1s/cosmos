## Problem statement

Stella's current browser speech synthesis uses a minimal voice picker, which can land on voices that sound flat or generic instead of like a polished female guide. Separately, the map does not preserve a clear visual memory of which nodes a user has already explored, so it is easy to lose track of progress while moving around the graph.

## Status

In progress on 2026-03-29.

## Goals and non-goals

- Goals:
  - Make Stella prefer more natural-sounding female narration voices with an instructor or guide feel when the browser exposes them.
  - Keep voice playback resilient across browsers by falling back cleanly when preferred voices are unavailable.
  - Track nodes the user has already visited during the session and surface that state directly on the map.
  - Give visited nodes a subtle persistent glow or lighting treatment that remains readable without overpowering hover and selection states.
- Non-goals:
  - Adding a new third-party TTS API or backend service.
  - Reworking the existing voice panel layout or transcript copy.
  - Changing guided journey progression logic beyond reusing its visible visited affordance.

## Constraints

- Stay within the current client-only React and Web Speech API architecture.
- Avoid adding secrets, backend dependencies, or runtime services.
- Preserve existing canvas rendering performance and interaction hierarchy.
- Keep visited-node styling compatible with selected, hovered, search-dimmed, and neighbor-highlighted states.

## Relevant files

- `src/App.jsx`
- `src/components/BrainMap.jsx`
- `src/components/VoicePanel.jsx`
- `src/utils/render-helpers.js`
- `src/utils/render-helpers.test.js`
- `src/utils/voice-speech.js`
- `src/utils/voice-speech.test.js`
- `docs/features/2026-03-29-stella-voice-panel.md`

## Proposed design

- Replace the simple regex-based voice picker with a scored preference system that favors English female assistant voices commonly exposed by modern browsers and platforms, with extra weight for names associated with smoother neural/system narration.
- Load and react to the browser voice list in `VoicePanel` so speech can use late-loading voices instead of only what is available on first render.
- Track visited node ids in `App` using a session-persistent state bucket backed by `sessionStorage`, and mark a node visited when focus mode is entered or when it is otherwise selected for inspection.
- Pass the visited-node set into `BrainMap`, then extend `drawNode` with a soft visited halo and ring that complements existing selection and hover treatments.

## Interfaces/contracts

- `BrainMap` will accept a `visitedNodeIds` prop.
- `drawNode` will accept an `isVisited` visual flag alongside existing selection and hover flags.
- `pickNarrationVoice` will continue to accept an array of browser voice objects, but its selection rules will become score-based instead of first-match regex selection.

## Risks and edge cases

- Browser voice inventories vary widely, so the new picker must degrade gracefully when none of the preferred voice names exist.
- Speech synthesis voices often load asynchronously, so voice selection must not assume `getVoices()` is complete during the first render.
- A visited-node effect that is too bright could muddy selection feedback or make the map feel noisy.
- Session-persistent visited state should avoid leaking across unrelated browser sessions if the user expects a lighter-weight memory than guided journey persistence.

## Validation plan

- Run targeted tests for `voice-speech` and `render-helpers`.
- Run `npm run lint`.
- Run `npm run build`.
- Manually inspect the map and voice panel in the browser if time permits, focusing on visited-node readability and voice replay behavior.

## Migration notes

No migration is expected.
