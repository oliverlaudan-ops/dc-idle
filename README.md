# Divide &amp; Conquer Idle

> A recursive puzzle idle game. Split problems, master algorithms.

🎮 **Play (when deployed):** [dc-idle.future-pulse.de](https://dc-idle.future-pulse.de)

## What is this?

A browser-based idle game where the core loop is **Divide & Conquer**.
You don't fight monsters — you fight **problems**. Your weapon is the
choice of how to split, when to stop, and which merging strategy to use.

The recursion tree _is_ the game board.

## Current status

**Spike** — Closest-Pair-of-Points tutorial prototype.

- 20 points on a dark-cyan canvas.
- Click to drop a vertical split.
- Win: every sub-region has ≤ 4 points.
- Press **R** to reseed.
- 6 splits max — proves that _balanced beats deep_.

## Vision

See [`VISION.md`](./VISION.md) for the full pitch: the 10-second tutorial,
the boss sequence, the skin, the prestige model.

## Tech

- **Pixi.js 8** — Canvas/WebGL renderer. ~88 kB gzipped.
- **TypeScript** strict mode.
- **Vite** — dev server + production build.
- **localStorage** — saves (planned, not in spike yet).
- **GitHub Pages** with custom domain `dc-idle.future-pulse.de`.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build → dist/
npm run preview    # serve the production build locally
```

## Roadmap

- [x] Spike: Closest-Pair tutorial canvas with click-to-split
- [ ] Merge phase: highlight pairs and reveal the actual closest pair
- [ ] Boss #1: Closest Pair as a full puzzle (parameter tuning)
- [ ] Boss #2: Merge Sort (threshold tweak)
- [ ] Boss #3: Karatsuba
- [ ] Idle layer: prestige, run-cycles, save/load
- [ ] Visual pass: node glow, merge animation, sound
- [ ] Itch.io release

## License

MIT.
