export class DrawingSystem {
  constructor(canvas, physics) {
    this.canvas = canvas;
    this.physics = physics;
    this.strokes = [];
    this.currentPoints = [];
    this.isDrawing = false;
    this.enabled = true;
    this.maxInk = 300;
    this.inkUsed = 0;
    this._nextId = 0;
    this.autoMakeDynamic = false;
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
    // lowered threshold: 3px minimum between sample points (was 5px)
    if ((x - last.x) ** 2 + (y - last.y) ** 2 >= 9) {
      this.currentPoints.push({ x, y });
    }
  }

  // Returns true (once) if the last pointer-up created a stroke — use to suppress toggle.
  consumeJustDrew() {
    const v = Boolean(this._justDrew);
    this._justDrew = false;
    return v;
  }

  _onEnd() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this._justDrew = false;
    const pts = this.currentPoints;
    if (pts.length < 2) { this.currentPoints = []; return; }

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
      if (inkUsed + segLen > inkBudget) break;
      inkUsed += segLen;
      usedPts.push(pts[i + 1]);
      const body = this.physics.addStaticSegment(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, 6, `stroke_${id}`);
      if (body) {
        // store half-length for dynamic rendering after lift
        const dx = pts[i+1].x - pts[i].x, dy = pts[i+1].y - pts[i].y;
        body._halfLen = Math.sqrt(dx*dx + dy*dy) / 2;
        bodies.push(body);
      }
    }

    if (bodies.length === 0) { this.currentPoints = []; return; }
    this.inkUsed = Math.min(this.inkUsed + inkUsed, this.maxInk);
    const stroke = { id, bodies, points: usedPts, inkUsed, isDynamic: false };
    this.strokes.push(stroke);
    this.currentPoints = [];
    this._justDrew = true;

    // in flowing phase: immediately release line to gravity on finger lift
    if (this.autoMakeDynamic) {
      stroke.isDynamic = true;
      stroke.bodies.forEach(b => this.physics.makeDynamic(b));
    }
  }

  _hitTest(x, y) {
    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const stroke = this.strokes[i];
      if (stroke.isDynamic) continue;
      const pts = stroke.points;
      for (let i2 = 0; i2 < pts.length - 1; i2++) {
        if (this._nearSeg(x, y, pts[i2].x, pts[i2].y, pts[i2+1].x, pts[i2+1].y, 14)) return stroke;
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
    this.inkUsed = Math.max(0, this.inkUsed - stroke.inkUsed);
    this.strokes = this.strokes.filter(s => s.id !== stroke.id);
  }

  makeAllDynamic() {
    this.autoMakeDynamic = true;
    this.strokes.forEach(stroke => {
      if (!stroke.isDynamic) {
        stroke.isDynamic = true;
        stroke.bodies.forEach(b => this.physics.makeDynamic(b));
      }
    });
  }

  // call each frame to remove strokes that have fallen off canvas
  update(canvasH) {
    this.strokes = this.strokes.filter(stroke => {
      if (!stroke.isDynamic) return true;
      const allGone = stroke.bodies.every(b => b.position.y > canvasH + 60);
      if (allGone) {
        stroke.bodies.forEach(b => this.physics.removeBody(b));
        this.inkUsed = Math.max(0, this.inkUsed - stroke.inkUsed);
        return false;
      }
      return true;
    });
  }

  render(ctx) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of this.strokes) {
      if (stroke.isDynamic) {
        // render each segment at its current physics position
        for (const body of stroke.bodies) {
          const { x, y } = body.position;
          const hl = body._halfLen || 20;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(body.angle);
          ctx.globalAlpha = 0.75;
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#C8A882';
          ctx.beginPath();
          ctx.moveTo(-hl, 0);
          ctx.lineTo(hl, 0);
          ctx.stroke();
          ctx.restore();
        }
      } else {
        ctx.globalAlpha = 1;
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#C8A882';
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
    }

    // preview line while drawing
    if (this.isDrawing && this.currentPoints.length > 1) {
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#C8A882';
      ctx.beginPath();
      ctx.moveTo(this.currentPoints[0].x, this.currentPoints[0].y);
      this.currentPoints.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }

    ctx.restore();
  }

  reset() {
    this.strokes.forEach(s => s.bodies.forEach(b => this.physics.removeBody(b)));
    this.strokes = [];
    this.inkUsed = 0;
    this.isDrawing = false;
    this.currentPoints = [];
    this.autoMakeDynamic = false;
  }

  setEnabled(v) { this.enabled = v; }
  setMaxInk(v) { this.maxInk = v; }
  getInkRatio() { return this.inkUsed / this.maxInk; }
}
