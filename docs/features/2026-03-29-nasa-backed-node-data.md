# Feature: NASA-Backed Node Data

## Metadata

| Field | Value |
|---|---|
| **Date** | 2026-03-29 |
| **Status** | shipped |
| **Author** | Codex |
| **PR/Commit** | n/a |
| **ADR** | None |

## Summary

Replaced the tiny handpicked exoplanet demo set with a reproducible NASA-backed graph capped at 200 total nodes, while keeping the mission hubs, static delivery model, and no-backend architecture intact.

## Motivation

The graph was carrying factual planet fields directly in source, which made the data easy to drift and hard to refresh. This change makes the data provenance explicit and gives the repo a repeatable way to update node facts from NASA without turning the app into a runtime data client.

## Scope

What is included and what is explicitly excluded.

### Included
- Shared curated catalog for mission hubs and mission source filters
- NASA sync script that pulls mission discovery counts and generates up to 193 exoplanet nodes from the archive
- Generated checked-in data module with exoplanet nodes and mission-to-planet links
- Data-derived exoplanet panel notes to replace stale handcrafted filler copy
- Tests for the NASA mapping, budget allocation, selection, and assembled graph data
- README command and architecture updates

### Excluded
- Full-catalog ingestion from NASA into the live graph
- Runtime API fetching in the browser
- Auto-generation of the graph link topology
- Mission prose rewrites or UI redesign

## Implementation

### Files/Systems Touched
- `src/data/node-catalog.js` — defined mission hubs, mission source filters, and the 200-node cap
- `src/data/nasa-sync.js` — added query, ranking, budget allocation, mapping, and serialization helpers
- `src/data/sync-nasa-data.js` — added the repo-local NASA sync command that generates the capped dataset
- `src/data/generated-nasa-data.js` — checked in generated NASA-backed exoplanet nodes, links, and mission discovery counts
- `src/data/graph-data.js` — rebuilt exported graph data from curated missions plus generated NASA nodes
- `src/utils/spiral-layout.js` — updated spiral placement so dense mission clusters stay readable
- `src/api/stella.js` — capped comparison context so Stella stays usable with a much larger catalog
- `src/data/nasa-sync.test.js` — added automated coverage for the sync helpers and assembled dataset
- `src/api/stella.test.js` — updated Stella tests for the capped comparison shortlist
- `README.md` — documented the new sync command and 200-node architecture

### Architecture Impact

The app still ships static graph data, but it now renders a generated NASA-backed exoplanet catalog rather than a tiny handcrafted list. Mission hubs remain curated, and the sync step owns exoplanet node generation plus mission-to-planet link generation.

### Contracts/Interfaces Changed

No consumer-facing data contract changed. `graph-data.js` still exports the same `nodes`, `links`, `getNeighborIds`, and `graphData` interfaces.

### Data Model Changes

No consumer-facing field names changed. The main structural change is that `generated-nasa-data.js` now exports a generated `nasaExoplanetNodes` array and `nasaLinks`, and mission `discoveryCount` values are synced from NASA archive queries.

### Environment/Config Changes

Added `npm run sync:nasa-data` as a repo-local maintenance command. No new environment variables were introduced.

## Migration Steps

Run `npm run sync:nasa-data` whenever the capped NASA-backed graph needs to be refreshed from the archive.

## Validation Performed

- Ran `npm run sync:nasa-data` to generate the checked-in NASA dataset
- Confirmed the assembled graph contains exactly 200 total nodes: 7 missions and 193 exoplanets
- Ran `npx vitest run src/data/nasa-sync.test.js src/utils/focus-lenses.test.js`
- Ran `npx eslint src/data/graph-data.js src/data/generated-nasa-data.js src/data/nasa-sync.js src/data/nasa-sync.test.js src/data/node-catalog.js src/data/sync-nasa-data.js src/utils/spiral-layout.js src/api/stella.js src/utils/focus-lenses.test.js`
- Ran `npm run test`
- Ran `npm run lint`
- Ran `npm run build`

## Follow-Up Tasks

- [ ] Decide whether the 200-node cap should become user-configurable or remain fixed
- [ ] Decide whether mission status/method metadata should also move to a NASA-backed source
