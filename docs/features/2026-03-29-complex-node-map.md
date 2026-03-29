# Feature: Complex Node Map

## Metadata

| Field | Value |
|---|---|
| **Date** | 2026-03-29 |
| **Status** | shipped |
| **Author** | Codex |
| **PR/Commit** | not recorded |
| **ADR** | None |

## Summary

The Cosmos map now renders as a richer galactic network instead of a set of simple mission halos. Mission clusters keep more of their intended spiral structure, sibling exoplanets are connected by faint local meshes, and major mission hubs are tied together with atmospheric bridge currents behind the real graph.

## Motivation

The graph’s literal node-link data was correct, but the scene looked too sparse and mechanically uniform. The map needed more visible structure so the network felt like a living star atlas rather than a few isolated rings.

## Scope

### Included
- Stronger positional memory for the spiral layout
- Per-link orbit metrics so mission links do not collapse into uniform spokes
- Derived decorative scene structure for mission clusters and inter-mission bridges
- Canvas rendering updates for cluster rings, mesh links, and bridge currents
- Tests for the new scene derivation and link metric helpers

### Excluded
- New interactive nodes or fake data records
- Changes to the focus-mode panels or AI guide behavior
- Replacing the existing graph library

## Implementation

### Files/Systems Touched
- `src/components/BrainMap.jsx` — applies the richer force tuning and renders derived scene structure
- `src/utils/spiral-layout.js` — adds per-link orbit metrics and a stronger spiral force
- `src/utils/graph-scene.js` — derives mission clusters, sibling meshes, and bridge links
- `src/utils/render-helpers.js` — renders cluster rings, bridge currents, and mesh filaments on canvas
- `src/utils/graph-scene.test.js` — tests the new scene derivation and orbit metrics

### Architecture Impact

None. This stays inside the existing client-side canvas rendering model and adds a derived scene layer around the current data.

### Contracts/Interfaces Changed

- `assignLinkOrbitMetrics` was added to enrich real graph links with layout-aware distance and curvature metadata.
- `buildGraphSceneDetails` was added to derive decorative scene structure from the existing positioned nodes and links.

### Data Model Changes

None. The source node and link catalog stays the same.

### Environment/Config Changes

None.

## Migration Steps

No migration is required.

## Validation Performed

- `npm run test`
- `npm run lint`
- `npm run build`
- Manual browser verification was not performed in this session
