// ============================================================
//  Rig: renderizado procedural de humanoides "puppet"
// ============================================================
(function () {
  const TAU = Math.PI * 2;

  function bone(ctx, x, y, ang, len, w, color, cap) {
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = cap || 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    return [x2, y2];
  }

  function twoBone(ctx, x, y, a1, l1, a2, l2, w1, w2, col, outline) {
    const kx = x + Math.cos(a1) * l1;
    const ky = y + Math.sin(a1) * l1;
    const ex = kx + Math.cos(a1 + a2) * l2;
    const ey = ky + Math.sin(a1 + a2) * l2;
    if (outline) {
      bone(ctx, x, y, a1, l1, w1 + 1.6, outline);
      bone(ctx, kx, ky, a1 + a2, l2, w2 + 1.6, outline);
    }
    bone(ctx, x, y, a1, l1, w1, col);
    bone(ctx, kx, ky, a1 + a2, l2, w2, col);
    return { ex, ey, kx, ky };
  }

  function defaultPose() {
    return {
      lean: 0, bob: 0, sq: 1,
      armF: Math.PI / 2 + 0.28, armB: Math.PI / 2 - 0.24,
      elbF: 0.5, elbB: 0.35,
      legF: Math.PI / 2 + 0.10, legB: Math.PI / 2 - 0.10,
      kneeF: -0.12, kneeB: -0.06,
      head: 0, headY: 0, wAng: 0.9, wHand: 1,
    };
  }

  const KEYS = ['lean', 'bob', 'sq', 'armF', 'armB', 'elbF', 'elbB', 'legF', 'legB', 'kneeF', 'kneeB', 'head', 'headY', 'wAng', 'wHand'];

  function lerpPose(a, b, t) {
    const o = {};
    for (const k of KEYS) o[k] = (a[k] === undefined ? b[k] : a[k]) + ((b[k] === undefined ? a[k] : b[k]) - (a[k] === undefined ? b[k] : a[k])) * t;
    return o;
  }

  function copyPose(p) {
    const o = {};
    for (const k of KEYS) o[k] = p[k];
    return o;
  }

  function drawWeapon(ctx, hx, hy, ang, kind, o) {
    const s = o.s || 1;
    const metal = o.pal.metal || '#cfc6b4';
    const dark = o.pal.metalDark || '#6b6472';
    const acc = o.pal.accent || '#f0c05a';
    const L = (o.wLen || 15) * s;
    if (kind === 'blade') {
      const tipx = hx + Math.cos(ang) * L, tipy = hy + Math.sin(ang) * L;
      ctx.strokeStyle = dark;
      ctx.lineWidth = 3.4 * s;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tipx, tipy); ctx.stroke();
      ctx.strokeStyle = metal;
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tipx, tipy); ctx.stroke();
      // guarda
      const gx = hx + Math.cos(ang) * 3.4 * s, gy = hy + Math.sin(ang) * 3.4 * s;
      bone(ctx, gx, gy, ang + Math.PI / 2, 3.2 * s, 1.6 * s, acc);
      Gfx.circ(tipx, tipy, 1.1 * s, '#fff');
    } else if (kind === 'club') {
      const tipx = hx + Math.cos(ang) * L * 0.9, tipy = hy + Math.sin(ang) * L * 0.9;
      ctx.strokeStyle = dark; ctx.lineWidth = 2.6 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tipx, tipy); ctx.stroke();
      Gfx.circ(tipx, tipy, 4.2 * s, '#4a3b33');
      Gfx.circ(tipx - 0.6 * s, tipy - 0.6 * s, 3.2 * s, '#6d5648');
      Gfx.circ(tipx - 1.2 * s, tipy - 1.2 * s, 1.6 * s, '#8b7160');
    } else if (kind === 'spear') {
      const tipx = hx + Math.cos(ang) * L * 1.5, tipy = hy + Math.sin(ang) * L * 1.5;
      ctx.strokeStyle = '#4a3b33'; ctx.lineWidth = 1.8 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx - Math.cos(ang) * 6 * s, hy - Math.sin(ang) * 6 * s); ctx.lineTo(tipx, tipy); ctx.stroke();
      Gfx.poly([
        [tipx - Math.sin(ang) * 2.4 * s, tipy + Math.cos(ang) * 2.4 * s],
        [tipx + Math.cos(ang) * 6 * s, tipy + Math.sin(ang) * 6 * s],
        [tipx + Math.sin(ang) * 2.4 * s, tipy - Math.cos(ang) * 2.4 * s],
      ], metal);
    } else if (kind === 'claw') {
      for (let i = -1; i <= 1; i++) {
        bone(ctx, hx, hy, ang + i * 0.28, L * 0.6, 1.5 * s, metal);
      }
    } else if (kind === 'staff') {
      const tipx = hx + Math.cos(ang) * L, tipy = hy + Math.sin(ang) * L;
      ctx.strokeStyle = '#5a4432'; ctx.lineWidth = 1.8 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx - Math.cos(ang) * 4 * s, hy - Math.sin(ang) * 4 * s); ctx.lineTo(tipx, tipy); ctx.stroke();
      Gfx.glow(tipx, tipy, 7 * s, acc, 0.5);
      Gfx.circ(tipx, tipy, 2.2 * s, acc);
    }
  }

  const Rig = {
    defaultPose, lerpPose, copyPose, drawWeapon,

    draw(ctx, o) {
      const s = o.s || 1;
      const face = o.face || 1;
      const p = o.pose || defaultPose();
      const pal = o.pal || {};
      const cloth = pal.cloth || '#3d5a80';
      const cloth2 = pal.cloth2 || '#2a3f5c';
      const skin = pal.skin || '#e0b090';
      const hair = pal.hair || '#2b2118';
      const leather = pal.leather || '#5b4632';
      const outline = pal.outline || '#14101a';
      const bulk = o.bulk || 1;
      const hurt = o.hurt || 0;
      const flashCol = o.flashCol || '#ffffff';

      ctx.save();
      ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
      ctx.translate(o.x, o.y);
      if (o.rot) ctx.rotate(o.rot);
      ctx.scale(face * s, s);

      const bob = p.bob;
      const hipY = -13 + bob;
      const lean = p.lean;

      // pierna trasera
      const legB = twoBone(ctx, -1.2, hipY, p.legB, 6.2, p.kneeB, 6.2, 3.4 * bulk, 2.9 * bulk, E.shade(cloth2, -0.18), outline);
      Gfx.circ(legB.ex, legB.ey, 1.9 * bulk, E.shade(leather, -0.25));

      // brazo trasero
      const shY = hipY - 7.5;
      const armB = twoBone(ctx, -2.4, shY, p.armB, 5.4, p.elbB, 5.2, 3.0 * bulk, 2.6 * bulk, E.shade(cloth2, -0.1), outline);
      Gfx.circ(armB.ex, armB.ey, 1.7 * bulk, E.shade(skin, -0.22));

      // capa
      if (o.cape !== undefined && o.cape > 0) {
        const cl = o.cape;
        const wave = Math.sin((o.t || 0) * 7) * 2.2 * cl;
        ctx.fillStyle = pal.cape || E.shade(cloth, -0.35);
        ctx.beginPath();
        ctx.moveTo(-4.4, shY - 1);
        ctx.quadraticCurveTo(-10 - cl * 6, shY + 7 + wave, -7 - cl * 8, hipY + 7 + wave * 1.4);
        ctx.quadraticCurveTo(-3, hipY + 5, -2.2, hipY + 1);
        ctx.closePath();
        ctx.fill();
      }

      // torso
      ctx.save();
      ctx.translate(0, hipY);
      ctx.rotate(lean * -0.35);
      const tw = 4.6 * bulk;
      const th = 8.6;
      ctx.fillStyle = outline;
      ctx.beginPath();
      ctx.moveTo(-tw - 0.9, 1.6);
      ctx.quadraticCurveTo(-tw - 1.2, -th + 1.5, -2.4, -th - 0.6);
      ctx.lineTo(2.4, -th - 0.6);
      ctx.quadraticCurveTo(tw + 1.2, -th + 1.5, tw + 0.9, 1.6);
      ctx.quadraticCurveTo(0, 3.4, -tw - 0.9, 1.6);
      ctx.fill();
      ctx.fillStyle = cloth;
      ctx.beginPath();
      ctx.moveTo(-tw, 1.2);
      ctx.quadraticCurveTo(-tw - 0.4, -th + 1.8, -2.2, -th);
      ctx.lineTo(2.2, -th);
      ctx.quadraticCurveTo(tw + 0.4, -th + 1.8, tw, 1.2);
      ctx.quadraticCurveTo(0, 2.8, -tw, 1.2);
      ctx.fill();
      // paneles de tela y pespuntes: mantienen lectura a tamaño pequeño y
      // convierten la silueta base en un atuendo de aventurero reconocible.
      ctx.fillStyle = E.alpha(cloth2, 0.52);
      ctx.beginPath(); ctx.moveTo(-tw + .8, -th + 2); ctx.lineTo(-1.1, -th + 1);
      ctx.lineTo(-2.8, -2); ctx.lineTo(-tw + 1, -.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = E.alpha(pal.trim || pal.accent || '#f0c05a', .72);
      ctx.lineWidth = .65;
      ctx.beginPath(); ctx.moveTo(-tw + 1, -th + 2); ctx.lineTo(-1.2, -th + 1.3); ctx.lineTo(-2.6, -2.2); ctx.stroke();
      ctx.strokeStyle = E.alpha('#f6dfb3', .18); ctx.lineWidth = .55;
      ctx.beginPath(); ctx.moveTo(2.6, -th + 1.5); ctx.lineTo(tw - 1, -th + 3.5); ctx.stroke();
      // cinturón
      ctx.fillStyle = leather;
      ctx.fillRect(-tw * 0.92, -1.2, tw * 1.84, 2.4);
      ctx.fillStyle = pal.accent || '#f0c05a';
      ctx.fillRect(-.85, -1.35, 1.7, 2.1);
      ctx.fillStyle = E.alpha('#fff1c8', .55);
      ctx.fillRect(-.4, -1, .55, .8);
      // pliegue
      ctx.fillStyle = E.alpha(cloth2, 0.6);
      ctx.fillRect(-tw * 0.5, -th + 1.4, 1.4, th * 0.7);
      // correa pecho
      ctx.strokeStyle = leather;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-3.2, -th + 0.6);
      ctx.lineTo(2.6, -2.4);
      ctx.stroke();
      ctx.restore();

      // hombrera con borde metálico y broche de capa.
      ctx.fillStyle = outline;
      ctx.beginPath(); ctx.moveTo(-3.2, shY - 2.4); ctx.lineTo(-7.1 * bulk, shY - 1.4);
      ctx.lineTo(-6.2 * bulk, shY + 2); ctx.lineTo(-2.2, shY + 1.7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = pal.metal || '#cfc6b4';
      ctx.beginPath(); ctx.moveTo(-3, shY - 1.8); ctx.lineTo(-6.1 * bulk, shY - 1);
      ctx.lineTo(-5.3 * bulk, shY + .8); ctx.lineTo(-2.1, shY + .7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = pal.trim || pal.accent || '#f0c05a';
      ctx.fillRect(-5.1 * bulk, shY - .4, 2.3 * bulk, .7);
      Gfx.circ(-3.8, shY + 2.5, .9, pal.accent || '#f0c05a');

      // pierna delantera
      const legF = twoBone(ctx, 1.0, hipY, p.legF, 6.4, p.kneeF, 6.4, 3.6 * bulk, 3.1 * bulk, cloth2, outline);
      Gfx.circ(legF.ex, legF.ey, 2.0 * bulk, leather);

      // cabeza
      const headY = hipY - 12.4 + p.headY;
      const hx = Math.cos(lean * -0.35) * 0 + 0.6;
      ctx.save();
      ctx.translate(hx, headY);
      ctx.rotate(p.head * 0.4 + lean * 0.4);
      // cuello
      Gfx.circ(0, 2.4, 2.0, E.shade(skin, -0.15));
      // cara
      ctx.fillStyle = outline;
      ctx.beginPath(); ctx.arc(0, 0, 4.9, 0, TAU); ctx.fill();
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.arc(0, 0, 4.1, 0, TAU); ctx.fill();
      // sombra lateral
      ctx.fillStyle = E.alpha('#000', 0.12);
      ctx.beginPath(); ctx.arc(-1.2, 0.6, 4.1, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
      // pelo
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.arc(0, -0.6, 4.3, Math.PI * 0.96, TAU * 1.02);
      ctx.lineTo(3.4, -2.6);
      ctx.quadraticCurveTo(0, -6.2, -4.4, -2.4);
      ctx.fill();
      // cinta de cuero y una pequeña placa frontal en el flequillo.
      ctx.fillStyle = pal.trim || pal.accent || '#f0c05a';
      ctx.fillRect(-3.7, -3.2, 6.9, .8);
      ctx.fillStyle = E.alpha('#fff2cf', .65);
      ctx.fillRect(-2.8, -3.1, 1.5, .45);
      // mechón
      ctx.beginPath();
      ctx.moveTo(3.6, -3.2); ctx.lineTo(6.2, -1.2); ctx.lineTo(3.2, -0.8);
      ctx.fill();
      // ojo
      ctx.fillStyle = pal.eye || '#1a1420';
      ctx.fillRect(2.2, -0.6, 1.3, 1.7);
      ctx.fillStyle = E.alpha(pal.eye || '#1a1420', .45);
      ctx.fillRect(1.5, -.2, 2.8, 2.7);
      ctx.fillStyle = '#fff';
      ctx.fillRect(3.0, -0.4, 0.7, 0.8);
      // marcas / boca
      ctx.fillStyle = E.alpha('#000', 0.25);
      ctx.fillRect(1.6, 2.2, 2.0, 0.7);
      if (o.horns) {
        ctx.fillStyle = pal.horn || '#d8cfae';
        ctx.beginPath(); ctx.moveTo(-2.4, -3.4); ctx.lineTo(-5.4, -7.6); ctx.lineTo(-1.0, -4.6); ctx.fill();
        ctx.beginPath(); ctx.moveTo(2.0, -3.6); ctx.lineTo(4.6, -7.8); ctx.lineTo(1.6, -4.4); ctx.fill();
      }
      ctx.restore();

      // brazo delantero + arma
      const armF = twoBone(ctx, 2.2, shY, p.armF, 5.6, p.elbF, 5.4, 3.2 * bulk, 2.8 * bulk, cloth, outline);
      Gfx.circ(armF.ex, armF.ey, 1.8 * bulk, skin);
      if (o.weapon) {
        const wa = o.weaponAng !== undefined ? o.weaponAng : p.wAng;
        const wl = o.wLen || 15;
        // el lienzo ya está escalado por s: el arma no debe volver a escalarse
        drawWeapon(ctx, armF.ex, armF.ey, wa, o.weapon, Object.assign({}, o, { wLen: wl, s: 1 }));
      }

      // brillo de daño
      if (hurt > 0) {
        ctx.globalCompositeOperation = 'lighter';
        Gfx.glow(0, hipY - 6, 13 * bulk, flashCol, hurt * 0.5);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
    },
  };

  window.Rig = Rig;
})();
