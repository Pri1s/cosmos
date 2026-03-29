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
| `npm run sync:nasa-data` | Refresh the capped NASA-backed graph dataset from the Exoplanet Archive |
| `npm run test` | Run Vitest utility checks |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | For AI guide | Gemini API key for Stella (the AI guide) |
| `STITCH_API_KEY` | For Stitch MCP | API key created in Stitch settings for the Google Stitch MCP server |
| `GITHUB_TOKEN` | Optional for React Bits MCP | Raises GitHub API limits used by the React Bits MCP server |

Create a `.env.local` file in the project root:

```
VITE_GEMINI_API_KEY=your-key-here
```

If you want the repo-local MCP servers to work, also export:

```bash
export STITCH_API_KEY=your-stitch-api-key
export GITHUB_TOKEN=your-github-token
```

## MCP Servers

This repo includes project-local MCP config in `.mcp.json` and `.cursor/mcp.json`.

- `stitch` uses Google's hosted MCP endpoint at `https://stitch.googleapis.com/mcp` and expects `STITCH_API_KEY`.
- `reactbits` runs `npx reactbits-dev-mcp-server` and can use `GITHUB_TOKEN` to avoid low unauthenticated GitHub API limits.

`reactbits` is community-maintained. `stitch` is Google's official Stitch MCP endpoint.

## Stack

- **React 19** + **Vite 8** — SPA framework and build tool
- **react-force-graph-2d** + **d3-force** — Force-directed graph rendering
- **Google Gemini API** — AI guide (Stella) chatbot
- **Plain CSS** — Styling (no Tailwind, no CSS modules)
- **Google Fonts** — Instrument Serif (display), DM Mono (UI/data)

## Architecture

Two-panel layout:
- **Left (~70%):** Interactive force-directed brain map (canvas-based)
- **Right (~30%):** AI guide panel with chat, quick actions, and node info

Graph topology is mission-centered and capped at 200 total nodes for readability. Exoplanet nodes and mission discovery counts are synced from NASA's public Exoplanet Archive into static source files, so the app still ships with no backend and no runtime data dependency. Mission copy remains curated, and the AI guide uses client-side API calls to Google Gemini.

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
