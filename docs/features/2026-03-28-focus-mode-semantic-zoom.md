# Feature: Focus Mode Semantic Zoom

## Metadata

| Field | Value |
|---|---|
| **Date** | 2026-03-28 |
| **Status** | shipped |
| **Author** | Codex |
| **PR/Commit** | uncommitted |
| **ADR** | `docs/architecture/adr/ADR-001-focus-mode-semantic-zoom.md` |

## Summary

Added a semantic zoom interaction that turns any selected node into a centered “knowledge layer” with orbiting lenses, replacing the old detail-only moment with a focused storytelling state.

## Motivation

The map already supported exploration and selection, but it lacked a second layer for understanding why a single world or mission matters. Focus Mode creates that shift without leaving the graph context.

## Scope

What is included and what is explicitly excluded.

### Included
- View-state transition from map to focus layer
- DOM overlay with hero node, orbiting lenses, and Back control
- Locally derived lens summaries and Stella follow-up prompts
- Guide panel event handling for scripted entry copy and lens asks
- Automated tests for lens derivation

### Excluded
- Second graph renderer or nested force layout
- Dataset schema rewrite
- Backend or persistence changes

## Implementation

### Files/Systems Touched
- `src/App.jsx` — owns focus-mode state, transition timing, and guide event dispatch
- `src/components/BrainMap.jsx` — suspends graph interaction outside map mode
- `src/components/GuidePanel.jsx` — consumes external guide events
- `src/components/FocusMode.jsx` — new overlay for the radial knowledge layer
- `src/utils/focus-lenses.js` — derives lens content and Stella prompts
- `src/utils/focus-lenses.test.js` — tests focus-lens generation
- `src/App.css` — adds focus-mode visuals and transitions

### Architecture Impact
The app now has an explicit presentation state machine for the map area and a DOM-based semantic zoom layer above the canvas graph.

### Contracts/Interfaces Changed
- `BrainMap` accepts `presentationMode`
- `GuidePanel` accepts `guideEvent` and `autoCommentEnabled`
- New `getFocusLenses(node, neighbors)` helper contract

### Data Model Changes
None. Lens content is derived from existing node and adjacency data.

### Environment/Config Changes
Added `vitest` and an `npm run test` script.

## Migration Steps

Run `npm install` to pick up `vitest`, then use `npm run test` alongside lint/build.

## Validation Performed

- Lint
- Production build
- Lens utility tests
- Manual review of focus transition, Back/Escape behavior, and lens-to-Stella handoff

## Follow-Up Tasks

- [ ] Consider lens-specific quick chips in the guide panel
- [ ] Consider pausing the background force simulation while focus is active
