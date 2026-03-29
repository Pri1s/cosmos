# Stella Response Quality

Status: completed on 2026-03-29.

## Problem statement

Stella's Gemini responses are low-quality for common prompts. The current integration sends the full curated dataset on every request, preserves the entire conversation without trimming, allows Gemini 2.5 Flash to spend output budget on thinking tokens, and uses a persona prompt that encourages filler openings and over-restrictive domain refusals.

## Goals and non-goals

### Goals
- Prevent truncated Gemini responses by disabling thinking for this chat flow.
- Replace the full-dataset prompt with compact, request-specific Cosmos context.
- Trim conversation history so each turn stays within a sane token budget.
- Improve Stella's tone so answers begin directly instead of with generic filler.
- Handle simple date/day/time questions cleanly.
- Add automated coverage for the new request-building behavior.

### Non-goals
- Redesign the guide panel UI.
- Add streaming responses.
- Introduce a backend or persistent chat storage.
- Solve every possible off-topic question with local logic.

## Constraints

- Cosmos remains a frontend-only Vite app.
- The Stella integration should stay behind the existing `src/api/stella.js` service boundary.
- Existing panel behavior and event wiring should remain intact.
- The change should stay scoped to response quality, not broader UI refactors.

## Relevant files

- `src/api/stella.js`
- `src/api/stella.test.js`
- `src/components/GuidePanel.jsx`
- `src/data/graph-data.js`
- `docs/plans/`
- `docs/features/`

## Proposed design

- Replace the current long-form system prompt with a shorter base prompt that explicitly says to answer first, avoid filler, and answer simple utility questions plainly when context allows.
- Build a compact request context for each turn:
  - current browser date
  - small catalog overview
  - targeted node summaries for the selected or referenced nodes
  - specialized compact context for comparison or detection prompts
- Trim chat history to the most recent turns and clip overly long message content.
- Set Gemini `thinkingBudget` to `0` for this low-latency chat flow.
- Short-circuit simple day/date/time questions locally to avoid unnecessary model calls.

## Interfaces/contracts

- `sendMessage(history, options)` remains the Stella service entry point.
- `history` keeps the same `{ role, content }` shape.
- `options` may include the currently selected node, active lens, and current time for request context.
- GuidePanel continues to receive plain string responses.

## Risks and edge cases

- Aggressive history trimming can remove useful conversation context if set too low.
- Simple keyword matching for node references can miss ambiguous prompts or partial names.
- Local date/time handling must avoid pretending to know more than the browser clock provides.
- Over-tightening the prompt can make Stella too terse or mechanical.

## Validation plan

- `npm run test`
- `npm run lint`
- `npm run build`
- Direct Gemini smoke checks for the prompts that previously degraded:
  - detection question
  - habitability question
  - day/date question

## Migration notes

- No environment variable changes are required.
- Existing Vite sessions only need a restart if the local env file itself changed.
