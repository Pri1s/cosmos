# PLAN.md — Performance Optimization

## 1. Objective

Eliminate jank and lag when panning, zooming, dragging panels, clicking nodes, and interacting with the force-directed graph. The app should feel fluid at 60fps on modern hardware.

**Current state:** Users experience visible lag during pan/zoom, node selection, panel dragging, and general interaction.

**Desired end state:** Smooth 60fps interactions across all user gestures — panning, zooming, dragging panels, selecting nodes, hovering, and searching.

## 2. Scope

### In scope
- Canvas render loop optimizations (stars, nebulae, scene structure)
- Eliminating unnecessary React re-renders in App.jsx and child components
- Fixing DetailPanel 100ms polling loop
- Fixing useFloatingPanel resize listener churn
- Memoizing expensive per-frame computations (gradient creation, node maps)
- Adding viewport resize state management so App.jsx doesn't re-read `window.innerWidth` on every render
- Debouncing search input

### Out of scope / non-goals
- Visual design changes (colors, sizes, effects)
- Adding/removing features
- Changing the data model or graph-data.js
- Adding TypeScript, Tailwind, or new dependencies
- Refactoring the API/Stella integration (beyond debouncing auto-comments)
- Server-side rendering or build-time optimizations

## 3. Context and Current State

### Architecture
- React 19 + Vite SPA
- `react-force-graph-2d` wraps an HTML5 canvas with d3-force simulation
- ~30 nodes, ~40 links — small dataset, but rendering is heavy due to decorative effects
- Multiple floating panels (Guide, Knowledge, Voice, Journey) use custom `useFloatingPanel` hook
- `DetailPanel` follows the selected node on the canvas

### Key bottlenecks identified

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **No viewport state** — `window.innerWidth/Height` read on every render, making `appMetrics`/`focusMetrics` recompute every time | `App.jsx:139-142` | Every state change triggers full layout recalc + cascading child re-renders |
| 2 | **Per-frame gradient creation** — `drawSceneStructure` creates `createRadialGradient`/`createLinearGradient` and builds a `new Map()` every animation frame | `render-helpers.js:61-63, 102-167` | Direct FPS degradation |
| 3 | **Per-frame nebula gradients** — `drawNebulae` creates 5 radial gradients every frame | `render-helpers.js:35-59` | Unnecessary GPU work |
| 4 | **Per-frame star rendering** — 300 individual `arc()` calls with trig per frame, each with a unique `fillStyle` | `render-helpers.js:22-33` | 300 fill style changes + arc draws per frame |
| 5 | **DetailPanel 100ms polling** — `setInterval(updatePosition, 100)` polling for position updates | `DetailPanel.jsx:44` | Fires 10x/sec regardless of activity, causes unnecessary re-renders |
| 6 | **useFloatingPanel resize listener churn** — `rect` in dependency array causes listener re-attach on every drag frame | `useFloatingPanel.js:54-63` | Memory leak potential, wasted event listener overhead |
| 7 | **Inline `appMetrics` object** — new object identity every render, invalidating all `useMemo` that depends on it | `App.jsx:142` | Cascading re-renders of layout-dependent components |
| 8 | **Non-memoized hex→rgb conversions** — `hexToRgbObj` called per-node per-frame with same 2 colors | `render-helpers.js:344-361` | Minor but easy win |
| 9 | **Search runs on every keystroke** without debounce | `App.jsx:493-512` | Creates new Set + filters array on each keypress |
| 10 | **`onNodeHover` passed as `setHoveredNode`** — triggers App re-render on every mouse move over graph | `App.jsx:628` | Full App re-render on hover |

## 4. Requirements

### Functional requirements
- All existing visual effects (stars twinkling, nebulae, cluster halos, bridge links, mesh links) must remain visually identical
- All interactions (pan, zoom, node click, hover, search, panel drag/resize, focus mode transitions) must continue to work correctly
- DetailPanel must still follow the selected node during zoom/pan

### Non-functional requirements
- Canvas rendering at 60fps during pan/zoom on modern hardware (M1+ Mac, equivalent desktop)
- No visible stutter when dragging floating panels
- Node hover should not cause full component tree re-render
- Search input should feel responsive (debounce ≤ 150ms)

### Developer/operational requirements
- No new dependencies
- `npm run lint` and `npm run build` must pass
- Changes must be backward-compatible (no API changes to component props)

## 5. Assumptions

| Assumption | Risk if wrong | Verification |
|------------|---------------|-------------|
| `react-force-graph-2d` exposes `onZoom` callback prop | Would need alternative to polling; check docs/source | Check ForceGraph2D prop types |
| Canvas gradient creation is the dominant per-frame cost | Profiling may reveal other bottleneck | Measure with Chrome DevTools Performance tab before/after |
| ~30 nodes means node map creation is cheap but still wasteful per-frame | If dataset grows, this becomes critical | Profile `getNodeMap` call frequency |
| Pre-computing hex→rgb for the 2 known colors is safe since COLORS is a constant | If colors become dynamic, cache needs invalidation | COLORS object is module-level const |

## 6. Constraints and Invariants

**Mandatory:**
- No TypeScript, no Tailwind, no new dependencies
- Plain CSS only
- No class components
- Canvas rendering must remain in `onRenderFramePre`, `nodeCanvasObject`, `linkCanvasObject` callbacks (required by react-force-graph-2d)
- No changes to `src/data/graph-data.js`

**Preferred:**
- Minimize number of changed files to reduce review surface
- Keep diffs focused — don't refactor unrelated code

## 7. Edge Cases and Failure Modes

| Edge case | Expected behavior |
|-----------|-------------------|
| Rapid panel dragging while graph is animating | Both should remain smooth; panel drag uses pointer events, graph uses canvas — they shouldn't conflict |
| Window resize during focus mode transition | Layout should recalculate correctly after transition completes |
| Node hover during search filtering | Hover highlighting should still work on visible (non-dimmed) nodes |
| DetailPanel position after zoom changes | Should update on zoom events rather than polling; if `onZoom` is unavailable, fall back to `requestAnimationFrame` loop (not `setInterval`) |
| Stars/nebulae rendering at extreme zoom levels | Pre-rendered layers may need to scale; verify at min/max zoom |

## 8. Risks and Tradeoffs

| Risk/Tradeoff | Mitigation |
|----------------|------------|
| Off-screen canvas for stars/nebulae adds memory | The canvas is small (~2000x2000); memory cost is negligible |
| Caching gradients means they won't update if node positions change | Node positions DO change during simulation; cache must be rebuilt when nodes move. Solution: only cache static gradients (nebulae), recompute per-frame for dynamic scene structure but avoid Map recreation |
| `React.memo` on components may hide prop changes bugs | Only wrap components where profiling shows re-render cost; use stable references |
| Debouncing search delays results | 100-150ms debounce is imperceptible for typing |

## 9. Proposed Design

### 9.1 Add viewport state to App.jsx

Replace raw `window.innerWidth/Height` reads with a `useViewportSize` hook that updates on resize via `ResizeObserver` or debounced `resize` event. This makes `viewportWidth`/`viewportHeight` stable between resizes.

```
// Before (runs every render):
const viewportWidth = window.innerWidth
const viewportHeight = window.innerHeight

// After (stable between resizes):
const [viewportWidth, viewportHeight] = useViewportSize()
```

### 9.2 Memoize appMetrics and focusMetrics

Wrap both in `useMemo` with `[viewportWidth, viewportHeight]` dependencies. Since viewport size is now stable, these only recompute on actual resize.

### 9.3 Cache static canvas layers (stars + nebulae)

Create an off-screen canvas once, draw stars and nebulae onto it, then `drawImage()` that canvas in `onRenderFramePre` each frame. Stars still twinkle — redraw the off-screen canvas periodically (every ~100ms via a timer or frame counter) rather than every frame.

**Alternative considered:** Drawing stars/nebulae only once without twinkling. Rejected because twinkling is a visible design element.

**Chosen approach:** Draw to off-screen canvas, update twinkling every 3-5 frames rather than every frame. The visual difference at 60fps is imperceptible.

### 9.4 Cache nodeMap in render-helpers

Instead of `new Map()` every frame in `drawSceneStructure`, pass a pre-built `nodeMap` or cache it at module level keyed by the nodes array reference.

### 9.5 Pre-compute hex→rgb values

The COLORS object has exactly 2 entries. Pre-compute their RGB strings at module level:

```js
const COLORS_RGB = {
  exoplanet: '94, 196, 247',
  mission: '247, 110, 94',
}
```

Replace all `hexToRgb(color)` calls in hot paths with direct lookup.

### 9.6 Fix DetailPanel: replace polling with onZoom/rAF

- If `react-force-graph-2d` supports an `onZoom` prop, use it to trigger position updates
- Also use the `onEngineStop`/`onEngineTick` callback for simulation-driven updates
- Replace `setInterval(100)` with a zoom callback + engine tick approach
- Fall back to `requestAnimationFrame` if needed (still better than 100ms setInterval since it aligns with display refresh)

### 9.7 Fix useFloatingPanel resize listener

Remove `rect` from the resize handler's dependency array. Use a ref to access the current rect inside the handler:

```js
const rectRef = useRef(rect)
rectRef.current = rect

useEffect(() => {
  if (!enabled) return
  const handleResize = () => {
    setRect(clampPanelRect(rectRef.current, getBounds(padding), { width: minWidth, height: minHeight }))
  }
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [enabled, minHeight, minWidth, padding])
```

### 9.8 Throttle hover updates

Wrap `setHoveredNode` in a throttled callback (~16ms / frame-aligned) or use `requestAnimationFrame` gating to prevent re-renders on every mouse pixel move.

### 9.9 Debounce search input

Add a 120ms debounce to `handleSearch` in App.jsx. The SearchBar component should call the debounced version.

### 9.10 Reduce gradient creation in drawSceneStructure

For bridge links: gradients must be recomputed since endpoints move. But avoid creating the nodeMap every call — accept it as a parameter.

For cluster halos: the radial gradient center follows the mission node, so it must be recomputed. This is acceptable since there are only ~5 clusters.

Main optimization: eliminate `getNodeMap()` call per frame.

## 10. Files and Surfaces Likely to Change

| File | Change |
|------|--------|
| `src/App.jsx` | Add `useViewportSize` hook usage, memoize `appMetrics`/`focusMetrics`, debounce search, throttle hover, stabilize callback references |
| `src/hooks/useViewportSize.js` | **New file** — simple hook returning `[width, height]` on resize |
| `src/utils/render-helpers.js` | Cache star/nebula off-screen canvas, pre-compute RGB values, accept nodeMap parameter in `drawSceneStructure`, optimize `drawNode` color conversions |
| `src/components/BrainMap.jsx` | Build nodeMap once and pass to render callbacks, implement off-screen canvas for background layers, pass `onZoom` prop to ForceGraph2D |
| `src/components/DetailPanel.jsx` | Replace `setInterval` polling with zoom callback / rAF approach |
| `src/hooks/useFloatingPanel.js` | Fix resize listener dependency array using ref |
| `src/components/SearchBar.jsx` | May need minor changes to support debounced callback (or debounce at App level) |

## 11. Implementation Plan

### Phase 0: Recon and Baseline

**Purpose:** Establish a performance baseline before changes.

**Steps:**
1. Run `npm run dev` and open Chrome DevTools Performance tab
2. Record a 5-second trace of: panning the graph, hovering nodes, clicking a node, dragging a panel
3. Note the frame times and identify the top callers in the flame chart
4. Check `react-force-graph-2d` for available props: `onZoom`, `onZoomEnd`, `onEngineStop`, `onEngineTick`
5. Read ForceGraph2D source or docs to verify zoom callback availability

**Verify:** Baseline metrics recorded, available callback props identified.

---

### Milestone 1: Viewport state + memoized metrics

**Purpose:** Eliminate the root cause of cascading re-renders — every state change causing full layout recalculation.

**Changes:**
1. Create `src/hooks/useViewportSize.js`:
   - Returns `[width, height]`
   - Listens to `window resize` event with passive listener
   - Debounces updates by 100ms to avoid resize spam
2. In `App.jsx`:
   - Replace `window.innerWidth/Height` reads with `useViewportSize()`
   - Wrap `focusMetrics` in `useMemo([viewportWidth, viewportHeight])`
   - Wrap `appMetrics` in `useMemo([viewportWidth, viewportHeight, focusMetrics])`

**Dependencies:** None
**Risks:** Low — this is straightforward React optimization
**Verify:** Add a `console.count('App render')` temporarily and confirm re-renders drop significantly during hover/interaction. Remove before committing.

---

### Milestone 2: Canvas render loop optimization

**Purpose:** Reduce per-frame work in the canvas render callbacks.

**Changes:**
1. In `render-helpers.js`:
   - Add pre-computed `COLORS_RGB` lookup object alongside `COLORS`
   - Replace `hexToRgb`/`hexToRgbObj`/`withAlpha` calls in `drawNode` and `drawLink` with direct template literal usage of pre-computed RGB values
   - Modify `drawSceneStructure` to accept a `nodeMap` parameter instead of building one internally
   - Remove `getNodeMap` from being called inside `drawSceneStructure`

2. In `render-helpers.js` — off-screen canvas for stars:
   - Create module-level `_starsCanvas` and `_starsCtx`
   - `drawStars` redraws the off-screen canvas every N frames (use a frame counter, redraw every 4 frames)
   - Main `drawStars` call just does `ctx.drawImage(_starsCanvas, ...)` on non-redraw frames
   - Nebulae: similarly pre-render to an off-screen canvas (nebulae are fully static — never need redraw)

3. In `BrainMap.jsx`:
   - Build `nodeMap` once via `useMemo` from `graphData.nodes`
   - Pass `nodeMap` into `onRenderFramePre` → `drawSceneStructure`

**Dependencies:** None (can be done in parallel with Milestone 1)
**Risks:** Visual regression if off-screen canvas coordinates don't align with graph transform. Test by panning to edges.
**Verify:** Visually confirm stars still twinkle, nebulae still visible, cluster halos render correctly. Check DevTools Performance — `onRenderFramePre` should show reduced time.

---

### Milestone 3: Fix DetailPanel polling

**Purpose:** Replace the 100ms setInterval with event-driven position updates.

**Changes:**
1. In `BrainMap.jsx`:
   - Add `onZoom` prop to `ForceGraph2D` that fires a callback
   - Pass a new `onZoomChange` prop from App or use a ref-based approach

2. In `DetailPanel.jsx`:
   - Remove `setInterval(updatePosition, 100)`
   - Accept an `onZoom` registration mechanism (simplest: use `requestAnimationFrame` loop that only runs while the panel is mounted, which aligns with display refresh and is self-throttling)
   - Alternative: accept a `zoomTick` counter prop from BrainMap that increments on zoom, triggering a useEffect

**Chosen approach:** Use `requestAnimationFrame` loop instead of `setInterval`. This is simpler than prop-drilling zoom events and naturally aligns with display refresh rate. The rAF loop only runs while DetailPanel is mounted.

**Dependencies:** None
**Risks:** Position update timing changes slightly — test that panel doesn't visibly lag behind node during rapid zoom
**Verify:** Open DevTools, verify no `setInterval` timers running when DetailPanel is open. Pan/zoom and confirm panel follows node smoothly.

---

### Milestone 4: Fix useFloatingPanel + throttle hover

**Purpose:** Eliminate resize listener churn and reduce hover-triggered re-renders.

**Changes:**
1. In `useFloatingPanel.js`:
   - Add `const rectRef = useRef(rect); rectRef.current = rect`
   - Change resize handler to use `rectRef.current` instead of `rect`
   - Remove `rect` from the effect's dependency array

2. In `App.jsx`:
   - Wrap `setHoveredNode` usage in a rAF-gated callback:
     ```js
     const hoveredNodeRef = useRef(null)
     const hoverRafRef = useRef(null)
     const handleNodeHover = useCallback((node) => {
       hoveredNodeRef.current = node
       if (!hoverRafRef.current) {
         hoverRafRef.current = requestAnimationFrame(() => {
           hoverRafRef.current = null
           setHoveredNode(hoveredNodeRef.current)
         })
       }
     }, [])
     ```

3. In `App.jsx`:
   - Debounce `handleSearch` with a 120ms delay (implement inline with `setTimeout`/`useRef` — no new dependency needed)

**Dependencies:** None
**Risks:** Low. Hover might feel 1 frame delayed — imperceptible.
**Verify:** Drag a panel, confirm no event listener accumulation in DevTools. Hover over nodes rapidly, confirm no jank. Type in search, confirm results appear after brief delay.

---

### Milestone 5: Final verification and cleanup

**Purpose:** Confirm all optimizations work together, no regressions.

**Steps:**
1. Run `npm run lint` — fix any issues
2. Run `npm run build` — must succeed
3. Full interaction test: pan, zoom, hover, click node, open DetailPanel, drag Guide panel, search, enter/exit focus mode, start journey
4. Record a new Performance trace and compare to Phase 0 baseline
5. Remove any temporary console.count/log statements
6. Visually verify all effects render correctly

**Verify:** Lint passes, build succeeds, all interactions are smooth, no visual regressions.

---

### Execution model
All milestones executed by single agent, single branch. The changes are tightly coupled (e.g., Milestone 2 changes BrainMap.jsx which Milestone 3 also touches). Sequential execution prevents conflicts.

## 12. Validation Plan

### Automated tests
- `npm run lint` — passes
- `npm run build` — no errors or warnings

### Manual tests
| Test | Steps | Success criteria |
|------|-------|------------------|
| Pan smoothness | Click-drag the graph background | No visible stutter, smooth movement |
| Zoom smoothness | Mouse wheel zoom in/out | No frame drops |
| Node hover | Move mouse across nodes | Highlight appears/disappears without lag |
| Node click → DetailPanel | Click a node | Panel appears at correct position, follows during zoom |
| Panel drag | Drag Guide panel | Panel follows mouse without jank |
| Window resize | Resize browser window | Layout adapts without freezing |
| Search | Type in search bar | Results appear within ~150ms, no input lag |
| Focus mode transition | Click node to enter focus mode | Smooth zoom + transition |
| Journey panel | Start a journey, navigate | All journey interactions work |
| Star twinkling | Observe background | Stars still twinkle (may be slightly less frequent — acceptable) |
| Nebulae | Pan around graph | Nebulae halos visible |
| Cluster halos | Zoom into a mission cluster | Orbital rings and halo visible |

### Regression checks
- All visual effects present and correct
- All panel interactions functional
- Keyboard shortcuts (Escape) still work
- Auto-comments on node selection still trigger

## 13. Acceptance Criteria

- [ ] `npm run lint` passes with no new warnings
- [ ] `npm run build` succeeds
- [ ] No `setInterval` in DetailPanel.jsx
- [ ] `window.innerWidth/Height` not read directly in App component body (moved to hook)
- [ ] `appMetrics` and `focusMetrics` wrapped in `useMemo`
- [ ] `useFloatingPanel` resize listener does not re-attach on every rect change
- [ ] Star/nebula drawing uses off-screen canvas caching
- [ ] `drawSceneStructure` does not create a new `Map` every frame
- [ ] Node hover is throttled via rAF
- [ ] Search input is debounced
- [ ] All visual effects render correctly (stars, nebulae, halos, bridges, mesh links)
- [ ] Pan/zoom feels smooth at 60fps on dev machine

## 14. Rollout / Migration / Rollback

Not applicable — this is a client-side optimization with no data changes, API changes, or server-side impact. All changes are internal implementation details. Rollback is a simple `git revert`.

## 15. Open Questions

| Question | Why it matters | Default if unanswered |
|----------|---------------|----------------------|
| Does `react-force-graph-2d` ForceGraph2D accept an `onZoom` or `onZoomEnd` prop? | Determines best approach for DetailPanel position updates | Use `requestAnimationFrame` loop instead (already chosen as primary approach) |
| Should star twinkling frequency reduction (every 4 frames vs every frame) be noticeable? | Could affect visual quality perception | 4-frame interval at 60fps = ~15Hz update rate, still smooth for subtle twinkling. Adjust if needed. |

## 16. Definition of Done

- [ ] All files listed in Section 10 updated as described
- [ ] No unrelated changes in diff
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] All manual tests in Section 12 pass
- [ ] All acceptance criteria in Section 13 met
- [ ] Feature artifact created in `docs/features/`
- [ ] No `console.log` left in code

## 17. Execution Strategy

### 17.1 Execution model
**Single-agent, single-branch execution.** Justified because:
- All changes are tightly coupled (same files touched across milestones)
- Sequential execution prevents merge conflicts
- Total scope is ~7 files — not large enough to benefit from parallelism
- Risk of overlapping edits (especially `App.jsx`, `BrainMap.jsx`, `render-helpers.js`) is high

### 17.2–17.7
Not applicable — single-agent execution, no subagents, no worktrees, no parallel branches needed.

### 17.8 Default rule
Simplest execution model chosen. The work is sequential, tightly coupled, and manageable by a single agent.
