import { PhysicsEngine } from './physics.js';
import { DrawingSystem } from './drawing.js';
import { WaterSystem } from './water.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const W = 480, H = 720;

const physics = new PhysicsEngine(W, H);
const drawing = new DrawingSystem(canvas, physics);
const water = new WaterSystem(physics);

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
  if (lastTime === 0) lastTime = timestamp;
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

requestAnimationFrame(gameLoop);
