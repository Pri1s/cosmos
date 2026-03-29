# Cosmos — Product Requirements Document

## Overview

**Cosmos** is an interactive space data visualization that presents NASA exoplanet and mission data as a force-directed "brain map" graph, paired with an AI-powered guide that narrates and contextualizes the data. Built for a hackathon track focused on making NASA's public data accessible, visual, and story-driven.

**Core thesis:** Don't just display the data — give people a guide to walk them through it, then let them explore on their own.

---

## Target Experience

A user lands on Cosmos and is immediately greeted by an AI guide named **Stella** (working name — override if you prefer). The guide auto-starts a short narrated tour (~4 stops) that pans the camera across the brain map, highlighting key nodes and telling the story of how humanity discovered worlds beyond our solar system. After the tour, the user is free to click any node, drag the graph around, and ask Stella questions. The whole experience should feel like a planetarium show that turns into a conversation.

---

## Architecture

**Single-page application.** One HTML file for the hackathon demo. API key is client-side (acceptable for demo purposes — not production).

### Layout (Two-Panel)

```
┌─────────────────────────────────┬──────────────────────┐
│                                 │                      │
│                                 │   AI GUIDE PANEL     │
│       BRAIN MAP                 │   (always visible)   │
│       (force-directed graph)    │                      │
│                                 │   - Chat messages    │
│                                 │   - Quick actions    │
│                                 │   - Mini info card   │
│                                 │   - Text input       │
│                                 │                      │
└─────────────────────────────────┴──────────────────────┘
```

- **Left ~70%:** The interactive brain map (canvas-based, force-directed graph)
- **Right ~30%:** The AI guide panel (always visible, not collapsible)

---

## Brain Map

### Node Types

Two categories only:

| Type | Color | Description | ~Count |
|------|-------|-------------|--------|
| **Exoplanet** | Cyan/pulsar blue (`#5ec4f7`) | Confirmed exoplanets with notable properties | ~18-22 |
| **Mission/Telescope** | Red/nova (`#f76e5e`) | Space missions and telescopes that discovered them | ~6-8 |

**Total: ~25-30 curated nodes.** Every node should be interesting enough to click on. No filler.

### Edges

Edges represent the relationship: **"this mission/telescope discovered or studied this exoplanet."**

Examples:
- Kepler → Kepler-442b, Kepler-22b, Kepler-452b, etc.
- TESS → TOI-700d, LHS 1140b, etc.
- JWST → TRAPPIST-1e (atmospheric characterization)
- Ground-based → 51 Pegasi b (first exoplanet around a Sun-like star)

Missions will naturally become hub nodes with many connections. Exoplanets will mostly connect to 1-2 missions.

### Node Data (per node)

Each node carries metadata displayed in the detail panel:

**Exoplanet nodes:**
- Name
- Host star
- Discovery year
- Discovery method (transit, radial velocity, direct imaging, etc.)
- Mass (Earth masses)
- Radius (Earth radii)
- Orbital period
- Equilibrium temperature
- Distance from Earth (light-years)
- Habitability note (1-line editorial, e.g., "One of the most Earth-like worlds found so far")

**Mission nodes:**
- Name
- Agency (NASA, ESA, etc.)
- Launch year
- Status (active/retired)
- Detection method used
- Number of confirmed discoveries
- Key contribution (1-line editorial)

### Interactions

- **Click node** → Detail panel slides out beside the node (floating card with metadata). Also triggers the AI guide to comment on the selected node.
- **Drag node** → Repositions it; physics simulation adjusts neighbors.
- **Pan** → Drag on empty space to move the camera.
- **Zoom** → Scroll wheel to zoom in/out.
- **Search** → Search bar filters/highlights matching nodes and auto-zooms to single matches.
- **Hover** → Node glows brighter, cursor changes to pointer.

### Visual Design

- **Dark space theme.** Background is near-black (`#06080d`) with subtle star particles and faint nebula gradients.
- **Glowing nodes.** Each node has a soft radial glow in its category color.
- **Dim unrelated nodes.** When a node is selected, unconnected nodes fade to ~15% opacity — spotlight effect.
- **Edge styling.** Thin, low-opacity lines by default. Connected edges brighten when a node is selected.
- **Labels.** Monospace font, small, appear on zoom or hover. Selected node label is brighter and bolder.
- **Physics.** Force-directed simulation runs on load, settles organically, can be paused.

---

## AI Guide Panel

### Identity

- **Name:** Stella (working name)
- **Personality:** Warm and curious, like a planetarium narrator. Enthusiastic about space but not cheesy. Speaks in clear, accessible language — avoids jargon unless explaining it. Occasionally expresses genuine wonder. Not robotic, not overly casual.
- **Tone examples:**
  - "This is TRAPPIST-1e — and honestly, it's one of the most exciting planets we've found. It's roughly Earth-sized, sitting right in the habitable zone of its star. If any world out there has liquid water on its surface, this is a strong candidate."
  - "Kepler changed everything. Before this telescope, we'd confirmed maybe a few dozen exoplanets. Kepler found thousands — and it did it by staring at one patch of sky for years, watching for tiny dips in starlight."

### Panel Contents

From top to bottom:

1. **Header** — Guide name/avatar, maybe a small status indicator ("Stella — your guide")
2. **Chat messages** — Scrollable conversation thread. Guide messages + user messages.
3. **Mini info card** — When a node is selected, a compact card appears in the panel showing key stats (separate from the floating detail panel on the map — this is a simplified version for the chat context).
4. **Quick action buttons** — Contextual suggestion chips that change based on state:
   - During tour: `"Next stop →"`, `"Tell me more"`, `"Skip tour"`
   - During exploration: `"What makes this special?"`, `"Compare to Earth"`, `"What's nearby?"`, `"Show me something cool"`
   - When no node selected: `"Surprise me"`, `"Most habitable planet?"`, `"How do we find exoplanets?"`
5. **Text input** — Free-text input for asking Stella anything.

### Guided Tour (Auto-Start)

When the page loads, the tour begins automatically. The tour is **4 stops**, each consisting of:
- The camera panning/zooming to a specific area of the graph
- Relevant nodes highlighting
- Stella narrating in the chat panel
- A "Next stop →" button to advance (auto-advance after ~8 seconds if no interaction)

**Tour outline:**

| Stop | Focus | Stella says (gist) |
|------|-------|-------------------|
| 1. Welcome | Zoomed-out full graph | "Welcome to the atlas. 30 years ago we didn't know a single planet existed outside our solar system. Today, we've confirmed over 5,500. This map shows some of the most remarkable ones — and how we found them." |
| 2. The Pioneer | 51 Pegasi b node + ground-based telescopes | "It started here. In 1995, two astronomers in Switzerland detected a planet orbiting a Sun-like star for the first time. It was a 'hot Jupiter' — huge and impossibly close to its star. Nothing like what we expected. It changed everything." |
| 3. The Revolution | Kepler hub node + its cluster of planets | "Then came Kepler. This single telescope discovered thousands of planets by watching for tiny dips in starlight. Each dip — a world passing in front of its star. Some of those worlds turned out to be rocky, Earth-sized, and in the habitable zone." |
| 4. The Frontier | TRAPPIST-1 system nodes + JWST | "Now we're entering a new era. JWST is doing something Kepler couldn't — it's analyzing the atmospheres of these worlds. For the first time, we can ask not just 'are there other Earths?' but 'could anything live there?' Go ahead — explore. Click anything that catches your eye, and I'll tell you what I know." |

After stop 4, the tour ends and the user is in free exploration mode.

### Reactive Behavior (Post-Tour)

When the user clicks a node on the map, the guide automatically generates a comment about it. This should:
- Feel natural, not robotic (not just restating the metadata)
- Highlight what's interesting or unique about that node
- Sometimes reference connections to other nodes ("See how this connects to Kepler over there?")
- Be 2-4 sentences — concise, not a wall of text

The user can also type free-text questions, and Stella responds conversationally with knowledge of the full dataset.

### LLM Integration

- **Model:** Claude (Sonnet) via the Anthropic API — balances quality and speed for a chatbot use case.
- **System prompt:** Defines Stella's personality, the dataset context, and instructions for reactive behavior. Should include the full node dataset as context so Stella can reference any node accurately.
- **Trigger on node click:** When a node is selected, automatically send a message to the API like: `"The user just clicked on [node name]. Here is its data: [metadata]. Give a brief, engaging comment about this exoplanet/mission."` Display the response in the chat.
- **Free-text queries:** User messages go directly to the API with conversation history for context continuity.
- **Tour messages:** Pre-scripted (not API-generated) for consistency and speed. Hardcoded in the frontend.

---

## Curated Dataset

The data is hardcoded in the frontend as a JSON structure. Below is the target list — finalize during build, but aim for this composition:

### Missions/Telescopes (~7 nodes)
- Kepler (transit, NASA, 2009-2018, ~2,700 confirmed planets)
- TESS (transit, NASA, 2018-present)
- JWST (characterization, NASA/ESA, 2021-present)
- Hubble (imaging, NASA/ESA, 1990-present)
- CoRoT (transit, ESA, 2006-2013, first transit mission)
- HARPS / ground-based radial velocity (ESO, 2003-present)
- Spitzer (infrared, NASA, 2003-2020)

### Exoplanets (~20 nodes)
Curate for variety — mix of "most Earth-like," "most extreme," "historically important," and "recently discovered":

- **51 Pegasi b** — first exoplanet around a Sun-like star (1995, hot Jupiter)
- **Kepler-22b** — first planet found in habitable zone by Kepler
- **Kepler-442b** — high Earth Similarity Index
- **Kepler-452b** — "Earth's cousin," similar size and orbit
- **Kepler-16b** — orbits two stars (circumbinary, "Tatooine")
- **TRAPPIST-1b, d, e, f** — multi-planet system, some habitable zone
- **Proxima Centauri b** — closest known exoplanet
- **TOI-700d** — TESS's first Earth-sized habitable zone planet
- **LHS 1140b** — super-Earth, promising for atmospheric study
- **HD 209458b** — first transit detection, first atmospheric detection
- **55 Cancri e** — "diamond planet," super-Earth, extreme heat
- **WASP-76b** — where it rains iron
- **GJ 1214b** — "waterworld" candidate
- **K2-18b** — possible water vapor in atmosphere
- **PSR B1257+12 b, c** — first exoplanets ever discovered (around a pulsar, 1992)
- **CoRoT-7b** — first confirmed rocky exoplanet

(Adjust count to hit ~25-30 total nodes with missions.)

---

## Visual & Design Direction

- **Theme:** Dark, immersive, space-void aesthetic. Not sci-fi — more like a calm observatory.
- **Typography:** Serif display font for titles and node names (e.g., Instrument Serif). Monospace for metadata and UI labels (e.g., DM Mono).
- **Color palette:** Deep navy/black background. Category-coded node glows. Muted UI chrome. Accent purple for interactive elements.
- **Animations:** Smooth camera pans during tour (eased transitions). Node glow pulses subtly. Panel slide-in/out transitions.
- **Particles:** Subtle background stars (static or very slow drift). Optional: faint connecting particle trails along edges.

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Single HTML file | Hackathon simplicity, easy to demo |
| Graph rendering | Canvas 2D API | Lightweight, no dependencies, full control |
| Physics | Custom force-directed simulation | Simple repulsion + attraction, no library needed |
| AI chatbot | Anthropic Claude API (Sonnet) | Quality responses, easy integration |
| Styling | Inline CSS + Google Fonts | Single file, no build step |
| Data | Hardcoded JSON in the file | Curated, no API calls to NASA needed |

---

## MVP Scope & Non-Goals

### In Scope (MVP)
- [ ] Force-directed brain map with ~25-30 curated nodes (exoplanets + missions)
- [ ] Two node types with distinct visual styling and color coding
- [ ] Click-to-select with floating detail panel showing metadata
- [ ] Pan, zoom, drag, search interactions
- [ ] Always-visible AI guide panel (right side)
- [ ] Auto-starting guided tour (4 pre-scripted stops with camera choreography)
- [ ] Reactive AI comments on node selection (Claude API)
- [ ] Free-text chat with the guide
- [ ] Quick action buttons (contextual)
- [ ] Dark space theme with polished visual design

### Out of Scope (Not MVP)
- Live data from NASA APIs (data is curated/hardcoded)
- Multiple zoom levels or nested graphs
- User accounts, saving, or sharing
- Mobile-optimized layout (desktop-first for demo)
- Accessibility (WCAG compliance — stretch goal)
- Backend server (API key is client-side for demo)
- Sound or audio narration
- More than 2 node types

---

## Open Questions

- **Guide name:** "Stella" is a working name. Keep it or change?
- **Tour auto-advance timing:** 8 seconds per stop, or let the user control pace entirely?
- **Edge labels:** Should edges show the discovery method, or keep them unlabeled for visual cleanliness?
- **Node sizing:** Should exoplanet nodes scale by some property (e.g., planet radius) or stay uniform?
