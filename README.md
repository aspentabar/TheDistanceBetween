# The Distance Between

*by Aspen Tabar*

An interactive scrollytelling visualization that reveals just how vast the space between Earth and the Moon really is — by fitting all seven other planets side by side in the gap.

## What It Does

As you scroll, the experience unfolds in three acts:

1. **Earth & Moon** — Earth and the Moon appear at their true relative sizes, with a dashed line measuring the distance between them.
2. **The Planets Enter** — One by one, Mercury through Neptune rise into the gap between Earth and the Moon, each rendered to scale. The visualization zooms out as needed to fit them all.
3. **The Reveal** — All seven planets fit, side by side, in the space between Earth and the Moon — a distance of roughly 405,500 km at apogee.

## Tech Stack

- [React](https://react.dev/) — UI and state management
- [Vite](https://vitejs.dev/) — build tooling
- [Scrollama](https://github.com/russellsamora/scrollama) — scroll-driven step events and progress tracking
- [Tailwind CSS](https://tailwindcss.com/) — utility-first styling

## Running Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## How It Works

Planet sizes are based on real diameters (in km), rendered at a consistent `km/px` ratio so all bodies remain proportionally accurate throughout. As planets accumulate, the scene scales down to keep everything visible — but label text counter-scales to stay readable at all zoom levels.

The scroll progress is split into sub-phases per planet step:
- **Phase 1 (0–50%)** — the scene rescales to make room
- **Phase 2a (50–75%)** — Earth and the Moon spread apart
- **Phase 2b (75–100%)** — the new planet rises up from below into position
