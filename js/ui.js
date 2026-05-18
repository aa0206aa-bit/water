export class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.W = canvas.width;
    this._onBack = null;
    this._onReset = null;
    this._clickHandler = null;
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
    if (x < 60 && y < 60 && this._onBack) { this._onBack(); return; }
    if (x > this.W - 60 && y < 60 && this._onReset) { this._onReset(); return; }
    if (this._clickHandler) this._clickHandler(x, y);
  }

  on(event, fn) {
    if (event === 'back') this._onBack = fn;
    if (event === 'reset') this._onReset = fn;
    if (event === 'click') this._clickHandler = fn;
  }

  renderTopBar(ctx, inkRatio, levelName = '') {
    ctx.fillStyle = '#8B7355';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('←', 18, 42);
    ctx.fillText('↺', this.W - 48, 42);
    const barX = 70, barY = 16, barW = this.W - 140, barH = 20;
    ctx.fillStyle = '#E8D5C0';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 10);
    ctx.fill();
    const fillW = barW * Math.max(0, 1 - inkRatio);
    if (fillW > 0) {
      ctx.fillStyle = '#C8A882';
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillW, barH, 10);
      ctx.fill();
    }
    if (levelName) {
      ctx.fillStyle = '#8B7355';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(levelName, this.W / 2, barY + barH + 12);
      ctx.textAlign = 'left';
    }
  }

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
    ctx.strokeStyle = '#89A8AA';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (const w of container.walls) {
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    const z = container.fillZone;
    ctx.beginPath();
    ctx.moveTo(z.x + 10, container.fillLineY);
    ctx.lineTo(z.x + z.width - 10, container.fillLineY);
    ctx.stroke();
    ctx.setLineDash([]);
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
