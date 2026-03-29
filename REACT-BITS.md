# React Bits -- Research & Integration Notes for Cosmos

## What is React Bits?

React Bits is an open-source library of 110+ animated, interactive, and fully customizable React components created by David Haz (DavidHDev). It is designed for building visually memorable user interfaces with minimal effort.

- **Repository:** https://github.com/DavidHDev/react-bits
- **Website:** https://reactbits.dev
- **License:** MIT + Commons Clause (commercial usage allowed; you own the code after install)
- **Last updated:** March 2026 (updated monthly)

The library is **not a monolithic npm package**. Instead, components are individually installed via CLI (shadcn or jsrepo) or copy-pasted directly into your project. Each component is self-contained with minimal dependencies.

### Key characteristics

- 110+ components across 4 categories: **Text Animations**, **Animations**, **Components**, and **Backgrounds**
- Every component ships in 4 variants: JS+CSS, JS+Tailwind, TS+CSS, TS+Tailwind
- Works with any modern React setup: Vite, Next.js, Gatsby, CRA
- Lightweight, tree-shakeable, no monolithic bundle
- Some components require peer dependencies: `three` (3D), `gsap` (GSAP animations), `matter-js` (physics)

---

## Installation

React Bits does not use a traditional `npm install react-bits` approach. Components are added individually.

### Option 1: Via shadcn CLI (Recommended)

```bash
# Example: add BlurText in TypeScript + Tailwind variant
npx shadcn@latest add "@react-bits/BlurText-TS-TW"

# Example: add Particles background in JS + CSS variant
npx shadcn@latest add "@react-bits/Particles-JS-CSS"
```

### Option 2: Via jsrepo

```bash
# Pattern: github/DavidHDev/react-bits/src/<variant>/<Category>/<ComponentName>
npx jsrepo add github/DavidHDev/react-bits/src/ts-tailwind/Backgrounds/Particles
npx jsrepo add github/DavidHDev/react-bits/src/js-css/TextAnimations/BlurText
```

### Option 3: Manual copy-paste

Visit the component page on https://reactbits.dev, select your preferred variant (JS/TS, CSS/Tailwind), and copy the code directly into your project.

### Peer dependencies (install only what you need)

```bash
# Required for all components
npm install react react-dom

# Only if using 3D components
npm install three @react-three/fiber @react-three/drei

# Only if using GSAP-powered animations
npm install gsap

# Only if using physics-based animations
npm install matter-js
```

> **For Cosmos:** The project already uses React 19 + Vite, so any variant works. Since the project uses plain CSS (no Tailwind), the **JS-CSS** variant is the best fit unless Tailwind is added later.

---

## Available Components Relevant to Cosmos

The following components are organized by category, with notes on why each could be useful for a space visualization app.

### Text Animations

| Component | Description | Cosmos Use Case |
|-----------|-------------|-----------------|
| **BlurText** | Text that animates in/out with a blur effect | Panel headers, node names on hover |
| **SplitText** | Characters/words animate individually | Title animations, tour narration text |
| **GradientText** | Animated gradient flowing through text | App title "Cosmos", category labels |
| **ScrollReveal** | Text reveals on scroll | If scrollable content is added to guide panel |
| **RotatingText** | Cycles through words with animation | Rotating taglines ("Explore / Discover / Learn") |
| **ShinyText** | Shimmering/glowing text effect | Highlighting selected planet names |
| **TrueFocus** | Focus highlight moves across text | Drawing attention to key data points |
| **TypingAnimation** | Typewriter effect | AI guide (Stella) message rendering |
| **TextPressure** | Text reacts to cursor proximity | Interactive headers |
| **VariableProximity** | Font weight/style changes based on cursor | Exploratory UI elements |
| **CountUp** | Animated number counter | Statistics (distance, temperature, mass) |
| **DecryptedText** | Text "decrypts" character by character | Revealing planet names, sci-fi aesthetic |

### Backgrounds

| Component | Description | Cosmos Use Case |
|-----------|-------------|-----------------|
| **Particles** | Floating particle field | Could overlay or replace the custom star field |
| **Aurora** | Northern lights / aurora effect | Ambient background behind the guide panel |
| **Hyperspeed** | Star-warp / hyperspace tunnel effect | Transition animation when zooming to a node |
| **Squares** | Animated grid of squares | Subtle grid background for the detail panel |
| **GridDistortion** | Distortion effect on a grid | Interactive background responding to mouse |
| **Threads** | Animated thread/string visuals | Abstract connections visualization |
| **Waves** | Flowing wave animation | Ambient background element |
| **Noise** | Perlin noise background | Subtle texture behind UI panels |
| **Iridescence** | Color-shifting iridescent surface | Accent background for selected states |
| **Lightning** | Lightning bolt animations | Visual feedback for discoveries/connections |

### Animations

| Component | Description | Cosmos Use Case |
|-----------|-------------|-----------------|
| **StarBorder** | Animated star/sparkle border effect | Highlight selected node's detail card |
| **SplashCursor** | Colorful splash effect following cursor | Enhanced cursor for space exploration feel |
| **ImageTrail** | Images trail behind cursor movement | Could show planet thumbnails on hover |
| **MagnetLines** | Lines attracted to cursor | Visual connection between cursor and nodes |
| **ClickSpark** | Spark effect on click | Feedback when selecting a node |
| **Spotlight** | Spotlight follows cursor | Focus effect on the graph canvas |
| **GradualBlur** | Elements blur in/out gradually | Panel open/close transitions |
| **FadeContent** | Content fades in with animation | Detail panel content appearance |
| **AnimatedContent** | General purpose enter/exit animations | Any panel or overlay transitions |
| **LogoLoop** | Looping logo animation | Loading state for the app |

### Components (UI)

| Component | Description | Cosmos Use Case |
|-----------|-------------|-----------------|
| **CircularGallery** | 3D circular image carousel | Browsing planets or missions visually |
| **Dock** | macOS-style dock with magnification | Quick-access toolbar for categories |
| **TiltedCard** | 3D tilt-on-hover card | Planet/mission detail cards |
| **SpotlightCard** | Card with spotlight hover effect | Alternative detail panel design |
| **PixelCard** | Card with pixel-art aesthetic | Stylized info cards |
| **GlassIcons** | Frosted glass icon buttons | Toolbar/action buttons |
| **InfiniteMenu** | Infinite scrolling menu | Mission/planet list navigation |
| **Tooltip** | Animated tooltip | Node hover information |

---

## Conventions and Best Practices

### 1. Components are source-owned
Once installed, React Bits components live in your codebase (typically under `src/components/ui/` or similar). You own the code and should customize it freely.

### 2. Pick one variant and stay consistent
Choose JS-CSS, JS-TW, TS-CSS, or TS-TW for the whole project. For Cosmos (Vite + JS + plain CSS), use **JS-CSS** throughout.

### 3. Customize via props
All components expose props for colors, speeds, sizes, and behavior. Prefer prop customization over editing the component source when possible.

### 4. Keep peer dependencies minimal
Only install `three`, `gsap`, or `matter-js` if you actually use components that need them. Check each component's docs page for its specific dependencies.

### 5. Performance considerations
- Background components (Particles, Aurora, Hyperspeed) run on canvas or WebGL. Be mindful when layering them over Cosmos's existing ForceGraph2D canvas.
- Use `React.lazy()` and `Suspense` for heavy animated components to avoid blocking initial render.
- Disable or reduce animations for users who prefer reduced motion (`prefers-reduced-motion` media query).

### 6. Styling integration
- CSS variant components ship with their own `.css` files that should be imported alongside the component.
- Tailwind variants assume your project has Tailwind configured.
- Component styles use scoped class names to avoid conflicts with existing styles.

---

## MCP Server for React Bits

An MCP (Model Context Protocol) server exists for React Bits, allowing AI assistants to search, browse, and retrieve component code directly.

- **Repository:** https://github.com/ceorkm/reactbits-mcp-server
- **npm:** `reactbits-dev-mcp-server`
- **Official page:** https://reactbits.dev/get-started/mcp

### What it provides

- Browse and search 135+ ReactBits components
- Retrieve component source code in CSS or Tailwind variants
- Get usage examples and demo code
- Filter by category (Animations, Backgrounds, Components, TextAnimations)
- Built-in caching for fast responses

### Setup for Claude Desktop

Edit the Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Add the following:

```json
{
  "mcpServers": {
    "reactbits": {
      "command": "npx",
      "args": ["reactbits-dev-mcp-server"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

### Setup for Claude Code

```bash
claude mcp add reactbits -- npx reactbits-dev-mcp-server
```

### GitHub Token (Optional)

- Without token: 60 GitHub API requests/hour
- With token: 5,000 requests/hour
- Set via `GITHUB_TOKEN` environment variable or `.env` file

### Note

The MCP registry search returned no results for "react-bits", meaning it is not yet listed in the official MCP registry. The MCP server is community-maintained and available via npm/GitHub directly.

---

## Cosmos App -- Current UI Components & Enhancement Suggestions

### Current state of the app

The Cosmos app is a Vite + React 19 single-page application that visualizes NASA exoplanet and mission data as a force-directed graph. It currently has three main UI components:

| File | Purpose |
|------|---------|
| `src/components/BrainMap.jsx` | Full-screen canvas graph using `react-force-graph-2d` with custom star/nebula rendering |
| `src/components/SearchBar.jsx` | Floating search input with keyboard shortcuts (/, Cmd+K, Escape) |
| `src/components/DetailPanel.jsx` | Positioned info panel showing exoplanet/mission data when a node is selected |

The app uses a dark space theme (background `#06080d`), with cyan (`#5ec4f7`) for exoplanets and red-orange (`#f76e5e`) for missions.

### Suggested React Bits enhancements

#### SearchBar.jsx -- Enhancements

The current SearchBar is a simple `<input>` with an SVG icon and keyboard hint. It works well but has no animation or visual flair.

**Suggested additions:**
1. **SplashCursor** or **Spotlight** -- Add a subtle glow/spotlight effect around the search area when focused
2. **DecryptedText** -- Use for the placeholder text to give it a sci-fi "decoding" feel
3. **AnimatedContent** or **FadeContent** -- Wrap the search results dropdown (if added later) with animated entry/exit
4. **StarBorder** -- Add an animated star border around the search container when active

#### DetailPanel.jsx -- Enhancements

The current DetailPanel is a positioned div with fade-in transition (opacity + translateY). It shows structured rows of planet/mission data.

**Suggested additions:**
1. **TiltedCard** or **SpotlightCard** -- Replace the plain `div` with a React Bits card component for a 3D tilt or spotlight hover effect on the detail panel
2. **StarBorder** -- Wrap the panel in an animated border that matches the node's color (cyan for exoplanets, red-orange for missions)
3. **BlurText** -- Animate the node name (h2) with a blur-in effect when the panel opens
4. **CountUp** -- Animate numeric values (distance, temperature, orbital period, discovery count) with a count-up effect instead of showing them statically
5. **GradientText** -- Use for the "EXOPLANET" / "MISSION" badge text with a color gradient matching the node type
6. **DecryptedText** -- Use for row values to create a "data decoding" feel as the panel opens
7. **FadeContent** -- Wrap each detail row for staggered fade-in animation

#### App-level / Global enhancements

1. **Particles** or **Aurora** -- Add an ambient background layer behind the guide panel (right 30% of the layout per PRD) to differentiate it from the graph canvas
2. **Hyperspeed** -- Use as a brief transition effect when the camera zooms to a single search match (currently done with `graphRef.centerAt` + `graphRef.zoom`)
3. **TypingAnimation** -- Essential for the AI guide "Stella" when it is implemented; renders chat responses with a typewriter effect
4. **SplitText** -- Animate the app title or tour stop headings with per-character animation
5. **GlassIcons** -- Use for any toolbar buttons or quick-action icons in the guide panel
6. **Dock** -- Could serve as a category filter bar (Exoplanets / Missions / All) at the bottom of the screen
7. **ClickSpark** -- Add spark effects when clicking on graph nodes for satisfying visual feedback
8. **Tooltip** -- Replace browser-default tooltips with animated React Bits tooltips for node hover states

### Priority integration order

For maximum visual impact with minimal effort, consider this order:

1. **StarBorder** on DetailPanel -- Immediate wow factor, wraps existing component
2. **BlurText** on detail panel header -- Simple text swap, strong visual effect
3. **CountUp** on numeric values -- Brings data to life with animation
4. **DecryptedText** on search placeholder -- Sci-fi aesthetic, easy to add
5. **ClickSpark** on node clicks -- Quick integration via the existing `onNodeClick` handler
6. **TypingAnimation** for Stella (AI guide) -- Critical for the planned guide panel
7. **Aurora** or **Particles** background for guide panel -- Sets the mood for the right panel
8. **TiltedCard** for DetailPanel -- Bigger refactor but significantly elevates the detail view

---

## Sources

- https://reactbits.dev
- https://github.com/DavidHDev/react-bits
- https://github.com/ceorkm/reactbits-mcp-server
- https://reactbits.dev/get-started/mcp
- https://www.npmjs.com/package/reactbits-dev-mcp-server
