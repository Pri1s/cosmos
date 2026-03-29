# Feature: Focus Render Panel

## Metadata

| Field | Value |
|---|---|
| **Date** | 2026-03-29 |
| **Status** | shipped |
| **Author** | Codex |
| **PR/Commit** | uncommitted |
| **ADR** | None |

## Summary

Turned the focus-mode scene into a real center render panel and updated the surrounding floating-panel layout to arrange Stella and the Lens Explorer around that panel instead of around an invisible protected zone, while also protecting the `Back to Map` control and tightening the lens layout inside the render surface.

## Motivation

The earlier overlap fixes still relied on approximate geometry for the center scene. Making the render a first-class panel makes the arrangement logic concrete and easier to evolve, while also giving the focus view a clearer surface hierarchy.

## Scope

What is included and what is explicitly excluded.

### Included
- Real center render panel surface in focus mode
- Render-panel-aware layout math for Stella and the Lens Explorer
- `Back to Map` keep-out zone for floating panels
- Panel-local positioning for the focus hero and lens ring
- Panel-safe lens slots that avoid the hero card
- Regression tests for the render-panel layout helper

### Excluded
- Dragging or resizing the center render panel
- Changes to lens content or Stella prompts
- Map-mode layout changes

## Implementation

### Files/Systems Touched
- `src/App.jsx` — consumes the new focus layout result and passes the render rect into focus mode
- `src/components/FocusMode.jsx` — renders the hero and lens ring inside a real center panel
- `src/App.css` — adds the render-panel surface and panel-local focus styles
- `src/utils/focus-panel-layout.js` — returns `renderRect`, arranges the side panels around it, and protects the top-left control zone
- `src/utils/focus-panel-layout.test.js` — covers split and stacked focus-layout cases

### Architecture Impact
Focus mode now has three coordinated surfaces: a center render panel plus two floating side panels. Layout decisions are based on real panel rectangles instead of an inferred safe zone.

### Contracts/Interfaces Changed
- `getFocusPanelLayout(width, height, guideRect, knowledgeRect)` now returns `renderRect`
- `FocusMode` accepts `renderRect`

### Data Model Changes
None.

### Environment/Config Changes
None.

## Migration Steps

None.

## Validation Performed

- `npm run test`
- `npm run lint`
- `npm run build`
- Manual browser verification not performed in this session

## Follow-Up Tasks

- [ ] Consider making the render panel draggable if the panel system expands further
- [ ] Consider panel-aware lens spacing for very small viewports
