# Feature: Stella Voice Panel

## Metadata

| Field | Value |
|---|---|
| **Date** | 2026-03-29 |
| **Status** | shipped |
| **Author** | Codex |
| **PR/Commit** | not recorded |
| **ADR** | None |

## Summary

Focus mode now includes a third floating panel that presents Stella as a live narration channel with actual browser speech synthesis. The panel generates a story-style transcript for the selected node and currently active lens, speaks it aloud through the Web Speech API when supported, and starts underneath the node/lens panel so the right-side stack reads as a single inspection column.

## Motivation

The existing focus-mode surfaces explained facts and offered chat, but they did not provide an authored-feeling narrative layer. The Stella voice panel fills that gap by giving the selected world or mission a stronger sense of storytelling and momentum.

## Scope

What is included and what is explicitly excluded.

### Included
- A new focus-mode narration panel with a voice/broadcast visual treatment
- Local narration generation based on the selected node, active lens, and nearby nodes
- Browser-native speech synthesis playback for the narration transcript
- Default placement of the voice panel under the node/lens panel in focus mode
- Three-panel focus-mode layout support so guide, voice, and lens explorer can coexist
- Tests for narration generation and updated focus-panel layout behavior

### Excluded
- Real audio playback or text-to-speech
- Map-mode narration surfaces
- Changes to Gemini API configuration

## Implementation

### Files/Systems Touched
- `src/components/VoicePanel.jsx` — added the new voice-style narration panel
- `src/components/FocusMode.jsx` — rendered the voice panel alongside the existing focus surfaces
- `src/App.jsx` — introduced floating-panel state and layout coordination for the new panel
- `src/App.css` — added the voice-panel styling and waveform animation
- `src/utils/voice-narration.js` — generated narration copy and metadata locally
- `src/utils/voice-narration.test.js` — added tests for narration generation
- `src/utils/voice-speech.js` — added browser speech-synthesis helpers
- `src/utils/voice-speech.test.js` — added tests for speech helper behavior
- `src/utils/focus-panel-layout.js` — extended focus-mode layout to account for a third panel
- `src/utils/focus-panel-layout.test.js` — updated coverage for the three-panel arrangement

### Architecture Impact

None. The feature extends the current focus-mode/floating-panel architecture rather than introducing a new subsystem or service boundary.

### Contracts/Interfaces Changed

- `FocusMode` now accepts neighbor and voice-panel layout/interaction props.
- `getFocusPanelLayout` now returns `voiceRect` in addition to the existing guide and knowledge panel rects.

### Data Model Changes

None.

### Environment/Config Changes

None.

## Migration Steps

No migration is required.

## Validation Performed

- `npm run test`
- `npm run lint`
- `npm run build`
- Manual browser verification was not performed in this session

## Follow-Up Tasks

- [ ] Verify the final visual balance and drag/resize behavior in the browser across a few viewport sizes
