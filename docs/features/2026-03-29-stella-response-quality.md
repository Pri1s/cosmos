# Feature: Stella Response Quality

## Metadata

| Field | Value |
|---|---|
| **Date** | 2026-03-29 |
| **Status** | shipped |
| **Author** | Codex |
| **PR/Commit** | n/a |
| **ADR** | None |

## Summary

Improved Stella's response quality by cutting prompt bloat, disabling Gemini thinking for this chat flow, trimming stale conversation history, and handling simple date/day/time questions locally.

## Motivation

Stella was producing visibly poor replies: generic filler openings, truncated answers, and over-restrictive domain refusals. The root causes were token-heavy request construction, unbounded chat history, and a persona prompt that biased the model toward evasive answers.

## Scope

What is included and what is explicitly excluded.

### Included
- Shorter, stricter Stella system prompt
- Request-specific Cosmos context instead of the full dataset on every turn
- History trimming and per-message truncation before Gemini calls
- Gemini `thinkingBudget: 0` for this low-latency chat flow
- Local handling for date/day/time prompts
- Tests covering the new request-building and utility-response behavior

### Excluded
- Streaming responses
- Backend proxying
- UI redesign of the guide panel
- Broader off-topic assistant capabilities beyond simple utility questions

## Implementation

### Files/Systems Touched
- `src/api/stella.js` — rebuilt Stella request construction around compact context, history trimming, and local utility replies
- `src/api/stella.test.js` — added coverage for history trimming, comparison context, Gemini config, and local date/day handling
- `src/components/GuidePanel.jsx` — passed selected-node, lens, and current-time context into Stella requests

### Architecture Impact

None beyond the existing Stella service boundary. The guide panel still calls a single client-side API module, but that module now composes targeted context per request instead of embedding the full catalog every time.

### Contracts/Interfaces Changed

`sendMessage(history, options)` now accepts optional request context such as the selected node, active lens, and current time. Existing callers that pass only `history` remain valid.

### Data Model Changes

None.

### Environment/Config Changes

None.

## Migration Steps

None beyond restarting the dev server if the app was already running during the code change.

## Validation Performed

- Ran `npm run test -- src/api/stella.test.js`
- Ran full `npm run test`
- Ran `npm run lint`
- Ran `npm run build`
- Ran live Gemini smoke checks for:
  - `How do we find exoplanets?`
  - `Most habitable planet?`
  - `What day is it?`

## Follow-Up Tasks

- [ ] Consider streaming Gemini responses if Stella still feels latent
- [ ] Revisit whether more non-space utility questions should be answered locally or by Gemini
