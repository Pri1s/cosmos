## Problem statement

In focus mode, the knowledge panel is docked to the page edge and the Stella panel still behaves like the normal application sidebar. That makes both panels feel attached to the layout instead of like floating exploration tools around the selected node.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Make the focus-mode knowledge panel and Stella panel appear as floating windows.
  - Allow both windows to be dragged and resized while in focus mode.
  - Remove the reserved sidebar feel during focus mode so the map can use the full viewport width.
- Non-goals:
  - Changing Stella prompts or lens content.
  - Adding persistence across reloads.
  - Reworking map-mode detail/search behavior.

## Constraints

- Keep the implementation inside the existing React and CSS architecture.
- Preserve existing focus-mode interactions and guide behavior.
- Constrain floating windows to the viewport so they cannot be dragged fully off-screen.

## Relevant files

- `src/App.jsx`
- `src/App.css`
- `src/components/FocusMode.jsx`
- `src/components/GuidePanel.jsx`
- `src/components/KnowledgePanel.jsx`
- `src/hooks/useFloatingPanel.js`
- `src/utils/floating-panels.js`
- `src/utils/floating-panels.test.js`

## Proposed design

- Introduce a small floating-panel utility layer that clamps panel rectangles within the viewport and handles move/resize math.
- Use a custom React hook to manage drag and resize pointer interactions for each panel.
- In focus mode, render the knowledge panel as a floating window and switch Stella from fixed sidebar layout to a floating window treatment.
- Keep map mode unchanged aside from releasing the reserved guide width while focus mode is active.

## Interfaces/contracts

- `GuidePanel` gains optional floating-panel props for style and drag/resize handlers.
- `KnowledgePanel` gains optional floating-panel props for style and drag/resize handlers.
- Existing app state and guide event contracts remain unchanged.

## Risks and edge cases

- Pointer handling could interfere with interactive controls if drag listeners are attached too broadly.
- Panel bounds must remain correct during viewport resize.
- Focus-mode entry/exit should not leave panels in invalid positions.

## Validation plan

- Run `npm test`.
- Run `npm run lint`.
- Run `npm run build`.
- Manually verify drag and resize behavior for both panels in focus mode.

## Validation performed

- `npm test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification not performed in this session.

## Migration notes

- None.
