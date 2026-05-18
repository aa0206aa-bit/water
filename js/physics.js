if (typeof Matter === 'undefined') {
  throw new Error('Matter.js must be loaded as a classic <script> before physics.js');
}
const { Engine, World, Bodies } = Matter;

export class PhysicsEngine {
  constructor(width, height) {
    this.engine = Engine.create();
    this.engine.gravity.y = 2; // 2× default; feels water-like at 480×720 px scale
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

  // Returns null if segment is degenerate (<1px); callers must guard.
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

  // Removes all direct-child bodies except bounds. Only works for bodies added
  // directly to this.world (not nested composites).
  clearLevel() {
    const toRemove = this.world.bodies.filter(b => b.label !== 'bound');
    toRemove.forEach(b => World.remove(this.world, b));
  }

  step(delta) {
    Engine.update(this.engine, delta);
  }
}
