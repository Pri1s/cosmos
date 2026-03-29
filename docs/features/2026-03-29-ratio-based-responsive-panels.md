# Feature: Ratio-Based Responsive Panels

## Metadata

| Field | Value |
|---|---|
| **Date** | 2026-03-29 |
| **Status** | shipped |
| **Author** | Codex |
| **PR/Commit** | not recorded |
| **ADR** | None |

## Summary

Cosmos now scales its floating panel geometry and key panel typography from viewport ratios instead of relying on fixed pixel sizing. Focus-mode layout, panel minimum sizes, initial panel presets, and major panel text/spacing now scale together, and the right-hand focus stack now balances panel heights so the Stella voice card does not start in an undersized, clipped state.

## Motivation

The app’s focus-mode UI had accumulated several fixed dimensions that worked at one design size but produced crowding and overflow on smaller or narrower viewports. A shared ratio-based sizing system fixes that by making the containers and their internals respond to the same viewport scale.

## Scope

What is included and what is explicitly excluded.

### Included
- Shared viewport scaling helpers for responsive panel sizing
- Responsive focus-mode layout metrics and minimum sizes
- Responsive initial panel presets in the app shell
- Clamp-based scaling for key panel typography, spacing, and radii
- Tests for the new responsive sizing helpers and updated focus layout behavior

### Excluded
- A separate mobile-specific layout
- Changes to core application behavior outside sizing and layout
- New backend or API requirements

## Implementation

### Files/Systems Touched
- `src/utils/responsive-scale.js` — added shared viewport scaling helpers
- `src/utils/responsive-scale.test.js` — added tests for responsive scaling
- `src/utils/focus-panel-layout.js` — converted focus-mode geometry to responsive metrics
- `src/utils/focus-panel-layout.test.js` — updated focus-layout expectations for responsive sizing
- `src/App.jsx` — switched floating panel presets and map spacing to responsive values
- `src/App.css` — converted key panel text, spacing, and radii to clamp-based responsive tokens, including compact short-height behavior for the voice panel

### Architecture Impact

None. This follows the existing client-side layout architecture and adds a shared scaling utility rather than changing application structure.

### Contracts/Interfaces Changed

- `getResponsiveFocusMetrics` was added as a public utility for focus-mode sizing.
- `getFocusBackButtonRect` now accepts optional viewport dimensions for responsive safe-area calculations.

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

- [ ] Manually verify the panel scaling across a few real browser viewport sizes and adjust clamps if any panel still feels too dense
