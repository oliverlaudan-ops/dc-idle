import { Container, Graphics, Text, FederatedPointerEvent } from "pixi.js";
import type { GameContext } from "../main";

export interface TutorialState {
  points: { x: number; y: number }[];
  splits: { x: number; worldX: number; leftCount: number; rightCount: number }[];
  threshold: number;
  attempts: number;
  maxAttempts: number;
  status: "intro" | "playing" | "win" | "fail";
}

const POINT_RADIUS = 5;
const SPLIT_TOLERANCE_PX = 24;

export class Tutorial {
  private container: Container;
  private field: Graphics;
  private pointsLayer: Container;
  private splitsLayer: Container;
  private ghostLine: Graphics;
  private banner: Text;
  private subBanner: Text;
  private resetButton: Graphics;
  private resetLabel: Text;
  private bannerLayer: Container;
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
    this.bannerLayer = new Container();
    this.banner = new Text({
      text: "",
      style: {
        fill: ctx.colors.cyan,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 22,
        fontWeight: "500",
        letterSpacing: 1.5,
      },
    });
    this.subBanner = new Text({
      text: "",
      style: {
        fill: ctx.colors.textDim,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 12,
        letterSpacing: 1,
      },
    });
    this.bannerLayer.addChild(this.banner);
    this.bannerLayer.addChild(this.subBanner);
    this.resetButton = new Graphics();
    this.resetLabel = new Text({
      text: "↻  RESET",
      style: {
        fill: ctx.colors.bg,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 1.5,
      },
    });
    this.bannerLayer.addChild(this.resetButton);
    this.bannerLayer.addChild(this.resetLabel);
    this.resetButton.eventMode = "static";
    this.resetButton.cursor = "pointer";
    this.resetButton.on("pointertap", () => this.reseed());
    this.container.addChild(this.field);
    this.container.addChild(this.splitsLayer);
    this.container.addChild(this.pointsLayer);
    this.container.addChild(this.ghostLine);
    this.container.addChild(this.bannerLayer);
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
    // Reserve a 64px banner strip at top and 24px horizontal padding.
    const w = window.innerWidth - 32;
    const h = window.innerHeight - 96;
    return { width: w, height: h };
  }

  private drawField() {
    const g = this.field;
    g.clear();
    const { width, height } = this.getFieldSize();
    g.rect(16, 64, width, height)
      .stroke({ color: this.ctx.colors.border, width: 1 })
      .fill({ color: 0x0e1d24, alpha: 0.6 });
    // Mark the "trivial" zone (≤ threshold points) as a faint inner band
    // to make the win condition legible.
    const left = 16;
    const right = 16 + width;
    g.moveTo(left, 64 + height - 28)
      .lineTo(right, 64 + height - 28)
      .stroke({ color: this.ctx.colors.border, width: 1, alpha: 0.6 });
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
      g.x = 16 + p.x;
      g.y = 64 + p.y;
      layer.addChild(g);
    }
  }

  private drawSplits() {
    const layer = this.splitsLayer;
    layer.removeChildren();
    for (const s of this.state.splits) {
      const g = new Graphics();
      const xScreen = 16 + s.worldX;
      g.moveTo(xScreen, 64)
        .lineTo(xScreen, 64 + this.height)
        .stroke({ color: this.ctx.colors.cyan, width: 1, alpha: 0.85 });
      // tiny tick
      g.rect(xScreen - 3, 64, 6, 6)
        .fill({ color: this.ctx.colors.cyan });
      layer.addChild(g);
    }
  }

  private drawGhost(worldX: number | null) {
    const g = this.ghostLine;
    g.clear();
    if (worldX == null) return;
    const xScreen = 16 + worldX;
    g.moveTo(xScreen, 64)
      .lineTo(xScreen, 64 + this.height)
      .stroke({ color: this.ctx.colors.cyan, width: 1, alpha: 0.25 });
  }

  private updateBanner() {
    if (this.state.status === "win") {
      this.banner.text = "// FIELD BISECTED";
      this.subBanner.text = "sub-problems \u2264 4 are trivial. boss #1: closest pair of points.";
    } else if (this.state.status === "fail") {
      this.banner.text = "// OUT OF SPLITS";
      this.subBanner.text = "tip: a balanced split beats a deep one.";
    } else {
      this.banner.text = "TUTORIAL \u00b7 CLOSEST PAIR";
      const remaining = Math.max(0, this.state.maxAttempts - this.state.attempts);
      this.subBanner.text =
        `click to drop a vertical split. \u2264 ${this.state.threshold} points = trivial. ${remaining} split${remaining === 1 ? "" : "s"} left. \u2192 reset.`;
    }
    this.banner.x = 16;
    this.banner.y = 20;
    this.subBanner.x = 16;
    this.subBanner.y = 48;
    if (this.ctx.hud) {
      this.ctx.hud.textContent =
        this.state.status === "playing"
          ? `TUTORIAL \u00b7 ${this.state.attempts}/${this.state.maxAttempts} \u00b7 R=RESET`
          : this.state.status.toUpperCase();
    }
    const showReset = this.state.status !== "playing";
    this.resetButton.visible = showReset;
    this.resetLabel.visible = showReset;
    if (showReset) this.drawResetButton();
  }

  private drawResetButton() {
    const w = 110;
    const h = 36;
    const x = 16;
    const y = 78;
    this.resetButton.clear();
    this.resetButton.roundRect(x, y, w, h, 4)
      .fill({ color: this.ctx.colors.cyan })
      .stroke({ color: this.ctx.colors.cyan, width: 1 });
    this.resetLabel.x = x + 18;
    this.resetLabel.y = y + 11;
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
    const onMove = (ev: PointerEvent) => {
      if (this.state.status !== "playing") {
        this.hoverX = null;
        this.drawGhost(null);
        return;
      }
      const rect = (this.ctx.app.canvas as HTMLCanvasElement).getBoundingClientRect();
      const x = ev.clientX - rect.left - 16;
      const y = ev.clientY - rect.top - 64;
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
      const x = local.x - 16;
      const y = local.y - 64;
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
