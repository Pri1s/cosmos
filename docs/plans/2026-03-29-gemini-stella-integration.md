# Gemini Stella Integration

Status: completed on 2026-03-29.

## Problem statement

The Stella guide currently calls Anthropic and expects `VITE_ANTHROPIC_API_KEY`, but the local environment is configured with `VITE_GEMINI_API_KEY`. That mismatch causes Stella to fail immediately with a missing-key message even though a Gemini key is present.

## Goals and non-goals

### Goals
- Switch Stella's client-side API service from Anthropic to Gemini.
- Use `VITE_GEMINI_API_KEY` as the supported browser env var.
- Preserve the existing guide panel behavior and conversation history flow.
- Add automated coverage for the request/response mapping logic.
- Update repo docs to reflect the new AI provider and env contract.

### Non-goals
- Redesign the guide panel UI or chat UX.
- Add a backend proxy or server-side secret handling.
- Introduce multimodal inputs, tool calling, or streaming responses.
- Migrate unrelated local configuration files beyond the Stella integration.

## Constraints

- Cosmos remains a frontend-only Vite SPA with no backend.
- The change must stay compatible with the existing `{ role, content }` chat history shape used by `GuidePanel`.
- Existing unrelated local work in the repo must remain untouched.
- Validation should use the narrowest effective checks first, then full lint/build.

## Relevant files

- `src/api/stella.js`
- `src/components/GuidePanel.jsx`
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `docs/architecture/adr/`
- `docs/features/`

## Proposed design

- Replace the Anthropic REST call in `src/api/stella.js` with Gemini's `generateContent` REST endpoint.
- Translate local chat history into Gemini's `contents` array by mapping assistant turns to the `model` role.
- Pass Stella's long-form behavior prompt through Gemini's `system_instruction`.
- Parse the first candidate's text parts into a single reply string, and fail loudly if Gemini returns no text.
- Update the guide panel's missing-key handling to reference `VITE_GEMINI_API_KEY`.
- Add focused unit tests for payload construction and response parsing.

## Interfaces/contracts

- `sendMessage(history)` remains the public API used by `GuidePanel`.
- `history` stays as `Array<{ role: 'user'|'assistant', content: string }>` for UI code.
- The supported browser env var becomes `VITE_GEMINI_API_KEY`.
- Stella responses remain plain text strings for the existing panel renderer.

## Risks and edge cases

- Gemini uses `model` instead of `assistant` in its conversation history, so incorrect role mapping would break continuity.
- Gemini may return empty candidates or non-text parts, which needs explicit error handling.
- A client-side Gemini integration still exposes a browser-usable key, so docs should be clear about the frontend-only tradeoff.
- Users who change env vars while Vite is already running must restart the dev server.

## Validation plan

- `npm run test`
- `npm run lint`
- `npm run build`
- Manual code-path review of Stella's missing-key and successful-response handling.

## Migration notes

- Existing `.env` or `.env.local` files should define `VITE_GEMINI_API_KEY`.
- `VITE_ANTHROPIC_API_KEY` is no longer used by the Stella service after this change.
