# Cosmos

Interactive space data visualization that presents NASA exoplanet and mission data as a force-directed graph, paired with an AI guide that narrates and contextualizes the data.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_ANTHROPIC_API_KEY` | For AI guide | Anthropic API key for Stella (the AI guide) |

Create a `.env.local` file in the project root:

```
VITE_ANTHROPIC_API_KEY=your-key-here
```

## Stack

- **React 19** + **Vite 8** — SPA framework and build tool
- **react-force-graph-2d** + **d3-force** — Force-directed graph rendering
- **Anthropic Claude API** — AI guide (Stella) chatbot
- **Plain CSS** — Styling (no Tailwind, no CSS modules)
- **Google Fonts** — Instrument Serif (display), DM Mono (UI/data)

## Architecture

Two-panel layout:
- **Left (~70%):** Interactive force-directed brain map (canvas-based)
- **Right (~30%):** AI guide panel with chat, quick actions, and node info

Data is curated and hardcoded (~25-30 nodes). No backend, no database. The AI guide uses client-side API calls to Anthropic Claude.

See `PRD.md` for full product requirements.

## Documentation

| Document | Purpose |
|---|---|
| `PRD.md` | Product requirements |
| `REACT-BITS.md` | UI component library reference |
| `AGENTS.md` | Instructions for coding agents |
| `CLAUDE.md` | Instructions for Claude Code |
| `docs/architecture/adr/` | Architecture Decision Records |
| `docs/features/` | Shipped feature documentation |
| `docs/plans/` | In-progress specs and plans |
