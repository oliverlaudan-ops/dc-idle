# Divide & Conquer Idle — Vision

> _"Nimm das Problem. Teile es. Aber genau hier — wie?"_

## The pitch

Divide & Conquer is not _one_ algorithm. It is a _way of thinking_: split a
problem into smaller ones, solve them, merge the answers. This game makes
that pattern _playable_.

You don't fight monsters. You fight **problems** — and your weapon is the
choice of how to divide, when to stop, and which merging strategy to use.

## The promise

1. **Every split is a decision.** Parameters, variants, thresholds. The
   "optimal" solution isn't handed to you at the start — you discover it
   through runs. Wrong tweaks cost resources or run-time, but they are
   never a "Game Over without information".
2. **Every node is a different algorithm.** Closest Pair, Merge Sort,
   Karatsuba, Convex Hull, FFT, Selection, Strassen-Multiplication. The
   boss sequence is a D&C curriculum. Players learn CS history as a
   side-effect: Strassen 1969, Cooley–Tukey 1965, Karatsuba 1960 — the
   golden years of recursion.
3. **Prestige changes the class, not just the numbers.** Run 1–5: naive
   D&C. Run 6–10: cache-aware + parallel. Run 11+: sublinear (counting
   sort, radix), then sublinear² (binary search as the final boss). The
   only idle mechanic that escapes "ever bigger numbers" — after
   prestige, _the problems themselves change_.

## The UI promise

The recursion tree _is_ the game board. No number panel, no dashboard —
you see your splits, your merge paths, your active strategy _on the
tree_. Nodes collapse = merge. Depth = research. Width = parallelism.
Skin: dark cyan, monospace, soft glow, almost like a circuit diagram
come alive.

## The 10-second tutorial

> _"You have a field of points. Tap to drop a vertical split. Keep
> splitting until one side has ≤ 4 points. That's a 'trivial' sub-problem
> you can solve by hand."_

No word about Closest Pair of Points. Players figure it out by doing.

## The boss sequence (rough draft)

| # | Boss | D&C concept | Puzzle moment |
|---|------|-------------|---------------|
| 1 | Closest Pair of Points | split + strip-merge | strip-width tuning |
| 2 | Merge Sort | split + merge | threshold for switching to insertion sort |
| 3 | Karatsuba | 3-mult trick | n-threshold for recursion vs. schoolbook |
| 4 | Convex Hull | sort + scan | pivot choice in Quickhull |
| 5 | Selection (Quickselect) | partition + recurse | pivot strategy (Lomuto/Hoare/median-of-3) |
| 6 | Strassen Multiplication | 7-mult trick | crossover point |
| 7 | Cooley–Tukey FFT | bit-reversal + butterflies | radix-2 vs. radix-4 |
| 8 | Sublinear Sorts | counting / radix | bucket count tuning |
| 9 | Branch & Bound (vs. D&C) | _when_ D&C is the wrong tool | rejection thresholds |
| 10 | Binary Search | _"is there anything left to split?"_ | empty recursion tree = victory |

## Tech

- **Pixi.js 8** for the canvas tree. (Spike: 88 kB gzipped, fits an idle.)
- **TypeScript**, strict, no framework overhead.
- **Vite** for build.
- **localStorage** for saves. No backend.
- **Hosting:** GitHub Pages on `dc-idle.future-pulse.de`.

## Status

Spike: Closest-Pair tutorial prototype. Click to drop a vertical split.
Win condition: every sub-region has ≤ 4 points. R to reseed. 6 splits
max — proves the "balanced split beats deep split" idea.

## What this is NOT

- Not a CS lecture. The curriculum is a side-effect.
- Not a clicker. Decisions are the whole game.
- Not a 4X. There's no map, no empire. The recursion tree is the world.
