# CLAUDE.md — Claude Code Instructions for Cosmos

> Instructions for Claude Code and Claude-based workflows.
> General agent instructions are in AGENTS.md — read both. This file adds Claude-specific guidance.

---

## Project Context

**Cosmos** is a React 19 + Vite SPA that visualizes NASA exoplanet/mission data as a force-directed graph with an AI guide (Stella) powered by the Google Gemini API.

**Key files to read first:**
- `PRD.md` — full product requirements (read-only, do not modify)
- `REACT-BITS.md` — UI component library reference
- `src/App.jsx` — root layout
- `src/data/graph-data.js` — the curated dataset
- `src/components/BrainMap.jsx` — the core visualization

**Commands:** `npm run dev` (dev server), `npm run build` (build), `npm run lint` (lint).

---

## How to Work in This Repo

### Read AGENTS.md for full policies

AGENTS.md contains the complete rules for:
- Repository structure and where files go
- Spec-driven development workflow
- Definition of done checklist
- Engineering quality standards
- Testing and validation requirements
- ADR and feature artifact processes
- README update policy

**Follow everything in AGENTS.md.** This file adds Claude-specific behaviors on top.

---

## Claude-Specific Workflow

### Before starting non-trivial work

1. **Read the relevant source files** before proposing changes. Do not guess at code structure.
2. **Write a plan in `docs/plans/`** for features, refactors, or complex bugfixes. For simple fixes, state your approach in conversation instead.
3. **Challenge ambiguity.** If a request is unclear, ask before implementing. State your interpretation and get confirmation.

### During implementation

- **Keep diffs minimal and focused.** Do not refactor adjacent code, add comments to unchanged functions, or "improve" things outside scope.
- **Prefer editing existing files** over creating new ones.
- **Match existing patterns.** This project uses plain JS (not TypeScript), functional React components, plain CSS, and named exports for utilities.
- **Do not add dependencies** without discussing it first. If a dependency is needed, note it and explain why.
- **No speculative code.** Do not add feature flags, config options, or abstractions for requirements that don't exist yet.

### After completing work

1. Run `npm run lint` and `npm run build` — fix any errors.
2. If UI changed, verify with the preview tools or describe exactly what you verified.
3. Create/update a feature artifact in `docs/features/` using the template.
4. Create an ADR in `docs/architecture/adr/` if you made a significant architectural choice.
5. Update `README.md` only if setup, commands, env vars, or architecture changed materially.
6. State specifically what validation you performed.

---

## Code Conventions

- **JS, not TypeScript.** Match the existing codebase.
- **Functional components** with hooks. No class components.
- **PascalCase** for components, **camelCase** for functions/variables, **UPPER_SNAKE** for constants.
- **Named exports** for utilities. Default exports only for page-level components if needed.
- **JSDoc** for complex function signatures or component props when types aren't obvious.
- **No `console.log` left in production code** — use `console.warn` or `console.error` for actual issues.
- **CSS:** Plain CSS, co-located or in `App.css`. No Tailwind, no CSS modules (unless an ADR establishes them).
- **ESLint:** Follow the existing config. Do not add `eslint-disable` comments without justification.

---

## Architecture Boundaries

```
src/components/    → React components (UI + interaction logic)
src/components/ui/ → Shared UI primitives (React Bits, design atoms)
src/hooks/         → Custom React hooks
src/data/          → Static curated data (no runtime fetches for core data)
src/utils/         → Pure functions (no React, no side effects)
src/api/           → API service modules (Gemini client, message formatting)
```

**Rules:**
- Components own their rendering and interaction logic. Business logic that isn't React-specific goes in `utils/` or `hooks/`.
- API calls live in `src/api/`, not in components. Components call hooks or service functions.
- Data in `src/data/` is curated and static. If you need dynamic data, create a service in `src/api/`.
- Do not import from `components/` inside `utils/`. Dependencies flow: `utils → hooks/api → components`.

---

## Performance-Critical Areas

- **BrainMap canvas rendering** — this runs on every animation frame. Do not add expensive operations inside the render loop.
- **Force simulation** — d3-force runs continuously until settled. Avoid triggering unnecessary restimulations.
- **API calls to Gemini** — debounce user input, manage conversation context size, handle rate limits gracefully.
- **React re-renders** — the graph component is heavy. Use `React.memo`, stable references, and avoid prop changes that trigger full re-renders.

---

## Working with the AI Guide (Stella)

When building or modifying Stella's integration:
- System prompt and personality are defined in `PRD.md` — follow them precisely.
- Tour messages are pre-scripted (not API-generated) for speed and consistency.
- Post-tour node comments are API-generated and should be 2-4 sentences.
- The API key uses `VITE_GEMINI_API_KEY` env var — never hardcode it.
- Conversation history management: keep context relevant, truncate old messages to avoid token bloat.

---

## Common Pitfalls to Avoid

1. **Do not add TypeScript.** The project is JS. An ADR would be needed to change this.
2. **Do not install Tailwind.** The project uses plain CSS. REACT-BITS.md specifies JS-CSS variants.
3. **Do not modify PRD.md.** It is a read-only reference.
4. **Do not scatter API calls.** All Gemini API communication goes through a service module.
5. **Do not over-engineer the data layer.** The dataset is ~30 curated nodes. No need for state management libraries, caching layers, or databases.
6. **Do not add server-side code.** This is a client-side SPA for demo purposes.
7. **Do not add `// TODO` without context.** Every TODO must explain what needs to happen and why it wasn't done now.
