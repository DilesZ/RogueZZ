// ============================================================
//  Alquimia: ingredientes, recetas y hechizos
// ============================================================
(function () {
  const ING = {
    savia: { id: 'savia', name: 'Savia', color: '#5fd36a', dark: '#2c7a3a', icon: 'leaf' },
    hueso: { id: 'hueso', name: 'Hueso', color: '#e8dfc8', dark: '#8d8478', icon: 'bone' },
    ceniza: { id: 'ceniza', name: 'Ceniza', color: '#9d93ac', dark: '#4a4356', icon: 'ash' },
    sal: { id: 'sal', name: 'Sal', color: '#8fd8e8', dark: '#3a7a8c', icon: 'salt' },
    chispa: { id: 'chispa', name: 'Chispa', color: '#ffb03a', dark: '#a85f10', icon: 'spark' },
  };

  const RECIPES = [
    {
      id: 'fuego', name: 'Bola de Fuego', short: 'FUEGO', shape: 'orb',
      color: '#ff8a3a', cost: { chispa: 2, ceniza: 1 }, cd: 2.2, unlock: 0,
      desc: 'Proyectil ardiente que estalla al impactar.',
    },
    {
      id: 'cura', name: 'Savia Viva', short: 'CURA', shape: 'cross',
      color: '#5fd36a', cost: { savia: 1, hueso: 1 }, cd: 7, unlock: 0,
      desc: 'Restaura un 30% de vida durante 1,2 s.',
    },
    {
      id: 'lanza', name: 'Lanza de Sal', short: 'LANZA', shape: 'spear',
      color: '#8fd8e8', cost: { sal: 2, hueso: 1 }, cd: 3.4, unlock: 1,
      desc: 'Tres esquirlas perforantes en línea.',
    },
    {
      id: 'corteza', name: 'Piel de Corteza', short: 'CORTEZA', shape: 'shield',
      color: '#c8a06a', cost: { savia: 1, sal: 1 }, cd: 9, unlock: 1,
      desc: 'Absorbe 45 de daño durante 8 s.',
    },
    {
      id: 'ventisca', name: 'Ventisca', short: 'VENTISCA', shape: 'snow',
      color: '#bfeaf5', cost: { sal: 2, ceniza: 1 }, cd: 5.5, unlock: 2,
      desc: 'Estallido de escarcha que ralentiza alrededor.',
    },
    {
      id: 'umbra', name: 'Paso Umbrío', short: 'UMBRA', shape: 'step',
      color: '#a98bff', cost: { ceniza: 2, sal: 1 }, cd: 6, unlock: 2,
      desc: 'Te desvaneces y reapareces dañando el entorno.',
    },
    {
      id: 'griego', name: 'Fuego Griego', short: 'GRIEGO', shape: 'flame',
      color: '#ff6b2c', cost: { chispa: 1, sal: 1 }, cd: 7, unlock: 3,
      desc: 'Charco de llamas que abrasa la zona.',
    },
    {
      id: 'cadena', name: 'Cadena Vital', short: 'CADENA', shape: 'chain',
      color: '#e0503f', cost: { savia: 2, chispa: 1 }, cd: 11, unlock: 3,
      desc: 'Durante 8 s tus golpes te devuelven vida.',
    },
    {
      id: 'eco', name: 'Eco Primitivo', short: 'ECO', shape: 'wave',
      color: '#f0c05a', cost: { hueso: 1, ceniza: 1, chispa: 1 }, cd: 14, unlock: 4,
      desc: 'Ondada sísmica que aturde a todo lo cercano.',
    },
  ];

  const Alchemy = {
    ING, RECIPES,
    bag: {},
    cd: {},
    cdMul: 1,
    slots: [null, null, null, null],
    known: {},
    selected: 0,
    totalBrewed: 0,
    lastCast: '',

    reset(knownList) {
      this.bag = { savia: 0, hueso: 0, ceniza: 0, sal: 0, chispa: 0 };
      this.cd = {};
      this.known = {};
      if (knownList) knownList.forEach((k) => (this.known[k] = true));
      RECIPES.forEach((r) => { if (r.unlock === 0) this.known[r.id] = true; });
      this.slots = [null, null, null, null];
      const known = this.knownList();
      for (let i = 0; i < known.length && i < 4; i++) this.slots[i] = known[i];
      this.selected = 0;
    },

    knownList() { return RECIPES.filter((r) => this.known[r.id]).map((r) => r.id); },
    recipe(id) { return RECIPES.find((r) => r.id === id); },
    unlock(id) { this.known[id] = true; const free = this.slots.indexOf(null); if (free >= 0) this.slots[free] = id; },
    isKnown(id) { return !!this.known[id]; },

    add(ing, n) {
      if (!this.bag[ing]) this.bag[ing] = 0;
      this.bag[ing] += n || 1;
    },
    count(ing) { return this.bag[ing] || 0; },
    totalIngredients() { let t = 0; for (const k in this.bag) t += this.bag[k]; return t; },

    canCast(id) {
      const r = this.recipe(id);
      if (!r || !this.known[id]) return false;
      if ((this.cd[id] || 0) > 0) return false;
      for (const k in r.cost) if ((this.bag[k] || 0) < r.cost[k]) return false;
      return true;
    },
    missing(id) {
      const r = this.recipe(id);
      const out = [];
      for (const k in r.cost) if ((this.bag[k] || 0) < r.cost[k]) out.push(k);
      return out;
    },
    cdFrac(id) {
      const r = this.recipe(id);
      if (!r) return 0;
      return E.clamp01((this.cd[id] || 0) / (r.cd * this.cdMul));
    },
    tick(dt) {
      for (const k in this.cd) if (this.cd[k] > 0) this.cd[k] = Math.max(0, this.cd[k] - dt);
    },

    cast(id, g, hero) {
      if (!this.canCast(id)) {
        Snd.sfx('error');
        if (!this.known[id]) g.toast('Receta desconocida');
        else if ((this.cd[id] || 0) > 0) g.toast('Aún se está mezclando');
        else {
          const miss = this.missing(id).map((m) => ING[m].name).join(', ');
          g.toast('Faltan: ' + miss);
        }
        return false;
      }
      const r = this.recipe(id);
      for (const k in r.cost) this.bag[k] -= r.cost[k];
      this.cd[id] = r.cd * this.cdMul;
      this.totalBrewed++;
      this.lastCast = id;
      this.effect(id, g, hero, r);
      Snd.sfx('cast');
      return true;
    },

    effect(id, g, hero, r) {
      const aim = hero.aim;
      const hx = hero.x + Math.cos(aim) * 8;
      const hy = hero.y - 15 + Math.sin(aim) * 4;
      switch (id) {
        case 'fuego': {
          g.spawnProj({
            x: hx, y: hy, vx: Math.cos(aim) * 225, vy: Math.sin(aim) * 225,
            r: 5, life: 1.1, color: '#ff8a3a', trail: '#ffd08a', team: 'hero',
            damage: 16, knock: 90, kind: 'fire',
            onHit: (p, e) => {
              g.explode(p.x, p.y, 30, { damage: 20, knock: 150, color: '#ff8a3a', team: 'hero', kind: 'fire' });
              Snd.sfx('fire');
            },
          });
          break;
        }
        case 'cura': {
          hero.addHeal(hero.maxHp * 0.3, 1.2);
          g.ring(hero.x, hero.y - 14, 20, '#5fd36a');
          Snd.sfx('heal');
          break;
        }
        case 'corteza': {
          hero.shield = Math.min(hero.maxHp, (hero.shield || 0) + 45);
          hero.shieldTimer = 8;
          g.ringPulse(hero.x, hero.y - 14, '#c8a06a', 26);
          Snd.sfx('block');
          break;
        }
        case 'lanza': {
          for (let i = -1; i <= 1; i++) {
            const a = aim + i * 0.13;
            g.spawnProj({
              x: hx, y: hy, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340,
              r: 3, life: 0.65, color: '#8fd8e8', trail: '#dff7ff', team: 'hero',
              damage: 11, knock: 40, pierce: true, kind: 'salt', shape: 'shard',
            });
          }
          break;
        }
        case 'ventisca': {
          g.explode(hero.x, hero.y - 12, 62, {
            damage: 13, knock: 60, color: '#bfeaf5', team: 'hero', kind: 'ice',
            slow: 0.45, slowDur: 3.2, noShake: true,
          });
          hero.freezeRing(0.45);
          Snd.sfx('ice');
          break;
        }
        case 'umbra': {
          const dx = Math.cos(aim), dy = Math.sin(aim);
          const nx = hero.x + dx * 82, ny = hero.y + dy * 82;
          g.dust(hero.x, hero.y, '#a98bff', 18);
          if (g.room.canStand(nx, ny)) { hero.x = nx; hero.y = ny; }
          else { hero.x += dx * 30; hero.y += dy * 30; }
          hero.iframe = Math.max(hero.iframe, 0.35);
          g.dust(hero.x, hero.y, '#a98bff', 22);
          g.explode(hero.x, hero.y - 10, 34, { damage: 18, knock: 120, color: '#a98bff', team: 'hero', kind: 'void' });
          Snd.sfx('teleport');
          break;
        }
        case 'griego': {
          g.spawnZone({
            x: hero.x + Math.cos(aim) * 30, y: hero.y + Math.sin(aim) * 20,
            r: 30, life: 5.5, dps: 9, color: '#ff6b2c', team: 'hero', kind: 'fire',
            tick: 0.35,
          });
          break;
        }
        case 'cadena': {
          hero.lifesteal = (hero.permLifesteal || 0) + 0.35;
          hero.lifestealT = 8;
          g.ringPulse(hero.x, hero.y - 14, '#e0503f', 26);
          break;
        }
        case 'eco': {
          g.explode(hero.x, hero.y - 8, 96, {
            damage: 24, knock: 210, color: '#f0c05a', team: 'hero', kind: 'quake', stun: 0.9,
          });
          Gfx.shake(6);
          Snd.sfx('slam');
          break;
        }
      }
    },

    drawIng(ctx, ing, x, y, s, alpha) {
      const I = ING[ing];
      if (!I) return;
      const a = alpha === undefined ? 1 : alpha;
      ctx.globalAlpha = a;
      const c = I.color, d = I.dark;
      if (I.icon === 'leaf') {
        ctx.fillStyle = d;
        ctx.beginPath(); ctx.moveTo(x, y + 3 * s); ctx.quadraticCurveTo(x - 3 * s, y - 1 * s, x + 2 * s, y - 3 * s);
        ctx.quadraticCurveTo(x + 3 * s, y + 1 * s, x, y + 3 * s); ctx.fill();
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.moveTo(x - 0.4 * s, y + 2 * s); ctx.quadraticCurveTo(x - 2 * s, y - 0.6 * s, x + 1.4 * s, y - 2 * s);
        ctx.quadraticCurveTo(x + 1.8 * s, y + 0.8 * s, x - 0.4 * s, y + 2 * s); ctx.fill();
      } else if (I.icon === 'bone') {
        ctx.fillStyle = d;
        ctx.fillRect(x - 3 * s, y - 1 * s, 6 * s, 2 * s);
        Gfx.circ(x - 3 * s, y - 1.4 * s, 1.4 * s, d);
        Gfx.circ(x - 3 * s, y + 1.4 * s, 1.4 * s, d);
        Gfx.circ(x + 3 * s, y - 1.4 * s, 1.4 * s, d);
        Gfx.circ(x + 3 * s, y + 1.4 * s, 1.4 * s, d);
        ctx.fillStyle = c;
        ctx.fillRect(x - 2 * s, y - 0.5 * s, 4 * s, 1 * s);
      } else if (I.icon === 'ash') {
        Gfx.circ(x, y, 3 * s, d);
        Gfx.circ(x - 0.5 * s, y - 0.5 * s, 2.2 * s, c);
        Gfx.circ(x + 2 * s, y - 2 * s, 1 * s, d);
        Gfx.circ(x - 2.4 * s, y + 1.6 * s, 0.9 * s, d);
      } else if (I.icon === 'salt') {
        ctx.fillStyle = d;
        ctx.beginPath(); ctx.moveTo(x, y - 3.4 * s); ctx.lineTo(x + 2.6 * s, y + 1.4 * s); ctx.lineTo(x, y + 3.4 * s); ctx.lineTo(x - 2.6 * s, y + 1.4 * s); ctx.fill();
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.moveTo(x, y - 2.2 * s); ctx.lineTo(x + 1.5 * s, y + 0.8 * s); ctx.lineTo(x, y + 2 * s); ctx.lineTo(x - 1.5 * s, y + 0.8 * s); ctx.fill();
      } else if (I.icon === 'spark') {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x + 0.6 * s, y - 3.6 * s); ctx.lineTo(x - 1.8 * s, y + 0.4 * s); ctx.lineTo(x - 0.2 * s, y + 0.4 * s);
        ctx.lineTo(x - 0.8 * s, y + 3.4 * s); ctx.lineTo(x + 2.2 * s, y - 1.0 * s); ctx.lineTo(x + 0.4 * s, y - 1.0 * s);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    drawSpellIcon(ctx, id, x, y, s, o) {
      o = o || {};
      const r = this.recipe(id);
      if (!r) {
        Gfx.text('?', x, y - 3 * s, { size: s, align: 'center', color: '#4a4356' });
        return;
      }
      const c = r.color;
      ctx.globalAlpha = o.dim ? 0.4 : 1;
      Gfx.circ(x, y, 5.6 * s, E.shade(c, -0.72));
      Gfx.circ(x, y, 4.6 * s, E.shade(c, -0.45));
      ctx.strokeStyle = c;
      ctx.lineWidth = Math.max(1, s * 0.7);
      ctx.beginPath(); ctx.arc(x, y, 5.6 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = c;
      const u = s * 1.4;
      switch (r.shape) {
        case 'orb': Gfx.circ(x, y, 2.4 * u * 0.7, c); Gfx.circ(x - u * 0.3, y - u * 0.3, u * 0.5, '#ffe6b0'); break;
        case 'cross': ctx.fillRect(x - u * 0.45, y - u, u * 0.9, u * 2); ctx.fillRect(x - u, y - u * 0.45, u * 2, u * 0.9); break;
        case 'spear': ctx.beginPath(); ctx.moveTo(x, y - u * 1.5); ctx.lineTo(x + u * 0.7, y); ctx.lineTo(x, y + u * 1.5); ctx.lineTo(x - u * 0.7, y); ctx.fill(); break;
        case 'shield': ctx.beginPath(); ctx.moveTo(x, y - u * 1.3); ctx.lineTo(x + u, y - u * 0.5); ctx.lineTo(x + u * 0.7, y + u); ctx.lineTo(x, y + u * 1.3); ctx.lineTo(x - u * 0.7, y + u); ctx.lineTo(x - u, y - u * 0.5); ctx.fill(); break;
        case 'snow':
          for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(x, y); ctx.rotate(i * 1.05); ctx.fillRect(-u * 1.3, -u * 0.22, u * 2.6, u * 0.44); ctx.restore(); }
          break;
        case 'step': Gfx.circ(x, y, u * 0.5, c); Gfx.circ(x + u * 0.9, y - u * 0.7, u * 0.5, E.alpha(c, 0.5)); break;
        case 'flame': ctx.beginPath(); ctx.moveTo(x, y - u * 1.5); ctx.quadraticCurveTo(x + u * 1.2, y, x, y + u); ctx.quadraticCurveTo(x - u * 1.2, y, x, y - u * 1.5); ctx.fill(); break;
        case 'chain': ctx.fillRect(x - u * 1.3, y - u * 0.3, u * 2.6, u * 0.6); Gfx.circ(x - u * 1.3, y, u * 0.5, c); Gfx.circ(x + u * 1.3, y, u * 0.5, c); break;
        case 'wave':
          for (let i = 1; i <= 2; i++) { ctx.strokeStyle = c; ctx.lineWidth = s * 0.8; ctx.beginPath(); ctx.arc(x, y, u * i * 0.85, 0, Math.PI * 2); ctx.stroke(); }
          break;
      }
      ctx.globalAlpha = 1;
    },
  };

  window.Alchemy = Alchemy;
})();
