# The Distance Between

*by Aspen Tabar*

An interactive scrollytelling visualization that reveals just how vast the space between Earth and the Moon really is — by fitting all seven planets side by side in the gap.

## What It Does

As you scroll, the experience unfolds in stages:

1. **Earth & Moon** — Earth and the Moon appear at their true relative sizes, with a dashed line and the distance between them labeled.
2. **The Real Scale** — The scene zooms out to show the actual 251,966-mile gap, far larger than most people imagine.
3. **The Planets Enter** — One by one, Mercury through Neptune rise into the gap, each rendered to true relative scale.
4. **The Reveal** — All seven planets fit, side by side, in the space between Earth and the Moon — with room left over.

After the reveal, a closing reflection fades in and a "Restart Experience" button appears so users can go through it again.

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

## Build

```bash
npm run build
npm run preview
```

## How It Works

Planet sizes are based on real diameters (in km), rendered at a consistent `km/px` ratio so all bodies remain proportionally accurate throughout. As planets accumulate, the scene scales down to keep everything visible — label text counter-scales to stay readable at all zoom levels.

The star background is an oversized fixed container (160vw × 160vh) so that when the scene zooms out, no black edges appear. Heavy animation steps (like the final closing text) use raw scroll listeners instead of React state to bypass re-render overhead and keep motion smooth.

## Data

- Earth–Moon distance: **251,966 miles** (apogee / farthest point)
- All planet diameters are real values in km
