# Stella Voice Waveform And Playback Stability

## Problem statement

The Stella voice panel has two UX regressions:
- The decorative waveform only occupies a small fraction of the console width, so it reads as visually broken.
- Voice playback is torn down and restarted when focus-mode interactions change component state even if the spoken narration text is unchanged.

## Goals and non-goals

### Goals
- Make the waveform span the available console width in a way that still feels like an audio readout.
- Keep ongoing speech stable across benign focus-mode updates when the narration string has not changed.
- Reset playback cleanly when the narration text actually changes.

### Non-goals
- Replacing browser speech synthesis with generated audio assets.
- Reworking the narration copy, focus-mode layout, or Gemini integration.

## Constraints

- Keep the change scoped to the existing Stella voice panel implementation.
- Preserve the current manual start/stop interaction model.
- Avoid clobbering unrelated in-progress local edits already present in the repository.

## Relevant files

- `src/components/VoicePanel.jsx`
- `src/utils/voice-speech.js`
- `src/utils/voice-speech.test.js`
- `src/App.css`
- `src/components/FocusMode.jsx`
- `docs/features/2026-03-29-stella-voice-panel.md`

## Proposed design

- Remove unnecessary voice-panel remounting tied to lens changes so the component can hold its own playback session.
- Track the last spoken narration string inside `VoicePanel` and only cancel active speech when that string actually changes.
- Expand the waveform visually across the panel by making the bar row responsive to the panel width instead of relying on a short fixed-width cluster.

## Interfaces/contracts

- No public API changes are expected.
- Internal voice playback will continue to be driven by the existing `speechState` values.

## Risks and edge cases

- Browser speech synthesis callbacks can arrive after cancellation, so the component must continue guarding against stale utterance events.
- Removing the voice-panel remount key must not break the panel’s ability to refresh its displayed narration when the node or lens actually changes.

## Validation plan

- Run focused tests for `src/utils/voice-speech.test.js`.
- Run `npm run lint`.
- Run `npm run build`.

## Migration notes

No migration is required.

## Outcome

Completed on 2026-03-29.
- The waveform now stretches across the available console width.
- Voice playback no longer gets torn down by lens-level remounts or unchanged narration updates.
- Validation was completed with focused tests, lint, and build; browser verification was intentionally stopped at user request.
