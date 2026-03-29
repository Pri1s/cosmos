# ADR-001: Focus Mode Semantic Zoom

## Status

accepted

## Date

2026-03-28

## Context

Cosmos originally treated node selection as a map highlight plus a floating detail panel. The new Focus Mode feature needs a deeper, centered knowledge view while preserving the force-directed graph and the existing guide panel. The repo also requires tests for non-trivial logic, but had no test runner configured.

## Decision

Implement Focus Mode as a DOM overlay layered above the existing graph canvas, controlled by an explicit view-state machine in `App`. Derive lens content locally from node fields and graph neighbors. Add `vitest` for automated coverage of the pure lens-generation logic.

## Consequences

### Positive
- Keeps the force graph mounted and visually present during focus transitions.
- Avoids the complexity of a second graph renderer or nested force simulation.
- Makes lens logic testable and deterministic.

### Negative
- Adds more presentation state to `App`.
- Introduces a new dev dependency for testing.

### Neutral
- The detail panel remains part of the app, but only in map mode.

## Alternatives Considered

### Alternative 1: Second force graph for Focus Mode
- Description: Build a separate graph instance for the radial layer.
- Why it was rejected: Too much duplicated rendering and transition complexity for a fixed 4-6 lens layout.

### Alternative 2: API-generated lens content
- Description: Ask Stella to generate focus summaries on demand.
- Why it was rejected: Adds latency and weakens consistency for the primary interaction.
