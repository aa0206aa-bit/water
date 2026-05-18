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
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();
}

function gameLoop(timestamp) {
  if (lastTime === 0) lastTime = timestamp;
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
    ui.renderSourceButton(ctx, currentLevel.source.x, currentLevel.source.y, water.isTriggered(), lastTime);
  }

  drawing.render(ctx);
  water.render(ctx);

  if (currentLevel) {
    ui.renderTopBar(ctx, drawing.getInkRatio(), currentLevel.name);
  }

  if (state === STATES.WIN) ui.renderWin(ctx, calcStars());
  if (state === STATES.FAIL) ui.renderFail(ctx);

  requestAnimationFrame(gameLoop);
}

// Start
loadLevel(0);
requestAnimationFrame(gameLoop);
