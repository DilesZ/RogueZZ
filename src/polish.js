// ============================================================
//  REMASTE — pulido de "game feel", animación y ambiente
//  ------------------------------------------------------------
//  Módulo de parches finos sobre el juego base + enrich.
//  Cárgalo después de enrich.js (se puede retirar de index.html
//  y el juego vuelve a su estado anterior).
//
//  Contenido:
//   1. Cámara: punch de zoom en impactos y deriva orgánica.
//   2. Héroe: frenada real (adiós al deslizamiento), derrape al
//      invertir rumbo, squash & stretch y ciclo de andar ligado
//      a la zancada real (los pies ya no patinan).
//   3. Dash: anillo de arranque, estela de velocidad y punch.
//   4. Escenarios: capa de parallax medio por bioma (copas y
//      enredaderas, estalactitas y vetas de sal, monolitos y
//      estrellas), haces de luz, pools de luz bajo obstáculos y
//      pulsos recorriendo el sello de Omnitopia.
//   5. Animación: vaivén al andar de los enemigos, chispas
//      orbitando élites, polvo de carga, runas del jefe y
//      transición de sala en iris.
//   6. Post-proceso: gradación de color por bioma y grano fílmico.
// ============================================================
(function () {
  if (!window.Art || !window.Game || !window.Gfx || !window.Hero || !window.NaraArt) return;
  const TAU = Math.PI * 2;

  // ------------------------------------------------------------
  // 1) CÁMARA — punch de zoom + deriva sutil
  // ------------------------------------------------------------
  const cam = Gfx.cam;
  cam.z = 1; cam.tz = 1;
  Gfx.punch = function (a) {
    cam.tz = Math.min(1.15, Math.max(cam.tz, 1 + a));
  };

  const _updateCam = Gfx.updateCam;
  Gfx.updateCam = function (dt) {
    const c = this.cam;
    // el punch relaja siempre hacia 1
    c.tz += (1 - c.tz) * (dt > 0 ? 1 - Math.exp(-5.5 * dt) : 1);
    c.z += (c.tz - c.z) * (dt > 0 ? 1 - Math.exp(-16 * dt) : 1);
    const out = _updateCam.call(this, dt);
    // deriva orgánica: la cámara "respira" aunque el héroe esté quieto
    this._drift = (this._drift || 0) + dt;
    c.ox += Math.sin(this._drift * .5) * .45;
    c.oy += Math.cos(this._drift * .37) * .35;
    return out;
  };

  Gfx.begin = function () {
    const ctx = this.ctx, c = this.cam;
    ctx.save();
    ctx.translate(this.W / 2 + c.ox, this.H / 2 + c.oy);
    if (c.z !== 1) ctx.scale(c.z, c.z);
    ctx.translate(Math.round(-c.x), Math.round(-c.y));
  };

  Gfx.screenX = function (x) { return (x - Gfx.cam.x) * Gfx.cam.z + Gfx.W / 2 + Gfx.cam.ox; };
  Gfx.screenY = function (y) { return (y - Gfx.cam.y) * Gfx.cam.z + Gfx.H / 2 + Gfx.cam.oy; };

  // ------------------------------------------------------------
  // 2) HÉROE — movimiento con peso y animación anclada al paso
  // ------------------------------------------------------------
  const _heroUpdate = Hero.prototype.update;
  Hero.prototype.update = function (dt, g) {
    const h = this;
    if (h.sqX === undefined) {
      h.sqX = 1; h.sqY = 1; h.sqKick = 0; h.skidT = 0; h.stopT = 0;
    }
    const prevState = h.state;
    const prevVx = h.vx, prevVy = h.vy;
    const prevSp = Math.hypot(prevVx, prevVy);
    _heroUpdate.call(this, dt, g);

    // relojes de impulsos
    h.sqKick = Math.max(0, h.sqKick - dt * 5.5);
    h.stopT = Math.max(0, h.stopT - dt);
    h.skidT = Math.max(0, h.skidT - dt);

    // anillo de arranque del dash
    if (h.state === 'dash' && prevState !== 'dash' && g) {
      g.vfx.push({ kind: 'ring', x: h.x, y: h.y - 8, r: 3, r2: 26, color: '#bfe9ff', t: 0, life: .3 });
      Gfx.punch(.04);
    }

    // refinamiento del movimiento base: aceleración decidida al pulsar,
    // frenada en seco al soltar — el héroe se detiene, no patina.
    if (g && g.room && (h.state === 'idle' || h.state === 'run')) {
      const ax = Input.axis();
      const has = !!(ax.x || ax.y);
      const rate = has ? 17 : 30;
      const gearSp = 1 + (h.gearSpeed || 0);
      h.vx = E.smooth(h.vx, ax.x * h.speed * gearSp, rate, dt);
      h.vy = E.smooth(h.vy, ax.y * h.speed * gearSp, rate, dt);
      let sp = Math.hypot(h.vx, h.vy);
      if (!has && sp < 9) { h.vx = 0; h.vy = 0; sp = 0; }

      // frenada en seco tras correr: polvo hacia atrás + micro-squash
      if (!has && prevSp > 85 && sp < 34 && h.stopT <= 0) {
        h.stopT = .3;
        h.sqKick = 1;
        const a = Math.atan2(prevVy, prevVx);
        Gfx.P.burst(h.x + Math.cos(a) * 4, h.y, 6, {
          color: g.room.dustColor || '#6b5b47', speed: 46, life: .4, size: 1.8,
          grav: 40, fade: .55, angle: a, spread: .9,
        });
        Snd.sfx('step');
      }
      // derrape al invertir el rumbo en carrera
      if (has && prevSp > 70 && h.skidT <= 0) {
        const want = Math.atan2(ax.y, ax.x);
        const cur = Math.atan2(prevVy, prevVx);
        const d = ((want - cur + Math.PI * 3) % TAU) - Math.PI;
        if (Math.abs(d) > 2.05) {
          h.skidT = .16;
          Gfx.P.burst(h.x, h.y, 4, {
            color: g.room.dustColor || '#6b5b47', speed: 30, life: .3, size: 1.4,
            grav: 30, fade: .6, angle: cur, spread: .6,
          });
        }
      }
    }

    // squash & stretch por estado
    let txs = 1, tys = 1;
    if (h.state === 'dash') { txs = 1.12; tys = .87; }
    else if (h.state === 'hurt') { txs = 1.13; tys = .85; }
    else if (h.state === 'run') {
      const plant = Math.max(0, Math.sin(h.walkPhase * 2));
      tys = 1 - plant * .022;
      txs = 1 + plant * .012;
    }
    const k = 1 - Math.exp(-17 * dt);
    h.sqX += (txs - h.sqX) * k;
    h.sqY += (tys - h.sqY) * k;
  };

  const _heroDraw = Hero.prototype.draw;
  Hero.prototype.draw = function (ctx, g) {
    // squash alrededor del apoyo (los pies quedan clavados al suelo)
    const sx = this.sqX === undefined ? 1 : this.sqX * (1 + (this.sqKick || 0) * .1);
    const sy = this.sqY === undefined ? 1 : this.sqY * (1 - (this.sqKick || 0) * .17);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(sx, sy);
    ctx.translate(-this.x, -this.y);
    _heroDraw.call(this, ctx, g);
    ctx.restore();

    // estela de velocidad durante el dash
    if (this.state === 'dash') {
      const a = Math.atan2(this.dashDirY, this.dashDirX);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const off = (i - 1.5) * 4.4;
        const px = this.x - Math.cos(a) * (9 + i * 3) + Math.cos(a + Math.PI / 2) * off;
        const py = this.y - 12 - Math.sin(a) * (9 + i * 3) + Math.sin(a + Math.PI / 2) * off * .6;
        ctx.globalAlpha = .3 - i * .055;
        ctx.strokeStyle = i % 2 ? '#dff4ff' : '#ffffff';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - Math.cos(a) * (9 + i * 2.6), py - Math.sin(a) * (9 + i * 2.6));
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  };

  // ciclo de andar de la hoja de sprites ligado a la zancada real:
  // la frecuencia de los pasos sigue la velocidad del cuerpo.
  const _naraDraw = NaraArt.drawHero;
  NaraArt.drawHero = function (ctx, hero, time, alpha) {
    if (hero && (hero.state === 'idle' || hero.state === 'run') &&
      Math.hypot(hero.vx || 0, hero.vy || 0) > 14) {
      const wp = ((hero.walkPhase % TAU) + TAU) % TAU;
      const frame = Math.floor(wp / (TAU / 5)) % 5;
      _naraDraw.call(this, ctx, hero, (frame + .5) / 11, alpha);
      return;
    }
    _naraDraw.call(this, ctx, hero, time, alpha);
  };

  // el perro también deja polvo al esprintar
  const _drawDog = Art.drawDog;
  Art.drawDog = function (ctx, dog, time) {
    _drawDog.call(this, ctx, dog, time);
    const sp = Math.hypot(dog.vx || 0, dog.vy || 0);
    if (sp > 78 && Math.random() < .3) {
      Gfx.P.spawn({
        x: dog.x - dog.vx * .04, y: dog.y, vx: -dog.vx * .12, vy: -8,
        life: .3, size: 1.3, color: '#6b5b47', fade: .6,
      });
    }
  };

  // ------------------------------------------------------------
  // 3) ESCENARIOS — parallax medio, haces de luz y suelo vivo
  // ------------------------------------------------------------
  const MIDS = Object.create(null);
  function midLayer(id) {
    if (MIDS[id]) return MIDS[id];
    const c = document.createElement('canvas');
    c.width = 560; c.height = 320;
    const x = c.getContext('2d');
    x.lineJoin = 'round'; x.lineCap = 'round';
    if (id === 'jungla') {
      // dosel de copas cerrando el marco superior y lianas colgando
      for (let i = 0; i < 26; i++) {
        const cx2 = (i * 47) % 560 - 10;
        const cy2 = 8 + ((i * 31) % 26);
        const rr = 26 + (i * 17) % 30;
        x.fillStyle = i % 2 ? 'rgba(7,16,11,.92)' : 'rgba(10,22,15,.88)';
        x.beginPath();
        x.ellipse(cx2, cy2, rr, rr * .5, (i % 3 - 1) * .3, 0, TAU);
        x.fill();
        x.fillStyle = 'rgba(46,74,38,.2)';
        x.beginPath();
        x.ellipse(cx2 - rr * .25, cy2 - rr * .16, rr * .5, rr * .2, -.4, 0, TAU);
        x.fill();
      }
      for (let i = 0; i < 9; i++) {
        const vx = 24 + i * 62 + (i * 13) % 15;
        const len = 70 + (i * 43) % 130;
        x.strokeStyle = 'rgba(14,26,17,.85)';
        x.lineWidth = 1.6;
        x.beginPath();
        x.moveTo(vx, 22 + (i * 11) % 14);
        x.quadraticCurveTo(vx + 10, 22 + len * .55, vx - 6, 22 + len);
        x.stroke();
        x.fillStyle = 'rgba(24,44,26,.8)';
        for (let j = 1; j <= 3; j++) {
          const t = j / 3.2;
          const lx = vx + 10 * t * 2 * (1 - t) - 6 * t * t;
          const ly = 22 + len * t;
          x.beginPath(); x.ellipse(lx, ly, 3.4, 1.7, .5, 0, TAU); x.fill();
        }
      }
      // troncos colosales enmarcando los lados
      for (const [tx2, tw] of [[36, 44], [524, 52]]) {
        x.fillStyle = 'rgba(6,12,9,.95)';
        x.beginPath();
        x.moveTo(tx2 - tw / 2, 320);
        x.quadraticCurveTo(tx2 - tw * .3, 150, tx2 - tw * .22, 40);
        x.lineTo(tx2 + tw * .22, 40);
        x.quadraticCurveTo(tx2 + tw * .3, 150, tx2 + tw / 2, 320);
        x.closePath(); x.fill();
        x.fillStyle = 'rgba(56,88,44,.12)';
        for (let i = 0; i < 6; i++) {
          x.fillRect(tx2 - tw * .18 + (i % 2) * 8, 60 + i * 42, 5, 20);
        }
      }
    } else if (id === 'cavernas') {
      // racimos de estalactitas con facetas y vetas de sal luminosas
      for (let i = 0; i < 12; i++) {
        const bx = i * 50 - 12;
        const hh = 60 + (i * 37) % 74;
        x.fillStyle = i % 2 ? 'rgba(8,18,28,.95)' : 'rgba(10,23,34,.92)';
        x.beginPath();
        x.moveTo(bx - 22, 0); x.lineTo(bx + 24, 0);
        x.lineTo(bx + 12, hh * .5); x.lineTo(bx + 6, hh);
        x.lineTo(bx - 2, hh * .6); x.lineTo(bx - 14, hh * .42);
        x.closePath(); x.fill();
        x.strokeStyle = 'rgba(126,196,216,.16)';
        x.lineWidth = 1.2;
        x.beginPath();
        x.moveTo(bx + 8, 4); x.lineTo(bx + 3, hh * .45); x.lineTo(bx + 1, hh * .9);
        x.stroke();
      }
      // vetas de sal que brillan en la roca del fondo
      for (let i = 0; i < 7; i++) {
        const sx = 40 + i * 78, sy = 120 + (i * 53) % 150;
        x.strokeStyle = 'rgba(150,224,238,.3)';
        x.lineWidth = 1.1;
        x.beginPath();
        x.moveTo(sx, sy);
        x.lineTo(sx + 16, sy + 9);
        x.lineTo(sx + 30, sy + 4);
        x.stroke();
        x.fillStyle = 'rgba(190,240,246,.5)';
        x.fillRect(sx + 15, sy + 7, 2, 2);
        x.fillRect(sx + 29, sy + 2, 1.6, 1.6);
      }
    } else {
      // estrellas y una estructura anular gigante tras la niebla
      for (let i = 0; i < 46; i++) {
        const sx = (i * 97) % 560, sy = (i * 61) % 200;
        x.fillStyle = i % 3 ? 'rgba(210,196,255,.4)' : 'rgba(255,244,214,.5)';
        x.fillRect(sx, sy, 1.3, 1.3);
      }
      x.strokeStyle = 'rgba(126,74,188,.4)';
      x.lineWidth = 3;
      x.beginPath(); x.ellipse(280, 330, 190, 60, 0, Math.PI, TAU); x.stroke();
      x.strokeStyle = 'rgba(214,180,255,.3)';
      x.lineWidth = 1;
      x.beginPath(); x.ellipse(280, 330, 182, 54, 0, Math.PI, TAU); x.stroke();
      // monolitos suspendidos con canto inferior iluminado
      for (const [mx, my, mw, mh] of [[92, 150, 30, 96], [300, 108, 24, 74], [452, 172, 34, 110]]) {
        x.fillStyle = 'rgba(13,8,24,.95)';
        x.beginPath();
        x.moveTo(mx - mw / 2, my);
        x.lineTo(mx - mw * .32, my - mh);
        x.lineTo(mx + mw * .3, my - mh - 8);
        x.lineTo(mx + mw / 2, my - mh * .3);
        x.lineTo(mx + mw * .36, my);
        x.closePath(); x.fill();
        const gl = x.createLinearGradient(0, my - 8, 0, my);
        gl.addColorStop(0, 'rgba(197,134,255,.5)');
        gl.addColorStop(1, 'rgba(197,134,255,0)');
        x.fillStyle = gl;
        x.fillRect(mx - mw * .3, my - 8, mw * .6, 8);
        x.fillStyle = 'rgba(201,154,255,.35)';
        x.fillRect(mx - 1, my - mh * .5, 1.6, mh * .4);
      }
      // antenas lejanas en el horizonte
      for (let i = 0; i < 5; i++) {
        const ax = 60 + i * 120;
        x.strokeStyle = 'rgba(16,10,28,.9)';
        x.lineWidth = 2.4;
        x.beginPath(); x.moveTo(ax, 268); x.lineTo(ax, 232 - (i * 13) % 22); x.stroke();
        x.beginPath(); x.moveTo(ax - 6, 244); x.lineTo(ax + 6, 244); x.stroke();
        x.fillStyle = 'rgba(216,150,255,.55)';
        x.fillRect(ax - 1, 228 - (i * 13) % 22, 2, 2);
      }
    }
    MIDS[id] = c;
    return c;
  }

  const _drawBackground = Art.drawBackground;
  Art.drawBackground = function (ctx, room, camX, time) {
    _drawBackground.call(this, ctx, room, camX, time);
    const id = room.biomeId;
    const px = (camX.x - room.w / 2) * .16;
    const py = (camX.y - room.h / 2) * .1;
    ctx.drawImage(midLayer(id), -40 - px, -24 - py, 560, 320);
    drawMidFX(ctx, id, time);
  };

  // capas animadas del fondo: haces, shaft de sal y drones exploradores
  const RAYS = Object.create(null);
  function rayCanvas() {
    if (RAYS.ray) return RAYS.ray;
    const c = document.createElement('canvas');
    c.width = 90; c.height = 210;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 210);
    g.addColorStop(0, 'rgba(226,238,168,.34)');
    g.addColorStop(.7, 'rgba(208,226,142,.1)');
    g.addColorStop(1, 'rgba(208,226,142,0)');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(18, 0); x.lineTo(72, 0); x.lineTo(88, 210); x.lineTo(2, 210);
    x.closePath(); x.fill();
    RAYS.ray = c;
    return c;
  }
  function drawMidFX(ctx, id, time) {
    if (id === 'jungla') {
      // dos haces de sol que se mecen entre el dosel
      const img = rayCanvas();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 2; i++) {
        const sw = Math.sin(time * .16 + i * 2.4) * 16;
        ctx.save();
        ctx.translate(96 + i * 190 + sw, -12);
        ctx.rotate((i ? -1 : 1) * .1 + Math.sin(time * .1 + i) * .03);
        ctx.globalAlpha = .5 + Math.sin(time * .3 + i * 1.7) * .18;
        ctx.drawImage(img, 0, 0, 90, 210);
        ctx.restore();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    } else if (id === 'cavernas') {
      // columna de luz desde una grieta del techo
      const cx2 = 280 + Math.sin(time * .1) * 8;
      const g = ctx.createLinearGradient(0, 0, 0, 190);
      g.addColorStop(0, 'rgba(150,226,238,.14)');
      g.addColorStop(1, 'rgba(150,226,238,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx2 - 26, 0); ctx.lineTo(cx2 + 26, 0);
      ctx.lineTo(cx2 + 62, 190); ctx.lineTo(cx2 - 62, 190);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      // drones exploradores cruzando el cielo + banda de barrido
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 2; i++) {
        const spd = 11 + i * 5;
        const px = ((time * spd + i * 300) % 620) - 70;
        const py = 64 + Math.sin(time * .7 + i * 2.6) * 22 + i * 34;
        for (let j = 0; j < 3; j++) {
          ctx.globalAlpha = .3 - j * .09;
          Gfx.circ(px - 8 * (j + 1), py, 1.6 - j * .4, '#c79aff');
        }
        ctx.globalAlpha = .8;
        Gfx.glow(px, py, 7, '#c17bf0', .5);
        Gfx.circ(px, py, 1.6, '#f2e2ff');
      }
      ctx.globalAlpha = .05;
      const sy = (time * 9) % (Gfx.H + 40) - 20;
      const sc = ctx.createLinearGradient(0, sy - 8, 0, sy + 8);
      sc.addColorStop(0, 'rgba(180,120,255,0)');
      sc.addColorStop(.5, 'rgba(180,120,255,1)');
      sc.addColorStop(1, 'rgba(180,120,255,0)');
      ctx.fillStyle = sc;
      ctx.fillRect(0, sy - 8, Gfx.W, 16);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  // pools de luz proyectados en el suelo por cada obstáculo luminoso
  const POOLS = new WeakMap();
  function poolCanvas(col, r) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(r * 2); c.height = Math.ceil(r);
    const x = c.getContext('2d');
    const g = x.createRadialGradient(c.width / 2, c.height / 2, 2, c.width / 2, c.height / 2, r);
    g.addColorStop(0, E.alpha(col, .42));
    g.addColorStop(.55, E.alpha(col, .14));
    g.addColorStop(1, E.alpha(col, 0));
    x.fillStyle = g;
    x.save();
    x.translate(c.width / 2, c.height / 2);
    x.scale(1, .5);
    x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
    x.restore();
    return c;
  }

  const POOL_COL = {
    brazier: '#ff9a3a', tree: '#d5ae6c',
    crystal: '#7ed6e2', well: '#7ed6e2',
    pylon: '#c17bf0', beacon: '#c17bf0',
  };

  const _drawFloor = Art.drawFloor;
  Art.drawFloor = function (ctx, room, time) {
    _drawFloor.call(this, ctx, room, time);
    const id = room.biomeId;

    // luz de color bajo cada obstáculo
    for (const o of room.obstacles) {
      let e = POOLS.get(o);
      if (!e) {
        const col = POOL_COL[o.kind] || '#d5ae6c';
        const rr = (o.r + o.h * .55) * 1.7;
        e = { cv: poolCanvas(col, Math.ceil(rr)), rr, col };
        POOLS.set(o, e);
      }
      const flick = .82 + Math.sin(time * (id === 'jungla' ? 6.5 : 2.2) + o.x * .7) * .18;
      ctx.globalAlpha = (id === 'jungla' ? .55 : .38) * flick;
      ctx.drawImage(e.cv, o.x - e.rr, o.y - e.rr * .5, e.rr * 2, e.rr);
      ctx.globalAlpha = 1;
    }

    if (id === 'cavernas') {
      // charcos de salmuera con reflejos que resbalan
      const seed = room.seed || 1;
      for (let i = 0; i < 2; i++) {
        const hx = Math.sin((seed + i * 17.3) * 12.9) * .5 + .5;
        const hy = Math.sin((seed + i * 9.1) * 7.7) * .5 + .5;
        const wx = 60 + hx * (room.w - 120);
        const wy = 70 + hy * (room.h - 130);
        const wr = 15 + i * 6;
        ctx.save();
        ctx.globalAlpha = .5;
        ctx.fillStyle = 'rgba(28,58,74,.5)';
        ctx.beginPath(); ctx.ellipse(wx, wy, wr, wr * .42, 0, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 2; j++) {
          const p = ((time * .35 + j * .5 + i * .3) % 1);
          ctx.globalAlpha = .35 * Math.sin(p * Math.PI);
          ctx.strokeStyle = '#9fe4ef';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(wx, wy, wr * .5 * p + 2, wr * .2 * p + 1, 0, .2, 2.6);
          ctx.stroke();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    } else if (id === 'omnitopia') {
      // pulsos de energía recorriendo el sello grabado
      const cx2 = room.w / 2, cy2 = 34 + (room.h - 52) * .52;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const a = time * .55 + i * TAU / 3;
        const px = cx2 + Math.cos(a) * 68;
        const py = cy2 + Math.sin(a) * 28;
        ctx.globalAlpha = .5;
        Gfx.glow(px, py, 6, '#c79aff', .4);
        Gfx.circ(px, py, 1.3, '#f2e4ff');
        ctx.globalAlpha = .22;
        ctx.strokeStyle = '#c79aff';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(cx2, cy2, 68, 28, 0, a - .5, a);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    } else {
      // musgo luminoso que respira en la jungla
      const seed = room.seed || 1;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const hx = Math.sin((seed + i * 31.7) * 9.3) * .5 + .5;
        const hy = Math.sin((seed + i * 13.9) * 5.1) * .5 + .5;
        const gx = 50 + hx * (room.w - 100);
        const gy = 60 + hy * (room.h - 120);
        const pl = .5 + Math.sin(time * 1.4 + i * 2.2) * .5;
        Gfx.glow(gx, gy, 11 + pl * 4, '#9cc86a', .1 + pl * .06);
        Gfx.circ(gx - 2, gy + 1, 1, E.alpha('#c9e28a', .5 * pl + .2));
        Gfx.circ(gx + 3, gy - 1, .8, E.alpha('#c9e28a', .4 * pl + .15));
      }
      ctx.restore();
    }
  };

  // ------------------------------------------------------------
  // 4) ANIMACIÓN — vaivén de enemigos, élites y jefe
  // ------------------------------------------------------------
  const _drawFoeP = Art.drawFoe;
  Art.drawFoe = function (ctx, foe, time) {
    const moving = Math.hypot(foe.vx || 0, foe.vy || 0) > 9;
    if (moving && foe.type !== 'wisp' && foe.state !== 'spawn') {
      // vaivén lateral al caminar: los bichos ya no flotan rígidos
      const wob = Math.sin((foe.animT || 0) * 9) * .05;
      ctx.save();
      ctx.translate(foe.x, foe.y);
      ctx.rotate(wob * (foe.face || 1));
      ctx.translate(-foe.x, -foe.y);
      _drawFoeP.call(this, ctx, foe, time);
      ctx.restore();
    } else {
      _drawFoeP.call(this, ctx, foe, time);
    }
    // polvo bajo el cargador cuando telegrafía la embestida
    if (foe.type === 'charger' && foe.telegraph > .3 && Math.random() < .4) {
      Gfx.P.spawn({
        x: foe.x + E.rnd(8, -8), y: foe.y, vx: E.rnd(16, -16), vy: -E.rnd(24, 6),
        life: .35, size: 1.5, color: '#8a7264', fade: .6,
      });
    }
    // chispas orbitando élites
    if (foe.elite && foe.state !== 'dead' && foe.state !== 'spawn') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const a = time * 2.2 + i * TAU / 3;
        const rr = 15 + Math.sin(time * 3 + i) * 1.6;
        const px = foe.x + Math.cos(a) * rr;
        const py = foe.y - 13 * (foe.scale || 1) + Math.sin(a) * rr * .38;
        ctx.globalAlpha = .6 + Math.sin(time * 5 + i * 2) * .25;
        Gfx.circ(px, py, 1, '#ffd98a');
        Gfx.glow(px, py, 3.4, '#f0b95a', .35);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  };

  // runas girando alrededor del jefe en fase 2
  const _drawBoss = Art.drawBoss;
  Art.drawBoss = function (ctx, boss, time) {
    _drawBoss.call(this, ctx, boss, time);
    if (boss.phase >= 2 && boss.state !== 'dead') {
      ctx.save();
      ctx.globalAlpha = .4 + Math.sin(time * 3) * .1;
      ctx.strokeStyle = '#ff8a6a';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const a = time * 1.3 + i * TAU / 6;
        const px = boss.x + Math.cos(a) * 34 * (boss.scale || 1);
        const py = boss.y - 26 * (boss.scale || 1) + Math.sin(a) * 12;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(a * 2);
        ctx.strokeRect(-2.2, -2.2, 4.4, 4.4);
        ctx.beginPath(); ctx.moveTo(0, -2.2); ctx.lineTo(0, 2.2); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  };

  // vida extra en la capa ambiental: luciérnagas y barrido
  const _drawAmbient = Art.drawAmbient;
  Art.drawAmbient = function (ctx, room, time, layer) {
    _drawAmbient.call(this, ctx, room, time, layer);
    if (layer !== 1) return;
    const id = room.biomeId;
    if (id === 'jungla') {
      // luciérnagas errantes cerca del suelo
      for (let i = 0; i < 4; i++) {
        const ox = 40 + (i * 137) % (room.w - 80);
        const oy = room.h * .55 + Math.sin(time * .8 + i * 2.4) * (room.h * .2);
        const fx = ox + Math.cos(time * .5 + i * 1.9) * 26;
        const fy = oy + Math.sin(time * .9 + i * 2.9) * 14;
        const bl = .4 + Math.sin(time * 2.6 + i * 1.3) * .6;
        if (bl <= 0) continue;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        Gfx.glow(fx, fy, 5 + bl * 3, '#d8e86a', .3 * bl);
        Gfx.circ(fx, fy, .9, E.alpha('#f4ffb0', .5 + bl * .5));
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
  };

  // ------------------------------------------------------------
  // 5) TRANSICIÓN DE SALA — iris con el color del bioma
  // ------------------------------------------------------------
  const _gameDraw = Game.draw;
  Game.draw = function (ctx) {
    _gameDraw.call(this, ctx);
    const g = this;
    if (g.transition && g.fade > .01 && g.room && g.hero) {
      const f = E.clamp01(g.fade);
      const r = E.lerp(300, 16, f);
      const cx2 = Gfx.screenX(g.hero.x);
      const cy2 = Gfx.screenY(g.hero.y - 12);
      const accent = g.room.biome.accent || '#c8a0ff';
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, Gfx.W, Gfx.H);
      ctx.arc(cx2, cy2, r, 0, TAU, true);
      ctx.fillStyle = 'rgba(4,3,8,.9)';
      ctx.fill('evenodd');
      // aro de energía en el borde del iris
      ctx.globalAlpha = .75 * (1 - Math.abs(f * 2 - 1));
      ctx.strokeStyle = E.alpha(accent, .8);
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx2, cy2, r + 2, 0, TAU); ctx.stroke();
      ctx.globalAlpha *= .5;
      ctx.strokeStyle = E.alpha('#ffffff', .5);
      ctx.lineWidth = .7;
      ctx.beginPath(); ctx.arc(cx2, cy2, r + 5, 0, TAU); ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  };

  // ------------------------------------------------------------
  // 6) POST-PROCESO — gradación de color y grano fílmico
  // ------------------------------------------------------------
  const GRADE = {
    jungla: ['#2e5238', .17],
    cavernas: ['#1e4a66', .19],
    omnitopia: ['#3a2a6e', .21],
  };
  const NOISE = [];
  let noiseReady = false;
  let noiseFlip = 0;
  function buildNoise() {
    if (noiseReady) return;
    for (let n = 0; n < 2; n++) {
      const c = document.createElement('canvas');
      c.width = 160; c.height = 90;
      const x = c.getContext('2d');
      const im = x.createImageData(160, 90);
      for (let i = 0; i < im.data.length; i += 4) {
        const v = 96 + Math.random() * 64;
        im.data[i] = v; im.data[i + 1] = v; im.data[i + 2] = v;
        im.data[i + 3] = 255;
      }
      x.putImageData(im, 0, 0);
      NOISE.push(c);
    }
    noiseReady = true;
  }

  const _drawPost = Game.draw;
  Game.draw = function (ctx) {
    _drawPost.call(this, ctx);
    const g = this;
    if (!g.room) return;
    if (g.state === 'run' || g.state === 'reward' || g.state === 'pause') {
      // gradación por bioma
      const gr = GRADE[g.room.biomeId];
      if (gr) {
        ctx.save();
        ctx.globalCompositeOperation = 'soft-light';
        ctx.globalAlpha = gr[1];
        ctx.fillStyle = gr[0];
        ctx.fillRect(0, 0, Gfx.W, Gfx.H);
        ctx.restore();
      }
      // grano fílmico sutil
      buildNoise();
      noiseFlip ^= 1;
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = .045;
      ctx.drawImage(NOISE[noiseFlip], 0, 0, Gfx.W, Gfx.H);
      ctx.restore();
    }
  };

  // ------------------------------------------------------------
  // 7) GATILLOS DE CÁMARA — punch en los momentos clave
  // ------------------------------------------------------------
  const _addHit = Game.addHit;
  Game.addHit = function (o) {
    _addHit.call(this, o);
    if (o.kind === 'heavy' || o.kind === 'quake') Gfx.punch(.05);
    else if (o.crit && o.team === 'hero') Gfx.punch(.028);
  };

  const _hurtHero = Game.hurtHero;
  Game.hurtHero = function (dmg, o) {
    Gfx.punch(.06);
    _hurtHero.call(this, dmg, o);
  };

  const _levelUp = Game.levelUp;
  Game.levelUp = function () {
    _levelUp.call(this);
    Gfx.punch(.06);
  };

  const _explode = Game.explode;
  Game.explode = function (x, y, r, o) {
    _explode.call(this, x, y, r, o);
    if (!o || !o.noShake) Gfx.punch(.04);
  };

  const _foesBoss = window.Foes.boss;
  window.Foes.boss = function (id, x, y) {
    const b = _foesBoss.call(window.Foes, id, x, y);
    if (b) Gfx.punch(.1);
    return b;
  };
})();
