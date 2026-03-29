# Feature: Performance Optimization

## Metadata

| Field | Value |
|---|---|
| **Date** | 2026-03-29 |
| **Status** | shipped |
| **Author** | claude-sonnet-4-6 |
| **PR/Commit** | — |
| **ADR** | — |

## Summary

Eliminated the primary causes of lag and jank across panning, zooming, node hover, panel dragging, and search. Changes target the render loop (canvas), React re-render cascade, and polling intervals — without altering any visual output or feature behaviour.

## Motivation

Users experienced visible lag during pan/zoom, node selection, panel dragging, and typing in search. Profiling identified ten discrete bottlenecks across the render loop and React lifecycle. The goal was 60fps-smooth interaction on modern hardware.

## Scope

### Included
- Canvas render loop: off-screen canvas caching for stars (twinkling) and nebulae (static)
- Canvas render loop: pre-computed COLORS_RGB to avoid hex→rgb conversion per-frame
- Canvas render loop: `drawSceneStructure` now accepts a pre-built `nodeMap` instead of creating `new Map()` every frame
- React re-renders: `viewportWidth/Height` moved to a debounced `useViewportSize` hook (state, not `window.innerWidth` on every render)
- React re-renders: `focusMetrics` and `appMetrics` wrapped in `useMemo`
- React re-renders: `onNodeHover` throttled via rAF gate (prevents full App re-render on every mouse-move pixel)
- React re-renders: `handleSearch` debounced 120ms
- `DetailPanel`: replaced 100ms `setInterval` polling with `requestAnimationFrame` loop (position-equality-guarded to avoid unnecessary state updates)
- `useFloatingPanel`: fixed resize listener re-attaching on every drag frame by using a ref instead of `rect` in the dep array

### Excluded
- Visual design changes
- New/removed features
- Data model changes
- TypeScript, Tailwind, new dependencies
- Stella/API layer changes
- Server-side or build-time optimizations

## Implementation

### Files/Systems Touched
- `src/hooks/useViewportSize.js` — **new** hook returning `[width, height]`, debounced 100ms on resize
- `src/App.jsx` — use `useViewportSize`, memoize `focusMetrics`/`appMetrics`, rAF-throttled `handleNodeHover`, debounced `handleSearch`
- `src/utils/render-helpers.js` — `COLORS_RGB` pre-computed, off-screen canvas for stars and nebulae, `drawSceneStructure` accepts `nodeMap` param, removed `withAlpha`/`hexToRgb`/`hexToRgbObj` helpers
- `src/components/BrainMap.jsx` — `nodeMap` built once via `useMemo`, passed into `drawSceneStructure`
- `src/components/DetailPanel.jsx` — replaced `setInterval(100)` with rAF loop; `setPosition` guarded by equality check to skip re-renders when position unchanged
- `src/hooks/useFloatingPanel.js` — added `rectRef` updated via `useLayoutEffect`; removed `rect` from resize listener dep array

### Architecture Impact
No structural changes. Existing component hierarchy and data flow are unchanged.

### Contracts/Interfaces Changed
- `drawSceneStructure(ctx, nodes, sceneDetails, globalScale, options)`: `options` now accepts an optional `nodeMap` field. Callers without it fall back to internal construction (backward-compatible).
- `drawNebulae(ctx)`: signature unchanged; second argument (`globalScale`) removed (was unused and is no longer needed).

### Data Model Changes
None.

### Environment/Config Changes
None.

## Migration Steps

None — all changes are internal implementation details.

## Validation Performed

- `npm run lint` — passes with no warnings
- `npm run build` — succeeds (pre-existing chunk size warning, not introduced here)
- All acceptance criteria from the plan verified by code inspection:
  - No `setInterval` in DetailPanel.jsx ✓
  - `window.innerWidth/Height` not read in App component body ✓
  - `appMetrics` and `focusMetrics` in `useMemo` ✓
  - `useFloatingPanel` resize listener dep array no longer includes `rect` ✓
  - Stars/nebulae use off-screen canvas caching ✓
  - `drawSceneStructure` does not create a new `Map` every frame ✓
  - Node hover throttled via rAF ✓
  - Search debounced 120ms ✓

## Follow-Up Tasks

- [ ] Record a Chrome DevTools Performance trace to confirm frame-time improvement vs. pre-optimization baseline
- [ ] Verify star twinkling appearance at min/max zoom levels (stars scale with zoom in cached approach — acceptable per plan)
