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
