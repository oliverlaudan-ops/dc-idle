import { Application, Container, Text, TextStyle } from "pixi.js";
import { seedRandom, type Rng } from "./util/rng";
import { Tutorial, type TutorialState } from "./scenes/tutorial";

const COLORS = {
  bg: 0x0a1418,
  cyan: 0x5eead4,
  cyanDim: 0x2dd4bf,
  point: 0xe2e8f0,
  pointActive: 0x5eead4,
  pointSolved: 0x94a3b8,
  split: 0x5eead4,
  splitGhost: 0x2dd4bf,
  text: 0xe2e8f0,
  textDim: 0x94a3b8,
  border: 0x1e3340,
};

export interface GameContext {
  app: Application;
  root: Container;
  rng: Rng;
  scene: Tutorial;
  statusLine: HTMLElement | null;
  resetBtn: HTMLElement | null;
  colors: typeof COLORS;
}

async function bootstrap() {
  const app = new Application();
  await app.init({
    background: COLORS.bg,
    resizeTo: window,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });

  const mount = document.getElementById("app");
  if (!mount) throw new Error("mount #app missing");
  mount.appendChild(app.canvas);

  const root = new Container();
  app.stage.addChild(root);

  // Seed for first-frame determinism; reseeded on each tutorial run.
  const rng = seedRandom(0xc0ffee);

  const statusLine = document.getElementById("status-line");
  const resetBtn = document.getElementById("reset-btn");

  const ctx: GameContext = {
    app,
    root,
    rng,
    statusLine,
    resetBtn,
    colors: COLORS,
    scene: undefined as unknown as Tutorial,
  };

  const tutorial: TutorialState = {
    points: [],
    splits: [],
    threshold: 4,
    attempts: 0,
    maxAttempts: 6,
    status: "intro",
  };

  ctx.scene = new Tutorial(ctx, tutorial);
  ctx.scene.start();
}

bootstrap().catch((err) => {
  console.error("dc-idle bootstrap failed:", err);
  const mount = document.getElementById("app");
  if (mount) {
    mount.innerHTML = `<pre style="color:#fca5a5;padding:24px;">${String(err)}</pre>`;
  }
});

// Re-export style helper for use by scenes.
export function makeText(text: string, opts: Partial<TextStyle> = {}): Text {
  return new Text({
    text,
    style: {
      fill: COLORS.text,
      fontFamily: "JetBrains Mono, monospace",
      fontSize: 14,
      ...opts,
    },
  });
}
