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
    ctx.save();
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
      const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
      grad.addColorStop(0, '#D4956A');
      grad.addColorStop(1, '#C8A882');
      ctx.fillStyle = grad;
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
    ctx.restore();
  }

  renderFaucet(ctx, sx, sy, isFlowing, t = 0) {
    ctx.save();

    // --- pipe body ---
    ctx.strokeStyle = '#7AADB0';
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy - 52);
    ctx.lineTo(sx, sy - 12);
    ctx.stroke();

    // --- nozzle (wider at mouth) ---
    ctx.fillStyle = '#8BBCBF';
    ctx.strokeStyle = '#5C9099';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(sx - 13, sy - 14, 26, 14, [3, 3, 7, 7]);
    ctx.fill();
    ctx.stroke();

    // --- knob ---
    const knobY = sy - 64;
    if (isFlowing) {
      ctx.shadowColor = 'rgba(255, 210, 60, 0.5)';
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = isFlowing ? '#FFD580' : '#C8B89A';
    ctx.beginPath();
    ctx.arc(sx, knobY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#8B9E9E';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // knob cross grip (rotates 45° when open)
    ctx.save();
    ctx.translate(sx, knobY);
    ctx.rotate(isFlowing ? Math.PI / 4 : 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-9, 0); ctx.lineTo(9, 0);
    ctx.moveTo(0, -9); ctx.lineTo(0, 9);
    ctx.stroke();
    ctx.restore();

    // ON / OFF text on knob
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isFlowing ? '#4a6800' : '#888';
    ctx.fillText(isFlowing ? 'ON' : 'OFF', sx, knobY);

    // --- water stream when flowing ---
    if (isFlowing) {
      ctx.strokeStyle = '#89CFF0';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      const len = 34;
      for (let i = 2; i <= len; i += 2) {
        ctx.lineTo(sx + Math.sin(t / 130 + i * 0.35) * 2.8, sy + i);
      }
      ctx.stroke();
      // drip bead at tip
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#89CFF0';
      ctx.beginPath();
      const tipX = sx + Math.sin(t / 130 + len * 0.35) * 2.8;
      ctx.arc(tipX, sy + len + 5, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 滑水道：半透明藍色水道 + 護欄線
  renderSlide(ctx, points) {
    if (!points || points.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const drawPath = () => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    };
    // 水道底色
    drawPath();
    ctx.strokeStyle = 'rgba(137,207,240,0.20)';
    ctx.lineWidth = 30;
    ctx.stroke();
    // 滑道面（主線）
    drawPath();
    ctx.strokeStyle = '#7AADB0';
    ctx.lineWidth = 8;
    ctx.stroke();
    // 高光邊
    drawPath();
    ctx.strokeStyle = 'rgba(210,242,246,0.72)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  renderWalls(ctx, walls) {
    ctx.save();
    ctx.strokeStyle = '#89A8AA';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (const w of walls) {
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderContainer(ctx, container, fillRatio) {
    ctx.save();
    if (container.funnelTopY !== undefined) {
      this._renderFunnel(ctx, container, fillRatio);
      ctx.restore();
      return;
    }
    // ── 舊版圓柱杯（backward compat）──
    const cw = container.cupWidth;
    const ch = container.cupHeight;
    const top = container.cupTop;
    const bot = top + ch;
    const cx = container.cx;
    const left = cx - cw / 2;
    const right = cx + cw / 2;

    // water fill (clipped to cup interior)
    if (fillRatio > 0) {
      ctx.save();
      const clipPath = new Path2D();
      clipPath.rect(left + 6, top, cw - 12, ch);
      ctx.clip(clipPath);
      const fillH = ch * Math.min(fillRatio, 1);
      const grad = ctx.createLinearGradient(left, bot - fillH, left, bot);
      grad.addColorStop(0, 'rgba(137,207,240,0.25)');
      grad.addColorStop(1, 'rgba(100,180,230,0.45)');
      ctx.fillStyle = grad;
      ctx.fillRect(left + 6, bot - fillH, cw - 12, fillH);
      ctx.restore();
    }

    // cup body outline – left wall, right wall, bottom
    ctx.strokeStyle = '#7AADB0';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, bot - 12);
    ctx.quadraticCurveTo(left, bot, left + 12, bot);
    ctx.lineTo(right - 12, bot);
    ctx.quadraticCurveTo(right, bot, right, bot - 12);
    ctx.lineTo(right, top);
    ctx.stroke();

    // subtle cup body fill (transparent)
    ctx.fillStyle = 'rgba(230,245,255,0.18)';
    ctx.beginPath();
    ctx.rect(left + 4, top, cw - 8, ch);
    ctx.fill();

    // lid (slightly wider than body)
    const lidW = cw + 14;
    const lidH = 16;
    const lidX = cx - lidW / 2;
    const lidTop = top - lidH;
    ctx.fillStyle = '#C8B89A';
    ctx.beginPath();
    ctx.roundRect(lidX, lidTop, lidW, lidH, [8, 8, 2, 2]);
    ctx.fill();
    ctx.strokeStyle = '#8B9E9E';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // dome cap on lid
    const domeW = 34, domeH = 9;
    ctx.fillStyle = '#B8A485';
    ctx.beginPath();
    ctx.roundRect(cx - domeW / 2, lidTop - domeH, domeW, domeH + 3, [6, 6, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#8B9E9E';
    ctx.lineWidth = 2;
    ctx.stroke();

    // straw
    ctx.strokeStyle = '#FFB6C1';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + 8, lidTop - domeH + 2);
    ctx.lineTo(cx + 26, top - 72);
    ctx.stroke();
    // straw tip highlight
    ctx.strokeStyle = '#ffcfe0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 9, lidTop - domeH + 4);
    ctx.lineTo(cx + 27, top - 70);
    ctx.stroke();

    // fill line (dashed)
    ctx.strokeStyle = 'rgba(80,140,180,0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(left + 12, container.fillLineY);
    ctx.lineTo(right - 12, container.fillLineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // face emoji inside cup
    const face = this._getFace(fillRatio);
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(face, container.faceX, container.faceY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  _renderFunnel(ctx, container, fillRatio) {
    const { cx, funnelTopY: fTop, funnelTopWidth, cupTop, cupWidth, cupHeight } = container;
    const fLeft = cx - funnelTopWidth / 2, fRight = cx + funnelTopWidth / 2;
    const cLeft = cx - cupWidth / 2, cRight = cx + cupWidth / 2;
    const cBot = cupTop + cupHeight;

    // 水位填充（裁切至漏斗+杯身輪廓）
    if (fillRatio > 0) {
      ctx.save();
      const clip = new Path2D();
      clip.moveTo(fLeft, fTop);
      clip.lineTo(fRight, fTop);
      clip.lineTo(cRight, cupTop);
      clip.lineTo(cRight, cBot);
      clip.lineTo(cLeft, cBot);
      clip.lineTo(cLeft, cupTop);
      clip.closePath();
      ctx.clip(clip);
      const totalH = cBot - fTop;
      const fillH = totalH * Math.min(fillRatio, 1);
      const grad = ctx.createLinearGradient(0, cBot - fillH, 0, cBot);
      grad.addColorStop(0, 'rgba(137,207,240,0.20)');
      grad.addColorStop(1, 'rgba(100,180,230,0.42)');
      ctx.fillStyle = grad;
      ctx.fillRect(fLeft - 5, cBot - fillH, funnelTopWidth + 10, fillH);
      ctx.restore();
    }

    ctx.strokeStyle = '#7AADB0';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // 左漏斗壁
    ctx.beginPath(); ctx.moveTo(fLeft, fTop); ctx.lineTo(cLeft, cupTop); ctx.stroke();
    // 右漏斗壁
    ctx.beginPath(); ctx.moveTo(fRight, fTop); ctx.lineTo(cRight, cupTop); ctx.stroke();
    // 左杯身（底部圓角）
    ctx.beginPath();
    ctx.moveTo(cLeft, cupTop);
    ctx.lineTo(cLeft, cBot - 12);
    ctx.quadraticCurveTo(cLeft, cBot, cLeft + 12, cBot);
    ctx.stroke();
    // 右杯身
    ctx.beginPath();
    ctx.moveTo(cRight, cupTop);
    ctx.lineTo(cRight, cBot - 12);
    ctx.quadraticCurveTo(cRight, cBot, cRight - 12, cBot);
    ctx.stroke();
    // 底部
    ctx.beginPath(); ctx.moveTo(cLeft + 12, cBot); ctx.lineTo(cRight - 12, cBot); ctx.stroke();

    // 漏斗頂端開口裝飾線
    ctx.strokeStyle = '#89BCBE';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(fLeft - 5, fTop); ctx.lineTo(fRight + 5, fTop); ctx.stroke();

    // 填充線（虛線）
    ctx.strokeStyle = 'rgba(80,140,180,0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(cLeft + 8, container.fillLineY);
    ctx.lineTo(cRight - 8, container.fillLineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 表情
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._getFace(fillRatio), container.faceX, container.faceY);
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
    ctx.save();
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
    ctx.textBaseline = 'middle';
    ctx.fillText('下一關 →', this.W / 2, 468);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  renderFail(ctx) {
    ctx.save();
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
    ctx.textBaseline = 'middle';
    ctx.fillText('再試一次', this.W / 2, 428);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
}
