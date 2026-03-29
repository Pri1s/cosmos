## Problem statement

The current node map reads as a few simple mission hubs with circular exoplanet halos. Even though the data is correct, the scene does not feel layered or structurally rich enough, so the map looks sparse and mechanically uniform.

## Status

Completed on 2026-03-29.

## Goals and non-goals

- Goals:
  - Make the graph read as a richer stellar network without obscuring interaction.
  - Add visible structural complexity around mission clusters and between clusters.
  - Preserve the existing data model and click/hover behavior.
- Non-goals:
  - Adding fake interactive nodes.
  - Changing the AI guide or focus-mode panel behavior.
  - Replacing the force-graph library.

## Constraints

- Keep the graph performant on canvas.
- Decorative structure should remain deterministic so the scene feels intentional.
- The real mission/exoplanet nodes must remain visually dominant over decorative lines.

## Relevant files

- `src/components/BrainMap.jsx`
- `src/utils/render-helpers.js`
- `src/utils/spiral-layout.js`
- `src/data/graph-data.js`
- `src/utils/` new helper file(s)

## Proposed design

- Build a derived scene model from the existing graph data with per-mission clusters, faint local mesh links, and bridge currents between major hubs.
- Render those extra structures behind the real links/nodes so they increase visual density without changing pointer behavior.
- Strengthen the spiral layout/force tuning so clusters hold a more deliberate galactic composition instead of collapsing into simple rings.

## Interfaces/contracts

- Add a pure helper that derives decorative scene details from positioned graph nodes and links.
- Keep the public `BrainMap` component interface unchanged.

## Risks and edge cases

- Over-rendering can make the map noisy or muddy node readability.
- Extra canvas work can hurt performance if the scene helper emits too many decorative segments.
- Force tuning changes can accidentally make the graph less stable if the spiral pull is too strong.

## Validation plan

- Run `npm run test`.
- Run `npm run lint`.
- Run `npm run build`.
- Manually inspect the map in the browser for density/readability.

## Migration notes

No migration is expected.

## Validation performed

- `npm run test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser verification was not performed in this session.
