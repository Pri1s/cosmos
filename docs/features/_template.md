# Feature: [Title]

## Metadata

| Field | Value |
|---|---|
| **Date** | YYYY-MM-DD |
| **Status** | shipped / in-progress / reverted |
| **Author** | name or agent |
| **PR/Commit** | link or hash if available |
| **ADR** | link to related ADR if applicable |

## Summary

One-paragraph description of what was built and why it matters.

## Motivation

Why this feature exists. What problem it solves or what opportunity it captures.

## Scope

What is included and what is explicitly excluded.

### Included
- ...

### Excluded
- ...

## Implementation

### Files/Systems Touched
- `src/components/Foo.jsx` — added X
- `src/data/graph-data.js` — added Y nodes

### Architecture Impact
Describe any changes to data flow, component hierarchy, or system boundaries. Write "None" if the feature follows existing patterns.

### Contracts/Interfaces Changed
New or modified props, data shapes, API endpoints, or function signatures.

### Data Model Changes
Changes to node/edge data structure, new fields, removed fields.

### Environment/Config Changes
New env vars, build flags, or external service requirements.

## Migration Steps

Steps needed to adopt this change (if any). Include commands to run, env vars to set, or data to update.

## Validation Performed

- What was tested and how
- Specific scenarios verified
- Known limitations

## Follow-Up Tasks

- [ ] Any remaining work or known improvements
