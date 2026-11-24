// ============================================================
//  EXPANSIÓN "CENTELLA" — assets, animaciones y fauna nueva
//  ------------------------------------------------------------
//  Este módulo amplía Ecos de Evermore sin tocar los archivos
//  originales: envuelve las funciones existentes y añade las
//  suyas propias. Cárgalo tras main.js. Se puede retirar de
//  index.html y el juego vuelve a su estado base.
//
//  Contenido:
//   · Tres obstáculos nuevos animados por bioma: braserio ritual
//     (jungla), pozo de sal (cavernas) y faro hueco (omnitopia).
//   · Nuevo enemigo: el ESPECTRO DE CENIZA (shade), que se
//     desvanece en humo, acecha invisible y reaparece al flanco
//     del héroe para soltar una ráfaga de sombra.
//   · Muerte en disolución para todos los enemigos, con resto
//     luminoso ascendente.
//   · Capa ambiental por bioma: ceniza y pétalos quemados,
//     motas de sal con goteos, glifos suspendidos.
//   · El Alambique (hub) gana una fogata y un caldero animados.
//   · FX nuevos: estrella de crítico, columna de luz al subir de
//     nivel, estela en los recogibles, pulso de peligro con vida
//     baja y runas giratorias en las puertas abiertas.
//   · Sonido: velo, ráfaga de sombra, campana de alma y tema de
//     victoria.
// ============================================================
(function () {
  const TAU = Math.PI * 2;
  if (!window.Art || !window.Game || !window.Gfx) return;

  // pseudo-aleatorio determinista por índice, estable entre frames
  function hash(i, seed) {
    const s = Math.sin(i * 127.1 + (seed || 1) * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  function linear(ctx, x0, y0, x1, y1, colors) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
    return g;
  }
  function radial(ctx, x, y, r, colors) {
    const g = ctx.createRadialGradient(x - r * .28, y - r * .35, .1, x, y, r);
    colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
    return g;
  }
  function vpath(ctx, points, fill, stroke, width) {
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 1; ctx.stroke(); }
  }
  function vellipse(ctx, x, y, rx, ry, fill, stroke, width) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 1; ctx.stroke(); }
  }

  // ------------------------------------------------------------
  // 1) OBSTÁCULOS NUEVOS — se enganchan tras Art.drawObstacle
  // ------------------------------------------------------------
  const _drawObstacle = Art.drawObstacle;
  Art.drawObstacle = function (ctx, room, o, time) {
    if (o.kind === 'brazier') { drawBrazier(ctx, o, time); return; }
    if (o.kind === 'well') { drawWell(ctx, o, time); return; }
    if (o.kind === 'beacon') { drawBeacon(ctx, o, time); return; }
    _drawObstacle.call(this, ctx, room, o, time);
  };

  // Braserio ritual de la jungla: fuego de tres capas, brasas y chispas.
  function drawBrazier(ctx, o, time) {
    vellipse(ctx, o.x, o.y, o.r + 5, 4, '#101014');
    vpath(ctx, [[o.x - o.r * .8, o.y], [o.x - o.r * .45, o.y - o.h * .62], [o.x - o.r * .55, o.y - o.h * .5], [o.x - o.r * .2, o.y]],
      linear(ctx, o.x - o.r, o.y - o.h, o.x, o.y, ['#3a3440', '#221c28']), '#0c0a12', 1);
    vpath(ctx, [[o.x + o.r * .8, o.y], [o.x + o.r * .45, o.y - o.h * .62], [o.x + o.r * .55, o.y - o.h * .5], [o.x + o.r * .2, o.y]],
      linear(ctx, o.x, o.y - o.h, o.x + o.r, o.y, ['#453e4c', '#2a2332']), '#0c0a12', 1);
    const by = o.y - o.h * .62;
    vpath(ctx, [[o.x - o.r, by], [o.x - o.r * .5, by - 4], [o.x + o.r * .5, by - 4], [o.x + o.r, by], [o.x + o.r * .6, by + 3], [o.x - o.r * .6, by + 3]],
      linear(ctx, o.x - o.r, by - 4, o.x + o.r, by + 3, ['#5d5468', '#2e2836']), '#0e0b14', 1.2);
    ctx.fillStyle = E.alpha('#14101c', .85);
    ctx.beginPath(); ctx.ellipse(o.x, by - 3, o.r * .72, 2.6, 0, 0, TAU); ctx.fill();
    // brasas
    for (let i = 0; i < 4; i++) {
      const px = o.x - 3 + i * 2.2, pk = .5 + Math.sin(time * 5 + i * 1.8) * .5;
      Gfx.glow(px, by - 4, 3.4, '#ff7a2e', .22 * pk);
      Gfx.circ(px, by - 4, 1.1, E.mix('#8a2c14', '#ffb03a', pk));
    }
    // llamas
    const flick = Math.sin(time * 9 + o.x * .7) * .5 + Math.sin(time * 15.7) * .3;
    const fh = 9 + flick * 1.6;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    vpath(ctx, [[o.x - o.r * .55, by - 3], [o.x - o.r * .4, by - 3 - fh * .5], [o.x + Math.sin(time * 7.3) * 1.6, by - 3 - fh], [o.x + o.r * .42, by - 3 - fh * .42], [o.x + o.r * .55, by - 3]], E.alpha('#e8541f', .8));
    vpath(ctx, [[o.x - o.r * .34, by - 3], [o.x - o.r * .22, by - 3 - fh * .62], [o.x + Math.sin(time * 9.1 + 1) * 1.2, by - 3 - fh * 1.18], [o.x + o.r * .26, by - 3 - fh * .5], [o.x + o.r * .34, by - 3]], E.alpha('#ffa02e', .85));
    vpath(ctx, [[o.x - o.r * .18, by - 3.4], [o.x + Math.sin(time * 11 + 2) * .9, by - 3 - fh * .82], [o.x + o.r * .16, by - 3.4]], E.alpha('#ffe89a', .9));
    ctx.restore();
    Gfx.glow(o.x, by - 5, 24 + flick * 4, '#ff9a3a', .22);
    Gfx.glow(o.x, by - 5, 42, '#e8541f', .09);
    // chispas ascendentes
    for (let i = 0; i < 5; i++) {
      const cyc = 26 + hash(i, o.x) * 14;
      const t = (time * (18 + hash(i * 3.7, o.x) * 16) + hash(i * 7.1, o.x) * cyc) % cyc;
      const py = by - 6 - t;
      const px = o.x + Math.sin(time * 2.2 + i * 2.4) * 4;
      const fade = Math.max(0, 1 - t / cyc);
      ctx.globalAlpha = fade * .8;
      Gfx.circ(px, py, .9, i % 2 ? '#ffd08a' : '#ff9a4a');
      ctx.globalAlpha = 1;
    }
  }

  // Pozo de sal de las cavernas: agua luminosa, ondas y cristales en órbita.
  function drawWell(ctx, o, time) {
    vellipse(ctx, o.x, o.y, o.r + 5, (o.r + 5) * .52, '#0d1a24');
    vellipse(ctx, o.x, o.y, o.r + 2.4, (o.r + 2.4) * .5, '#2c4356');
    vellipse(ctx, o.x, o.y, o.r + .6, (o.r + .6) * .47, '#4a6a80');
    const wl = .62 + Math.sin(time * 1.8 + o.x) * .1;
    vellipse(ctx, o.x, o.y, o.r * .84, o.r * .4, radial(ctx, o.x - 2, o.y - 2, o.r, ['#d6f6f4', '#7cc4d8', '#1d3d58']));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {
      const p = ((time * .5 + k / 3) % 1);
      Gfx.ring(o.x, o.y, 3 + p * o.r * .8, '#bfeef2', (1 - p) * .35 * wl, .8);
    }
    ctx.restore();
    for (let i = 0; i < 7; i++) {
      const a = i * TAU / 7 + .3;
      const px = o.x + Math.cos(a) * (o.r + 1.4), py = o.y + Math.sin(a) * (o.r + 1.4) * .5;
      const sw = 2 + (i % 2);
      vpath(ctx, [[px - sw, py], [px, py - 3.4 - (i % 2) * 1.6], [px + sw, py]], linear(ctx, px, py - 4, px, py, ['#e8fbff', '#7cc4d8', '#1d3d58']), '#d5f5f0', .6);
    }
    for (let i = 0; i < 3; i++) {
      const a = time * (.8 + i * .22) + i * 2.1;
      const px = o.x + Math.cos(a) * (o.r * .5);
      const py = o.y - 8 - Math.sin(a) * 4 - i * 2.5;
      const bob = Math.sin(time * 2.4 + i) * .8;
      Gfx.glow(px, py + bob, 5, '#8fe6ef', .2);
      vpath(ctx, [[px - 1.8, py + bob], [px, py + bob - 3], [px + 1.8, py + bob], [px, py + bob + 2.4]], '#bff2f6', '#e9ffff', .6);
    }
    Gfx.glow(o.x, o.y - 2, 26, '#7ed6e2', .13 + Math.sin(time * 2.1) * .03);
  }

  // Faro hueco de Omnitopia: obelisco, núcleo flotante y glifos en secuencia.
  function drawBeacon(ctx, o, time) {
    vellipse(ctx, o.x, o.y, o.r + 5, 4, '#120c1e');
    vpath(ctx, [[o.x - o.r, o.y], [o.x - o.r * .4, o.y - o.h * .34], [o.x - o.r * .34, o.y - o.h * .62], [o.x + o.r * .34, o.y - o.h * .62], [o.x + o.r * .4, o.y - o.h * .34], [o.x + o.r, o.y]],
      linear(ctx, o.x - o.r, o.y - o.h, o.x + o.r, o.y, ['#4c3c68', '#2c2340', '#191226']), '#c9a2ff', .8);
    vpath(ctx, [[o.x - o.r * .18, o.y - 2], [o.x - o.r * .12, o.y - o.h * .58], [o.x + o.r * .12, o.y - o.h * .58], [o.x + o.r * .18, o.y - 2]], '#191326');
    const pulse = .5 + Math.sin(time * 3 + o.x * .2) * .5;
    ctx.strokeStyle = E.alpha('#d5a8ff', .3 + pulse * .5);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(o.x, o.y - 3); ctx.lineTo(o.x, o.y - o.h * .58); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const gy = o.y - o.h * (.2 + i * .14);
      const gk = .5 + Math.sin(time * 4 - i * 1.1) * .5;
      ctx.fillStyle = E.alpha('#e3c4ff', .25 + gk * .55);
      ctx.fillRect(o.x - 2.6, gy - .8, 1.2, 1.6);
      ctx.fillRect(o.x + 1.4, gy - .8, 1.2, 1.6);
    }
    const cy = o.y - o.h * .62 - 7 - Math.sin(time * 2.2) * 1.6;
    ctx.save();
    ctx.translate(o.x, cy);
    ctx.rotate(time * 1.4);
    vpath(ctx, [[0, -4.4], [3.2, 0], [0, 4.4], [-3.2, 0]], linear(ctx, -3, -3, 3, 3, ['#fff3dc', '#d9a0ff', '#714eac']), '#efd4ff', .8);
    ctx.restore();
    for (let i = 0; i < 2; i++) {
      const a = time * (2 - i * .7) + i * Math.PI;
      const px = o.x + Math.cos(a) * 7.5, py = cy + Math.sin(a) * 3.4;
      Gfx.circ(px, py, 1.2, '#c79aff');
    }
    Gfx.glow(o.x, cy, 16 + pulse * 5, '#c17bf0', .3);
    Gfx.glow(o.x, cy, 30, '#8a4bd8', .1);
    ctx.strokeStyle = E.alpha('#d5a8ff', .4);
    ctx.lineWidth = .7;
    ctx.beginPath(); ctx.ellipse(o.x, cy, 9.5, 3.6, 0, 0, TAU); ctx.stroke();
  }

  // ------------------------------------------------------------
  // 2) EL ESPECTRO DE CENIZA (shade) — dibujo vivo y conducta
  // ------------------------------------------------------------
  // Cuerpo del espectro dibujado a mano cada frame: el manto ondula,
  // los jirones respiran y los ojos de brasa parpadean.
  function drawShadeBody(ctx, foe, time, stretchK, alpha) {
    const s = (foe.scale || 1) * (1 + (stretchK || 0) * .6);
    const sq = 1 - (stretchK || 0) * .3;
    const bob = Math.sin(time * 2.7 + foe.x) * 2.5;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(foe.x, foe.y + bob);
    ctx.scale((foe.face || 1) * sq, s);
    // resplandor interior
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    Gfx.glow(0, -22, 20, '#8a5fd8', .3 + Math.sin(time * 3.2 + foe.x) * .05);
    ctx.restore();
    // vapor tras el manto
    ctx.save(); ctx.globalAlpha *= .55;
    for (let i = 0; i < 4; i++) {
      const sx = -2 + (i - 1.5) * 7;
      const sway = Math.sin(time * (1.7 + i * .5) + i * 2.1) * 2.5;
      vpath(ctx, [[sx, -14], [sx - 5 + sway, -7 + i], [sx + 1, -2 + i * 1.6], [sx + 5, 2 + i]], null,
        ['#6b53a0', '#4c3a7c', '#382a62', '#241a46'][i], 1.5 - i * .25);
    }
    ctx.restore();
    // manto exterior jironado
    const breathe = Math.sin(time * 3.4) * .7;
    vpath(ctx, [[0, -38], [8, -35], [13, -28], [14, -20], [17, -13], [12, -15], [14, -7], [7, -12], [9, -3], [2, -10], [2, -1], [-3, -10], [-6, -3], [-7, -13], [-13, -8], [-11, -16], [-16, -13], [-13, -21], [-11, -29], [-6, -35]],
      linear(ctx, -14, -38, 16, 0, ['#8a72b8', '#5b4488', '#2c2048']), '#12101e', 1.6);
    // manto interior y pliegues
    vpath(ctx, [[0, -34], [6, -31], [9, -24], [8, -16], [4, -10], [-2, -12], [-7, -16], [-8, -24], [-5, -31]],
      linear(ctx, -8, -34, 9, -10, ['#5d4890', '#372a60']), '#1a1530', 1.1);
    vpath(ctx, [[-4, -24], [-1, -20], [-3, -15]], null, 'rgba(154,128,200,.5)', 1);
    vpath(ctx, [[4, -25], [2, -20], [4, -15]], null, 'rgba(154,128,200,.4)', 1);
    // capucha con vacío interior
    vellipse(ctx, 0, -30 + breathe * .2, 7.5, 7, '#0d0a18', '#241d3a', 1);
    vellipse(ctx, 0, -29.6 + breathe * .2, 5.6, 5.4, radial(ctx, 0, -30, 7, ['#3a2d66', '#171232', '#080612']));
    // ojos de brasa (parpadean)
    const blink = .72 + Math.sin(time * 5.2 + foe.x) * .28;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    Gfx.glow(-2.5, -30.4, 4.5 * blink, '#ff9a3a', .3 * blink);
    Gfx.glow(2.5, -30.4, 4.5 * blink, '#ff9a3a', .3 * blink);
    ctx.restore();
    vellipse(ctx, -2.5, -30.4, 1.35, 1.7 * blink, '#ffcf7e', '#b0562e', .5);
    vellipse(ctx, 2.5, -30.4, 1.35, 1.7 * blink, '#ffcf7e', '#b0562e', .5);
    vellipse(ctx, -2.5, -30.6, .5, .8, '#fff6d8');
    vellipse(ctx, 2.5, -30.6, .5, .8, '#fff6d8');
    // broche de plata y garras flotantes
    ctx.strokeStyle = '#cfd3e8'; ctx.lineWidth = .8;
    ctx.beginPath(); ctx.moveTo(-4, -24); ctx.lineTo(-1, -22); ctx.lineTo(2, -23); ctx.stroke();
    vellipse(ctx, 0, -22.5, 1.2, 1.2, '#e8ebf4', '#565a78', .6);
    vpath(ctx, [[-15, -22], [-19, -19], [-16, -18]], null, '#8a72b8', 1.2);
    vpath(ctx, [[15, -22], [19, -19], [16, -18]], null, '#8a72b8', 1.2);
    // destello de daño
    if (foe.flash > 0) Gfx.glow(0, -20, 18, '#ffffff', foe.flash * .4);
    ctx.restore();
  }

  const _drawFoe = Art.drawFoe;
  Art.drawFoe = function (ctx, foe, time) {
    if (foe.type !== 'shade') { _drawFoe.call(this, ctx, foe, time); return; }
    const scale = (foe.scale || 1) * (foe.state === 'spawn' ? .72 + .28 * E.clamp01(foe.t / foe.spawnT) : 1);
    const fade = (foe.state === 'spawn' ? E.clamp01(foe.t / foe.spawnT) : 1) * (foe.veilAlpha === undefined ? 1 : foe.veilAlpha);
    Gfx.shadow(foe.x, foe.y + 1, (foe.r || 7) + 2, .12 * fade);
    ctx.save();
    ctx.translate(0, 0);
    ctx.scale(scale, scale);
    drawShadeBody(ctx, foe, time, 0, fade);
    ctx.restore();
    if (foe.elite) {
      Gfx.ring(foe.x, foe.y - 18 * scale, 13 * scale, '#f2cb7e', .46 + Math.sin(time * 4) * .1, .8);
      Gfx.glow(foe.x, foe.y - 22 * scale, 16, '#e0b36f', .1);
    }
    if (foe.telegraph > .15) Gfx.glow(foe.x, foe.y - 20, 15 * scale, '#ff695c', .18 * foe.telegraph);
  };

  // Disolución de muerte: el cuerpo se estira hacia arriba, se desvanece
  // y un resto luminoso asciende en espiral antes de extinguirse.
  Art.drawFoeDissolve = function (ctx, foe, time) {
    const k = E.clamp01((foe.deadT || 0) / 0.45);
    const soulCol = foe.deathColor || '#e0d0ff';
    if (foe.type === 'shade') {
      drawShadeBody(ctx, foe, time, k, (1 - k) * .9);
    } else {
      // el sprite original se estira y se disuelve
      ctx.save();
      ctx.translate(foe.x, foe.y);
      ctx.scale(1 - k * .25, 1 + k * .55);
      ctx.translate(-foe.x, -foe.y);
      ctx.globalAlpha = (1 - k) * .9;
      _drawFoe.call(Art, ctx, foe, time);
      ctx.restore();
    }
    // resto / alma ascendente
    const soulY = foe.y - 16 * (foe.scale || 1) - k * 30;
    const sx = foe.x + Math.sin(time * 5 + foe.x * .3) * (2 + k * 3);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const a = Math.sin((1 - k) * Math.PI) * .85;
    Gfx.glow(sx, soulY, 9 + k * 8, soulCol, .3 * a);
    Gfx.circ(sx, soulY, 1.7, '#fff6e0');
    Gfx.ring(foe.x, foe.y - 6, 4 + k * 14, soulCol, (1 - k) * .5, 1);
    ctx.restore();
  };

  // Los enemigos muertos pasan por la disolución en vez de desaparecer.
  const _enemyDraw = window.EnemyBase.prototype.draw;
  window.EnemyBase.prototype.draw = function (ctx, g) {
    if (this.state === 'dead') { Art.drawFoeDissolve(ctx, this, g.time); return; }
    _enemyDraw.call(this, ctx, g);
  };

  // ------------------------------------------------------------
  // 3) CLASE SHADE — velarse, acechar y soltar sombra
  // ------------------------------------------------------------
  class Shade extends window.EnemyBase {
    constructor(x, y, o) {
      o = o || {};
      super('shade', x, y, o);
      this.flying = true;
      this.r = 7;
      this.scale = 1;
      this.deathColor = '#a98cf0';
      this.veilAlpha = 1;
      this.shootCd = E.rnd(2.4, 1.2);
      this.stalkFrom = null;
      this.stalkTo = null;
      this.side = 1;
      if (o.elite) {
        this.hp = 75; this.maxHp = 75;
        this.damage = 15;
        this.xp = 30; this.essence = 8;
        this.elite = true;
        this.scale = 1.22;
        this.noKnock = true;
      } else {
        this.hp = 30; this.maxHp = 30;
        this.damage = 11;
        this.xp = 10; this.essence = 2;
      }
      this.hpBarT = 2;
    }

    ai(dt, g) {
      const hero = g.hero;
      const d = E.dist(this.x, this.y, hero.x, hero.y);
      this.telegraph = Math.max(0, this.telegraph - dt * 2);
      if (this.state === 'chase') {
        this.veilAlpha = Math.min(1, this.veilAlpha + dt * 3.2);
        const a = E.angTo(this.x, this.y, hero.x, hero.y);
        const want = 88;
        const rad = d < want - 22 ? -1 : d > want + 32 ? 1 : 0;
        const sp = this.speed * this.slowMul;
        this.vx = E.smooth(this.vx, Math.cos(a) * sp * rad, 4, dt);
        this.vy = E.smooth(this.vy, Math.sin(a) * sp * rad + Math.sin(this.t * 3.1) * 16, 4, dt);
        this.shootCd -= dt;
        if (this.shootCd <= 0 && d < 200) {
          this.state = 'veil'; this.t = 0;
          this.side = E.chance(.5) ? 1 : -1;
          Snd.sfx('veil');
        }
      } else if (this.state === 'veil') {
        // se disuelve en humo
        this.vx *= .9; this.vy *= .9;
        this.veilAlpha = Math.max(0, this.veilAlpha - dt * 3.6);
        if (Math.random() < .3) Gfx.P.spawn({
          x: this.x + E.rnd(6, -6), y: this.y - E.rnd(20, 4),
          vy: -14, life: .5, size: 1.6, color: '#7a5fb8', glow: true, shape: 'circle', fade: .6,
        });
        if (this.t > .5) {
          this.state = 'stalk'; this.t = 0;
          this.stalkFrom = { x: this.x, y: this.y };
          // reaparece a un costado o detrás del héroe
          const ang = hero.aim + this.side * (1.15 + E.rnd(.55));
          this.stalkTo = { x: hero.x + Math.cos(ang) * 62, y: hero.y + Math.sin(ang) * 46 };
          const b = g.room.bounds;
          this.stalkTo.x = E.clamp(this.stalkTo.x, b.x + 16, b.x + b.w - 16);
          this.stalkTo.y = E.clamp(this.stalkTo.y, b.y + 20, b.y + b.h - 12);
        }
      } else if (this.state === 'stalk') {
        // deriva invisible hacia la nueva posición
        this.vx = 0; this.vy = 0;
        const p = E.clamp01(this.t / .55);
        const q = p * p * (3 - 2 * p);
        this.x = E.lerp(this.stalkFrom.x, this.stalkTo.x, q);
        this.y = E.lerp(this.stalkFrom.y, this.stalkTo.y, q);
        if (this.t > .55) {
          this.state = 'appear'; this.t = 0;
          Gfx.P.burst(this.x, this.y - 12, 12, { color: ['#9d84d8', '#5c4694', '#c9a8ff'], speed: 85, life: .45, size: 1.8, glow: true });
          Gfx.ring(this.x, this.y - 12, 4, '#b18cff', .8, 1.6);
          Snd.sfx('shadeCast');
        }
      } else if (this.state === 'appear') {
        this.vx *= .8; this.vy *= .8;
        this.veilAlpha = Math.min(1, this.veilAlpha + dt * 4.5);
        if (this.t > .22) { this.state = 'windup'; this.t = 0; this.telegraph = 1; }
      } else if (this.state === 'windup') {
        this.vx *= .85; this.vy *= .85;
        this.telegraph = Math.min(1, this.t / .42);
        this.veilAlpha = 1;
        if (this.t > .42) {
          this.state = 'chase'; this.t = 0;
          this.shootCd = E.rnd(3.2, 2.1);
          const base = E.angTo(this.x, this.y - 14, hero.x, hero.y - 14);
          for (let i = -1; i <= 1; i++) {
            const a = base + i * .3;
            g.spawnProj({
              x: this.x, y: this.y - 14, vx: Math.cos(a) * 118, vy: Math.sin(a) * 118,
              r: 4, life: 2.6, color: '#a06be8', trail: '#e0d0ff', team: 'foe',
              damage: this.damage, knock: 55, kind: 'shadow', homing: .35,
            });
          }
          Snd.sfx('shadeCast');
          this.vx -= Math.cos(base) * 46;
          this.vy -= Math.sin(base) * 46;
        }
      }
    }
  }

  const _foesMake = window.Foes.make;
  window.Foes.make = function (type, x, y, o) {
    if (type === 'shade') return new Shade(x, y, o);
    return _foesMake.call(window.Foes, type, x, y, o);
  };

  // el espectro habita las cavernas y Omnitopia
  for (const b of window.World.BIOMES) {
    if (b.id === 'cavernas' || b.id === 'omnitopia') {
      if (!b.enemies.includes('shade')) b.enemies.push('shade', 'shade');
      if (!b.elite.includes('shade')) b.elite.push('shade');
    }
  }

  // ------------------------------------------------------------
  // 4) VARIEDAD DE OBSTÁCULOS — hook sobre Room.prototype.build
  // ------------------------------------------------------------
  const OB_KINDS = {
    jungla: ['brazier'],
    cavernas: ['well'],
    omnitopia: ['beacon'],
  };
  const _roomBuild = window.World.Room.prototype.build;
  window.World.Room.prototype.build = function (rng) {
    _roomBuild.call(this, rng);
    const kinds = OB_KINDS[this.biomeId];
    if (!kinds) return;
    for (const o of this.obstacles) {
      // la mitad de los obstáculos se vuelve una pieza nueva animada
      if (this.rng() < .5) o.kind = kinds[Math.floor(this.rng() * kinds.length)];
    }
  };

  // ------------------------------------------------------------
  // 5) CAPA AMBIENTAL POR BIOMA — ceniza, sal y glifos
  // ------------------------------------------------------------
  Art.drawAmbient = function (ctx, room, time, layer) {
    const seed = room.seed || 1;
    const h1 = (i) => hash(i, seed + layer * 37);
    const W = room.w, H = room.h, bId = room.biomeId;
    if (bId === 'jungla') {
      // ceniza y pétalos quemados cayendo a la deriva
      const n = layer === 0 ? 13 : 8;
      for (let i = 0; i < n; i++) {
        const sp = 13 + h1(i * 3.1) * 24;
        const x0 = h1(i * 7.7) * W;
        const size = 1.5 + h1(i * 5.3) * 2.3;
        const cyc = H + 46;
        const t = (time * sp + h1(i * 11.3) * cyc) % cyc;
        const y = t - 23;
        const x = x0 + Math.sin(time * 1.3 + i * 2.1) * (5 + size * 2.6) - 8;
        const fade = Math.min(1, t / 12) * Math.max(0, 1 - Math.max(0, t - H + 8) / 30);
        if (fade <= 0) continue;
        ctx.save();
        ctx.globalAlpha = (layer === 0 ? .42 : .68) * fade;
        ctx.translate(x, y);
        ctx.rotate(Math.sin(time * 1.8 + i) * 1.2 + .5);
        ctx.fillStyle = i % 3 === 0 ? '#c96f45' : i % 3 === 1 ? '#8a7440' : '#5d6a3a';
        ctx.beginPath(); ctx.ellipse(0, 0, size, size * .46, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,200,130,.28)';
        ctx.fillRect(-size * .5, -size * .16, size, size * .28);
        ctx.restore();
      }
    } else if (bId === 'cavernas') {
      // motas de sal que flotan hacia arriba
      const n = layer === 0 ? 12 : 7;
      for (let i = 0; i < n; i++) {
        const sp = 7 + h1(i * 3.7) * 13;
        const x0 = h1(i * 9.1) * W;
        const t = (time * sp + h1(i * 5.2) * H) % H;
        const y = H - t + 10;
        const x = x0 + Math.sin(time * .9 + i * 1.9) * 7;
        const fade = Math.min(1, t / 14) * Math.max(0, 1 - Math.max(0, t - H + 22) / 22);
        if (fade <= 0) continue;
        const tw = .5 + Math.sin(time * 3.4 + i * 2.7) * .5;
        ctx.save();
        ctx.globalAlpha = (layer === 0 ? .4 : .6) * fade * (0.45 + tw * .55);
        if (i % 3 === 0) Gfx.glow(x, y, 5, '#9fe3ef', .1 * fade);
        ctx.fillStyle = '#cfeef4';
        ctx.beginPath();
        ctx.moveTo(x, y - 2.2 * (1 + tw * .4));
        ctx.lineTo(x + 1.4, y);
        ctx.lineTo(x, y + 2.2 * (1 + tw * .4));
        ctx.lineTo(x - 1.4, y);
        ctx.fill();
        ctx.restore();
      }
      // goteos desde la bóveda (solo capa de fondo)
      if (layer === 0) {
        for (let i = 0; i < 2; i++) {
          const T = 2.6 + i * 1.3;
          const t = (time + i * 1.1) % T;
          const dx = room.bounds.x + 30 + h1(i * 13.7) * (room.bounds.w - 60);
          const fallDur = .8;
          const y1 = room.bounds.y - 6;
          const y2 = room.bounds.y + room.bounds.h * (.45 + h1(i * 3.3) * .4);
          if (t < fallDur) {
            const p = t / fallDur;
            const y = E.lerp(y1, y2, p * p);
            ctx.globalAlpha = .75 * Math.min(1, p * 4);
            ctx.fillStyle = '#bfe8f2';
            ctx.beginPath(); ctx.ellipse(dx, y, 1, 2.1, 0, 0, TAU); ctx.fill();
            ctx.globalAlpha = 1;
          } else {
            const k = E.clamp01((t - fallDur) / .5);
            if (k < 1) Gfx.ring(dx, y2, 2 + E.easeOut(k) * 7, '#bfe8f2', (1 - k) * .5, .8);
          }
        }
      }
    } else {
      // glifos suspendidos que ascienden por Omnitopia
      const n = layer === 0 ? 11 : 7;
      for (let i = 0; i < n; i++) {
        const sp = 9 + h1(i * 4.9) * 16;
        const x0 = h1(i * 8.3) * W;
        const cyc = H + 30;
        const t = (time * sp + h1(i * 6.1) * cyc) % cyc;
        const y = H - t + 15;
        const x = x0 + Math.sin(time * 1.1 + i * 2.4) * 9;
        const fade = Math.min(1, t / 16) * Math.max(0, 1 - Math.max(0, t - H + 20) / 26);
        if (fade <= 0) continue;
        const blink = .45 + Math.sin(time * 4.2 + i * 3.3) * .55;
        const s = 1.7 + h1(i * 2.9) * 1.6;
        ctx.save();
        ctx.globalAlpha = (layer === 0 ? .38 : .55) * fade * blink;
        ctx.translate(x, y);
        ctx.rotate(time * (i % 2 ? .8 : -.6) + i);
        if (i % 3 === 0) Gfx.glow(0, 0, 6, '#c79aff', .12 * fade);
        ctx.strokeStyle = '#d8b0ff'; ctx.lineWidth = .9;
        ctx.strokeRect(-s, -s, s * 2, s * 2);
        ctx.beginPath(); ctx.moveTo(0, -s * .7); ctx.lineTo(0, s * .7);
        ctx.moveTo(-s * .7, 0); ctx.lineTo(s * .7, 0); ctx.stroke();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  };

  // ------------------------------------------------------------
  // 6) PUERTAS — círculo de runas giratorio al abrirse
  // ------------------------------------------------------------
  const _drawDoor = Art.drawDoor;
  Art.drawDoor = function (ctx, door, game) {
    _drawDoor.call(this, ctx, door, game);
    if (!door.open) return;
    const x = door.x, y = door.y, h = door.h, t = game.time;
    const cols = { boon: '#d5a8ff', heal: '#e99b79', ing: '#83d8c3', essence: '#d1a1ff', recipe: '#e8c477' };
    const col = cols[door.reward && door.reward.type] || '#d5a8ff';
    const ry = y + h * .78, spin = t * .9;
    ctx.save();
    ctx.globalAlpha = .5 + Math.sin(t * 2.4) * .12;
    ctx.strokeStyle = col; ctx.lineWidth = .9;
    ctx.beginPath(); ctx.ellipse(x, ry, 16, 6.6, 0, 0, TAU); ctx.stroke();
    ctx.globalAlpha *= .6;
    ctx.beginPath(); ctx.ellipse(x, ry, 11, 4.4, 0, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = spin + i * TAU / 8;
      const px = x + Math.cos(a) * 16, py = ry + Math.sin(a) * 6.6;
      ctx.globalAlpha = .35 + Math.sin(t * 3 + i) * .25;
      Gfx.circ(px, py, 1.1, i % 2 ? '#fff1d5' : col);
    }
    ctx.restore();
  };

  // ------------------------------------------------------------
  // 7) SONIDO — velo, ráfaga de sombra, alma y tema de victoria
  // ------------------------------------------------------------
  const _sfx = Snd.sfx;
  Snd.sfx = function (name) {
    if (!this.ready || this.muted) return;
    if (name === 'veil') {
      // el espectro se desvanece: susurro de aire invertido
      this.noise({ freq: 1600, to: 2600, dur: 0.3, gain: 0.09, q: 2.6 });
      this.tone({ freq: 340, to: 110, dur: 0.32, type: 'sine', gain: 0.07 });
      return;
    }
    if (name === 'shadeCast') {
      // ráfaga de sombra: barrido oscuro descendente
      this.tone({ freq: 620, to: 130, dur: 0.26, type: 'sawtooth', gain: 0.11, filter: 1500, filterTo: 320 });
      this.noise({ freq: 850, to: 220, dur: 0.2, gain: 0.1 });
      return;
    }
    if (name === 'soul') {
      // campanita suave de alma liberada
      this.tone({ freq: 880, to: 1320, dur: 0.5, type: 'sine', gain: 0.055 });
      this.tone({ freq: 1320, to: 1760, dur: 0.4, type: 'sine', gain: 0.035, delay: 0.12 });
      return;
    }
    _sfx.call(this, name);
  };
  // tema de victoria: triunfo mayor sobre la escala del título
  Snd.SONGS.victory = { bpm: 100, root: 50, scale: [0, 2, 4, 7, 9], arp: [0, 7, 12, 16, 12, 7, 9, 4], lead: true };
  // las élites liberan su alma con la campana al caer
  const _enemyDie = window.EnemyBase.prototype.die;
  window.EnemyBase.prototype.die = function (o) {
    const wasElite = this.elite || this.boss;
    _enemyDie.call(this, o);
    if (wasElite) Snd.sfx('soul');
  };

  // ------------------------------------------------------------
  // 8) FX DE JUEGO — críticos, nivel, recogidas y victoria
  // ------------------------------------------------------------
  const _addHit = Game.addHit;
  Game.addHit = function (o) {
    _addHit.call(this, o);
    if (o.crit && o.team === 'hero') {
      this.vfx.push({ kind: 'star', x: o.x, y: o.y, t: 0, life: .32, r: 5, r2: 27, color: '#ffd24a' });
    }
  };

  Game.levelUp = function () {
    Snd.sfx('levelup');
    Gfx.Fx.flash('#f0c05a', 0.25);
    Gfx.shake(3);
    this.toast('¡NIVEL ' + this.hero.level + '!', '#f0c05a');
    const hx = this.hero.x, hy = this.hero.y;
    // columna de luz y anillo ascendente
    this.vfx.push({ kind: 'pillar', x: hx, y: hy, t: 0, life: .75, r: 8, r2: 78, color: '#f0c05a' });
    this.vfx.push({ kind: 'ring', x: hx, y: hy - 2, t: 0, life: .55, r: 4, r2: 40, color: '#ffd97a' });
    Gfx.P.burst(hx, hy - 14, 22, { color: ['#fff3c4', '#f0c05a', '#e8a23a'], speed: 130, life: .9, size: 2, glow: true, grav: -70 });
    for (let i = 0; i < 10; i++) {
      Gfx.P.spawn({
        x: hx + E.rnd(14, -14), y: hy, vx: E.rnd(20, -20), vy: E.rnd(-90, -150),
        life: .9, size: 1.6, color: '#ffd97a', glow: true, shape: 'spark', rot: E.rnd(TAU), vrot: 8, grav: 120,
      });
    }
  };

  Game.victory = function () {
    this.state = 'victory';
    this.deathT = 0;
    this.essenceEarned += 120;
    this.essence += 120;
    this.save.essence = Math.round(this.essence);
    this.save.runs = (this.save.runs || 0) + 1;
    this.save.best = (this.save.best || 0) + 1;
    this.save.bestRooms = Math.max(this.save.bestRooms || 0, this.roomsCleared);
    this.persist();
    Snd.music('victory');
    Snd.sfx('levelup');
    // lluvia de chispas doradas y púrpura sobre la pantalla final
    for (let i = 0; i < 46; i++) {
      Gfx.P.spawn({
        x: E.rnd(Gfx.W), y: E.rnd(Gfx.H * .7),
        vx: E.rnd(30, -30), vy: E.rnd(-40, -130),
        life: E.rnd(1.6, .7), size: E.rnd(2.4, 1),
        color: i % 3 ? '#f0c05a' : i % 3 === 1 ? '#d9a0ff' : '#fff3c4',
        glow: true, grav: 60, drag: .04, shape: i % 4 === 0 ? 'spark' : 'circle',
      });
    }
  };

  // estela en los recogibles y destello al recogerlos
  const _updatePickups = Game.updatePickups;
  Game.updatePickups = function (dt) {
    const essBefore = this.essence;
    const ingBefore = Alchemy.totalIngredients();
    for (const p of this.pickups) {
      if (Math.random() < 0.22) Gfx.P.spawn({
        x: p.x + E.rnd(3, -3), y: p.y - p.z, vy: -9, life: .38, size: 1.2,
        color: p.type === 'essence' ? '#dab3ff' : p.type === 'heal' ? '#ffab8f' : '#9fe8c0',
        glow: true, shape: 'circle', fade: .7,
      });
    }
    _updatePickups.call(this, dt);
    const h = this.hero;
    if (this.essence > essBefore) {
      Gfx.P.burst(h.x, h.y - 16, 5, { color: '#dab3ff', speed: 44, life: .4, size: 1.5, glow: true, grav: -60 });
    } else if (Alchemy.totalIngredients() > ingBefore) {
      Gfx.P.burst(h.x, h.y - 16, 5, { color: '#9fe8c0', speed: 44, life: .4, size: 1.5, glow: true, grav: -60 });
    }
  };

  // ------------------------------------------------------------
  // 9) HÉROE — destello de hoja en reposo y polvo al frenar el dash
  // ------------------------------------------------------------
  const _heroUpdate = window.Hero.prototype.update;
  window.Hero.prototype.update = function (dt, g) {
    const wasDash = this.state === 'dash';
    _heroUpdate.call(this, dt, g);
    // reloj del destello de la hoja
    if (this.glintT === undefined) this.glintT = 3.6;
    this.glintT -= dt;
    if (this.glintT < -0.26) this.glintT = 4.2 + Math.random() * 2.8;
    // nube de polvo al frenar el dash
    if (wasDash && this.state === 'idle' && g && g.room) {
      Gfx.P.burst(this.x, this.y, 7, {
        color: g.room.dustColor || '#6b5b47', speed: 38, life: .42, size: 1.8,
        grav: 50, fade: .6, angle: Math.PI, spread: 1.2,
      });
    }
  };

  const _heroDraw = window.Hero.prototype.draw;
  window.Hero.prototype.draw = function (ctx, g) {
    _heroDraw.call(this, ctx, g);
    // destello de mantenimiento de la hoja (solo en reposo o paseo)
    if (this.glintT !== undefined && this.glintT < 0 && this.state !== 'dead' && (this.state === 'idle' || this.state === 'run')) {
      const k = 1 + this.glintT / 0.26;
      const kk = Math.sin(k * Math.PI);
      const tipx = this.x + Math.cos(this.aim) * 23;
      const tipy = this.y - 27 + Math.sin(this.aim) * 15;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = kk * .85;
      Gfx.glow(tipx, tipy, 4 + kk * 4, '#fff6d8', .5 * kk);
      const wa = this.aim + .8 + k * 1.5;
      ctx.strokeStyle = '#fff8e2';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tipx + Math.cos(wa) * 2, tipy + Math.sin(wa) * 2);
      ctx.lineTo(tipx + Math.cos(wa) * 7, tipy + Math.sin(wa) * 7);
      ctx.stroke();
      ctx.globalAlpha = kk * .6;
      Gfx.circ(tipx, tipy, 1, '#ffffff');
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  };

  // ------------------------------------------------------------
  // 10) EL ALAMBIQUE — fogata, caldero y ceniza flotante
  // ------------------------------------------------------------
  UI.campfire = function (ctx, x, y, t) {
    const flick = Math.sin(t * 9) * .5 + Math.sin(t * 15.7) * .3;
    Gfx.glow(x, y - 4, 44 + flick * 4, '#e8541f', .1 + Math.sin(t * 6) * .012);
    Gfx.glow(x, y - 6, 24 + flick * 3, '#ff9a3a', .2);
    // círculo de piedras
    for (let i = 0; i < 7; i++) {
      const a = i * TAU / 7 + .4;
      const px = x + Math.cos(a) * 13, py = y + Math.sin(a) * 4.6;
      Gfx.ellipse(px, py, 2.6, 1.9, i % 2 ? '#3a3440' : '#4a4352');
      Gfx.rect(px - 1.6, py - 1.4, 1, .7, 'rgba(240,206,150,.3)');
    }
    // leños cruzados
    ctx.save();
    ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 9, y + 2); ctx.lineTo(x + 8, y - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 8, y - 5); ctx.lineTo(x + 9, y + 2); ctx.stroke();
    ctx.strokeStyle = '#6d4a30'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x - 9, y + 1); ctx.lineTo(x + 8, y - 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 8, y - 6); ctx.lineTo(x + 9, y + 1); ctx.stroke();
    ctx.restore();
    // brasas
    for (let i = 0; i < 4; i++) {
      const pk = .5 + Math.sin(t * 5 + i * 1.8) * .5;
      Gfx.circ(x - 3.4 + i * 2.3, y - 1.4, 1, E.mix('#8a2c14', '#ffb03a', pk));
    }
    // llamas
    const fh = 11 + flick * 1.8;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    Gfx.poly([[x - 6, y - 2], [x - 4.4, y - 2 - fh * .5], [x + Math.sin(t * 7.3) * 1.6, y - 2 - fh], [x + 4.6, y - 2 - fh * .42], [x + 6, y - 2]], E.alpha('#e8541f', .75));
    Gfx.poly([[x - 4, y - 2], [x - 2.6, y - 2 - fh * .62], [x + Math.sin(t * 9.1 + 1) * 1.2, y - 2 - fh * 1.18], [x + 3, y - 2 - fh * .5], [x + 4, y - 2]], E.alpha('#ffa02e', .85));
    Gfx.poly([[x - 2, y - 2.4], [x + Math.sin(t * 11 + 2) * .9, y - 2 - fh * .82], [x + 2, y - 2.4]], E.alpha('#ffe89a', .9));
    ctx.restore();
    // chispas ascendentes
    for (let i = 0; i < 6; i++) {
      const cyc = 30 + (i * 17 % 14);
      const tt = (t * (16 + (i * 7 % 12)) + i * 9) % cyc;
      const py = y - 4 - tt;
      const px = x + Math.sin(t * 2.2 + i * 2.4) * 5;
      ctx.globalAlpha = Math.max(0, 1 - tt / cyc) * .85;
      Gfx.circ(px, py, .9, i % 2 ? '#ffd08a' : '#ff9a4a');
      ctx.globalAlpha = 1;
    }
    // humo tenue
    for (let i = 0; i < 3; i++) {
      const tt = (t * .55 + i * .8) % 1;
      ctx.globalAlpha = (1 - tt) * .16;
      Gfx.circ(x + Math.sin(t * 1.4 + i * 2) * 3, y - 16 - tt * 26, 2.4 + tt * 4, '#8d8496');
      ctx.globalAlpha = 1;
    }
  };

  UI.cauldron = function (ctx, x, y, t) {
    Gfx.glow(x, y - 6, 22, '#7fe36b', .09 + Math.sin(t * 3) * .014);
    // peana
    Gfx.rect(x - 9, y + 3, 18, 2.6, '#241d2c');
    Gfx.rect(x - 6, y + 1, 3, 4, '#1a1420');
    Gfx.rect(x + 3, y + 1, 3, 4, '#1a1420');
    // cuerpo
    Gfx.ellipse(x, y - 2, 10.4, 7.6, '#100c16');
    Gfx.ellipse(x, y - 2.6, 9.2, 6.6, '#241b30');
    Gfx.ellipse(x, y - 3, 8.6, 6, '#2e2340');
    Gfx.rect(x - 9.6, y - 8.4, 19.2, 1.6, '#0e0a14');
    // líquido verde brillante
    Gfx.ellipse(x, y - 8.2, 7.6, 2.2, '#12301c');
    Gfx.ellipse(x, y - 8.4, 6.6, 1.7, '#2c6b30');
    Gfx.ellipse(x - 2, y - 8.8, 3, .8, '#7fe36b');
    // burbujas que ascienden y revientan
    for (let i = 0; i < 5; i++) {
      const cyc = 1.6 + (i * .37 % .8);
      const tt = (t * .8 + i * .53) % cyc / cyc;
      const bx = x - 4 + (i * 5 % 8);
      const by = y - 8 - tt * (4 + (i % 3));
      const a = Math.sin(tt * Math.PI);
      ctx.globalAlpha = a * .8;
      Gfx.circ(bx, by, Math.max(.3, 1.5 - tt), i % 2 ? '#9fe86a' : '#d6ffb0');
      ctx.globalAlpha = 1;
    }
    // vapor de colores
    for (let i = 0; i < 3; i++) {
      const tt = (t * .4 + i * .7) % 1;
      ctx.globalAlpha = (1 - tt) * .2;
      Gfx.circ(x + Math.sin(t * 1.1 + i * 2.6) * 4, y - 12 - tt * 22, 2 + tt * 5, i % 2 ? '#7fe36b' : '#b98bff');
      ctx.globalAlpha = 1;
    }
  };

  const _drawHub = UI.drawHub;
  UI.drawHub = function (ctx, g) {
    _drawHub.call(this, ctx, g);
    const t = g.time;
    // ceniza flotando sobre todo el campamento
    for (let i = 0; i < 16; i++) {
      const ax = (i * 113 + Math.sin(t * .5 + i * 1.7) * 22 + 480) % Gfx.W;
      const ay = (i * 61 + t * (5 + i % 4 * 3)) % (Gfx.H + 20) - 10;
      ctx.globalAlpha = .18 + (i % 4) * .09;
      Gfx.rect(ax, ay, 1.2, 1.2, i % 3 ? '#e8b88a' : '#b98bff');
      ctx.globalAlpha = 1;
    }
    UI.campfire(ctx, 106, 250, t);
    UI.cauldron(ctx, 422, 248, t);
  };

  // ------------------------------------------------------------
  // 11) GAME.DRAW — integración de capas nuevas
  //     (copia fiel del original + capa ambiental, disolución de
  //      enemigos muertos, vfx de estrella/columna y pulso de peligro)
  // ------------------------------------------------------------
  Game.draw = function (ctx) {
    const g = this;
    if (g.state === 'title') {
      UI.drawTitle(ctx, g);
      UI.drawFade(ctx, g.fade);
      return;
    }
    if (g.state === 'hub') {
      UI.drawHub(ctx, g);
      UI.drawFade(ctx, g.fade);
      Gfx.F.draw(ctx);
      return;
    }
    if (!g.room) { UI.drawTitle(ctx, g); return; }

    const r = g.room;
    Art.drawBackground(ctx, r, Gfx.cam, g.time);
    Gfx.begin();
    Art.drawFloor(ctx, r, g.time);

    // capa ambiental de fondo (ceniza, sal, glifos)
    Art.drawAmbient(ctx, r, g.time, 0);

    // zonas en el suelo
    for (const z of g.zones) Art.drawZone(ctx, z, g.time);

    // decorado de obstáculos y entidades ordenados por y
    // (los enemigos muertos permanecen un instante para su disolución)
    const drawables = [];
    for (const o of r.obstacles) drawables.push({ y: o.y, kind: 'obs', o });
    for (const c of g.chests) drawables.push({ y: c.y + 4, kind: 'chest', o: c });
    for (const e of g.enemies) drawables.push({ y: e.y, kind: 'e', o: e });
    if (g.dog) drawables.push({ y: g.dog.y, kind: 'dog', o: g.dog });
    drawables.push({ y: g.hero.y, kind: 'hero', o: g.hero });
    drawables.sort((a, b) => a.y - b.y);

    // luz local sobre suelo y contornos
    for (const d of drawables) {
      if (d.kind === 'obs') continue;
      if (d.kind === 'chest') {
        if (!d.o.opened) Gfx.glow(d.o.x, d.o.y - 6, 18, '#f0c05a', .12);
        continue;
      }
      const actor = d.o;
      if (d.kind === 'hero') {
        const hue = actor.castGlow > .2 ? '#b98bff' : r.biome.accent;
        Gfx.glow(actor.x, actor.y - 9, 25 + actor.castGlow * 12, hue, .105);
        if (actor.state === 'heavy') Gfx.glow(actor.x, actor.y - 12, 33, '#ffd08a', .09);
      } else if (d.kind === 'dog') {
        Gfx.glow(actor.x, actor.y - 7, 13, '#d28a54', .07);
      } else {
        const hue = actor.type === 'wisp' ? (actor.elite ? '#bd82ff' : '#70d9ee')
          : actor.type === 'shade' ? '#9d7be8'
            : actor.type === 'charger' ? '#ef7658'
              : actor.type === 'boss' ? '#c17bf0' : '#d6a55f';
        Gfx.glow(actor.x, actor.y - 10 * (actor.scale || 1), 20 * (actor.scale || 1), hue, actor.elite ? .16 : .095);
      }
    }

    for (const d of drawables) {
      if (d.kind === 'obs') Art.drawObstacle(ctx, r, d.o, g.time);
      else if (d.kind === 'chest') Art.drawChest(ctx, d.o, g.time);
      else if (d.kind === 'e') d.o.draw(ctx, g);
      else if (d.kind === 'dog') Art.drawDog(ctx, d.o, g.time);
      else if (d.kind === 'hero') d.o.draw(ctx, g);
    }

    // puertas
    for (const d of g.doors) Art.drawDoor(ctx, d, g);

    // proyectiles
    for (const p of g.projectiles) Art.drawProjectile(ctx, p);

    // partículas y números
    Gfx.P.draw(ctx, 0);
    Gfx.P.draw(ctx, 1);
    Gfx.F.draw(ctx);

    // capa ambiental de primer plano
    Art.drawAmbient(ctx, r, g.time, 1);

    // vfx
    for (const v of g.vfx) {
      const k = E.clamp01(v.t / v.life);
      if (v.kind === 'ring' || v.kind === 'shock') {
        const rr = E.lerp(v.r, v.r2, E.easeOut(k));
        Gfx.ring(v.x, v.y, rr, v.color, (1 - k) * 0.9, v.kind === 'shock' ? 3 : 2);
      } else if (v.kind === 'boom') {
        const rr = E.lerp(v.r, v.r2, E.easeOut(k));
        Gfx.circA(v.x, v.y, rr, v.color, (1 - k) * 0.35);
        Gfx.ring(v.x, v.y, rr, v.color, (1 - k) * 0.9, 2);
      } else if (v.kind === 'star') {
        // estrella de crítico: cuatro puntas que giran y se abren
        const rr = E.lerp(v.r, v.r2, E.easeOut(k));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (1 - k) * .95;
        ctx.translate(v.x, v.y);
        ctx.rotate(k * 1.1);
        ctx.strokeStyle = v.color;
        ctx.lineWidth = 2.2 * (1 - k) + .4;
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * rr * .25, Math.sin(a) * rr * .25);
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
          ctx.stroke();
        }
        ctx.rotate(Math.PI / 4);
        ctx.globalAlpha *= .45;
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * rr * .18, Math.sin(a) * rr * .18);
          ctx.lineTo(Math.cos(a) * rr * .62, Math.sin(a) * rr * .62);
          ctx.stroke();
        }
        ctx.restore();
      } else if (v.kind === 'pillar') {
        // columna de luz (subida de nivel)
        const hh = E.lerp(v.r, v.r2, E.easeOut(k));
        const w = 9 * (1 - k * .55);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const gr = ctx.createLinearGradient(0, v.y - hh, 0, v.y);
        gr.addColorStop(0, E.alpha(v.color, 0));
        gr.addColorStop(.72, E.alpha(v.color, .5 * (1 - k)));
        gr.addColorStop(1, E.alpha(v.color, .85 * (1 - k)));
        ctx.fillStyle = gr;
        ctx.fillRect(v.x - w, v.y - hh, w * 2, hh);
        ctx.globalAlpha = (1 - k) * .5;
        Gfx.ring(v.x, v.y - 2, E.easeOut(k) * 30, v.color, (1 - k) * .7, 1.6);
        ctx.restore();
      }
    }

    // recogibles
    for (const p of g.pickups) Art.drawPickup(ctx, p, g.time);

    Gfx.end();

    // HUD
    if (g.state !== 'death' && g.state !== 'victory') UI.drawHUD(ctx, g);

    if (g.hero.state === 'dead' && g.state === 'run') {
      ctx.fillStyle = 'rgba(20,4,8,0.55)';
      ctx.fillRect(0, 0, Gfx.W, Gfx.H);
    }

    if (g.state === 'reward') UI.drawRewards(ctx, g);
    if (g.state === 'pause') UI.drawPause(ctx, g);
    if (g.state === 'radial') UI.radialHover = UI.drawRadial(ctx, g);
    if (g.state === 'inventory') UI.drawInventory(ctx, g);
    if (g.state === 'death') UI.drawDeath(ctx, g);
    if (g.state === 'victory') UI.drawVictory(ctx, g);

    Gfx.Fx.drawFlash();
    Gfx.Fx.vignette(0.42);
    // pulso de peligro cuando la vida está al límite
    if (g.state === 'run' && g.hero.state !== 'dead' && g.hero.hp / g.hero.maxHp < 0.3) {
      const danger = 1 - g.hero.hp / g.hero.maxHp;
      const pulse = .5 + Math.sin(g.time * 5.6) * .5;
      const rg = ctx.createRadialGradient(Gfx.W / 2, Gfx.H / 2, Gfx.H * .4, Gfx.W / 2, Gfx.H / 2, Gfx.H * .84);
      rg.addColorStop(0, 'rgba(150,18,18,0)');
      rg.addColorStop(1, `rgba(150,18,18,${(.1 + pulse * .17) * danger * 1.7})`);
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, Gfx.W, Gfx.H);
    }
    UI.drawFade(ctx, g.fade);
  };
})();
