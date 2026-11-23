// ============================================================
//  Gráficos: canvas, cámara, fuente, partículas, efectos
// ============================================================
(function () {
  const Gfx = {
    W: 480,
    H: 270,
    canvas: null,
    ctx: null,
    scale: 1,
    pixelRatio: 2,
    cam: { x: 0, y: 0, tx: 0, ty: 0, shake: 0, ox: 0, oy: 0, bounds: null, freeze: 0 },
    time: 0,
    textCache: new Map(),

    init(canvas) {
      this.canvas = canvas;
      // El juego sigue usando coordenadas lógicas 480×270, pero el canvas
      // rasteriza a 960×540 para que luces, curvas y contornos respiren mejor.
      this.canvas.width = this.W * this.pixelRatio;
      this.canvas.height = this.H * this.pixelRatio;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
      this.ctx.imageSmoothingEnabled = false;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    },

    resize() {
      const pad = 24;
      const w = window.innerWidth - pad;
      const h = window.innerHeight - pad * 2;
      let s = Math.min(w / this.W, h / this.H);
      s = Math.max(1, Math.floor(s * 2) / 2);
      this.scale = s;
      this.canvas.style.width = Math.round(this.W * s) + 'px';
      this.canvas.style.height = Math.round(this.H * s) + 'px';
    },

    clear(color) {
      this.ctx.fillStyle = color || '#0a0810';
      this.ctx.fillRect(0, 0, this.W, this.H);
    },

    camReset(x, y, bounds) {
      this.cam.bounds = bounds || null;
      this.cam.tx = x; this.cam.ty = y;
      this.cam.x = x; this.cam.y = y;
      this.cam.shake = 0;
      this.updateCam(0);
    },

    camFollow(px, py, dt, lookX, lookY) {
      const c = this.cam;
      const b = c.bounds;
      let tx = px + (lookX || 0);
      let ty = py + (lookY || 0);
      if (b) {
        const hw = this.W / 2, hh = this.H / 2;
        if (b.w <= this.W) tx = b.x + b.w / 2;
        else tx = E.clamp(tx, b.x + hw, b.x + b.w - hw);
        if (b.h <= this.H) ty = b.y + b.h / 2;
        else ty = E.clamp(ty, b.y + hh, b.y + b.h - hh);
      }
      c.tx = tx; c.ty = ty;
      this.updateCam(dt);
    },

    updateCam(dt) {
      const c = this.cam;
      const k = dt > 0 ? 1 - Math.exp(-9 * dt) : 1;
      c.x += (c.tx - c.x) * k;
      c.y += (c.ty - c.y) * k;
      if (c.shake > 0.01) {
        c.ox = (Math.random() * 2 - 1) * c.shake;
        c.oy = (Math.random() * 2 - 1) * c.shake;
        c.shake *= Math.exp(-8 * dt);
      } else {
        c.shake = 0;
        c.ox *= 0.6; c.oy *= 0.6;
      }
    },

    shake(a) {
      this.cam.shake = Math.min(7, Math.max(this.cam.shake, a));
    },

    begin() {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(
        Math.round(-this.cam.x + this.W / 2 + this.cam.ox),
        Math.round(-this.cam.y + this.H / 2 + this.cam.oy)
      );
    },
    end() { this.ctx.restore(); },

    screenX(x) { return x - this.cam.x + this.W / 2 + this.cam.ox; },
    screenY(y) { return y - this.cam.y + this.H / 2 + this.cam.oy; },

    // ---------------- texto ----------------
    textW(str, size = 1, spacing = 1) {
      if (!str) return 0;
      return str.length * (E.FONT_W + spacing) * size - spacing * size;
    },

    text(str, x, y, o) {
      o = o || {};
      const size = o.size || 1;
      const color = o.color || '#e8dfc8';
      const align = o.align || 'left';
      const spacing = o.spacing === undefined ? 1 : o.spacing;
      str = String(str).toUpperCase();
      const w = this.textW(str, size, spacing);
      let dx = Math.round(x);
      if (align === 'center') dx = Math.round(x - w / 2);
      else if (align === 'right') dx = Math.round(x - w);
      const dy = Math.round(y);
      const ctx = this.ctx;
      if (o.shadow) {
        this.rawText(str, dx + (o.shadowOff || 1), dy + (o.shadowOff || 1), size, o.shadow, spacing, o.alpha);
      }
      if (o.outline) {
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          if (!ox && !oy) continue;
          this.rawText(str, dx + ox, dy + oy, size, o.outline, spacing, o.alpha);
        }
      }
      this.rawText(str, dx, dy, size, color, spacing, o.alpha);
      return w;
    },

    displayText(str, x, y, o) {
      o = o || {};
      const ctx = this.ctx;
      const size = o.size || 24;
      ctx.save();
      ctx.textAlign = o.align || 'center';
      ctx.textBaseline = 'top';
      ctx.font = `${o.weight || 700} ${size}px ${o.font || 'Georgia, "Times New Roman", serif'}`;
      ctx.lineJoin = 'round';
      if (o.shadow) {
        ctx.shadowColor = o.shadow;
        ctx.shadowBlur = o.blur || 12;
        ctx.shadowOffsetY = o.shadowY || 2;
      }
      ctx.fillStyle = o.color || '#f4e4c1';
      if (o.stroke) {
        ctx.strokeStyle = o.stroke;
        ctx.lineWidth = o.strokeWidth || 1;
        ctx.strokeText(String(str), x, y);
      }
      ctx.fillText(String(str), x, y);
      ctx.restore();
    },

    rawText(str, x, y, size, color, spacing, alpha) {
      const ctx = this.ctx;
      const key = str + '|' + color + '|' + size + '|' + spacing;
      let entry = this.textCache.get(key);
      const padTop = Math.ceil(3 * size);
      if (!entry) {
        const w = Math.ceil(this.textW(str, size, spacing)) + 4;
        const h = Math.ceil((E.FONT_H + 5) * size) + 4;
        if (w <= 0) return;
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const c = cv.getContext('2d');
        c.imageSmoothingEnabled = false;
        c.fillStyle = color;
        let cx = 1;
        for (let i = 0; i < str.length; i++) {
          const ch = str[i];
          if (ch === ' ') { cx += (E.FONT_W + spacing) * size; continue; }
          const gl = E.glyphFor(ch);
          const rows = gl.g.split('/');
          for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            for (let cc = 0; cc < row.length; cc++) {
              if (row[cc] === '#') c.fillRect(cx + cc * size, padTop + r * size, size, size);
            }
          }
          if (gl.mark) this.drawMark(c, gl.mark, cx + 2 * size, padTop - 2 * size, size, color);
          cx += (E.FONT_W + spacing) * size;
        }
        entry = cv;
        if (this.textCache.size > 420) this.textCache.clear();
        this.textCache.set(key, entry);
      }
      if (alpha !== undefined) {
        ctx.globalAlpha = alpha;
        ctx.drawImage(entry, Math.round(x) - 1, Math.round(y) - padTop);
        ctx.globalAlpha = 1;
      } else {
        ctx.drawImage(entry, Math.round(x) - 1, Math.round(y) - padTop);
      }
    },

    drawMark(c, kind, x, y, size, color) {
      c.fillStyle = color;
      if (kind === 'acute') {
        c.fillRect(x, y + size, size, size);
        c.fillRect(x + size, y, size, size);
      } else if (kind === 'dia') {
        c.fillRect(x - size, y + size, size, size);
        c.fillRect(x + size * 2, y + size, size, size);
      }
    },

    // ---------------- formas ----------------
    rect(x, y, w, h, color) {
      const ctx = this.ctx;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    },
    rectA(x, y, w, h, color, alpha) {
      const ctx = this.ctx;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
    },
    circ(x, y, r, color) {
      const ctx = this.ctx;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, E.TAU);
      ctx.fill();
    },
    circA(x, y, r, color, alpha) {
      const ctx = this.ctx;
      ctx.globalAlpha = alpha;
      this.circ(x, y, r, color);
      ctx.globalAlpha = 1;
    },
    ellipse(x, y, rx, ry, color) {
      const ctx = this.ctx;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, E.TAU);
      ctx.fill();
    },
    line(x1, y1, x2, y2, color, w) {
      const ctx = this.ctx;
      ctx.strokeStyle = color;
      ctx.lineWidth = w || 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    },
    poly(points, color) {
      const ctx = this.ctx;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
      ctx.closePath();
      ctx.fill();
    },
    glow(x, y, r, color, alpha) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, E.alpha(color, alpha));
      g.addColorStop(0.5, E.alpha(color, alpha * 0.35));
      g.addColorStop(1, E.alpha(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
    },
    ring(x, y, r, color, alpha, width) {
      const ctx = this.ctx;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width || 1;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.2, r), 0, E.TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    arc(x, y, r, a0, a1, color, alpha, width) {
      const ctx = this.ctx;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width || 1;
      ctx.beginPath();
      ctx.arc(x, y, r, a0, a1);
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    shadow(x, y, rx, alpha) {
      const ctx = this.ctx;
      ctx.globalAlpha = alpha === undefined ? 0.35 : alpha;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.6, rx * 0.34), 0, 0, E.TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    },
  };

  // ---------------- partículas ----------------
  const P = {
    list: [],
    max: 900,
    spawn(o) {
      if (this.list.length > this.max) this.list.shift();
      this.list.push({
        x: o.x, y: o.y, vx: o.vx || 0, vy: o.vy || 0,
        life: o.life || 0.5, max: o.life || 0.5,
        size: o.size || 1.5, color: o.color || '#fff',
        grav: o.grav === undefined ? 0 : o.grav, drag: o.drag === undefined ? 0.02 : o.drag,
        glow: !!o.glow, shape: o.shape || 'rect', rot: o.rot || 0, vrot: o.vrot || 0,
        fade: o.fade === undefined ? 1 : o.fade, shrink: o.shrink === undefined ? 1 : o.shrink,
        layer: o.layer || 0, target: o.target || null,
      });
      return this.list[this.list.length - 1];
    },
    burst(x, y, n, o) {
      o = o || {};
      for (let i = 0; i < n; i++) {
        const a = o.angle !== undefined ? o.angle + E.rnd(o.spread, -o.spread) : E.rnd(E.TAU, 0);
        const sp = E.rnd(o.speed || 60, o.speedMin || 10);
        this.spawn({
          x: x + E.rnd(o.jitter || 2, -(o.jitter || 2)),
          y: y + E.rnd(o.jitter || 2, -(o.jitter || 2)),
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: E.rnd(o.life || 0.4, (o.life || 0.4) * 0.4),
          size: E.rnd(o.size || 2, 0.8),
          color: Array.isArray(o.color) ? E.pick(o.color) : (o.color || '#fff'),
          grav: o.grav || 0, drag: o.drag === undefined ? 0.08 : o.drag,
          glow: o.glow, shape: o.shape, shrink: 0.9,
        });
      }
    },
    update(dt, gravity) {
      const l = this.list;
      for (let i = l.length - 1; i >= 0; i--) {
        const p = l[i];
        p.life -= dt;
        if (p.life <= 0) { l.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.grav + (gravity || 0)) * dt;
        const d = Math.exp(-p.drag * 60 * dt);
        p.vx *= d; p.vy *= d;
        p.rot += p.vrot * dt;
      }
    },
    draw(ctx, layer) {
      const l = this.list;
      for (let i = 0; i < l.length; i++) {
        const p = l[i];
        if ((p.layer || 0) !== (layer || 0)) continue;
        const t = E.clamp01(p.life / p.max);
        ctx.globalAlpha = p.fade === 1 ? t : Math.min(1, p.fade) * t;
        ctx.fillStyle = p.color;
        const s = p.size * (p.shrink === 1 ? 1 : E.lerp(p.shrink, 1, t));
        if (p.glow) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = t * 0.9;
        }
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.2, s), 0, E.TAU);
          ctx.fill();
        } else if (p.shape === 'spark') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-s * 2, -s * 0.4, s * 4, Math.max(1, s * 0.8));
          ctx.restore();
        } else {
          ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.max(1, s), Math.max(1, s));
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    },
    clear() { this.list.length = 0; },
  };

  // ---------------- números flotantes ----------------
  const Fl = {
    list: [],
    add(x, y, txt, o) {
      o = o || {};
      this.list.push({
        x, y, txt: String(txt), life: o.life || 0.75, max: o.life || 0.75,
        color: o.color || '#fff', size: o.size || 1, vy: o.vy || -26,
        vx: o.vx || E.rnd(12, -12), crit: !!o.crit,
      });
    },
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const f = this.list[i];
        f.life -= dt;
        if (f.life <= 0) { this.list.splice(i, 1); continue; }
        f.y += f.vy * dt;
        f.x += f.vx * dt;
        f.vy *= 0.94;
        f.vx *= 0.9;
      }
    },
    draw(ctx) {
      for (const f of this.list) {
        const t = f.life / f.max;
        const pop = f.crit ? 1 + Math.max(0, (t - 0.8)) * 3 : 1;
        ctx.globalAlpha = Math.min(1, t * 2.2);
        Gfx.text(f.txt, f.x, f.y, {
          size: Math.round(f.size * pop), color: f.color, align: 'center',
          outline: '#0b0910', alpha: Math.min(1, t * 2.2),
        });
        ctx.globalAlpha = 1;
      }
    },
    clear() { this.list.length = 0; },
  };

  // ---------------- efectos de pantalla ----------------
  const Fx = {
    flashA: 0, flashColor: '#fff',
    flash(color, a) { this.flashColor = color; this.flashA = Math.max(this.flashA, a || 0.35); },
    vignette(a) {
      const ctx = Gfx.ctx;
      const g = ctx.createRadialGradient(Gfx.W / 2, Gfx.H / 2, Gfx.H * 0.35, Gfx.W / 2, Gfx.H / 2, Gfx.H * 0.95);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${a === undefined ? 0.55 : a})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, Gfx.W, Gfx.H);
    },
    update(dt) {
      if (this.flashA > 0) this.flashA = Math.max(0, this.flashA - dt * 3.2);
      P.update(dt);
      Fl.update(dt);
    },
    drawFlash() {
      if (this.flashA > 0.002) {
        Gfx.ctx.globalAlpha = this.flashA;
        Gfx.ctx.fillStyle = this.flashColor;
        Gfx.ctx.fillRect(0, 0, Gfx.W, Gfx.H);
        Gfx.ctx.globalAlpha = 1;
      }
    },
    reset() { P.clear(); Fl.clear(); this.flashA = 0; },
  };

  Gfx.P = P;
  Gfx.F = Fl;
  Gfx.Fx = Fx;
  Gfx.spark = (x, y, color, n, o) => P.burst(x, y, n, Object.assign({ color, speed: 70, life: 0.35, size: 1.6, glow: true }, o || {}));
  window.Gfx = Gfx;
})();
