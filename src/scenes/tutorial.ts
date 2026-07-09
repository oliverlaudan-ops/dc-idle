import { Container, Graphics, FederatedPointerEvent } from "pixi.js";
import type { GameContext } from "../main";

export interface TutorialState {
  points: { x: number; y: number }[];
  splits: { x: number; worldX: number; leftCount: number; rightCount: number }[];
  threshold: number;
  attempts: number;
  maxAttempts: number;
  status: "intro" | "playing" | "win" | "fail";
  lastRegionCount: number;
  lastAvgPerRegion: number;
}

const FIELD_TOP = 48;
const FIELD_H_PAD = 16;
const FIELD_BOTTOM_PAD = 72; // leave space for bottombar (always-on, ~56px)
const POINT_RADIUS = 5;
const SPLIT_TOLERANCE_PX = 24;

export class Tutorial {
  private container: Container;
  private field: Graphics;
  private pointsLayer: Container;
  private splitsLayer: Container;
  private ghostLine: Graphics;
  private width = 0;
  private height = 0;
  private state: TutorialState;
  private ctx: GameContext;
  private hoverX: number | null = null;

  constructor(ctx: GameContext, state: TutorialState) {
    this.ctx = ctx;
    this.state = state;
    this.container = new Container();
    this.field = new Graphics();
    this.pointsLayer = new Container();
    this.splitsLayer = new Container();
    this.ghostLine = new Graphics();
    this.container.addChild(this.field);
    this.container.addChild(this.splitsLayer);
    this.container.addChild(this.pointsLayer);
    this.container.addChild(this.ghostLine);
    ctx.root.addChild(this.container);
  }

  start() {
    this.spawnPoints();
    this.drawField();
    this.drawPoints();
    this.drawSplits();
    this.updateBanner();
    this.bindEvents();
  }

  private spawnPoints() {
    const { width, height } = this.getFieldSize();
    this.width = width;
    this.height = height;
    const pts: { x: number; y: number }[] = [];
    // Generate 20 points with min spacing to make Closest Pair meaningful.
    let tries = 0;
    while (pts.length < 20 && tries < 400) {
      tries++;
      const x = 40 + this.ctx.rng() * (width - 80);
      const y = 40 + this.ctx.rng() * (height - 80);
      const ok = pts.every(
        (p) => Math.hypot(p.x - x, p.y - y) > 36,
      );
      if (ok) pts.push({ x, y });
    }
    this.state.points = pts;
    this.state.splits = [];
    this.state.attempts = 0;
    this.state.status = "playing";
  }

  private getFieldSize() {
    const w = window.innerWidth - 2 * FIELD_H_PAD;
    const h = window.innerHeight - FIELD_TOP - FIELD_BOTTOM_PAD;
    return { width: w, height: h };
  }

  private drawField() {
    const g = this.field;
    g.clear();
    const { width, height } = this.getFieldSize();
    g.rect(FIELD_H_PAD, FIELD_TOP, width, height)
      .stroke({ color: this.ctx.colors.border, width: 1 })
      .fill({ color: 0x0e1d24, alpha: 0.6 });
  }

  private drawPoints() {
    const layer = this.pointsLayer;
    layer.removeChildren();
    const { splits } = this.state;
    for (const p of this.state.points) {
      const g = new Graphics();
      const within = splits.findIndex(
        (s) => p.x < s.worldX,
      );
      const activeSplit = within === -1 ? splits.length : within;
      const solved = activeSplit > 0; // inside a sub-region
      g.circle(0, 0, POINT_RADIUS)
        .fill({
          color: solved ? this.ctx.colors.pointSolved : this.ctx.colors.point,
        })
        .stroke({
          color: solved ? this.ctx.colors.cyanDim : this.ctx.colors.cyan,
          width: solved ? 0.6 : 1,
          alpha: solved ? 0.4 : 0.8,
        });
      g.x = FIELD_H_PAD + p.x;
      g.y = FIELD_TOP + p.y;
      layer.addChild(g);
    }
  }

  private drawSplits() {
    const layer = this.splitsLayer;
    layer.removeChildren();
    for (const s of this.state.splits) {
      const g = new Graphics();
      const xScreen = FIELD_H_PAD + s.worldX;
      g.moveTo(xScreen, FIELD_TOP)
        .lineTo(xScreen, FIELD_TOP + this.height)
        .stroke({ color: this.ctx.colors.cyan, width: 1, alpha: 0.85 });
      // tiny tick
      g.rect(xScreen - 3, FIELD_TOP, 6, 6)
        .fill({ color: this.ctx.colors.cyan });
      layer.addChild(g);
    }
  }

  private drawGhost(worldX: number | null) {
    const g = this.ghostLine;
    g.clear();
    if (worldX == null) return;
    const xScreen = FIELD_H_PAD + worldX;
    g.moveTo(xScreen, FIELD_TOP)
      .lineTo(xScreen, FIELD_TOP + this.height)
      .stroke({ color: this.ctx.colors.cyan, width: 1, alpha: 0.25 });
  }

  private updateBanner() {
    if (!this.ctx.statusLine || !this.ctx.phaseHint) return;
    const left = this.state.maxAttempts - this.state.attempts;
    if (this.state.status === "playing") {
      this.ctx.statusLine.textContent = `TUTORIAL \u00b7 ${this.state.attempts}/${this.state.maxAttempts} \u00b7 ${left} split${left === 1 ? "" : "s"} left`;
      this.ctx.phaseHint.innerHTML = `click on the field to drop a vertical split. goal: \u2264 <span class="accent">${this.state.threshold}</span> points per region.`;
    } else if (this.state.status === "win") {
      const regions = this.state.lastRegionCount;
      const avg = this.state.lastAvgPerRegion.toFixed(1);
      this.ctx.statusLine.textContent = `// TUTORIAL PASSED \u00b7 ${this.state.attempts} split${this.state.attempts === 1 ? "" : "s"} \u00b7 ${regions} region${regions === 1 ? "" : "s"} \u00b7 avg ${avg} pts`;
      this.ctx.phaseHint.innerHTML = `every region has \u2264 ${this.state.threshold} points \u2014 trivial to brute-force. <span class="accent">next:</span> boss #1 reveals the actual closest pair and the strip-merge phase. reset for another round.`;
    } else {
      this.ctx.statusLine.textContent = `// OUT OF SPLITS \u00b7 ${this.state.maxAttempts}/${this.state.maxAttempts} used`;
      this.ctx.phaseHint.innerHTML = `a balanced split beats a deep one \u2014 try fewer, wider regions. <span class="accent">tip:</span> aim for roughly equal left/right counts each time.`;
    }
  }

  private reseed() {
    this.state.attempts = 0;
    this.spawnPoints();
    this.drawField();
    this.drawPoints();
    this.drawSplits();
    this.drawGhost(null);
    this.updateBanner();
  }

  private bindEvents() {
    if (this.ctx.resetBtn) {
      this.ctx.resetBtn.addEventListener("click", () => this.reseed());
    }
    const onMove = (ev: PointerEvent) => {
      if (this.state.status !== "playing") {
        this.hoverX = null;
        this.drawGhost(null);
        return;
      }
      const rect = (this.ctx.app.canvas as HTMLCanvasElement).getBoundingClientRect();
      const x = ev.clientX - rect.left - FIELD_H_PAD;
      const y = ev.clientY - rect.top - FIELD_TOP;
      if (x < 0 || x > this.width || y < 0 || y > this.height) {
        this.hoverX = null;
        this.drawGhost(null);
        return;
      }
      this.hoverX = x;
      this.drawGhost(x);
    };
    const onLeave = () => {
      this.hoverX = null;
      this.drawGhost(null);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "r" || ev.key === "R") {
        this.reseed();
      }
    };
    // Use Pixi's stage events for tap handling — handles both mouse and touch uniformly.
    const onStageTap = (ev: FederatedPointerEvent) => {
      if (this.state.status !== "playing") return;
      const local = this.container.toLocal(ev.global);
      const x = local.x - FIELD_H_PAD;
      const y = local.y - FIELD_TOP;
      if (x < 0 || x > this.width || y < 0 || y > this.height) return;
      this.trySplit(x);
    };
    this.ctx.app.stage.eventMode = "static";
    this.ctx.app.stage.hitArea = this.ctx.app.screen;
    this.ctx.app.stage.on("pointertap", onStageTap);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("keydown", onKey);

    const onResize = () => {
      // Soft resize: re-center field, but keep current split world coords.
      // For the spike we just redraw; splits remain visible.
      const { width, height } = this.getFieldSize();
      this.width = width;
      this.height = height;
      this.drawField();
      this.drawPoints();
      this.drawSplits();
      this.drawGhost(this.hoverX);
      this.updateBanner();
    };
    window.addEventListener("resize", onResize);
  }

  private trySplit(worldX: number) {
    if (this.state.attempts >= this.state.maxAttempts) return;
    // Refuse splits too close to existing splits or to the field edge.
    for (const s of this.state.splits) {
      if (Math.abs(s.worldX - worldX) < SPLIT_TOLERANCE_PX) return;
    }
    if (worldX < SPLIT_TOLERANCE_PX || worldX > this.width - SPLIT_TOLERANCE_PX) return;

    // Compute counts left/right of this split (considering all current splits
    // as nested dividers; for spike we treat splits as a single chain left→right).
    const ordered = [...this.state.splits.map((s) => s.worldX), worldX].sort((a, b) => a - b);
    const segments: { lo: number; hi: number; count: number }[] = [];
    let lo = 0;
    for (const x of ordered) {
      segments.push({ lo, hi: x, count: 0 });
      lo = x;
    }
    segments.push({ lo, hi: this.width, count: 0 });
    for (const p of this.state.points) {
      for (const seg of segments) {
        if (p.x >= seg.lo && p.x < seg.hi) {
          seg.count++;
          break;
        }
      }
    }
    const leftCount = segments[0]?.count ?? 0;
    const rightCount = segments[segments.length - 1]?.count ?? 0;
    this.state.splits.push({ x: worldX, worldX, leftCount, rightCount });
    this.state.attempts++;
    // Track region stats for the win/fail summary line.
    this.state.lastRegionCount = segments.length;
    this.state.lastAvgPerRegion = segments.length === 0
      ? 0
      : segments.reduce((acc, s) => acc + s.count, 0) / segments.length;
    this.drawSplits();
    this.drawPoints();
    this.updateBanner();

    // Win: every segment has <= threshold points OR we just got close enough.
    const allTrivial = segments.every((s) => s.count <= this.state.threshold);
    if (allTrivial) {
      this.state.status = "win";
      this.drawGhost(null);
      this.updateBanner();
      return;
    }
    if (this.state.attempts >= this.state.maxAttempts) {
      this.state.status = "fail";
      this.drawGhost(null);
      this.updateBanner();
    }
  }
}
