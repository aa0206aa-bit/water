const SPAWN_INTERVAL = 80;

export class WaterSystem {
  constructor(physics) {
    this.physics = physics;
    this.particles = [];
    this.triggered = false;
    this.paused = false;
    this.totalCount = 60;
    this.spawned = 0;
    this.spawnTimer = 0;
    this.source = { x: 0, y: 0 };
  }

  configure(sourceX, sourceY, count = 60) {
    this.source = { x: sourceX, y: sourceY };
    this.totalCount = count;
  }

  trigger() {
    if (!this.triggered) this.triggered = true;
  }

  setFlowing(active) {
    if (active && !this.triggered) this.triggered = true;
    this.paused = !active;
  }

  isFlowing() { return this.triggered && !this.paused; }
  isTriggered() { return this.triggered; }

  isDone() { return this.spawned >= this.totalCount; }

  allSettled() {
    if (!this.isDone()) return false;
    return this.particles.every(p => {
      const v = Matter.Body.getVelocity(p);
      return v.x * v.x + v.y * v.y < 0.5;
    });
  }

  update(delta) {
    if (!this.triggered || this.paused) return;
    this.spawnTimer += delta;
    while (this.spawnTimer >= SPAWN_INTERVAL && this.spawned < this.totalCount) {
      const jitter = (Math.random() - 0.5) * 10;
      this.particles.push(this.physics.addWaterParticle(this.source.x + jitter, this.source.y));
      this.spawned++;
      this.spawnTimer -= SPAWN_INTERVAL;
    }
  }

  render(ctx) {
    if (this.particles.length === 0) return;
    ctx.save();
    // Shadow layer for depth
    ctx.fillStyle = '#5ba8d4';
    ctx.globalAlpha = 0.15;
    for (const p of this.particles) {
      const { x, y } = p.position;
      ctx.beginPath();
      ctx.arc(x + 1, y + 1, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // Main particle
    ctx.fillStyle = '#89CFF0';
    ctx.globalAlpha = 0.7;
    for (const p of this.particles) {
      const { x, y } = p.position;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Highlight
    ctx.fillStyle = '#d6eeff';
    ctx.globalAlpha = 0.4;
    for (const p of this.particles) {
      const { x, y } = p.position;
      ctx.beginPath();
      ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
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
    this.paused = false;
    this.spawned = 0;
    this.spawnTimer = 0;
  }
}
