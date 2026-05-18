# Water Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 3-level browser 2D physics drawing puzzle game where players draw lines to guide water particles into a cute triangular container.

**Architecture:** HTML5 Canvas for all rendering; Matter.js for all physics (static level walls, player-drawn lines as static bodies, water as dynamic circle bodies); state machine in main.js drives DRAWING → FLOWING → WIN/FAIL transitions.

**Tech Stack:** HTML5 Canvas, Matter.js 0.19.0 (local), ES6 modules, python3 local server

---

## File Map

| File | Responsibility |
|------|----------------|
| `index.html` | Canvas element, script loading |
| `style.css` | Canvas centering, body background |
| `js/main.js` | Game loop, state machine, render orchestration, level loading |
| `js/physics.js` | Matter.js engine wrapper: add/remove static segments, add water circles, step |
| `js/drawing.js` | Mouse/touch → path points → static Matter.js bodies; ink accounting; stroke deletion |
| `js/water.js` | One-time particle spawn from source; render particles; count particles in fill zone |
| `js/ui.js` | Render ink bar, source button, reset/back buttons, win/fail overlay |
| `js/levels/level1.js` | Tutorial level data |
| `js/levels/level2.js` | Obstacle level data |
| `js/levels/level3.js` | Multi-line level data |
| `js/levels/index.js` | Exports `levels` array |

---

## Task 1: Project Scaffold + Game Loop

**Files:**
- Create: `~/game/water/index.html`
- Create: `~/game/water/style.css`
- Create: `~/game/water/js/main.js`
- Create: `~/game/water/lib/matter.min.js` (via curl)

- [ ] **Step 1: Download Matter.js**

```bash
curl -L "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js" \
  -o ~/game/water/lib/matter.min.js
wc -c ~/game/water/lib/matter.min.js
```
Expected: file size ~200KB

- [ ] **Step 2: Write index.html**

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Water Puzzle</title>
  <link rel="stylesheet" href="style.css">
  <script src="lib/matter.min.js"></script>
</head>
<body>
  <canvas id="game-canvas" width="480" height="720"></canvas>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Write style.css**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #2a2a2a;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  overflow: hidden;
}
#game-canvas {
  display: block;
  background: #FFF8F0;
  cursor: crosshair;
  touch-action: none;
  max-height: 100vh;
  max-width: 100vw;
}
```

- [ ] **Step 4: Write js/main.js (scaffold only)**

```javascript
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const W = 480, H = 720;

let lastTime = 0;

function drawGrid() {
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function gameLoop(timestamp) {
  const delta = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;
  ctx.clearRect(0, 0, W, H);
  drawGrid();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

- [ ] **Step 5: Start dev server and verify canvas renders**

```bash
cd ~/game/water && python3 -m http.server 8080 &
open http://localhost:8080
```
Expected: cream-colored canvas with faint grid on dark background

- [ ] **Step 6: Commit**

```bash
cd ~/game/water
git init
git add index.html style.css js/main.js lib/matter.min.js
git commit -m "feat: project scaffold with canvas game loop"
```

---

## Task 2: Physics Engine Wrapper

**Files:**
- Create: `~/game/water/js/physics.js`

- [ ] **Step 1: Write js/physics.js**

```javascript
const { Engine, World, Bodies } = Matter;

export class PhysicsEngine {
  constructor(width, height) {
    this.engine = Engine.create();
    this.engine.gravity.y = 2;
    this.world = this.engine.world;
    this.width = width;
    this.height = height;
    this._addBounds();
  }

  _addBounds() {
    const t = 50, W = this.width, H = this.height;
    World.add(this.world, [
      Bodies.rectangle(W/2, -t/2, W, t, { isStatic: true, label: 'bound', friction: 0 }),
      Bodies.rectangle(W/2, H + t/2, W, t, { isStatic: true, label: 'bound', friction: 0 }),
      Bodies.rectangle(-t/2, H/2, t, H, { isStatic: true, label: 'bound', friction: 0 }),
      Bodies.rectangle(W + t/2, H/2, t, H, { isStatic: true, label: 'bound', friction: 0 }),
    ]);
  }

  // Add a static line segment as a thin rectangle
  addStaticSegment(x1, y1, x2, y2, thickness = 10, label = 'wall') {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return null;
    const angle = Math.atan2(dy, dx);
    const body = Bodies.rectangle(
      (x1 + x2) / 2, (y1 + y2) / 2,
      len, thickness,
      { isStatic: true, angle, label, friction: 0.3, restitution: 0.1 }
    );
    World.add(this.world, body);
    return body;
  }

  // Add a dynamic water particle
  addWaterParticle(x, y) {
    const body = Bodies.circle(x, y, 6, {
      restitution: 0.05,
      friction: 0.5,
      frictionAir: 0.01,
      density: 0.002,
      label: 'water',
    });
    World.add(this.world, body);
    return body;
  }

  removeBody(body) {
    World.remove(this.world, body);
  }

  // Remove all non-bound bodies (for level reset)
  clearLevel() {
    const toRemove = this.world.bodies.filter(b => b.label !== 'bound');
    toRemove.forEach(b => World.remove(this.world, b));
  }

  step(delta) {
    Engine.update(this.engine, delta);
  }
}
```

- [ ] **Step 2: Wire physics into main.js and verify via console**

Add to top of `js/main.js`:
```javascript
import { PhysicsEngine } from './physics.js';
const physics = new PhysicsEngine(W, H);
```

Add to `gameLoop` before `requestAnimationFrame`:
```javascript
physics.step(delta);
```

- [ ] **Step 3: Open browser console and verify no errors**

```
open http://localhost:8080
# Open DevTools console — expect no errors
# Type: physics.engine.gravity.y
# Expected: 2
```

- [ ] **Step 4: Commit**

```bash
cd ~/game/water
git add js/physics.js js/main.js
git commit -m "feat: Matter.js physics engine wrapper"
```

---

## Task 3: Drawing System

**Files:**
- Create: `~/game/water/js/drawing.js`
- Modify: `~/game/water/js/main.js`

- [ ] **Step 1: Write js/drawing.js**

```javascript
export class DrawingSystem {
  constructor(canvas, physics) {
    this.canvas = canvas;
    this.physics = physics;
    this.strokes = [];       // [{id, bodies, points, inkUsed}]
    this.currentPoints = [];
    this.isDrawing = false;
    this.enabled = true;
    this.maxInk = 300;
    this.inkUsed = 0;
    this._nextId = 0;
    this._bindEvents();
  }

  _bindEvents() {
    const c = this.canvas;
    c.addEventListener('mousedown', e => this._onStart(this._pos(e)));
    c.addEventListener('mousemove', e => this._onMove(this._pos(e)));
    c.addEventListener('mouseup', () => this._onEnd());
    c.addEventListener('mouseleave', () => this._onEnd());
    c.addEventListener('touchstart', e => { e.preventDefault(); this._onStart(this._pos(e.touches[0])); }, { passive: false });
    c.addEventListener('touchmove', e => { e.preventDefault(); this._onMove(this._pos(e.touches[0])); }, { passive: false });
    c.addEventListener('touchend', e => { e.preventDefault(); this._onEnd(); }, { passive: false });
  }

  _pos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  _onStart({ x, y }) {
    if (!this.enabled) return;
    const hit = this._hitTest(x, y);
    if (hit) { this._deleteStroke(hit); return; }
    if (this.inkUsed >= this.maxInk) return;
    this.isDrawing = true;
    this.currentPoints = [{ x, y }];
  }

  _onMove({ x, y }) {
    if (!this.isDrawing) return;
    const last = this.currentPoints[this.currentPoints.length - 1];
    if ((x - last.x) ** 2 + (y - last.y) ** 2 >= 25) {
      this.currentPoints.push({ x, y });
    }
  }

  _onEnd() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    const pts = this.currentPoints;
    if (pts.length < 2) { this.currentPoints = []; return; }

    // Calculate total length of this stroke
    let totalLen = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      totalLen += Math.hypot(pts[i+1].x - pts[i].x, pts[i+1].y - pts[i].y);
    }
    if (totalLen < 20) { this.currentPoints = []; return; }

    const available = this.maxInk - this.inkUsed;
    const inkBudget = Math.min(totalLen, available);

    const id = this._nextId++;
    const bodies = [];
    const usedPts = [pts[0]];
    let inkUsed = 0;

    for (let i = 0; i < pts.length - 1; i++) {
      const segLen = Math.hypot(pts[i+1].x - pts[i].x, pts[i+1].y - pts[i].y);
      if (inkUsed + segLen > inkBudget + 0.5) break;
      inkUsed += segLen;
      usedPts.push(pts[i + 1]);
      const body = this.physics.addStaticSegment(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, 6, `stroke_${id}`);
      if (body) bodies.push(body);
    }

    if (bodies.length === 0) { this.currentPoints = []; return; }
    this.inkUsed += inkUsed;
    this.strokes.push({ id, bodies, points: usedPts, inkUsed });
    this.currentPoints = [];
  }

  _hitTest(x, y) {
    for (const stroke of this.strokes) {
      const pts = stroke.points;
      for (let i = 0; i < pts.length - 1; i++) {
        if (this._nearSeg(x, y, pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, 14)) return stroke;
      }
    }
    return null;
  }

  _nearSeg(px, py, ax, ay, bx, by, thresh) {
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx*dx + dy*dy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px-ax)*dx + (py-ay)*dy) / lenSq));
    return Math.hypot(px - (ax + t*dx), py - (ay + t*dy)) < thresh;
  }

  _deleteStroke(stroke) {
    stroke.bodies.forEach(b => this.physics.removeBody(b));
    this.inkUsed -= stroke.inkUsed;
    this.strokes = this.strokes.filter(s => s.id !== stroke.id);
  }

  render(ctx) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#C8A882';
    for (const stroke of this.strokes) {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
    if (this.isDrawing && this.currentPoints.length > 1) {
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(this.currentPoints[0].x, this.currentPoints[0].y);
      this.currentPoints.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  reset() {
    this.strokes.forEach(s => s.bodies.forEach(b => this.physics.removeBody(b)));
    this.strokes = [];
    this.inkUsed = 0;
    this.isDrawing = false;
    this.currentPoints = [];
  }

  setEnabled(v) { this.enabled = v; }
  setMaxInk(v) { this.maxInk = v; }
  getInkRatio() { return this.inkUsed / this.maxInk; }
}
```

- [ ] **Step 2: Wire drawing into main.js**

Replace `js/main.js` with:
```javascript
import { PhysicsEngine } from './physics.js';
import { DrawingSystem } from './drawing.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const W = 480, H = 720;

const physics = new PhysicsEngine(W, H);
const drawing = new DrawingSystem(canvas, physics);

let lastTime = 0;

function drawGrid() {
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function gameLoop(timestamp) {
  const delta = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;
  physics.step(delta);
  ctx.clearRect(0, 0, W, H);
  drawGrid();
  drawing.render(ctx);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

- [ ] **Step 3: Test drawing in browser**

```
open http://localhost:8080
```
- Draw lines with mouse → lines appear in warm tan color
- Click on an existing line → it disappears (ink returns)
- Draw until ink runs out → can no longer draw new lines

- [ ] **Step 4: Commit**

```bash
cd ~/game/water
git add js/drawing.js js/main.js
git commit -m "feat: drawing system with ink limit and stroke deletion"
```

---

## Task 4: Water Particle System

**Files:**
- Create: `~/game/water/js/water.js`

- [ ] **Step 1: Write js/water.js**

```javascript
export class WaterSystem {
  constructor(physics) {
    this.physics = physics;
    this.particles = [];
    this.triggered = false;
    this.totalCount = 60;
    this.spawned = 0;
    this.spawnTimer = 0;
    this.SPAWN_INTERVAL = 80;
    this.source = { x: 0, y: 0 };
  }

  configure(sourceX, sourceY, count = 60) {
    this.source = { x: sourceX, y: sourceY };
    this.totalCount = count;
  }

  trigger() {
    if (!this.triggered) this.triggered = true;
  }

  isTriggered() { return this.triggered; }

  isDone() { return this.spawned >= this.totalCount; }

  allSettled() {
    if (!this.isDone()) return false;
    return this.particles.every(p => {
      const v = p.velocity;
      return v.x * v.x + v.y * v.y < 0.5;
    });
  }

  update(delta) {
    if (!this.triggered) return;
    this.spawnTimer += delta;
    while (this.spawnTimer >= this.SPAWN_INTERVAL && this.spawned < this.totalCount) {
      const jitter = (Math.random() - 0.5) * 10;
      this.particles.push(this.physics.addWaterParticle(this.source.x + jitter, this.source.y));
      this.spawned++;
      this.spawnTimer -= this.SPAWN_INTERVAL;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = '#89CFF0';
    for (const p of this.particles) {
      const { x, y } = p.position;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  countInZone(zone) {
    return this.particles.filter(p => {
      const { x, y } = p.position;
      return x >= zone.x && x <= zone.x + zone.width &&
             y >= zone.y && y <= zone.y + zone.height;
    }).length;
  }

  reset() {
    this.particles.forEach(b => this.physics.removeBody(b));
    this.particles = [];
    this.triggered = false;
    this.spawned = 0;
    this.spawnTimer = 0;
  }
}
```

- [ ] **Step 2: Add a test wall and water source to main.js**

Add at the bottom of main.js imports section:
```javascript
import { WaterSystem } from './water.js';
```

Add after `const drawing = ...`:
```javascript
const water = new WaterSystem(physics);
water.configure(100, 80);
// Test wall — remove after verifying
physics.addStaticSegment(30, 200, 280, 200, 10, 'test_wall');
```

Add `water.update(delta)` and `water.render(ctx)` calls inside `gameLoop`:
```javascript
function gameLoop(timestamp) {
  const delta = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;
  physics.step(delta);
  water.update(delta);
  ctx.clearRect(0, 0, W, H);
  drawGrid();
  drawing.render(ctx);
  water.render(ctx);
  requestAnimationFrame(gameLoop);
}
```

Add a temporary spacebar trigger for testing:
```javascript
document.addEventListener('keydown', e => {
  if (e.code === 'Space') water.trigger();
});
```

- [ ] **Step 3: Test water particles in browser**

```
open http://localhost:8080
```
- Press Space → blue particles fall from (100, 80)
- Particles bounce off the test wall at y=200
- Particles settle at the bottom

- [ ] **Step 4: Remove test wall and spacebar listener** (clean up before committing)

Remove these lines from main.js:
```javascript
// Remove: physics.addStaticSegment(30, 200, 280, 200, 10, 'test_wall');
// Remove: document.addEventListener('keydown', ...)
```

- [ ] **Step 5: Commit**

```bash
cd ~/game/water
git add js/water.js js/main.js
git commit -m "feat: water particle system with one-time trigger"
```

---

## Task 5: Level Data

**Files:**
- Create: `~/game/water/js/levels/level1.js`
- Create: `~/game/water/js/levels/level2.js`
- Create: `~/game/water/js/levels/level3.js`
- Create: `~/game/water/js/levels/index.js`

Canvas is 480×720. All coordinates are in canvas pixels.

- [ ] **Step 1: Write js/levels/level1.js** (Tutorial — one diagonal line needed)

```javascript
// Level 1: Water falls from top-left, hits a shelf.
// Player draws one diagonal line from shelf edge → container.
export const level1 = {
  id: 1,
  name: '初識水流',
  maxInk: 280,
  particleCount: 60,
  fillThreshold: 32,
  source: { x: 100, y: 70 },
  // Pre-built static walls (rendered as teal pipes)
  walls: [
    { x1: 30,  y1: 130, x2: 30,  y2: 280 },  // left vertical pipe
    { x1: 30,  y1: 280, x2: 240, y2: 280 },  // horizontal shelf
  ],
  // Triangular container (open top): two angled sides + flat bottom
  container: {
    cx: 320, cy: 580,
    walls: [
      { x1: 210, y1: 490, x2: 270, y2: 650 },  // left side
      { x1: 430, y1: 490, x2: 370, y2: 650 },  // right side
      { x1: 270, y1: 650, x2: 370, y2: 650 },  // bottom
    ],
    fillZone: { x: 218, y: 535, width: 184, height: 110 },
    fillLineY: 540,
    // Face center for expression rendering
    faceX: 320, faceY: 580,
  },
};
```

- [ ] **Step 2: Write js/levels/level2.js** (Obstacle — draw bridge over/around blocker)

```javascript
// Level 2: Water falls from top-center.
// A horizontal blocker diverts it. Player must bridge to the right container.
export const level2 = {
  id: 2,
  name: '繞過障礙',
  maxInk: 320,
  particleCount: 60,
  fillThreshold: 32,
  source: { x: 80, y: 70 },
  walls: [
    { x1: 30,  y1: 200, x2: 30,  y2: 330 },  // left vertical
    { x1: 30,  y1: 330, x2: 200, y2: 330 },  // left shelf
    // Gap here (x=200 to x=290) — player bridges it
    { x1: 290, y1: 250, x2: 290, y2: 400 },  // right vertical blocker
    { x1: 290, y1: 400, x2: 450, y2: 400 },  // right shelf
  ],
  container: {
    cx: 370, cy: 590,
    walls: [
      { x1: 260, y1: 500, x2: 315, y2: 660 },
      { x1: 480, y1: 500, x2: 425, y2: 660 },
      { x1: 315, y1: 660, x2: 425, y2: 660 },
    ],
    fillZone: { x: 268, y: 545, width: 204, height: 110 },
    fillLineY: 550,
    faceX: 370, faceY: 590,
  },
};
```

- [ ] **Step 3: Write js/levels/level3.js** (Multi-line — bridge gap + redirect)

```javascript
// Level 3: Pipe has a gap mid-way, and the exit pipe goes wrong direction.
// Player needs two lines: one to bridge the gap, one to redirect to container.
export const level3 = {
  id: 3,
  name: '精準導流',
  maxInk: 360,
  particleCount: 60,
  fillThreshold: 28,
  source: { x: 80, y: 70 },
  walls: [
    { x1: 30,  y1: 140, x2: 30,  y2: 260 },  // left drop pipe
    { x1: 30,  y1: 260, x2: 170, y2: 260 },  // left pipe section
    // Gap x=170 to x=280 — player bridges it
    { x1: 280, y1: 260, x2: 450, y2: 260 },  // right pipe section
    { x1: 450, y1: 260, x2: 450, y2: 460 },  // right drop pipe
    // Water exits right pipe going down toward bottom-right — player redirects left
  ],
  container: {
    cx: 200, cy: 600,
    walls: [
      { x1:  90, y1: 510, x2: 145, y2: 670 },
      { x1: 310, y1: 510, x2: 255, y2: 670 },
      { x1: 145, y1: 670, x2: 255, y2: 670 },
    ],
    fillZone: { x: 98, y: 555, width: 204, height: 110 },
    fillLineY: 560,
    faceX: 200, faceY: 600,
  },
};
```

- [ ] **Step 4: Write js/levels/index.js**

```javascript
import { level1 } from './level1.js';
import { level2 } from './level2.js';
import { level3 } from './level3.js';

export const levels = [level1, level2, level3];
```

- [ ] **Step 5: Commit**

```bash
cd ~/game/water
git add js/levels/
git commit -m "feat: level data for 3 levels"
```

---

## Task 6: UI System

**Files:**
- Create: `~/game/water/js/ui.js`

- [ ] **Step 1: Write js/ui.js**

```javascript
export class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.W = canvas.width;
    this._onSourceClick = null;
    this._onReset = null;
    this._onBack = null;
    this._onNext = null;
    canvas.addEventListener('click', e => this._handleClick(e));
    canvas.addEventListener('touchend', e => { e.preventDefault(); this._handleClick(e.changedTouches[0]); }, { passive: false });
  }

  _pos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  _handleClick(e) {
    const { x, y } = this._pos(e);
    // Back button: top-left 50×50
    if (x < 60 && y < 60 && this._onBack) { this._onBack(); return; }
    // Reset button: top-right 50×50
    if (x > this.W - 60 && y < 60 && this._onReset) { this._onReset(); return; }
    // Source button and next/retry checked via registered callbacks from main.js
    if (this._clickHandler) this._clickHandler(x, y);
  }

  on(event, fn) {
    if (event === 'back') this._onBack = fn;
    if (event === 'reset') this._onReset = fn;
    if (event === 'click') this._clickHandler = fn;
  }

  renderTopBar(ctx, inkRatio) {
    // Back arrow
    ctx.fillStyle = '#8B7355';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('←', 18, 42);
    // Reset icon
    ctx.fillText('↺', this.W - 48, 42);
    // Ink bar background
    const barX = 70, barY = 16, barW = this.W - 140, barH = 20;
    ctx.fillStyle = '#E8D5C0';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 10);
    ctx.fill();
    // Ink bar fill
    const fillW = barW * Math.max(0, 1 - inkRatio);
    if (fillW > 0) {
      ctx.fillStyle = '#C8A882';
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillW, barH, 10);
      ctx.fill();
    }
    // Ink label
    ctx.fillStyle = '#8B7355';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✏️ 墨水', this.W / 2, barY + barH + 12);
    ctx.textAlign = 'left';
  }

  renderSourceButton(ctx, sourceX, sourceY, triggered) {
    const r = 28;
    ctx.save();
    ctx.fillStyle = triggered ? '#C0C0C0' : '#FFD580';
    ctx.beginPath();
    ctx.arc(sourceX, sourceY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = triggered ? '#999' : '#B8860B';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = triggered ? '#999' : '#5a3e00';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💧', sourceX, sourceY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  renderWalls(ctx, walls) {
    ctx.strokeStyle = '#89A8AA';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (const w of walls) {
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
    }
  }

  renderContainer(ctx, container, fillRatio) {
    // Container walls
    ctx.strokeStyle = '#89A8AA';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (const w of container.walls) {
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
    }
    // Dashed fill line
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    const z = container.fillZone;
    ctx.beginPath();
    ctx.moveTo(z.x + 10, container.fillLineY);
    ctx.lineTo(z.x + z.width - 10, container.fillLineY);
    ctx.stroke();
    ctx.setLineDash([]);
    // Cup face
    const face = this._getFace(fillRatio);
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(face, container.faceX, container.faceY + 30);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  _getFace(ratio) {
    if (ratio >= 1.0) return '😄';
    if (ratio >= 0.8) return '😊';
    if (ratio >= 0.5) return '👀';
    return '😟';
  }

  renderWin(ctx, stars) {
    ctx.fillStyle = 'rgba(255,248,240,0.88)';
    ctx.fillRect(0, 0, this.W, 720);
    ctx.fillStyle = '#5a3e00';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('過關！', this.W / 2, 300);
    ctx.font = '50px sans-serif';
    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    ctx.fillText(starStr, this.W / 2, 380);
    // Next button
    ctx.fillStyle = '#FFD580';
    ctx.beginPath();
    ctx.roundRect(this.W/2 - 90, 440, 180, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#5a3e00';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('下一關 →', this.W / 2, 476);
    ctx.textAlign = 'left';
  }

  renderFail(ctx) {
    ctx.fillStyle = 'rgba(255,248,240,0.88)';
    ctx.fillRect(0, 0, this.W, 720);
    ctx.fillStyle = '#5a3e00';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('水不夠喝 😢', this.W / 2, 320);
    ctx.fillStyle = '#FFD580';
    ctx.beginPath();
    ctx.roundRect(this.W/2 - 90, 400, 180, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#5a3e00';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('再試一次', this.W / 2, 436);
    ctx.textAlign = 'left';
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/game/water
git add js/ui.js
git commit -m "feat: UI system for ink bar, buttons, win/fail overlays"
```

---

## Task 7: Game State Machine (Wire Everything Together)

**Files:**
- Replace: `~/game/water/js/main.js`

- [ ] **Step 1: Replace js/main.js with full game state machine**

```javascript
import { PhysicsEngine } from './physics.js';
import { DrawingSystem } from './drawing.js';
import { WaterSystem } from './water.js';
import { UI } from './ui.js';
import { levels } from './levels/index.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const W = 480, H = 720;

const STATES = { DRAWING: 'DRAWING', FLOWING: 'FLOWING', WIN: 'WIN', FAIL: 'FAIL' };

let state = STATES.DRAWING;
let currentLevelIndex = 0;
let currentLevel = null;
let flowEndTimer = 0;
const GRACE_PERIOD = 3500; // ms after all particles spawned before evaluating

const physics = new PhysicsEngine(W, H);
const drawing = new DrawingSystem(canvas, physics);
const water = new WaterSystem(physics);
const ui = new UI(canvas);

// Win overlay next-button click zone: center ~(W/2, 468), 180×56
// Fail overlay retry-button click zone: center ~(W/2, 428), 180×56
ui.on('click', (x, y) => {
  if (state === STATES.WIN) {
    if (x > W/2 - 90 && x < W/2 + 90 && y > 440 && y < 496) nextLevel();
  } else if (state === STATES.FAIL) {
    if (x > W/2 - 90 && x < W/2 + 90 && y > 400 && y < 456) resetLevel();
  } else if (state === STATES.DRAWING) {
    // Source button hit test
    const src = currentLevel.source;
    if (Math.hypot(x - src.x, y - src.y) < 32) triggerWater();
  }
});

ui.on('reset', () => resetLevel());
ui.on('back', () => { currentLevelIndex = 0; resetLevel(); });

function loadLevel(index) {
  currentLevel = levels[index];
  drawing.reset();   // removes drawn bodies from physics first
  water.reset();     // removes particle bodies from physics first
  physics.clearLevel(); // then clear remaining level wall bodies
  drawing.setMaxInk(currentLevel.maxInk);
  drawing.setEnabled(true);
  water.configure(currentLevel.source.x, currentLevel.source.y, currentLevel.particleCount);
  state = STATES.DRAWING;
  flowEndTimer = 0;

  // Add level walls to physics
  currentLevel.walls.forEach(w => {
    physics.addStaticSegment(w.x1, w.y1, w.x2, w.y2, w.thickness || 10, 'level_wall');
  });
  currentLevel.container.walls.forEach(w => {
    physics.addStaticSegment(w.x1, w.y1, w.x2, w.y2, 10, 'container_wall');
  });
}

function triggerWater() {
  if (state !== STATES.DRAWING) return;
  water.trigger();
  state = STATES.FLOWING;
}

function resetLevel() {
  loadLevel(currentLevelIndex);
}

function nextLevel() {
  currentLevelIndex = (currentLevelIndex + 1) % levels.length;
  loadLevel(currentLevelIndex);
}

function evaluate() {
  const count = water.countInZone(currentLevel.container.fillZone);
  if (count >= currentLevel.fillThreshold) {
    state = STATES.WIN;
    drawing.setEnabled(false);
  } else {
    state = STATES.FAIL;
    drawing.setEnabled(false);
  }
}

function calcStars() {
  const r = drawing.getInkRatio();
  return r <= 0.33 ? 3 : r <= 0.66 ? 2 : 1;
}

function calcFillRatio() {
  const count = water.countInZone(currentLevel.container.fillZone);
  return Math.min(1, count / currentLevel.fillThreshold);
}

let lastTime = 0;

function drawGrid() {
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function gameLoop(timestamp) {
  const delta = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;

  // Update
  physics.step(delta);
  water.update(delta);
  if (state === STATES.FLOWING && water.isDone()) {
    flowEndTimer += delta;
    if (flowEndTimer >= GRACE_PERIOD) evaluate();
  }

  // Render
  ctx.clearRect(0, 0, W, H);
  drawGrid();

  if (currentLevel) {
    ui.renderWalls(ctx, currentLevel.walls);
    const fillRatio = calcFillRatio();
    ui.renderContainer(ctx, currentLevel.container, fillRatio);
    ui.renderSourceButton(ctx, currentLevel.source.x, currentLevel.source.y, water.isTriggered());
  }

  drawing.render(ctx);
  water.render(ctx);

  if (currentLevel) {
    ui.renderTopBar(ctx, drawing.getInkRatio());
  }

  if (state === STATES.WIN) ui.renderWin(ctx, calcStars());
  if (state === STATES.FAIL) ui.renderFail(ctx);

  requestAnimationFrame(gameLoop);
}

// Start
loadLevel(0);
requestAnimationFrame(gameLoop);
```

- [ ] **Step 2: Test full game flow in browser**

```
open http://localhost:8080
```
Verify:
- Level 1 loads: shelf walls visible, triangular container at bottom, sad face on container
- Draw a diagonal line from shelf edge toward container
- Click 💧 source button → water flows, source grays out
- Water fills container → 3.5s after spawning completes → win/fail overlay appears
- Click 下一關 → Level 2 loads
- Reset button (↺) restarts current level

- [ ] **Step 3: Commit**

```bash
cd ~/game/water
git add js/main.js
git commit -m "feat: full game state machine wiring all systems together"
```

---

## Task 8: Visual Polish

**Files:**
- Modify: `~/game/water/js/water.js`
- Modify: `~/game/water/js/ui.js`

- [ ] **Step 1: Improve particle rendering — layered transparency for liquid feel**

In `water.js`, replace the `render` method:
```javascript
render(ctx) {
  if (this.particles.length === 0) return;
  ctx.save();
  // Draw shadow layer for depth
  for (const p of this.particles) {
    const { x, y } = p.position;
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#5ba8d4';
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  // Draw main particle
  for (const p of this.particles) {
    const { x, y } = p.position;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#89CFF0';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#d6eeff';
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
```

- [ ] **Step 2: Add level name display to top bar in ui.js**

In `ui.js`, update `renderTopBar` to accept a level name and display it:
```javascript
renderTopBar(ctx, inkRatio, levelName = '') {
  // Back arrow
  ctx.fillStyle = '#8B7355';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('←', 18, 42);
  // Reset icon
  ctx.fillText('↺', this.W - 48, 42);
  // Ink bar background
  const barX = 70, barY = 16, barW = this.W - 140, barH = 20;
  ctx.fillStyle = '#E8D5C0';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 10);
  ctx.fill();
  // Ink bar fill
  const fillW = barW * Math.max(0, 1 - inkRatio);
  if (fillW > 0) {
    const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    grad.addColorStop(0, '#D4956A');
    grad.addColorStop(1, '#C8A882');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillW, barH, 10);
    ctx.fill();
  }
  // Level name
  if (levelName) {
    ctx.fillStyle = '#8B7355';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(levelName, this.W / 2, barY + barH + 12);
    ctx.textAlign = 'left';
  }
}
```

- [ ] **Step 3: Update main.js to pass levelName to renderTopBar**

In `gameLoop`, change the `renderTopBar` call:
```javascript
ui.renderTopBar(ctx, drawing.getInkRatio(), currentLevel ? currentLevel.name : '');
```

- [ ] **Step 4: Add gentle pulsing animation to source button when untriggered**

In `ui.js`, update `renderSourceButton` to accept timestamp for pulse:
```javascript
renderSourceButton(ctx, sourceX, sourceY, triggered, t = 0) {
  const r = triggered ? 26 : 26 + Math.sin(t / 400) * 3;
  ctx.save();
  if (!triggered) {
    ctx.shadowColor = '#FFD580';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = triggered ? '#C0C0C0' : '#FFD580';
  ctx.beginPath();
  ctx.arc(sourceX, sourceY, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = triggered ? '#999' : '#B8860B';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.fillStyle = triggered ? '#aaa' : '#5a3e00';
  ctx.font = `${triggered ? 18 : 20}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💧', sourceX, sourceY);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}
```

In `main.js`, pass timestamp to source button render:
```javascript
ui.renderSourceButton(ctx, currentLevel.source.x, currentLevel.source.y, water.isTriggered(), lastTime);
```

- [ ] **Step 5: Final visual test in browser**

```
open http://localhost:8080
```
Verify:
- Particles have highlight + shadow for depth
- Ink bar has gradient fill
- Source button pulses gently before triggered
- Level name appears under ink bar
- Cup face changes from 😟 → 😊 → 😄 as water fills

- [ ] **Step 6: Final commit**

```bash
cd ~/game/water
git add js/water.js js/ui.js js/main.js
git commit -m "feat: visual polish — particle depth, gradient ink bar, source pulse, cup expressions"
```

---

## Spec Coverage Check

| Spec requirement | Covered in |
|-----------------|------------|
| 畫線導流 drawing mechanics | Task 3 |
| 線條變成物理實體 | Task 3 (physics.addStaticSegment) |
| 2D 物理引擎 | Task 2 (Matter.js) |
| 水流模擬 / 粒子 | Task 4 |
| 物體互動（橋/擋板） | Task 3 + Task 2 (static bodies) |
| 墨水條限制 | Task 3 (inkUsed/maxInk) + Task 6 (bar UI) |
| 星級評等 1-3 | Task 7 (calcStars) |
| 水源只能按一次 | Task 4 (triggered flag) |
| 日系奶油風 | Task 1 (palette) + Task 8 |
| 杯子表情系統 | Task 6 (_getFace) |
| 3 關 | Task 5 |
| 粒子球水流 | Task 4 + Task 8 |
