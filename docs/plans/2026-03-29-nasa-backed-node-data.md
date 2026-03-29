# NASA-Backed Node Data

Status: completed on 2026-03-29 with a 200-node NASA-backed graph cap, revised from the initial 100-node pass on 2026-03-29.

## Problem statement

The current implementation still only renders a tiny curated exoplanet set. Even if those facts are refreshed from NASA, the map still feels like a prototype because the node population is capped by hand rather than drawn from the archive.

The revised user request is explicit: populate the map with real NASA-backed nodes, then expand the initial pass by another 100 nodes while keeping the graph capped and readable.

## Goals and non-goals

### Goals
- Populate the graph with up to 200 total nodes using NASA Exoplanet Archive data.
- Keep the existing mission hubs and UI-facing node contract intact.
- Add a reproducible repo-local sync step so the dataset can be refreshed later.
- Add automated coverage for the data mapping logic.
- Keep Stella prompt construction workable with a much larger catalog.

### Non-goals
- Import the full NASA dataset into the live graph with no cap.
- Rework the force-graph layout or curation strategy.
- Add a backend, database, or runtime NASA fetch path.
- Replace the existing mission prose or redesign the panels.

## Constraints

- Core graph data should remain static and checked into the repo.
- The app must continue to work offline after data has been synced into source files.
- Existing consumers expect the current node shape and field names.
- The repository already has unrelated local changes, so this diff must stay tightly scoped.
- The graph layout has to stay readable when the node count jumps by an order of magnitude.

## Relevant files

- `src/data/graph-data.js`
- `src/data/`
- `src/api/stella.js`
- `src/utils/spiral-layout.js`
- `src/utils/focus-lenses.js`
- `src/utils/focus-lenses.test.js`
- `package.json`
- `README.md`

## Proposed design

- Keep the curated mission nodes and mission source filters, but replace the curated exoplanet list with generated exoplanet nodes from NASA.
- Add a Node-based sync script that queries the NASA Exoplanet Archive TAP endpoint per mission source, ranks records by data completeness, and selects up to 193 exoplanets so the graph stays under 200 total nodes once the 7 mission nodes are included.
- Generate mission-to-planet links from the mission source queries instead of hand-maintaining a planet list.
- Normalize the API response into the app's existing node shape:
  - `hostname` -> `hostStar`
  - `disc_year` -> `discoveryYear`
  - `discoverymethod` -> `method`
  - `pl_bmasse` -> `mass`
  - `pl_rade` -> `radius`
  - `pl_orbper` -> `orbitalPeriod`
  - `pl_eqt` -> `temperature`
  - `sy_dist` (parsecs) -> `distance` in light-years
- Generate a short data-derived note for each exoplanet so the panels do not show stale handcrafted placeholder copy.
- Update the spiral placement logic and Stella context building to behave sensibly with a much larger catalog.

## Interfaces/contracts

- Exoplanet nodes must continue to expose `id`, `type`, `name`, `hostStar`, `discoveryYear`, `method`, `mass`, `radius`, `orbitalPeriod`, `temperature`, `distance`, and `habitability`.
- `graph-data.js` must continue to export `nodes`, `links`, `getNeighborIds`, and `graphData`.
- The sync command should fail loudly if it cannot populate the capped dataset.

## Risks and edge cases

- Mission-source filters overlap in a few cases, so selection and linking must deduplicate planets correctly.
- `sy_dist` is reported in parsecs, while the UI expects light-years.
- Some planets have null values for mass, radius, or equilibrium temperature; the generated data must preserve `null` without breaking the panels or lens copy.
- A naive prompt dump of hundreds of planets would overwhelm Stella's context window.
- A naive placement strategy will produce unreadable clusters around the largest mission hubs.

## Validation plan

- `npm run test`
- `npm run lint`
- `npm run build`
- Manual spot-check of several nodes to confirm values render correctly in search, detail view, and focus mode.
- Confirm the generated graph stays at or below 200 total nodes.

## Validation performed

- `npm run sync:nasa-data` passed and regenerated the checked-in NASA dataset.
- Confirmed the assembled graph now contains exactly 200 total nodes: 7 missions and 193 exoplanets.
- `npm run test` passed.
- `npm run lint` passed.
- `npm run build` passed.

## Migration notes

- Existing imports from `src/data/graph-data.js` remain unchanged.
- Future data refreshes should use the sync command instead of hand-editing exoplanet fields.
