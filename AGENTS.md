# AGENTS.md — Coding Agent Instructions for Cosmos

> For Codex, Copilot Workspace, and similar coding agents.
> Claude-specific instructions live in CLAUDE.md.

---

## Project Summary

**Cosmos** is a React 19 + Vite single-page application that visualizes NASA exoplanet and mission data as a force-directed graph, paired with an AI guide (Stella) powered by the Google Gemini API. Dark space theme, canvas-based rendering, no backend.

**Stack:** React 19, Vite 8, react-force-graph-2d, d3-force, Google Gemini API, plain CSS, Google Fonts (Instrument Serif, DM Mono).

---

## Repository Structure

```
cosmos/
├── index.html              # Entry point — fonts, favicon, root div
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── eslint.config.js        # ESLint flat config
├── PRD.md                  # Product requirements (read-only reference)
├── REACT-BITS.md           # UI component library reference
├── AGENTS.md               # This file — agent instructions
├── CLAUDE.md               # Claude Code instructions
├── src/
│   ├── main.jsx            # React entry point
│   ├── App.jsx             # Root component, layout
│   ├── App.css             # Global styles
│   ├── components/         # React components
│   │   ├── BrainMap.jsx    # Force-directed graph canvas
│   │   ├── SearchBar.jsx   # Search with keyboard shortcuts
│   │   └── DetailPanel.jsx # Node detail overlay
│   ├── data/               # Static data (curated, not fetched)
│   │   └── graph-data.js   # Nodes and edges dataset
│   └── utils/              # Pure helper functions
│       ├── spiral-layout.js
│       └── render-helpers.js
├── docs/
│   ├── architecture/
│   │   └── adr/            # Architecture Decision Records
│   ├── features/           # Feature artifact files
│   ├── plans/              # Specs/plans for in-progress work
│   ├── runbooks/           # Operational/debug procedures
│   └── reference/          # API docs, external references
└── dist/                   # Build output (gitignored)
```

### Where things go

| Type of code | Location | Notes |
|---|---|---|
| React components | `src/components/` | One component per file, PascalCase filenames |
| Page/layout components | `src/App.jsx` or `src/layouts/` | Create `layouts/` only if >1 layout needed |
| Reusable UI primitives | `src/components/ui/` | For React Bits components or shared UI atoms |
| Static/curated data | `src/data/` | JSON-like JS exports, no runtime fetches for core data |
| Pure utility functions | `src/utils/` | No React imports, no side effects |
| Hooks | `src/hooks/` | Custom React hooks, `use` prefix |
| API integration | `src/api/` or `src/services/` | Gemini API calls, message formatting |
| Styles | Co-located `.css` files or `src/App.css` | No CSS modules yet; plain CSS |
| Tests | `src/__tests__/` or co-located `*.test.jsx` | Mirror source structure |
| Feature docs | `docs/features/` | One file per shipped feature |
| Architecture decisions | `docs/architecture/adr/` | Numbered ADR files |
| Work-in-progress specs | `docs/plans/` | Delete or archive after completion |

### Do NOT

- Put component logic in `utils/` — if it uses React, it belongs in `components/` or `hooks/`.
- Put API keys or secrets in source files — use environment variables (`VITE_*` prefix for client-side).
- Add files to the project root unless they are config files or top-level docs.
- Create new top-level directories without an ADR.
- Put generated or build artifacts in `src/`.
- Modify `PRD.md` — it is a read-only reference document.

---

## Commands

```bash
npm run dev       # Start dev server (Vite, port 5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint check
```

---

## Development Workflow

### 1. Plan before coding (non-trivial work)

For any feature, refactor, or non-trivial bugfix, write a plan before implementing. Create a file in `docs/plans/` with:

- **Problem statement** — what is broken or missing
- **Goals and non-goals** — what you will and will not do
- **Constraints** — tech, time, compatibility limits
- **Relevant files** — what you will read and modify
- **Proposed design** — how it will work
- **Interfaces/contracts** — props, data shapes, API changes
- **Risks and edge cases** — what could go wrong
- **Validation plan** — how you will verify it works
- **Migration notes** — if changing existing behavior

**When you can skip a full plan:** One-liner fixes, typo corrections, dependency bumps, lint fixes, adding a single test. If in doubt, write the plan.

**Challenge unclear requirements.** If something in the PRD or a request is ambiguous, note the ambiguity and state your interpretation before coding.

### 2. Implement with discipline

- Keep diffs scoped to the task. Do not refactor unrelated code.
- Prefer small, composable functions and components.
- Use explicit prop types or JSDoc for component interfaces.
- Handle errors explicitly — no silent catches.
- Add logging at integration boundaries (API calls, data transforms).
- Avoid premature abstraction: three similar lines > one premature helper.
- Avoid giant files: if a component exceeds ~250 lines, consider splitting.
- No dead code, no commented-out code, no stale TODOs without context.

### 3. Validate before claiming done

- Run `npm run lint` and fix all errors.
- Run `npm run build` and confirm no build errors.
- Test the change manually or describe exactly what you tested.
- For UI changes: confirm the change renders correctly in the browser.
- For data changes: confirm graph nodes/edges update as expected.
- For API integration: confirm request/response cycle works.
- **Name what validation you performed.** Do not say "done" without specifics.

### 4. Update documentation

After completing work:
- Create or update a feature artifact in `docs/features/` (see template below).
- Create an ADR in `docs/architecture/adr/` if you made an architecturally significant decision.
- Update `README.md` if setup, commands, env vars, or architecture changed.
- Update the plan in `docs/plans/` or delete it if work is complete.

---

## Definition of Done

A task is complete when ALL of these are true:

- [ ] Code implemented and working
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Tests added or updated for non-trivial logic
- [ ] Feature artifact created/updated in `docs/features/`
- [ ] ADR created if architecturally significant
- [ ] README updated if user-facing setup/commands changed
- [ ] Plan updated or removed from `docs/plans/`
- [ ] No unrelated files changed
- [ ] No dead code or unexplained TODOs introduced

---

## Engineering Quality Standards

### Performance
- Minimize re-renders: use `React.memo`, `useCallback`, `useMemo` where measurable.
- Do not create objects/arrays in render that could be stable references.
- Canvas rendering (BrainMap) is performance-critical — profile before adding effects.
- Lazy-load heavy components (`React.lazy` + `Suspense`).

### API Integration
- Gemini API calls go through a single service module, not scattered in components.
- Never send API requests on every render or keystroke — debounce.
- Include conversation context efficiently; do not send the entire chat history if truncation is possible.
- Handle rate limits and errors with user-visible feedback.

### Observability
- Log API errors with enough context to debug (status, endpoint, truncated body).
- Use `console.warn` for recoverable issues, `console.error` for failures.
- Never swallow errors silently.

### Security
- API keys must be in `VITE_*` environment variables, never hardcoded.
- Sanitize any user input rendered as HTML.
- No `eval()`, no `dangerouslySetInnerHTML` without explicit sanitization.

### Code Style
- JavaScript (not TypeScript) — match existing codebase.
- Functional components with hooks. No class components.
- Named exports preferred over default exports for utilities.
- PascalCase for components, camelCase for functions/variables, UPPER_SNAKE for constants.
- Use existing ESLint config — do not disable rules without justification.

---

## Testing & Validation

- Add tests near the behavior being changed.
- Cover at least one happy path and one relevant edge case for non-trivial logic.
- Run the narrowest effective validation first (lint → build → unit → manual).
- For UI: describe what you see in the browser or use snapshots.
- For data: verify node counts, edge connections, metadata accuracy.
- Smoke-test workflows end-to-end: tour flow, node click → detail panel → AI response.

---

## Architecture Decision Records (ADRs)

**When to write an ADR:**
- Adding a new dependency or library
- Changing the build/deploy pipeline
- Restructuring the component hierarchy
- Changing data flow patterns (state management, API integration)
- Creating a new top-level directory
- Any decision a future developer would ask "why did we do it this way?"

**When an ADR is NOT needed:**
- Bug fixes that don't change architecture
- Adding a component that follows existing patterns
- Style/CSS changes
- Data content updates (adding nodes, fixing metadata)

ADRs go in `docs/architecture/adr/` using the template at `docs/architecture/adr/_template.md`.

---

## Feature Artifacts

After every completed feature or substantial capability, create or update a feature artifact in `docs/features/`. Use the template at `docs/features/_template.md`.

**Filename convention:** `YYYY-MM-DD-short-kebab-description.md` (e.g., `2026-03-28-guided-tour.md`).

**When to create one:**
- New user-facing feature shipped
- Substantial internal capability added (e.g., new API integration)
- Major refactor that changes how something works

**When NOT to create one:**
- Tiny bug fixes
- Dependency updates
- Style tweaks

---

## README Update Policy

Update `README.md` when:
- Setup or installation steps change
- `npm` scripts or build commands change
- Environment variables or required services change
- High-level architecture or project purpose changes
- Deployment or usage instructions change

Do NOT update README for:
- Internal refactors
- New components that follow existing patterns
- Data content changes
- Test additions

---

## Documentation Hierarchy

| Document | Purpose | Audience |
|---|---|---|
| `README.md` | Project overview, setup, usage | Humans |
| `AGENTS.md` | Agent behavior instructions | Codex, coding agents |
| `CLAUDE.md` | Claude Code instructions | Claude Code |
| `PRD.md` | Product requirements (read-only) | Everyone |
| `docs/plans/` | In-progress specs | Agents + humans during development |
| `docs/architecture/adr/` | Architecture decisions | Future developers and agents |
| `docs/features/` | Shipped feature records | Future developers and agents |
| `docs/runbooks/` | Operational/debug guides | Humans during incidents |
| `docs/reference/` | External API docs, data schemas | Agents + humans |
