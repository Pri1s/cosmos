# ADR-002: Gemini Client Integration for Stella

## Status

accepted

## Date

2026-03-29

## Context

Cosmos is a frontend-only Vite SPA with no backend proxy. Stella was previously wired to Anthropic and expected `VITE_ANTHROPIC_API_KEY`, but the active local setup provides a Gemini API key instead. The project needs Stella to work with the available browser-exposed key while preserving the existing guide panel behavior and no-backend architecture.

## Decision

Switch Stella's direct browser integration from Anthropic's Messages API to Google's Gemini `generateContent` REST API, using `VITE_GEMINI_API_KEY` as the supported client-side environment variable. Keep the existing `sendMessage(history)` service boundary and translate the UI's local `{ role, content }` conversation history into Gemini's `contents` format inside the service layer.

## Consequences

### Positive
- Aligns the codebase with the available Gemini API key and restores Stella without adding backend infrastructure.
- Preserves the current chat UI and service boundary, so the provider swap stays localized.
- Keeps the repo consistent with its frontend-only deployment model.

### Negative
- Gemini keys remain browser-usable secrets, so this integration has the same client-side exposure tradeoff as the previous direct API approach.
- Provider-specific request and response mapping now lives in the Stella service and must be maintained if Gemini's API shape changes.

### Neutral
- Stella's personality prompt and UI behavior remain the same; only the provider contract changes.

## Alternatives Considered

### Alternative 1: Keep Anthropic and require a new Anthropic key
- Description: Leave the integration as-is and require all local environments to supply `VITE_ANTHROPIC_API_KEY`.
- Why it was rejected: It does not solve the immediate mismatch and keeps the app broken for the current configured environment.

### Alternative 2: Add a backend proxy for AI requests
- Description: Move Stella calls behind a server-side endpoint so browser clients never see provider keys.
- Why it was rejected: It conflicts with the repo's explicit no-backend architecture and is out of scope for restoring the existing frontend-only app.
