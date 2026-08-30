# Synthetic Relationship Graph Visualization

A professional, studio-grade React Flow v12 (`@xyflow/react`) + Dagre (`@dagrejs/dagre`) graph visualization component built for Next.js 14 App Router and Tailwind CSS.

## Installation Commands

```bash
npm install @xyflow/react @dagrejs/dagre tailwindcss
```

## Features

- **Dagre Auto-Layout:** Computes hierarchical top-to-bottom tree positions (`74` top → `70` middle → `42`/`53`/`67` bottom).
- **Force-Directed Radial Toggle:** Switch between Dagre Tree layout and Radial layout centered on Node `70`.
- **4 Custom Node Category Cards:**
  - `Suspicious`: Rose theme (`border-rose-500 bg-rose-50/90`) with `⚠ suspicious` tag.
  - `Transaction`: Emerald theme (`border-emerald-500 bg-emerald-50/90`) with `$` glyph.
  - `Entity Wallet`: Sky blue theme (`border-sky-500 bg-sky-50/90`).
  - `IP Observation`: Violet theme (`border-violet-500 bg-violet-50/90`).
- **White Pill Edge Labels:** Edge text (`sent`, `received by`, `network obs`) renders over a solid white pill background to ensure zero line crossing.
- **Edge Hover Highlighting:** Hovering an edge highlights the connected source and target nodes.
- **Element Inspector:** Interactive side panel detailing clicked nodes (degree, connected topology) and edges.
- **Time-Safe Footer:** Caption badge marking `Graph Proxy Version: v2-time-safe`.
