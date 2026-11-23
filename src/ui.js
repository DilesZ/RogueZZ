// ============================================================
//  Interfaz: HUD, rueda alquímica, menús, tarjetas
// ============================================================
(function () {
  const RARITY = {
    comun: { c: '#8fb8c8', label: 'COMÚN' },
    raro: { c: '#b98bff', label: 'RARO' },
    epico: { c: '#f0c05a', label: 'ÉPICO' },
  };

  const UI = {
    RARITY,
    hover: -1,

    wrap(str, maxChars) {
      const words = String(str).split(' ');
      const lines = [];
      let cur = '';
      for (const w of words) {
        if ((cur + ' ' + w).trim().length > maxChars) {
          if (cur) lines.push(cur.trim());
          cur = w;
        } else cur = (cur + ' ' + w).trim();
      }
      if (cur) lines.push(cur.trim());
      return lines;
    },

    panel(ctx, x, y, w, h, o) {
      o = o || {};
      ctx.fillStyle = o.fill || 'rgba(9,7,15,0.88)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = o.border || 'rgba(120,100,150,0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      if (o.accent) {
        const a = o.accent;
        Gfx.rect(x, y, 3, 3, a);
        Gfx.rect(x + w - 3, y, 3, 3, a);
        Gfx.rect(x, y + h - 3, 3, 3, a);
        Gfx.rect(x + w - 3, y + h - 3, 3, 3, a);
      }
    },

    bar(ctx, x, y, w, h, frac, col, bg) {
      Gfx.rect(x - 1, y - 1, w + 2, h + 2, 'rgba(0,0,0,0.6)');
      Gfx.rect(x, y, w, h, bg || '#241a28');
      if (frac > 0) Gfx.rect(x, y, Math.max(1, w * E.clamp01(frac)), h, col);
    },

    drawHUD(ctx, g) {
      const h = g.hero;
      const t = g.time;

      // ---- vida ----
      const hw = 92;
      UI.panel(ctx, 6, 6, hw + 28, 28, { border: 'rgba(90,70,110,0.55)', accent: 'rgba(200,160,240,0.4)' });
      const pulse = 1 + Math.sin(t * 4) * 0.04;
      ctx.save();
      ctx.translate(15, 18);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#8a2b2b';
      ctx.beginPath();
      ctx.moveTo(0, 3); ctx.bezierCurveTo(-6, -2, -5, -7, 0, -4); ctx.bezierCurveTo(5, -7, 6, -2, 0, 3);
      ctx.fill();
      ctx.fillStyle = '#e0503f';
      ctx.beginPath();
      ctx.moveTo(0, 2); ctx.bezierCurveTo(-5, -2, -4.4, -6, 0, -3.4); ctx.bezierCurveTo(4.4, -6, 5, -2, 0, 2);
      ctx.fill();
      ctx.restore();

      UI.bar(ctx, 24, 9, hw, 8, h.hp / h.maxHp, '#d84a3f', '#2a1420');
      if (h.shield > 0) {
        const sf = E.clamp01(h.shield / 45);
        Gfx.rect(24, 9, hw * sf, 8, 'rgba(210,175,120,0.6)');
      }
      Gfx.rect(24, 9, hw * E.clamp01(h.hp / h.maxHp), 2, 'rgba(255,170,150,0.45)');
      UI.bar(ctx, 24, 20, hw, 3, h.xp / h.xpNext, '#6b9bd8', '#1a1a2a');
      Gfx.text('N' + h.level, 118, 17, { size: 1, align: 'center', color: '#f0c05a' });

      // ---- ingredientes ----
      let ix = 14;
      const iy = 42;
      for (const k in Alchemy.bag) {
        const c = Alchemy.bag[k];
        Alchemy.drawIng(ctx, k, ix, iy, 1, c > 0 ? 1 : 0.35);
        Gfx.text(c, ix + 6, iy - 3, { size: 1, color: c > 0 ? '#e8dfc8' : '#4a4356', shadow: '#000' });
        ix += 26;
      }

      // ---- esquiva ----
      const dx = 12, dy = 236;
      for (let i = 0; i < h.dashMax; i++) {
        const full = i < h.dashCharges;
        Gfx.poly([[dx + i * 9, dy], [dx + i * 9 + 4, dy + 5], [dx + i * 9 + 8, dy], [dx + i * 9 + 4, dy + 9]], full ? '#9fd8ff' : '#26343f');
        if (full) Gfx.circ(dx + i * 9 + 4, dy + 4, 1, 'rgba(255,255,255,0.6)');
      }

      // ---- perro ----
      const dog = g.dog;
      if (dog) {
        const dxx = 12, dyy = 252;
        Gfx.circ(dxx + 4, dyy + 2, 4, dog.state === 'down' ? '#3a2a20' : '#8a5a34');
        Gfx.rect(dxx + 2, dyy - 2, 1.4, 2, '#2a1a12');
        Gfx.rect(dxx + 5, dyy - 2, 1.4, 2, '#2a1a12');
        UI.bar(ctx, dxx + 11, dyy, 26, 4, dog.hp / dog.maxHp, dog.state === 'down' ? '#4a3a3a' : '#8fd36a', '#1a2418');
        if (dog.state === 'down') {
          Gfx.text(Math.ceil(dog.downTimer) + 'S', dxx + 13, dyy + 6, { size: 1, color: '#ff8a7a' });
        }
      }

      // ---- hechizos ----
      const slots = Alchemy.slots;      const sw = 30;
      const totalW = slots.length * sw;
      const sx = Gfx.W / 2 - totalW / 2 + sw / 2;
      const sy = 246;
      for (let i = 0; i < slots.length; i++) {
        const id = slots[i];
        const cx = sx + i * sw;
        const sel = i === Alchemy.selected;
        UI.panel(ctx, cx - 12, sy - 12, 24, 24, {
          border: sel ? 'rgba(240,192,90,0.9)' : 'rgba(100,85,130,0.5)',
          fill: sel ? 'rgba(40,26,20,0.85)' : 'rgba(10,8,16,0.8)',
        });
        if (id) {
          Alchemy.drawSpellIcon(ctx, id, cx, sy, 1, { dim: !Alchemy.known[id] });
          const frac = Alchemy.cdFrac(id);
          if (frac > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(cx - 11, sy - 11, 22, 22 * frac);
          }
          const r = Alchemy.recipe(id);
          const ok = Alchemy.canCast(id);
          Gfx.circ(cx + 9, sy - 9, 4, ok ? '#2a4a2a' : '#3a2020');
          Gfx.text(String(i + 1), cx + 7.5, sy - 11.5, { size: 1, color: ok ? '#9fe86a' : '#8a5a5a' });
        } else {
          Gfx.text('-', cx, sy - 3, { size: 1, align: 'center', color: '#3a3448' });
        }
      }

      // ---- objetivo ----
      const biome = g.room ? g.room.biome : null;
      if (biome) {
        Gfx.text(biome.short + ' · ' + (g.roomIndex + 1) + '/' + g.roomTotal, Gfx.W - 8, 8, {
          size: 1, align: 'right', color: 'rgba(200,190,220,0.65)',
        });
      }
      Gfx.text('ESENCIA ' + g.essence, Gfx.W - 8, 18, { size: 1, align: 'right', color: '#b98bff' });

      // ---- jefe ----
      if (g.boss && g.boss.alive) {
        const B = g.boss;
        const bw = 196;
        const bx = Gfx.W / 2 - bw / 2;
        const by = 14;
        Gfx.text(B.name, Gfx.W / 2, 2, { size: 1, align: 'center', color: '#e8dfc8', shadow: '#000' });
        Gfx.rect(bx - 3, by - 2, bw + 6, 10, 'rgba(0,0,0,0.75)');
        Gfx.rect(bx, by, bw, 6, '#2a1018');
        const frac = E.clamp01(B.hp / B.maxHp);
        Gfx.rect(bx, by, bw * frac, 6, '#c8463c');
        Gfx.rect(bx, by, bw * frac, 2, 'rgba(255,180,150,0.45)');
        Gfx.rect(bx + bw * frac - 1, by - 1, 2, 8, 'rgba(255,220,180,0.55)');
        for (let i = 1; i < 3; i++) Gfx.rect(bx + (bw * i) / 3, by - 1, 1, 8, 'rgba(0,0,0,0.55)');
        for (let i = 0; i < 3; i++) {
          const on = B.phase >= i;
          Gfx.rect(bx + i * 6, by + 8, 4, 2, on ? '#f0c05a' : '#3a2a2a');
        }
      }

      // ---- aviso de sala ----
      if (g.notice && g.notice.t > 0) {
        const k = Math.min(1, g.notice.t * 3);
        ctx.globalAlpha = k;
        Gfx.text(g.notice.text, Gfx.W / 2, 44, { size: 2, align: 'center', color: g.notice.color || '#e8dfc8', outline: '#0b0910' });
        ctx.globalAlpha = 1;
      }

      // ---- toasts ----
      let ty = 64;
      for (let i = g.toasts.length - 1; i >= 0; i--) {
        const to = g.toasts[i];
        const a = E.clamp01(to.t / 0.3) * E.clamp01((to.max - to.t) / 0.4);
        ctx.globalAlpha = a;
        const tw = Gfx.textW(to.text, 1) + 10;
        UI.panel(ctx, Gfx.W / 2 - tw / 2, ty - 2, tw, 11, { fill: 'rgba(8,6,14,0.8)', border: 'rgba(120,100,150,0.4)' });
        Gfx.text(to.text, Gfx.W / 2, ty + 1, { size: 1, align: 'center', color: to.color || '#e8dfc8' });
        ctx.globalAlpha = 1;
        ty += 13;
      }
    },

    drawRadial(ctx, g) {
      const cx = Gfx.W / 2, cy = Gfx.H / 2 + 4;
      ctx.fillStyle = 'rgba(4,3,8,0.86)';
      ctx.fillRect(0, 0, Gfx.W, Gfx.H);
      Gfx.glow(cx, cy, 110, '#7b4bd8', 0.14);
      Gfx.text('ALQUIMIA', cx, 16, { size: 2, align: 'center', color: '#c8a0ff', outline: '#0b0910' });
      Gfx.text('RANURA ' + (Alchemy.selected + 1) + '  ·  ' + (Alchemy.slots[Alchemy.selected] ? Alchemy.recipe(Alchemy.slots[Alchemy.selected]).name.toUpperCase() : 'VACÍA'), cx, 33, { size: 1, align: 'center', color: '#bdb0c8' });

      const known = Alchemy.knownList();
      const n = Math.max(1, known.length);
      const R = 58;
      Gfx.ring(cx, cy, R, 'rgba(160,130,210,0.35)', 1, 1);
      Gfx.ring(cx, cy, R + 13, 'rgba(160,130,210,0.12)', 1, 1);

      const mouseA = E.angTo(cx, cy, Input.mouse.x, Input.mouse.y);
      const mouseD = E.dist(cx, cy, Input.mouse.x, Input.mouse.y);
      let hoverIdx = -1;
      if (mouseD > 18) {
        const rel = ((mouseA + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2));
        hoverIdx = Math.round(rel / (Math.PI * 2 / n)) % n;
      }

      // ranuras de la rueda
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R;
        const id = known[i];
        const r = Alchemy.recipe(id);
        const sel = Alchemy.slots[Alchemy.selected] === id;
        const hov = i === hoverIdx;
        const rr = hov ? 15 : 12;
        if (hov) Gfx.glow(x, y, 22, r.color, 0.3);
        Gfx.circ(x, y, rr, hov ? E.alpha(r.color, 0.3) : 'rgba(12,9,20,0.94)');
        Gfx.ring(x, y, rr, sel ? '#f0c05a' : hov ? r.color : 'rgba(120,100,160,0.5)', 1, sel ? 2 : 1);
        Alchemy.drawSpellIcon(ctx, id, x, y, hov ? 1.3 : 1.05);
      }

      // centro: icono de la ranura activa
      Gfx.circ(cx, cy, 17, 'rgba(12,9,20,0.96)');
      Gfx.ring(cx, cy, 17, 'rgba(240,192,90,0.65)', 1, 1);
      const selId = Alchemy.slots[Alchemy.selected];
      if (selId) Alchemy.drawSpellIcon(ctx, selId, cx, cy, 1.4);
      else Gfx.text('-', cx, cy - 4, { size: 2, align: 'center', color: '#3a3448' });
      Gfx.text(String(Alchemy.selected + 1), cx + 11, cy + 6, { size: 1, color: '#f0c05a' });

      // ficha de la receta bajo la rueda
      if (hoverIdx >= 0) {
        const id = known[hoverIdx];
        const r = Alchemy.recipe(id);
        const pw = 236;
        const px = cx - pw / 2;
        const py = 202;
        UI.panel(ctx, px, py, pw, 34, { border: E.alpha(r.color, 0.75), fill: 'rgba(10,8,16,0.96)' });
        Gfx.text(r.name.toUpperCase(), cx, py + 5, { size: 1, align: 'center', color: r.color });
        const costs = Object.keys(r.cost).map((k) => r.cost[k] + ' ' + Alchemy.ING[k].name).join('  +  ');
        Gfx.text(costs, cx, py + 16, { size: 1, align: 'center', color: '#bdb0c8' });
        const state = Alchemy.canCast(id) ? 'LISTO PARA MEZCLAR' : Alchemy.cd[id] > 0 ? 'EN REPOSO' : 'FALTAN INGREDIENTES';
        Gfx.text(state, cx, py + 25, { size: 1, align: 'center', color: Alchemy.canCast(id) ? '#9fe86a' : '#c86a6a' });
      } else {
        Gfx.text('SEÑALA UNA RECETA', cx, 218, { size: 1, align: 'center', color: 'rgba(180,160,200,0.55)' });
      }

      // ranuras inferiores
      for (let i = 0; i < 4; i++) {
        const x = cx - 51 + i * 34;
        const on = i === Alchemy.selected;
        Gfx.rect(x - 12, 241, 24, 18, on ? 'rgba(60,40,20,0.9)' : 'rgba(10,8,16,0.8)');
        Gfx.rect(x - 12, 241, 24, 18, 'rgba(0,0,0,0)');
        ctx.strokeStyle = on ? '#f0c05a' : 'rgba(100,85,130,0.5)';
        ctx.strokeRect(x - 11.5, 241.5, 23, 17);
        const sid = Alchemy.slots[i];
        if (sid) Alchemy.drawSpellIcon(ctx, sid, x, 250, 0.85);
        Gfx.text(String(i + 1), x - 9, 242, { size: 1, color: on ? '#f0c05a' : '#6a5f7a' });
      }
      Gfx.text('1-4 RANURA  ·  CLIC ASIGNAR  ·  TAB CERRAR', cx, 264, { size: 1, align: 'center', color: 'rgba(180,160,200,0.55)' });
      return hoverIdx;
    },

    card(ctx, x, y, w, h, boon, selected) {
      const rar = RARITY[boon.rarity] || RARITY.comun;
      UI.panel(ctx, x, y, w, h, {
        border: selected ? rar.c : 'rgba(100,85,130,0.55)',
        fill: selected ? 'rgba(24,18,32,0.96)' : 'rgba(9,7,15,0.9)',
        accent: rar.c,
      });
      if (selected) Gfx.glow(x + w / 2, y + h / 2, w * 0.7, rar.c, 0.09);
      Gfx.circ(x + w / 2, y + 22, 13, E.alpha(rar.c, 0.16));
      Gfx.ring(x + w / 2, y + 22, 13, rar.c, 0.8, 1);
      UI.drawBoonIcon(ctx, boon.icon, x + w / 2, y + 22, rar.c);
      const lines = UI.wrap(boon.name, 16);
      Gfx.text(lines[0] || '', x + w / 2, y + 40, { size: 1, align: 'center', color: rar.c });
      if (lines[1]) Gfx.text(lines[1], x + w / 2, y + 49, { size: 1, align: 'center', color: rar.c });
      const dl = UI.wrap(boon.desc, 22);
      dl.forEach((l, i) => Gfx.text(l, x + w / 2, y + 62 + i * 9, { size: 1, align: 'center', color: '#c9bfd6' }));
      Gfx.text(rar.label, x + w / 2, y + h - 10, { size: 1, align: 'center', color: E.alpha(rar.c, 0.7) });
    },

    drawBoonIcon(ctx, icon, x, y, col) {
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 1.4;
      const u = 3;
      switch (icon) {
        case 'sword':
          ctx.beginPath(); ctx.moveTo(x - u, y + u); ctx.lineTo(x + u, y - u); ctx.stroke();
          ctx.fillRect(x - u - 1, y + u - 1, 3, 3);
          break;
        case 'boot':
          ctx.beginPath(); ctx.moveTo(x - u, y - u); ctx.lineTo(x - u, y + u); ctx.lineTo(x + u, y + u); ctx.stroke();
          break;
        case 'heart':
          ctx.beginPath(); ctx.moveTo(x, y + u); ctx.bezierCurveTo(x - 2 * u, y, x - u, y - 2 * u, x, y - u);
          ctx.bezierCurveTo(x + u, y - 2 * u, x + 2 * u, y, x, y + u); ctx.fill();
          break;
        case 'dash':
          for (let i = -1; i <= 1; i++) Gfx.rect(x - u + i * 2, y - u + Math.abs(i) * 2, 1.4, 2 * u - Math.abs(i) * 3, col);
          break;
        case 'crit':
          ctx.beginPath(); ctx.moveTo(x + u, y - u); ctx.lineTo(x - u, y); ctx.lineTo(x + u, y + u); ctx.stroke();
          break;
        case 'blood':
          ctx.beginPath(); ctx.moveTo(x, y - 2 * u); ctx.quadraticCurveTo(x + u, y, x, y + u); ctx.quadraticCurveTo(x - u, y, x, y - 2 * u); ctx.fill();
          break;
        case 'shield':
          ctx.beginPath(); ctx.moveTo(x, y - 2 * u); ctx.lineTo(x + 2 * u, y - u); ctx.lineTo(x + u, y + 2 * u); ctx.lineTo(x - u, y + 2 * u); ctx.lineTo(x - 2 * u, y - u); ctx.closePath(); ctx.stroke();
          break;
        case 'star':
          for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; Gfx.rect(x + Math.cos(a) * u - 0.6, y + Math.sin(a) * u - 0.6, 2, 2, col); }
          break;
        case 'leaf':
          ctx.beginPath(); ctx.ellipse(x, y, 1.6 * u, u, 0.7, 0, Math.PI * 2); ctx.fill();
          break;
        case 'dog':
          Gfx.circ(x, y + 1, u, col);
          Gfx.rect(x - u, y - u, 1.4, 2.4, col);
          Gfx.rect(x + u - 1.4, y - u, 1.4, 2.4, col);
          break;
        case 'thorn':
          ctx.beginPath(); ctx.moveTo(x - 2 * u, y + u); ctx.lineTo(x, y - 2 * u); ctx.lineTo(x + 2 * u, y + u); ctx.stroke();
          break;
        case 'flask':
          Gfx.rect(x - 1, y - 2 * u, 2, 2, col);
          ctx.beginPath(); ctx.arc(x, y + u * 0.6, 1.8 * u, 0, Math.PI * 2); ctx.stroke();
          break;
        case 'bolt':
          ctx.beginPath(); ctx.moveTo(x + u, y - 2 * u); ctx.lineTo(x - u, y); ctx.lineTo(x, y); ctx.lineTo(x - u, y + 2 * u); ctx.lineTo(x + u, y); ctx.lineTo(x, y); ctx.fill();
          break;
        case 'eye':
          ctx.beginPath(); ctx.ellipse(x, y, 2.2 * u, 1.3 * u, 0, 0, Math.PI * 2); ctx.stroke();
          Gfx.circ(x, y, 1.1 * u, col);
          break;
        case 'coin':
          Gfx.circ(x, y, 1.7 * u, col);
          Gfx.circ(x, y, 1.1 * u, 'rgba(0,0,0,0.5)');
          break;
        default:
          Gfx.circ(x, y, u, col);
      }
    },

    // ------------- menú de recompensa -------------
    rewardLayout(n) {
      const cw = 104, ch = 110, gap = 12;
      const total = n * cw + (n - 1) * gap;
      return { cw, ch, gap, total, x0: Gfx.W / 2 - total / 2, y: 74 };
    },

    drawRewards(ctx, g) {
      ctx.fillStyle = 'rgba(5,4,9,0.78)';
      ctx.fillRect(0, 0, Gfx.W, Gfx.H);
      Gfx.text('ELIGE UNA BENDICIÓN', Gfx.W / 2, 34, { size: 2, align: 'center', color: '#e8dfc8', outline: '#0b0910' });
      Gfx.text(g.rewardSource || '', Gfx.W / 2, 52, { size: 1, align: 'center', color: 'rgba(180,160,200,0.7)' });
      const L = UI.rewardLayout(g.rewardOptions.length);
      for (let i = 0; i < g.rewardOptions.length; i++) {
        UI.card(ctx, L.x0 + i * (L.cw + L.gap), L.y, L.cw, L.ch, g.rewardOptions[i], i === g.rewardSel);
        Gfx.text(String(i + 1), L.x0 + i * (L.cw + L.gap) + 7, L.y + 5, { size: 1, color: 'rgba(200,190,220,0.5)' });
      }
      Gfx.text('CLIC O 1-4 PARA ELEGIR', Gfx.W / 2, 196, { size: 1, align: 'center', color: 'rgba(180,160,200,0.55)' });
    },

    // ------------- pausa -------------
    drawPause(ctx, g) {
      ctx.fillStyle = 'rgba(5,4,9,0.82)';
      ctx.fillRect(0, 0, Gfx.W, Gfx.H);
      Gfx.text('PAUSA', Gfx.W / 2, 34, { size: 3, align: 'center', color: '#e8dfc8', outline: '#0b0910' });
      const opts = g.pauseOptions();
      for (let i = 0; i < opts.length; i++) {
        const y = 76 + i * 18;
        const sel = i === g.pauseSel;
        if (sel) {
          Gfx.rect(Gfx.W / 2 - 78, y - 2, 156, 14, 'rgba(80,60,110,0.35)');
          Gfx.rect(Gfx.W / 2 - 78, y - 2, 2, 14, '#f0c05a');
        }
        Gfx.text(opts[i].label + (opts[i].value !== undefined ? '  ' + opts[i].value : ''), Gfx.W / 2 - 68, y, {
          size: 1, color: sel ? '#f0e0c0' : '#a89cb8',
        });
      }
      UI.panel(ctx, 40, 178, Gfx.W - 80, 66, { border: 'rgba(90,70,110,0.4)' });
      Gfx.text('CONTROLES', 50, 183, { size: 1, color: '#8fd8e8' });
      const ctrl = [
        'WASD MOVER · RATÓN APUNTAR · CLIC ATACAR',
        'ESPACIO ESQUIVAR · CLIC DER / K GOLPE PESADO',
        'TAB RUEDA ALQUÍMICA · Q LANZAR HECHIZO · E INTERACTUAR',
      ];
      ctrl.forEach((c, i) => Gfx.text(c, 50, 194 + i * 11, { size: 1, color: '#a89cb8' }));
      Gfx.text('M SILENCIO · ESC PAUSA', 50, 231, { size: 1, color: '#6a5f7a' });
    },

    // ------------- título -------------
    drawTitle(ctx, g) {
      const t = g.time;
      // fondo animado
      const grad = ctx.createLinearGradient(0, 0, 0, Gfx.H);
      grad.addColorStop(0, '#0d0a18');
      grad.addColorStop(0.6, '#150e22');
      grad.addColorStop(1, '#08060e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, Gfx.W, Gfx.H);
      for (let i = 0; i < 40; i++) {
        const x = (i * 97 + Math.sin(t * 0.3 + i) * 30) % Gfx.W;
        const y = (i * 53 + t * (6 + (i % 5) * 3)) % Gfx.H;
        ctx.globalAlpha = 0.15 + (i % 4) * 0.08;
        Gfx.rect(x, y, 1.3, 1.3, i % 3 ? '#7fe36b' : '#c8a0ff');
      }
      ctx.globalAlpha = 1;
      // silueta de árboles
      for (let i = 0; i < 12; i++) {
        const x = i * 44 - 10;
        const hh = 60 + ((i * 37) % 40);
        ctx.fillStyle = 'rgba(6,10,8,0.9)';
        ctx.beginPath();
        ctx.moveTo(x - 26, Gfx.H);
        ctx.quadraticCurveTo(x, Gfx.H - hh, x + 26, Gfx.H);
        ctx.fill();
      }
      // Portal de piedra con una luna roja: motivo visual que presenta el
      // descenso como una expedición y conecta los tres biomas.
      Gfx.glow(240, 145, 78, '#d56842', .12 + Math.sin(t * 1.8) * .025);
      Gfx.circ(240, 144, 29, 'rgba(18,10,20,.72)');
      Gfx.ring(240, 144, 30 + Math.sin(t * 1.3) * 1.2, '#e59a68', .34, 1);
      Gfx.ring(240, 144, 37, '#b97858', .14, 1);
      ctx.save();
      ctx.strokeStyle = 'rgba(134,101,91,.54)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(240, 176, 47, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = 'rgba(31,23,28,.9)';
      ctx.fillRect(190, 175, 8, 24); ctx.fillRect(282, 175, 8, 24);
      ctx.fillStyle = 'rgba(168,117,77,.42)';
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + i * Math.PI / 6;
        const x = 240 + Math.cos(a) * 47, y = 176 + Math.sin(a) * 47;
        ctx.fillRect(x - 2, y - 2, 4, 3);
      }
      ctx.restore();
      // Reflejos de brasa y polvo mágico en primer plano.
      for (let i = 0; i < 14; i++) {
        const x = (i * 43 + Math.sin(t * .7 + i) * 8) % Gfx.W;
        const y = 164 + (i * 19) % 83 + Math.sin(t * 1.1 + i) * 2;
        Gfx.glow(x, y, 7 + (i % 3) * 2, i % 3 ? '#b98bff' : '#ff9b52', .055);
        Gfx.circ(x, y, .7, i % 3 ? 'rgba(216,184,255,.5)' : 'rgba(255,182,111,.55)');
      }
      // Siluetas de la nueva heroína y su compañero, frente al umbral.
      Art.drawHero(ctx, { x: 412, y: 258, vx: 0, vy: 0, state: 'idle', face: -1, animT: 0, aim: Math.PI, castGlow: 0, showHurt: 0 }, t);
      Art.drawDog(ctx, { x: 376, y: 258, vx: 0, vy: 0, face: -1, phase: 0, state: 'follow', alpha: 1, hurtFlash: 0, lungeDir: { x: 0, y: 0 } }, t);
      Gfx.glow(Gfx.W / 2, 120, 90, '#7b4bd8', 0.16);
      // logo
      const bob = Math.sin(t * 1.4) * 1.2;
      Gfx.displayText('ECOS', Gfx.W / 2, 43 + bob, {
        size: 38, color: '#f3e5ca', stroke: '#241528', strokeWidth: 1.5,
        shadow: '#bd754b', blur: 18, shadowY: 2,
      });
      Gfx.displayText('DE EVERMORE', Gfx.W / 2, 88 + bob, {
        size: 15, weight: 600, color: '#d9b4ff', stroke: '#1b1123', strokeWidth: 1,
        shadow: '#764b9b', blur: 9,
      });
      Gfx.rect(Gfx.W / 2 - 92, 122, 184, 1, 'rgba(240,192,90,0.5)');
      Gfx.text('ALQUIMIA  &  CENIZA', Gfx.W / 2, 128, { size: 1, align: 'center', color: '#f0c05a' });
      if (Math.sin(t * 3) > -0.4) {
        Gfx.text('PULSA CUALQUIER TECLA', Gfx.W / 2, 176, { size: 1, align: 'center', color: '#e8dfc8' });
      }
      Gfx.text('UN ROGUELITE DE ACCIÓN Y ALQUIMIA', Gfx.W / 2, 200, { size: 1, align: 'center', color: 'rgba(160,145,180,0.55)' });
      if (g.save.best > 0) {
        Gfx.text('MEJOR: ' + g.save.bestRooms + ' SALAS · ' + g.save.runs + ' DESCENSOS', Gfx.W / 2, 214, { size: 1, align: 'center', color: 'rgba(160,145,180,0.4)' });
      }
      Gfx.text('WASD + RATÓN + ESPACIO', Gfx.W / 2, 244, { size: 1, align: 'center', color: 'rgba(120,105,145,0.6)' });
    },

    // ------------- hub -------------
    drawHub(ctx, g) {
      const t = g.time;
      const grad = ctx.createLinearGradient(0, 0, 0, Gfx.H);
      grad.addColorStop(0, '#0a0a12');
      grad.addColorStop(1, '#0a0710');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, Gfx.W, Gfx.H);
      // hoguera (brasa al pie)
      const gx = Gfx.W / 2, gy = 262;
      Gfx.glow(gx, gy, 70, '#ff8a3a', 0.07 + Math.sin(t * 3) * 0.015);
      Gfx.text('EL ALAMBIQUE', Gfx.W / 2, 12, { size: 2, align: 'center', color: '#f0c05a', outline: '#0b0910' });
      Gfx.text('ESENCIA: ' + g.essence, Gfx.W / 2, 31, { size: 1, align: 'center', color: '#b98bff' });

      // lista de mejoras
      const list = g.metaList;
      const startY = 48;
      for (let i = 0; i < list.length; i++) {
        const m = list[i];
        const y = startY + i * 22;
        const sel = i === g.hubSel;
        const lvl = g.metaLevel(m.id);
        const maxed = lvl >= m.max;
        const can = (g.save.essence || 0) >= m.cost(lvl) && !maxed;
        if (sel) {
          Gfx.rect(28, y - 2, 250, 20, 'rgba(90,70,140,0.22)');
          Gfx.rect(28, y - 2, 2, 20, '#f0c05a');
        }
        Gfx.text(m.name, 36, y, { size: 1, color: maxed ? '#5a5266' : sel ? '#f0e0c0' : '#bdb0c8' });
        for (let k = 0; k < m.max; k++) {
          const on = k < lvl;
          Gfx.rect(152 + k * 7, y + 1, 5, 5, on ? '#f0c05a' : '#2a2438');
        }
        Gfx.text(maxed ? 'MÁX' : (m.cost(lvl) + ' ES'), 272, y, { size: 1, align: 'right', color: maxed ? '#5a5266' : can ? '#b98bff' : '#6a5f7a' });
      }
      const selM = list[g.hubSel];
      if (selM) {
        UI.panel(ctx, 288, 48, 168, 150, { border: 'rgba(120,100,150,0.4)' });
        Gfx.text(selM.name, 296, 54, { size: 1, color: '#f0c05a' });
        const dl = UI.wrap(selM.desc, 25);
        dl.forEach((l, i) => Gfx.text(l, 296, 68 + i * 10, { size: 1, color: '#bdb0c8' }));
        Gfx.text('NIVEL ' + g.metaLevel(selM.id) + '/' + selM.max, 296, 186, { size: 1, color: '#8fd8e8' });
      }

      // recetas
      Gfx.text('RECETAS', 288, 206, { size: 1, color: '#8fd8e8' });
      const unknown = Alchemy.RECIPES.filter((r) => !(g.save.recipes || []).includes(r.id));
      const nextR = unknown[0];
      if (nextR) {
        Gfx.text(nextR.name, 296, 218, { size: 1, color: '#c9bfd6' });
        const cost = nextR.unlockCost || (120 + (g.save.recipes || []).length * 60);
        Gfx.text(cost + ' ES  ·  [R] DESBLOQUEAR', 296, 228, { size: 1, color: (g.save.essence || 0) >= cost ? '#9fe86a' : '#6a5f7a' });
      } else {
        Gfx.text('TODAS APRENDIDAS', 296, 218, { size: 1, color: '#f0c05a' });
      }

      // botón descender
      const by = 240;
      const sel2 = g.hubSel === -1;
      UI.panel(ctx, Gfx.W / 2 - 74, by, 148, 20, {
        border: sel2 ? '#f0c05a' : 'rgba(120,100,150,0.5)',
        fill: sel2 ? 'rgba(60,40,20,0.9)' : 'rgba(10,8,16,0.9)',
      });
      Gfx.text('▶ DESCENDER', Gfx.W / 2, by + 6, { size: 1, align: 'center', color: sel2 ? '#ffe0a0' : '#cbb' });
      Gfx.text('↑↓ ELEGIR · ENTER COMPRAR · R RECETA · S DESCENDER', Gfx.W / 2, 262, { size: 1, align: 'center', color: 'rgba(150,135,175,0.45)' });
    },

    drawDeath(ctx, g) {
      const a = E.clamp01(g.deathT / 0.8);
      ctx.fillStyle = `rgba(10,3,6,${0.9 * a})`;
      ctx.fillRect(0, 0, Gfx.W, Gfx.H);
      Gfx.text('HAS CAÍDO', Gfx.W / 2, 70, { size: 3, align: 'center', color: '#c8463c', outline: '#0b0910', alpha: a });
      Gfx.text('El eco se deshace… pero la esencia permanece.', Gfx.W / 2, 100, { size: 1, align: 'center', color: '#c9bfd6', alpha: a });
      UI.panel(ctx, Gfx.W / 2 - 90, 118, 180, 60, { border: 'rgba(120,80,80,0.5)' });
      Gfx.text('SALAS SUPERADAS', Gfx.W / 2, 126, { size: 1, align: 'center', color: '#8d8496' });
      Gfx.text(String(g.roomsCleared), Gfx.W / 2, 136, { size: 2, align: 'center', color: '#e8dfc8' });
      Gfx.text('ESENCIA GANADA', Gfx.W / 2 - 42, 158, { size: 1, color: '#b98bff' });
      Gfx.text('+' + g.essenceEarned, Gfx.W / 2 + 42, 158, { size: 1, align: 'right', color: '#b98bff' });
      if (g.deathT > 1.4 && Math.sin(g.time * 3) > -0.3) {
        Gfx.text('PULSA PARA VOLVER AL ALAMBIQUE', Gfx.W / 2, 196, { size: 1, align: 'center', color: '#e8dfc8' });
      }
    },

    drawVictory(ctx, g) {
      const a = E.clamp01(g.deathT / 1.2);
      ctx.fillStyle = `rgba(6,8,14,${0.92 * a})`;
      ctx.fillRect(0, 0, Gfx.W, Gfx.H);
      Gfx.glow(Gfx.W / 2, 80, 120, '#f0c05a', 0.15);
      Gfx.text('EL ECO DESPIERTA', Gfx.W / 2, 54, { size: 3, align: 'center', color: '#f0c05a', outline: '#0b0910', alpha: a });
      Gfx.text('Has atravesado la jungla, la sal y la máquina.', Gfx.W / 2, 88, { size: 1, align: 'center', color: '#c9bfd6', alpha: a });
      Gfx.text('Evermore respira de nuevo.', Gfx.W / 2, 100, { size: 1, align: 'center', color: '#c9bfd6', alpha: a });
      UI.panel(ctx, Gfx.W / 2 - 100, 118, 200, 56, { border: 'rgba(240,192,90,0.5)' });
      Gfx.text('TIEMPO', Gfx.W / 2 - 88, 126, { size: 1, color: '#8d8496' });
      Gfx.text(E.fmtTime(g.runTime), Gfx.W / 2 + 88, 126, { size: 1, align: 'right', color: '#e8dfc8' });
      Gfx.text('ESENCIA', Gfx.W / 2 - 88, 140, { size: 1, color: '#8d8496' });
      Gfx.text('+' + g.essenceEarned, Gfx.W / 2 + 88, 140, { size: 1, align: 'right', color: '#b98bff' });
      Gfx.text('SALAS', Gfx.W / 2 - 88, 154, { size: 1, color: '#8d8496' });
      Gfx.text(String(g.roomsCleared), Gfx.W / 2 + 88, 154, { size: 1, align: 'right', color: '#e8dfc8' });
      if (g.deathT > 2 && Math.sin(g.time * 3) > -0.3) {
        Gfx.text('PULSA PARA VOLVER AL ALAMBIQUE', Gfx.W / 2, 196, { size: 1, align: 'center', color: '#e8dfc8' });
      }
    },

    drawFade(ctx, a) {
      if (a <= 0) return;
      ctx.globalAlpha = E.clamp01(a);
      ctx.fillStyle = '#06040a';
      ctx.fillRect(0, 0, Gfx.W, Gfx.H);
      ctx.globalAlpha = 1;
    },
  };

  window.UI = UI;
})();
