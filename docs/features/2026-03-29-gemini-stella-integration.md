# Feature: Gemini Stella Integration

## Metadata

| Field | Value |
|---|---|
| **Date** | 2026-03-29 |
| **Status** | shipped |
| **Author** | Codex |
| **PR/Commit** | n/a |
| **ADR** | `docs/architecture/adr/ADR-002-gemini-client-integration.md` |

## Summary

Switched Stella's client-side chat integration from Anthropic to Gemini so the app works with `VITE_GEMINI_API_KEY` and the existing frontend-only deployment model.

## Motivation

The guide panel was hard-coded to require an Anthropic key even though the active environment was configured with a Gemini key. That mismatch blocked all Stella responses. This change aligns the runtime integration, env var contract, and repository documentation around the provider that is actually being used.

## Scope

What is included and what is explicitly excluded.

### Included
- Gemini `generateContent` integration in the Stella service
- Request mapping from local chat history into Gemini conversation turns
- Response parsing for Gemini text candidates
- Updated missing-key messaging in the guide panel
- Tests for Gemini payload and response handling
- README, agent docs, plan, and ADR updates

### Excluded
- Streaming responses
- Multimodal prompts or file uploads
- Backend proxying or server-side secret storage
- UI redesign of the guide panel

## Implementation

### Files/Systems Touched
- `src/api/stella.js` — replaced Anthropic-specific request logic with Gemini request/response helpers
- `src/api/stella.test.js` — added unit coverage for Gemini payload construction and text extraction
- `src/components/GuidePanel.jsx` — updated missing-key messaging to the Gemini env var
- `README.md` — updated provider and environment variable documentation
- `AGENTS.md` — aligned project-level agent instructions with Gemini
- `CLAUDE.md` — aligned Claude-specific repo guidance with Gemini

### Architecture Impact

The app still uses a single client-side service module for Stella, but that module now translates UI chat history into Gemini's `generateContent` contract instead of Anthropic's Messages API.

### Contracts/Interfaces Changed

The internal Stella service now expects `VITE_GEMINI_API_KEY` instead of `VITE_ANTHROPIC_API_KEY`. `sendMessage(history)` remains the same public interface for the UI.

### Data Model Changes

None.

### Environment/Config Changes

The supported AI env var is now `VITE_GEMINI_API_KEY`. Existing Vite sessions need a restart after changing env files.

## Migration Steps

1. Set `VITE_GEMINI_API_KEY` in `.env` or `.env.local`.
2. Remove stale `VITE_ANTHROPIC_API_KEY` entries if present.
3. Restart `npm run dev` so Vite reloads the env vars.

## Validation Performed

- Added and ran focused Vitest coverage for the Gemini request/response helpers
- Ran `npm run lint`
- Ran `npm run build`
- Manually reviewed the guide panel error path to confirm it now points users to `VITE_GEMINI_API_KEY`

## Follow-Up Tasks

- [ ] Decide whether Stella should move to streaming responses for lower perceived latency
- [ ] Revisit client-side key exposure if the app ever graduates from demo-style deployment
