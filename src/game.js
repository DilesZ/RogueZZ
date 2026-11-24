// ============================================================
//  Juego: flujo de partida, combate, salas, meta-progreso
// ============================================================
(function () {
  const TAU = Math.PI * 2;

  const RUN_PLAN = [
    { biome: 'jungla', kind: 'combat' },
    { biome: 'jungla', kind: 'combat' },
    { biome: 'jungla', kind: 'elite' },
    { biome: 'jungla', kind: 'boss' },
    { biome: 'cavernas', kind: 'combat' },
    { biome: 'cavernas', kind: 'combat' },
    { biome: 'cavernas', kind: 'elite' },
    { biome: 'cavernas', kind: 'boss' },
    { biome: 'omnitopia', kind: 'combat' },
    { biome: 'omnitopia', kind: 'combat' },
    { biome: 'omnitopia', kind: 'elite' },
    { biome: 'omnitopia', kind: 'boss' },
  ];

  const BOONS = [
    { id: 'furia', name: 'Furia', desc: '+12% de daño de ataque.', icon: 'sword', rarity: 'comun', apply: (h) => { h.damageMult += 0.12; } },
    { id: 'zancada', name: 'Zancada', desc: '+8% velocidad al moverte.', icon: 'boot', rarity: 'comun', apply: (h) => { h.speed *= 1.08; } },
    { id: 'vigor', name: 'Vigor', desc: '+18 de vida máxima y cura inmediata.', icon: 'heart', rarity: 'comun', apply: (h) => { h.maxHp += 18; h.hp += 18; } },
    { id: 'viento', name: 'Viento Errante', desc: '+1 carga de esquiva.', icon: 'dash', rarity: 'raro', apply: (h) => { h.dashMax += 1; h.dashCharges = h.dashMax; } },
    { id: 'filo', name: 'Filo Certero', desc: '+10% de probabilidad de crítico.', icon: 'crit', rarity: 'raro', apply: (h) => { h.critChance += 0.1; } },
    { id: 'sangre', name: 'Sed de Sangre', desc: 'Robas 8% del daño que infliges.', icon: 'blood', rarity: 'raro', apply: (h) => { h.lifesteal += 0.08; h.permLifesteal = (h.permLifesteal || 0) + 0.08; } },
    { id: 'corteza', name: 'Muro de Corteza', desc: 'Ganas 10 de escudo al esquivar.', icon: 'shield', rarity: 'raro', apply: (h) => { h.dashShield = (h.dashShield || 0) + 10; } },
    { id: 'alquimista', name: 'Pulso Alquímico', desc: 'Recargas de hechizo un 25% más rápidas.', icon: 'flask', rarity: 'raro', apply: (h, g) => { g.cdMul *= 0.75; Alchemy.cdMul = g.cdMul; } },
    { id: 'bolsa', name: 'Bolsa Hollada', desc: '+1 ingrediente en cada recogida.', icon: 'leaf', rarity: 'comun', apply: (h) => { h.ingBonus = (h.ingBonus || 0) + 1; } },
    { id: 'vinculo', name: 'Vínculo', desc: 'El perro muerde un 60% más fuerte.', icon: 'dog', rarity: 'comun', apply: (h, g) => { g.dogDmgMul += 0.6; } },
    { id: 'espinas', name: 'Espinas', desc: 'Devuelves 8 de daño al ser golpeado.', icon: 'thorn', rarity: 'raro', apply: (h) => { h.thorns = (h.thorns || 0) + 8; } },
    { id: 'martillo', name: 'Martillo', desc: '+35% de daño en el golpe pesado.', icon: 'bolt', rarity: 'comun', apply: (h) => { h.heavyMul = (h.heavyMul || 1) * 1.35; } },
    { id: 'alma', name: 'Alma Quemada', desc: 'Recuperas 3 de vida con cada muerte.', icon: 'heart', rarity: 'raro', apply: (h) => { h.killHeal = (h.killHeal || 0) + 3; } },
    { id: 'codicia', name: 'Codicia', desc: '+25% de esencia obtenida.', icon: 'coin', rarity: 'comun', apply: (h, g) => { g.essenceMul *= 1.25; } },
    { id: 'erudito', name: 'Erudito', desc: '+20% de experiencia.', icon: 'star', rarity: 'comun', apply: (h, g) => { g.xpMul *= 1.2; } },
    { id: 'empuje', name: 'Empuje', desc: '+40% de empuje en tus golpes.', icon: 'sword', rarity: 'comun', apply: (h) => { h.knockMul = (h.knockMul || 1) * 1.4; } },
    { id: 'hechizo', name: 'Vertiente', desc: '+30% de daño de hechizos.', icon: 'flask', rarity: 'raro', apply: (h) => { h.spellMult = (h.spellMult || 1) * 1.3; } },
    { id: 'regenera', name: 'Savia Perenne', desc: 'Regeneras 1,5 de vida por segundo.', icon: 'leaf', rarity: 'epico', apply: (h) => { h.regen = (h.regen || 0) + 1.5; } },
    { id: 'berserk', name: 'Berserker', desc: '+35% de daño por debajo del 35% de vida.', icon: 'blood', rarity: 'epico', apply: (h) => { h.berserk = true; } },
    { id: 'pacto', name: 'Pacto de Ceniza', desc: 'Revives una vez con el 50% de vida.', icon: 'star', rarity: 'epico', apply: (h) => { h.reviveCharge = (h.reviveCharge || 0) + 1; } },
    { id: 'ojo', name: 'Ojo del Cazador', desc: 'Los críticos infligen 2,4x en vez de 1,7x.', icon: 'eye', rarity: 'raro', apply: (h) => { h.critMul = 2.4; } },
    { id: 'paso', name: 'Paso Fantasma', desc: 'Esquivar atraviesa a los enemigos y los daña.', icon: 'dash', rarity: 'epico', apply: (h) => { h.dashDamage = (h.dashDamage || 0) + 10; } },
  ];

  const META = [
    { id: 'hp', name: 'VITALIDAD', max: 5, desc: '+10 de vida inicial por nivel.', cost: (l) => 45 + l * 40 },
    { id: 'dmg', name: 'FILO ANCESTRAL', max: 5, desc: '+8% de daño inicial por nivel.', cost: (l) => 55 + l * 45 },
    { id: 'dash', name: 'PIES LIGEROS', max: 2, desc: '+1 carga de esquiva.', cost: (l) => 120 + l * 120 },
    { id: 'bolsa', name: 'BOLSA DE REAGENTAS', max: 3, desc: 'Empiezas con +2 de cada ingrediente.', cost: (l) => 50 + l * 45 },
    { id: 'perro', name: 'VÍNCULO CANINO', max: 3, desc: 'El perro muerde más fuerte y aguanta más.', cost: (l) => 60 + l * 55 },
    { id: 'alma', name: 'ALMA PRESERVADA', max: 1, desc: 'Revives una vez por descenso (40% de vida).', cost: () => 420 },
    { id: 'suerte', name: 'SUERTE DEL BUSCADOR', max: 3, desc: '+1 opción de recompensa en las puertas.', cost: (l) => 70 + l * 60 },
  ];

  const Game = {
    state: 'title',
    time: 0,
    hitstop: 0,
    timeScale: 1,
    hero: null,
    dog: null,
    enemies: [],
    hits: [],
    projectiles: [],
    zones: [],
    pickups: [],
    chests: [],
    doors: [],
    vfx: [],
    toasts: [],
    notice: null,
    boss: null,
    room: null,
    roomIndex: 0,
    roomTotal: RUN_PLAN.length,
    depth: 0,
    roomsCleared: 0,
    runTime: 0,
    essence: 0,
    essenceEarned: 0,
    essenceMul: 1,
    xpMul: 1,
    cdMul: 1,
    dogDmgMul: 1,
    boons: [],
    boonIds: [],
    spawnQueue: [],
    clearT: 0,
    doorT: 0,
    rewardOptions: [],
    rewardSel: 0,
    rewardSource: '',
    pendingReward: null,
    pauseSel: 0,
    hubSel: 0,
    deathT: 0,
    fade: 0,
    targetFade: 0,
    save: { essence: 0, meta: {}, recipes: [], runs: 0, best: 0, bestRooms: 0, muted: false },
    metaList: META,
    shakeEnabled: true,

    init() {
      this.load();
      Snd.setMuted(!!this.save.muted);
      this.hero = new Hero(240, 200);
      this.dog = new Dog(230, 210);
      this.hero.maxHp = 100;
      this.state = 'title';
    },

    // ---------------- guardado ----------------
    load() {
      try {
        const raw = localStorage.getItem('ecos-evermore-save-v1');
        if (raw) {
          const s = JSON.parse(raw);
          this.save = Object.assign(this.save, s);
          this.save.meta = this.save.meta || {};
          this.save.recipes = this.save.recipes || [];
        }
      } catch (e) { /* sin guardado */ }
      this.essence = this.save.essence || 0;
    },
    persist() {
      try {
        this.save.essence = this.essence;
        localStorage.setItem('ecos-evermore-save-v1', JSON.stringify(this.save));
      } catch (e) { /* ignorar */ }
    },
    metaLevel(id) { return this.save.meta[id] || 0; },

    // ---------------- inicio de partida ----------------
    resetRun() {
      const h = this.hero;
      h.maxHp = 100 + this.metaLevel('hp') * 10;
      h.hp = h.maxHp;
      h.speed = 104;
      h.damageMult = 1 + this.metaLevel('dmg') * 0.08;
      h.critChance = 0.08;
      h.critMul = 1.7;
      h.dashMax = 2 + this.metaLevel('dash');
      h.dashCharges = h.dashMax;
      h.dashTimer = 0;
      h.level = 1;
      h.xp = 0;
      h.xpNext = 24;
      h.shield = 0; h.shieldTimer = 0; h.healPool = 0; h.lifesteal = 0; h.lifestealT = 0;
      h.permLifesteal = 0;
      h.dashShield = 0; h.thorns = 0; h.heavyMul = 1; h.killHeal = 0; h.knockMul = 1;
      h.spellMult = 1; h.regen = 0; h.berserk = false; h.reviveCharge = 0; h.dashDamage = 0;
      h.ingBonus = 0;
      h.gear = { weapon: null, armor: null };
      h.bag = [];
      h._gearHp = 0;
      h.recomputeGear();
      h.dead = false;
      h.state = 'idle';
      h.ghosts.length = 0;

      this.dog.maxHp = 46 + this.metaLevel('perro') * 14;
      this.dog.hp = this.dog.maxHp;
      this.dog.state = 'follow';

      this.essenceMul = 1; this.xpMul = 1; this.cdMul = 1; this.dogDmgMul = 1;
      this.boons = []; this.boonIds = [];
      this.essenceEarned = 0;
      this.roomsCleared = 0;
      this.runTime = 0;
      this.depth = 0;
      this.roomIndex = 0;

      Alchemy.cdMul = 1;
      Alchemy.reset(this.save.recipes);
      Alchemy.slots = [null, null, null, null];
      const known = Alchemy.knownList();
      const startIng = this.metaLevel('bolsa') * 2;
      for (const k in Alchemy.bag) Alchemy.bag[k] = startIng;
      for (let i = 0; i < Math.min(4, known.length); i++) {
        if (i === 0) Alchemy.slots[0] = 'fuego';
        else if (i === 1) Alchemy.slots[1] = 'cura';
        else Alchemy.slots[i] = known[i];
      }
      // asegurar cura en ranura si existe
      if (!Alchemy.slots.includes('cura')) Alchemy.slots[3] = 'cura';
      Alchemy.selected = 0;
    },

    startRun() {
      this.resetRun();
      this.essence = this.save.essence || 0;
      this.roomsCleared = 0;
      this.enemies.length = 0;
      this.hits.length = 0;
      this.projectiles.length = 0;
      this.zones.length = 0;
      this.pickups.length = 0;
      this.chests.length = 0;
      this.vfx.length = 0;
      this.doors.length = 0;
      this.toasts.length = 0;
      Gfx.F.clear();
      Gfx.P.clear();
      this.boss = null;
      this.state = 'run';
      this.loadRoom(0);
      Snd.music('jungla');
    },

    loadRoom(index) {
      this.roomIndex = index;
      const plan = RUN_PLAN[index];
      const biome = World.biome(plan.biome);
      const seed = 1000 + index * 37 + (this.save.runs || 0) * 13;
      this.room = World.build(plan.biome, plan.kind, seed, index);
      this.roomIndex = index;
      this.depth = index;
      this.enemies.length = 0;
      this.hits.length = 0;
      this.projectiles.length = 0;
      this.zones.length = 0;
      this.pickups.length = 0;
      this.vfx.length = 0;
      this.doors.length = 0;
      this.spawnQueue.length = 0;
      this.boss = null;
      this.clearT = 0;
      this.doorT = 0;
      this.cleared = false;
      this.bossDelay = 0;

      const r = this.room;

      // cofres aleatorios: botín extra repartido por la sala
      this.chests.length = 0;
      if (plan.kind !== 'boss') {
        const bd = r.bounds;
        let nChests = 0;
        if (plan.kind === 'elite') nChests = 1 + (Math.random() < 0.35 ? 1 : 0);
        else nChests = (Math.random() < 0.72 ? 1 : 0) + (Math.random() < 0.18 ? 1 : 0);
        for (let i = 0; i < nChests; i++) {
          let cx = 0, cy = 0, ok = false;
          for (let k = 0; k < 40 && !ok; k++) {
            cx = bd.x + 24 + Math.random() * (bd.w - 48);
            cy = bd.y + 24 + Math.random() * (bd.h - 48);
            ok = r.canStand(cx, cy) && E.dist(cx, cy, r.w / 2, r.h - 54) > 80;
            if (ok) for (const c of this.chests) if (E.dist(cx, cy, c.x, c.y) < 70) ok = false;
          }
          if (ok) this.chests.push({ x: cx, y: cy, opened: false, t: 0, near: false, glow: Math.random() * TAU });
        }
      }
      this.hero.x = r.w / 2;
      this.hero.y = r.h - 54;
      this.hero.vx = 0; this.hero.vy = 0;
      this.hero.state = 'idle';
      this.hero.iframe = 0.8;
      this.dog.x = r.w / 2 + 20;
      this.dog.y = r.h - 46;
      this.dog.hp = Math.max(this.dog.hp, this.dog.maxHp * 0.4);

      Gfx.camReset(r.w / 2, r.h / 2, { x: 0, y: 0, w: r.w, h: r.h });
      Gfx.camFollow(this.hero.x, this.hero.y, 0);
      Gfx.Fx.reset();

      // enemigos
      const depthMul = 1 + index * 0.11;
      const pool = biome.enemies;
      const pts = r.spawns.slice().sort(() => Math.random() - 0.5);
      let pi = 0;
      const add = (type, elite, delay, bx, by) => {
        const p = bx !== undefined ? { x: bx, y: by } : pts[pi++ % pts.length];
        this.spawnQueue.push({ type, elite, x: p.x, y: p.y, delay: delay || 0, mul: depthMul });
      };
      if (plan.kind === 'boss') {
        this.spawnQueue.push({ type: 'boss', bossId: biome.boss, x: r.w / 2, y: r.h / 2, delay: 0.4, mul: depthMul });
        Snd.music('boss');
      } else if (plan.kind === 'elite') {
        const t = E.pick(biome.elite);
        add(t, true, 0.2);
        add(E.pick(pool), false, 0.9);
        add(E.pick(pool), false, 1.4);
        Snd.music(biome.music);
      } else {
        const n = 3 + Math.floor(index / 4);
        for (let i = 0; i < n; i++) add(E.pick(pool), false, 0.15 + i * 0.22);
        Snd.music(biome.music);
      }
      this.notice = { t: 3.2, text: plan.kind === 'boss' ? biome.bossName : biome.name, color: plan.kind === 'boss' ? '#c8463c' : '#f0c05a' };
      this.toast(plan.kind === 'boss' ? '¡El jefe despierta!' : plan.kind === 'elite' ? 'Élite en la sala' : 'Limpia la sala');
    },

    advanceRoom() {
      if (this.roomIndex + 1 >= RUN_PLAN.length) {
        this.victory();
        return;
      }
      this.doors.length = 0;
      this.transition = { t: 0, dur: 0.36, idx: this.roomIndex + 1, loaded: false };
      this.fade = 0;
    },

    // ---------------- efectos auxiliares ----------------
    toast(text, color) {
      this.toasts.push({ text, color: color || '#e8dfc8', t: 0, max: 2.2 });
      if (this.toasts.length > 4) this.toasts.shift();
    },
    dust(x, y, color, n) {
      Gfx.P.burst(x, y - 4, n || 10, { color: color || '#a08060', speed: 90, life: 0.5, size: 2, grav: 60 });
    },
    ring(x, y, r, color) {
      this.vfx.push({ kind: 'ring', x, y, r: 4, r2: r, color, t: 0, life: 0.4 });
      Gfx.P.burst(x, y, 8, { color, speed: 60, life: 0.4, size: 1.4, glow: true });
    },
    ringPulse(x, y, color, r) {
      this.vfx.push({ kind: 'ring', x, y, r: r * 0.4, r2: r, color, t: 0, life: 0.55 });
    },
    spawnShock(x, y, color, r, life) {
      this.vfx.push({ kind: 'shock', x, y, r: 6, r2: r, color, t: 0, life: life || 0.45 });
    },
    spawnDebris(x, y, color) {
      Gfx.P.spawn({
        x: x + E.rnd(20, -20), y: y - E.rnd(6, 0), vx: E.rnd(70, -70), vy: -E.rnd(130, 40),
        life: 0.9, size: E.rnd(2.5, 1), color, grav: 340, drag: 0.01, shape: 'rect', shrink: 0.6,
      });
    },
    spawnProj(o) {
      this.projectiles.push(Object.assign({
        r: 4, life: 2, hitSet: new Set(), pierce: false, homing: 0, delay: 0, spin: 0,
      }, o));
    },
    spawnZone(o) {
      this.zones.push(Object.assign({ r: 24, life: 1, dps: 8, tickT: 0, tick: 0.4, hitSet: new Set() }, o));
    },
    addHit(o) {
      o.hitSet = new Set();
      o.life = o.life || 0.1;
      this.hits.push(o);
      if (o.kind === 'heavy' || o.kind === 'quake') this.hitstopUnder(0.05);
    },
    hitstopUnder(t) { this.hitstop = Math.max(this.hitstop, t); },

    explode(x, y, r, o) {
      o = o || {};
      this.vfx.push({ kind: 'boom', x, y, r: 4, r2: r, color: o.color || '#ffb03a', t: 0, life: 0.42 });
      Gfx.P.burst(x, y, 22, {
        color: [o.color || '#ffb03a', '#ffffff', '#ff6b2c'], speed: 200, life: 0.55, size: 2.4, glow: true, grav: 90,
      });
      if (!o.noShake) Gfx.shake(4);
      const hit = {
        x, y, r, damage: o.damage || 10, knock: o.knock || 100, team: o.team || 'hero',
        life: 0.08, kind: o.kind || 'boom', source: this.hero, hitSet: new Set(),
        stun: o.stun || 0, slow: o.slow, slowDur: o.slowDur, dir: 0, crit: false,
      };
      this.hits.push(hit);
      Snd.sfx('explode');
    },

    hurtHero(dmg, o) {
      const before = this.hero.hp;
      const dealt = this.hero.takeDamage(dmg, o);
      if (dealt > 0) {
        this.hitstop = 0.05;
        if (this.hero.thorns && o && o.dir !== undefined) {
          const near = this.nearestEnemy(this.hero.x, this.hero.y, 60);
          if (near) near.takeDamage(this.hero.thorns, { dir: E.angTo(this.hero.x, this.hero.y, near.x, near.y), knock: 60 });
        }
        if (this.hero.hp <= 0) {
          if (this.hero.reviveCharge > 0) {
            this.hero.reviveCharge--;
            this.hero.hp = this.hero.maxHp * 0.5;
            this.hero.state = 'idle';
            this.hero.dead = false;
            this.hero.iframe = 2;
            Gfx.Fx.flash('#f0c05a', 0.5);
            this.toast('¡El pacto te sostiene!', '#f0c05a');
            Snd.sfx('levelup');
          } else {
            this.onDeath();
          }
        }
      }
    },

    nearestEnemy(x, y, r) {
      let best = null, bd = r * r;
      for (const e of this.enemies) {
        if (!e.alive || e.state === 'spawn') continue;
        const d = E.dist2(x, y, e.x, e.y);
        if (d < bd) { bd = d; best = e; }
      }
      return best;
    },

    spawnMinions(boss, n) {
      if (!this.room) return;
      const count = n || 2;
      for (let i = 0; i < count; i++) {
        const a = E.rnd(TAU, 0);
        const x = E.clamp(boss.x + Math.cos(a) * 46, 40, this.room.w - 40);
        const y = E.clamp(boss.y + Math.sin(a) * 40, 50, this.room.h - 40);
        const type = boss.id === 'custodian' ? 'wisp' : boss.id === 'alchemist' ? 'spitter' : 'grub';
        const e = Foes.make(type, x, y, {});
        e.state = 'spawn';
        e.t = 0;
        this.enemies.push(e);
        Gfx.P.burst(x, y - 8, 10, { color: '#b06be8', speed: 80, life: 0.5, size: 1.8, glow: true });
      }
      Snd.sfx('cast');
    },

    levelUp() {
      Snd.sfx('levelup');
      Gfx.Fx.flash('#f0c05a', 0.25);
      Gfx.shake(3);
      this.toast('¡NIVEL ' + this.hero.level + '!', '#f0c05a');
    },

    onEnemyDeath(e, o) {
      const xp = Math.round(e.xp * this.xpMul);
      this.hero.gainXp(xp, this);
      if (this.hero.killHeal) this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + this.hero.killHeal);
      // botín
      const ess = Math.round(e.essence * this.essenceMul);
      for (let i = 0; i < Math.min(4, ess); i++) {
        this.spawnPickup(e.x + E.rnd(8, -8), e.y + E.rnd(6, -6), 'essence', 1);
      }
      if (ess > 4) this.spawnPickup(e.x, e.y, 'essence', ess - 4);
      if (E.chance(e.elite ? 1 : 0.34)) {
        const ing = E.pick(Object.keys(Alchemy.ING));
        this.spawnPickup(e.x, e.y, 'ing', 1 + (this.hero.ingBonus || 0), ing);
        if (e.elite) {
          this.spawnPickup(e.x + 10, e.y, 'ing', 2 + (this.hero.ingBonus || 0), E.pick(Object.keys(Alchemy.ING)));
        }
      }
      if (E.chance(0.13)) this.spawnPickup(e.x, e.y, 'heal', 12);
      // equipo: armas y armaduras que caen de los enemigos (seguro en élites)
      const gearChance = e.boss ? 1 : e.elite ? 0.4 : 0.07 + this.depth * 0.004;
      if (E.chance(gearChance)) {
        const it = Items.roll(this.roomIndex);
        this.spawnPickup(e.x + E.rnd(6, -6), e.y + E.rnd(4, -4), it.kind, 1, it);
      }
      Gfx.shake(e.elite ? 4 : 1.6);
    },

    onBossDeath(b) {
      for (const e of this.enemies) {
        if (e !== b) {
          e.alive = false;
          e.remove = true;
          Gfx.P.burst(e.x, e.y - 10, 8, { color: '#c8a0ff', speed: 90, life: 0.5, size: 1.8, glow: true });
        }
      }
      this.enemies.length = 0;
      this.projectiles.length = 0;
      this.zones.length = 0;
      this.boss = null;
      for (let i = 0; i < 14; i++) this.spawnPickup(b.x + E.rnd(24, -24), b.y + E.rnd(14, -14), 'essence', 5);
      for (let i = 0; i < 3; i++) this.spawnPickup(b.x + E.rnd(20, -20), b.y, 'ing', 3, E.pick(Object.keys(Alchemy.ING)));
      this.spawnPickup(b.x, b.y, 'heal', 40);
      // el jefe siempre suelta equipo
      for (let i = 0; i < 2; i++) {
        const it = Items.roll(Math.min(11, this.roomIndex + 1));
        this.spawnPickup(b.x + E.rnd(20, -20), b.y + 10, it.kind, 1, it);
      }
      this.hero.gainXp(Math.round(110 * this.xpMul), this);
      this.toast('¡' + b.name + ' ha caído!', '#f0c05a');
      this.essenceEarned += 40;
      this.essence += 40;
      this.clearT = 0.0001;
      Gfx.Fx.flash('#ffffff', 0.5);
    },

    spawnPickup(x, y, type, amount, ing) {
      const gear = type === 'weapon' || type === 'armor';
      this.pickups.push({
        x, y, vx: E.rnd(80, -80), vy: E.rnd(-40, -120), type, amount: amount || 1, ing,
        life: gear ? 99 : 26, bob: E.rnd(TAU, 0), magnet: 0, z: 6, fullT: -9,
      });
    },

    // ---------------- muerte / victoria ----------------
    onDeath() {
      this.state = 'death';
      this.deathT = 0;
      this.hitstop = 0.12;
      Gfx.shake(8);
      Gfx.Fx.flash('#8a1a1a', 0.4);
      this.save.essence = Math.round(this.essence + 10);
      this.essence = this.save.essence;
      this.save.runs = (this.save.runs || 0) + 1;
      this.save.bestRooms = Math.max(this.save.bestRooms || 0, this.roomsCleared);
      this.persist();
      Snd.music('death');
    },

    victory() {
      this.state = 'victory';
      this.deathT = 0;
      this.essenceEarned += 120;
      this.essence += 120;
      this.save.essence = Math.round(this.essence);
      this.save.runs = (this.save.runs || 0) + 1;
      this.save.best = (this.save.best || 0) + 1;
      this.save.bestRooms = Math.max(this.save.bestRooms || 0, this.roomsCleared);
      this.persist();
      Snd.music('hub');
      Snd.sfx('levelup');
    },

    saveEssence(n) {
      this.save.essence = Math.round(n);
      this.essence = this.save.essence;
      this.persist();
    },

    // ---------------- recompensas ----------------
    openReward(source) {
      const pool = BOONS.filter((b) => !this.boonIds.includes(b.id));
      const opts = [];
      const count = Math.min(4, 3 + (this.metaLevel('suerte') || 0));
      for (let i = 0; i < count && pool.length; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        opts.push(pool.splice(idx, 1)[0]);
      }
      if (!opts.length) {
        this.toast('No quedan bendiciones', '#f0c05a');
        return;
      }
      this.rewardOptions = opts;
      this.rewardSel = 0;
      this.rewardSource = source || '';
      this.state = 'reward';
      Snd.sfx('relic');
    },

    takeBoon(b) {
      b.apply(this.hero, this);
      this.boons.push(b);
      this.boonIds.push(b.id);
      this.toast(b.name + ' obtenida', '#f0c05a');
      Snd.sfx('pick');
      this.state = 'run';
      this.advanceRoom();
    },

    applyDoorReward(door) {
      const r = door.reward;
      if (r.type === 'boon') {
        this.openReward('Bendición de ' + (this.room ? this.room.biome.name : ''));
        return;
      }
      if (r.type === 'heal') {
        this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + this.hero.maxHp * 0.4);
        this.hero.addHeal(0, 1);
        Gfx.F.add(this.hero.x, this.hero.y - 30, '+40%', { color: '#6ff08a', size: 2 });
        Snd.sfx('heal');
        this.toast('Fuente de savia: +40% de vida', '#6ff08a');
      } else if (r.type === 'ing') {
        for (let i = 0; i < 2; i++) {
          for (const k in Alchemy.bag) Alchemy.bag[k] += 1 + (this.hero.ingBonus || 0);
        }
        this.toast('Reagentas recogidas', '#8fd8e8');
        Snd.sfx('pick');
      } else if (r.type === 'essence') {
        this.essence += 30;
        this.essenceEarned += 30;
        this.toast('+30 esencia', '#b98bff');
        Snd.sfx('coin');
      } else if (r.type === 'recipe') {
        const unknown = Alchemy.RECIPES.filter((x) => !this.save.recipes.includes(x.id) && !Alchemy.known[x.id]);
        if (unknown.length) {
          const rec = unknown[0];
          this.save.recipes.push(rec.id);
          Alchemy.unlock(rec.id);
          this.persist();
          this.toast('Receta aprendida: ' + rec.name, '#f0c05a');
          Gfx.Fx.flash('#c8a0ff', 0.25);
        } else {
          this.essence += 25;
          this.essenceEarned += 25;
          this.toast('+25 esencia', '#b98bff');
        }
        Snd.sfx('relic');
      }
      this.advanceRoom();
    },

    // ---------------- actualización ----------------
    update(dt) {
      this.time += dt;
      if (Input.pressed('mute')) {
        this.save.muted = !this.save.muted;
        Snd.setMuted(this.save.muted);
        this.persist();
        this.toast(this.save.muted ? 'Silencio' : 'Sonido activado');
      }
      Snd.update();
      for (let i = this.toasts.length - 1; i >= 0; i--) {
        this.toasts[i].t += dt;
        if (this.toasts[i].t > this.toasts[i].max) this.toasts.splice(i, 1);
      }

      if (this.state === 'title') {
        if (Input.any()) { Snd.resume(); this.state = 'hub'; this.hubSel = 0; Snd.music('hub'); }
        return;
      }
      if (this.state === 'hub') { this.updateHub(dt); return; }
      if (this.state === 'death' || this.state === 'victory') {
        this.deathT += dt;
        Gfx.Fx.update(dt);
        if (this.deathT > 1.4 && Input.any()) {
          this.state = 'hub';
          this.hubSel = 0;
          this.targetFade = 0;
          Snd.music('hub');
        }
        return;
      }
      if (this.state === 'pause') { this.updatePause(dt); return; }
      if (this.state === 'reward') { this.updateReward(dt); return; }
      if (this.state === 'radial') {
        this.radialLock = Math.max(0, (this.radialLock || 0) - dt);
        for (let i = 0; i < 4; i++) {
          if (Input.pressed('slot' + (i + 1))) {
            Alchemy.selected = i;
            Snd.sfx('ui');
          }
        }
        if (this.radialLock <= 0 && (Input.pressed('radial') || Input.pressed('pause'))) {
          this.state = 'run';
          this.timeScale = 1;
          Snd.sfx('ui');
          return;
        }
        if (this.radialLock <= 0 && (Input.attackPressed() || Input.pressed('confirm'))) {
          const idx = UI.radialHover;
          if (idx >= 0) {
            const known = Alchemy.knownList();
            const id = known[idx];
            const slot = Alchemy.selected;
            Alchemy.slots[slot] = id;
            Snd.sfx('ui');
          }
          this.state = 'run';
          this.timeScale = 1;
        }
        Gfx.Fx.update(dt * 0.3);
        return;
      }
      if (this.state === 'inventory') { this.updateInventory(); return; }

      if (this.state !== 'run') return;
      if (Input.pressed('pause')) { this.state = 'pause'; this.pauseSel = 0; return; }
      if (Input.pressed('radial')) { this.state = 'radial'; this.radialLock = 0.2; this.timeScale = 0.14; return; }
      if (Input.pressed('inventory')) { this.state = 'inventory'; this.invSel = 0; Snd.sfx('ui'); return; }

      // cambio de ranura de hechizo
      for (let i = 0; i < 4; i++) {
        if (Input.pressed('slot' + (i + 1))) {
          Alchemy.selected = i;
          Snd.sfx('ui');
        }
      }

      // transición entre salas
      if (this.transition) {
        const tr = this.transition;
        tr.t += dt;
        const half = tr.dur * 0.5;
        this.fade = tr.t < half ? E.clamp01(tr.t / half) : E.clamp01(1 - (tr.t - half) / half);
        if (!tr.loaded && tr.t >= half) {
          tr.loaded = true;
          this.loadRoom(tr.idx);
        }
        if (tr.t >= tr.dur) {
          this.transition = null;
          this.fade = 0;
        }
        Gfx.Fx.update(dt);
        return;
      }

      this.runTime += dt;
      const sdt = dt * this.timeScale;
      if (this.hitstop > 0) {
        this.hitstop -= dt;
        Gfx.Fx.update(dt * 0.2);
        return;
      }

      const h = this.hero;
      Alchemy.tick(sdt);

      this.room.update(sdt);
      h.update(sdt, this);
      if (this.dog) this.dog.update(sdt, this);

      // regeneración / berserk
      if (h.regen) h.hp = Math.min(h.maxHp, h.hp + h.regen * sdt);
      h.berserkActive = h.berserk && h.hp < h.maxHp * 0.35;
      h.effDmgMul = h.damageMult * (h.gearDmgMul || 1) * (h.berserkActive ? 1.35 : 1);

      // cola de aparición
      for (let i = this.spawnQueue.length - 1; i >= 0; i--) {
        const sq = this.spawnQueue[i];
        sq.delay -= sdt;
        if (sq.delay <= 0) {
          this.spawnQueue.splice(i, 1);
          let e;
          if (sq.type === 'boss') {
            e = Foes.boss(sq.bossId, sq.x, sq.y);
            e.state = 'spawn';
            e.t = 0;
            e.spawnT = 1.1;
            e.phase = 0;
            this.boss = e;
            Snd.sfx('roar');
            Gfx.shake(5);
          } else {
            e = Foes.make(sq.type, sq.x, sq.y, { elite: sq.elite });
          }
          e.hp = Math.round(e.hp * sq.mul);
          e.maxHp = Math.round(e.maxHp * sq.mul);
          e.damage = e.damage * (1 + this.depth * 0.055);
          this.enemies.push(e);
          Gfx.P.burst(sq.x, sq.y - 10, 12, { color: '#b06be8', speed: 90, life: 0.5, size: 1.8, glow: true });
        }
      }

      // enemigos
      for (const e of this.enemies) e.update(sdt, this);
      this.enemies = this.enemies.filter((e) => !e.remove);

      // los enemigos jamás salen de la sala: el empuje de los golpes y los
      // enemigos voladores tampoco pueden atravesar los límites (antes unos
      // wisps empujados quedaban fuera, inalcanzables e imposibles de matar)
      const eb = this.room.bounds;
      for (const e of this.enemies) {
        if (!e.alive || e.state === 'dead' || e.state === 'spawn') continue;
        const pad = (e.r || 6) * 0.8;
        const nx = E.clamp(e.x, eb.x + pad, eb.x + eb.w - pad);
        const ny = E.clamp(e.y, eb.y + pad, eb.y + eb.h - pad);
        if (nx !== e.x) e.vx *= -0.25;
        if (ny !== e.y) e.vy *= -0.25;
        e.x = nx; e.y = ny;
      }

      // colisiones de golpes
      this.resolveHits(sdt);

      // proyectiles
      this.updateProjectiles(sdt);
      this.updateZones(sdt);

      // recogibles
      this.updatePickups(sdt);

      // efectos visuales
      for (let i = this.vfx.length - 1; i >= 0; i--) {
        const v = this.vfx[i];
        v.t += sdt;
        if (v.t > v.life) this.vfx.splice(i, 1);
      }

      // puertas
      if (this.room.doorHint) this.room.doorHint -= sdt;
      this.updateDoors(sdt);
      this.updateChests(sdt);

      // limpieza de sala
      const cleared = this.enemies.length === 0 && this.spawnQueue.length === 0;
      if (cleared && !this.cleared && this.state === 'run' && this.hero.state !== 'dead') {
        this.cleared = true;
        this.roomsCleared++;
        this.openDoors();
        if (RUN_PLAN[this.roomIndex].kind === 'boss') {
          this.toast('La puerta del siguiente círculo se abre', '#c8a0ff');
        }
      }

      // partículas y números
      Gfx.Fx.update(dt);
      Gfx.camFollow(h.x, h.y - 8, dt, Math.cos(h.aim) * 10, Math.sin(h.aim) * 4);

      // avisos
      if (this.notice) {
        this.notice.t -= dt;
        if (this.notice.t <= 0) this.notice = null;
      }
      this.fade = E.smooth(this.fade, 0, 4, dt);
    },

    updateHub(dt) {
      if (Input.pressed('up')) {
        this.hubSel = this.hubSel <= -1 ? this.metaList.length - 1 : this.hubSel - 1;
        Snd.sfx('uiMove');
      }
      if (Input.pressed('down')) {
        this.hubSel = this.hubSel >= this.metaList.length - 1 ? -1 : this.hubSel + 1;
        Snd.sfx('uiMove');
      }
      if (Input.pressed('confirm')) {
        if (this.hubSel >= 0) this.buyMeta(this.hubSel);
        else this.startRun();
      }
      if (Input.keyPressed('KeyR')) this.unlockRecipe();
      if (Input.keyPressed('KeyS') || Input.pressed('dash')) {
        Snd.sfx('door');
        this.startRun();
      }
      // clic en filas
      if (Input.mouse.pressed) {
        for (let i = 0; i < this.metaList.length; i++) {
          const y = 48 + i * 22;
          if (Input.mouse.x > 28 && Input.mouse.x < 278 && Input.mouse.y > y - 2 && Input.mouse.y < y + 18) {
            this.hubSel = i;
            this.buyMeta(i);
            break;
          }
        }
        if (Input.mouse.y > 240 && Input.mouse.y < 260) this.startRun();
      }
      Gfx.Fx.update(dt);
    },

    buyMeta(i) {
      const m = this.metaList[i];
      const lvl = this.metaLevel(m.id);
      if (lvl >= m.max) { Snd.sfx('error'); return; }
      const cost = m.cost(lvl);
      if ((this.save.essence || 0) < cost) { Snd.sfx('error'); this.toast('Esencia insuficiente'); return; }
      this.save.essence -= cost;
      this.essence = this.save.essence;
      this.save.meta[m.id] = lvl + 1;
      this.persist();
      Snd.sfx('levelup');
      this.toast(m.name + ' nivel ' + (lvl + 1), '#f0c05a');
    },

    unlockRecipe() {
      const unknown = Alchemy.RECIPES.filter((r) => !this.save.recipes.includes(r.id));
      if (!unknown.length) { Snd.sfx('error'); return; }
      const r = unknown[0];
      const cost = r.unlockCost || (120 + this.save.recipes.length * 60);
      if ((this.save.essence || 0) < cost) { Snd.sfx('error'); this.toast('Necesitas ' + cost + ' esencia'); return; }
      this.save.essence -= cost;
      this.essence = this.save.essence;
      this.save.recipes.push(r.id);
      this.persist();
      Snd.sfx('relic');
      this.toast('Receta: ' + r.name, '#c8a0ff');
    },

    updatePause(dt) {
      const opts = this.pauseOptions();
      if (Input.pressed('up')) { this.pauseSel = (this.pauseSel + opts.length - 1) % opts.length; Snd.sfx('uiMove'); }
      if (Input.pressed('down')) { this.pauseSel = (this.pauseSel + 1) % opts.length; Snd.sfx('uiMove'); }
      if (Input.pressed('pause')) { this.state = 'run'; return; }
      if (Input.pressed('confirm') || Input.attackPressed()) {
        switch (this.pauseSel) {
          case 0: this.state = 'run'; break;
          case 1: this.save.muted = !this.save.muted; Snd.setMuted(this.save.muted); this.persist(); Snd.sfx('ui'); break;
          case 2: Gfx.cam.shake = 0; this.shakeEnabled = !this.shakeEnabled; Snd.sfx('ui'); break;
          case 3: this.abandonRun(); break;
        }
      }
      Gfx.Fx.update(dt * 0.2);
    },

    pauseOptions() {
      return [
        { label: 'CONTINUAR' },
        { label: 'SONIDO', value: this.save.muted ? 'OFF' : 'ON' },
        { label: 'SACUDIDA', value: this.shakeEnabled ? 'ON' : 'OFF' },
        { label: 'ABANDONAR DESCENSO' },
      ];
    },

    abandonRun() {
      this.state = 'hub';
      this.hubSel = 0;
      this.save.essence = Math.round(this.essence);
      this.save.runs = (this.save.runs || 0) + 1;
      this.persist();
      Snd.music('hub');
    },

    updateReward(dt) {
      const n = this.rewardOptions.length;
      if (Input.pressed('left') || Input.keyPressed('KeyA')) { this.rewardSel = (this.rewardSel + n - 1) % n; Snd.sfx('uiMove'); }
      if (Input.pressed('right') || Input.keyPressed('KeyD')) { this.rewardSel = (this.rewardSel + 1) % n; Snd.sfx('uiMove'); }
      for (let i = 0; i < n; i++) if (Input.keyPressed('Digit' + (i + 1))) { this.rewardSel = i; }
      // hover ratón
      const L = UI.rewardLayout(n);
      if (Input.mouse.y > L.y && Input.mouse.y < L.y + L.ch) {
        for (let i = 0; i < n; i++) {
          const rx = L.x0 + i * (L.cw + L.gap);
          if (Input.mouse.x > rx && Input.mouse.x < rx + L.cw) {
            if (this.rewardSel !== i) Snd.sfx('uiMove');
            this.rewardSel = i;
          }
        }
      }
      if (Input.pressed('confirm') || Input.mouse.pressed) {
        const pick = this.rewardOptions[this.rewardSel];
        if (pick) this.takeBoon(pick);
      }
      Gfx.Fx.update(dt * 0.3);
    },

    resolveHits(dt) {
      const hud = this.hero;
      for (let i = this.hits.length - 1; i >= 0; i--) {
        const hit = this.hits[i];
        hit.life -= dt;
        const targets = hit.team === 'hero' ? this.enemies.concat(this.dog && false ? [] : []) : [hud];
        for (const t of targets) {
          if (!t || !t.alive && t !== hud) continue;
          if (t === hud && (hud.state === 'dead' || hud.iframe > 0)) continue;
          if (hit.hitSet.has(t)) continue;
          const tr = t.r || 6;
          if (E.dist(hit.x, hit.y, t.x, t.y - (t === hud ? 13 : 12 * (t.scale || 1))) > hit.r + tr) continue;
          hit.hitSet.add(t);
          let dmg = hit.damage;
          if (hit.team === 'hero') {
            const dir = E.angTo(hit.x, hit.y, t.x, t.y - 8);
            const dealt = t.takeDamage(dmg, {
              dir, knock: (hit.knock || 60) * (hud.knockMul || 1), stun: hit.stun, crit: hit.crit,
            });
            if (dealt > 0) {
              hud.onDealDamage(dealt);
              const x = t.x, y = t.y - 16 * (t.scale || 1);
              Gfx.F.add(x, y, Math.round(dealt), {
                color: hit.crit ? '#ffd24a' : '#ffffff', size: hit.crit ? 2 : 1, crit: hit.crit, life: 0.6,
              });
              Gfx.P.burst(hit.x, hit.y, hit.crit ? 10 : 5, {
                color: ['#ffffff', '#ffd08a', '#ff8a3a'], speed: hit.crit ? 150 : 90, life: 0.24, size: 1.6, glow: true,
              });
              Snd.sfx(hit.crit ? 'crit' : 'hit');
              if (hit.crit) Gfx.shake(3);
              this.hitstop = Math.max(this.hitstop, hit.kind === 'heavy' ? 0.06 : 0.025);
            }
          } else {
            this.hurtHero(hit.damage, { dir: hit.dir !== undefined ? hit.dir : E.angTo(hit.x, hit.y, hud.x, hud.y), knock: hit.knock || 100 });
          }
        }
        if (hit.life <= 0) this.hits.splice(i, 1);
      }
    },

    updateProjectiles(dt) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.life -= dt;
        if (p.life <= 0) { this.projectiles.splice(i, 1); continue; }

        if (p.shape === 'ring') {
          p.t = (p.t || 0) + dt;
          const k = E.clamp01(p.t / p.life);
          const rr = (p.maxR || 50) * E.easeOut(k);
          p.x = p.x0 === undefined ? (p.x0 = p.x) : p.x0;
          p.r = rr;
          // daño una vez
          if (p.damage > 0) {
            const hit = { x: p.x, y: p.y, r: rr, damage: p.damage, knock: 120, team: p.team, life: 0.02, hitSet: new Set(), kind: 'shock', source: this.hero };
            this.hits.push(hit);
            p.damage = 0;
          }
          continue;
        }

        if (p.homing > 0) {
          const tgt = p.team === 'foe' ? this.hero : this.nearestEnemy(p.x, p.y, 140);
          if (tgt) {
            const want = E.angTo(p.x, p.y, tgt.x, tgt.y - 12);
            const cur = Math.atan2(p.vy, p.vx);
            const na = E.lerpAngle(cur, want, E.clamp01(p.homing * dt));
            const sp = Math.hypot(p.vx, p.vy);
            p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp;
          }
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.spin) p.rot = (p.rot || 0) + p.spin * dt;

        if (p.trail && Math.random() < 0.7) {
          Gfx.P.spawn({
            x: p.x + E.rnd(2, -2), y: p.y + E.rnd(2, -2), vx: -p.vx * 0.06, vy: -p.vy * 0.06,
            life: 0.24, size: p.r * 0.7, color: p.trail, glow: true, shape: 'circle', shrink: 0.2,
          });
        }
        if (p.glow) Gfx.glow(p.x, p.y, p.r * 3, p.color, 0.3);

        // paredes
        if (!this.room.isInside(p.x, p.y, 2)) {
          if (p.bounce) { p.vx *= -1; p.vy *= -1; p.bounce--; p.x += p.vx * dt * 2; p.y += p.vy * dt * 2; }
          else {
            Gfx.P.burst(p.x, p.y, 6, { color: p.color, speed: 60, life: 0.3, size: 1.5, glow: true });
            this.projectiles.splice(i, 1);
            continue;
          }
        }
        for (const o of this.room.obstacles) {
          if (E.dist(p.x, p.y, o.x, o.y - o.h * 0.4) < o.r * 0.8 + p.r) {
            Gfx.P.burst(p.x, p.y, 6, { color: p.color, speed: 60, life: 0.3, size: 1.5, glow: true });
            this.projectiles.splice(i, 1);
            p.life = -1;
            break;
          }
        }
        if (p.life < 0) continue;

        // impactos
        if (p.team === 'foe') {
          if (E.dist(p.x, p.y, this.hero.x, this.hero.y - 13) < p.r + this.hero.r) {
            if (this.hero.iframe <= 0) {
              this.hurtHero(p.damage, { dir: Math.atan2(p.vy, p.vx), knock: p.knock || 80 });
              if (p.onHit) p.onHit(p, this.hero);
              this.projectiles.splice(i, 1);
            }
          }
        } else {
          for (const e of this.enemies) {
            if (!e.alive || e.state === 'spawn') continue;
            if (p.hitSet.has(e)) continue;
            if (E.dist(p.x, p.y, e.x, e.y - 12 * (e.scale || 1)) < p.r + e.r) {
              p.hitSet.add(e);
              const dmg = p.damage * (this.hero.spellMult || 1) * (1 + (this.hero.level - 1) * 0.05);
              const dealt = e.takeDamage(dmg, { dir: Math.atan2(p.vy, p.vx), knock: p.knock || 60, crit: false });
              if (dealt > 0) {
                Gfx.F.add(e.x, e.y - 16 * (e.scale || 1), Math.round(dealt), { color: '#ffd0a0', size: 1, life: 0.5 });
                this.hero.onDealDamage(dealt);
              }
              if (p.onHit) p.onHit(p, e);
              if (!p.pierce) { this.projectiles.splice(i, 1); break; }
            }
          }
        }
      }
    },

    updateZones(dt) {
      for (let i = this.zones.length - 1; i >= 0; i--) {
        const z = this.zones[i];
        z.life -= dt;
        z.tickT -= dt;
        if (z.life <= 0) { this.zones.splice(i, 1); continue; }
        if (z.tickT <= 0) {
          z.tickT = z.tick || 0.4;
          if (z.team === 'foe') {
            if (E.dist(z.x, z.y, this.hero.x, this.hero.y - 6) < z.r) {
              this.hurtHero(z.dps * (z.tick || 0.4), { dir: E.angTo(z.x, z.y, this.hero.x, this.hero.y), knock: 40 });
            }
          } else {
            for (const e of this.enemies) {
              if (!e.alive) continue;
              if (E.dist(z.x, z.y, e.x, e.y - 8) < z.r + e.r * 0.6) {
                e.takeDamage(z.dps * (z.tick || 0.4), { dir: E.angTo(z.x, z.y, e.x, e.y), knock: 0 });
                Gfx.P.spawn({ x: e.x, y: e.y - 10, vx: E.rnd(20, -20), vy: -30, life: 0.4, size: 1.6, color: z.color, glow: true });
              }
            }
          }
        }
        if (Math.random() < 0.5) {
          Gfx.P.spawn({
            x: z.x + E.rnd(z.r, -z.r), y: z.y + 2, vx: 0, vy: -E.rnd(30, 8),
            life: 0.5, size: 2, color: z.color, glow: true, shape: 'circle',
          });
        }
      }
    },

    updatePickups(dt) {
      const h = this.hero;
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const p = this.pickups[i];
        p.life -= dt;
        if (p.life <= 0) { this.pickups.splice(i, 1); continue; }
        p.z = Math.max(0, p.z - 260 * dt * (1 + p.vy / 200));
        p.x += p.vx * dt;
        p.vx *= 0.90;
        const d = E.dist(p.x, p.y, h.x, h.y - 6);
        const magnetR = 62;
        if (d < magnetR) {
          const a = E.angTo(p.x, p.y, h.x, h.y - 8);
          const pull = (1 - d / magnetR) * 500;
          p.vx += Math.cos(a) * pull * dt * 6;
          p.vx = E.clamp(p.vx, -260, 260);
          p.y = E.smooth(p.y, h.y, 8, dt);
        }
        if (d < 12) {
          let picked = true;
          if (p.type === 'essence') {
            this.essence += p.amount;
            this.essenceEarned += p.amount;
            Snd.sfx('coin');
          } else if (p.type === 'ing') {
            Alchemy.add(p.ing || E.pick(Object.keys(Alchemy.ING)), p.amount);
            Snd.sfx('pick');
          } else if (p.type === 'heal') {
            h.hp = Math.min(h.maxHp, h.hp + p.amount);
            Snd.sfx('heal');
            Gfx.F.add(h.x, h.y - 28, '+' + p.amount, { color: '#6ff08a', size: 1 });
          } else if (p.type === 'weapon' || p.type === 'armor') {
            // equipo: a la bolsa; se autoequipa si la ranura está vacía
            const it = p.ing;
            if (h.bag.length >= 10) {
              picked = false;
              if (this.time - p.fullT > 1.6) {
                this.toast('Inventario lleno', '#f0c05a');
                p.fullT = this.time;
              }
            } else {
              Snd.sfx('relic');
              let auto = '';
              if (it.kind === 'weapon' && !h.gear.weapon) { h.gear.weapon = it; auto = ' (equipada)'; }
              else if (it.kind === 'armor' && !h.gear.armor) { h.gear.armor = it; auto = ' (equipada)'; }
              else h.bag.push(it);
              h.recomputeGear();
              this.toast(it.name + ' — ' + Items.statText(it) + auto, it.color);
              Gfx.F.add(h.x, h.y - 36, it.name, { color: it.color, size: 1.3 });
            }
          }
          if (picked) this.pickups.splice(i, 1);
        }
      }
    },

    openDoors() {
      this.doors.length = 0;
      const r = this.room;
      const y = 38;
      const types = ['boon', 'heal', 'ing', 'essence', 'recipe'];
      const n = 2;
      const picks = [];
      // siempre una bendición
      picks.push('boon');
      while (picks.length < n) {
        const t = E.pick(types.filter((x) => x !== 'boon'));
        if (!picks.includes(t)) picks.push(t);
      }
      const xpos = n === 2 ? [r.w * 0.3, r.w * 0.7] : [r.w * 0.22, r.w * 0.5, r.w * 0.78];
      for (let i = 0; i < n; i++) {
        this.doors.push({
          x: xpos[i], y, w: 34, h: 40, reward: { type: picks[i] }, open: false, t: 0, used: false,
        });
      }
      this.doorT = 0.5;
      Snd.sfx('door');
    },

    updateDoors(dt) {
      if (!this.doors.length) return;
      this.doorT -= dt;
      for (const d of this.doors) {
        d.t += dt;
        if (d.t > 0.35) d.open = true;
      }
      if (this.doorT > 0) return;
      for (const d of this.doors) {
        if (d.used) continue;
        const cx = d.x, cy = d.y + 16;
        if (E.dist(this.hero.x, this.hero.y, cx, cy) < 20) {
          d.used = true;
          Gfx.P.burst(cx, cy, 20, { color: '#c8a0ff', speed: 120, life: 0.6, size: 2, glow: true });
          Snd.sfx('door');
          this.doors.length = 0;
          this.applyDoorReward(d);
          return;
        }
      }
    },

    // ---------------- cofres ----------------
    updateChests(dt) {
      for (const c of this.chests) {
        if (c.opened) { c.t += dt; c.near = false; continue; }
        c.near = E.dist(this.hero.x, this.hero.y, c.x, c.y) < 18;
        if (c.near && Input.pressed('interact')) this.openChest(c);
      }
    },

    openChest(c) {
      c.opened = true;
      c.t = 0;
      Gfx.P.burst(c.x, c.y - 8, 20, { color: ['#f0c05a', '#fff3d0', '#c8a0ff'], speed: 120, life: 0.7, size: 2, glow: true, grav: -60 });
      Gfx.shake(2);
      Snd.sfx('relic');
      const roll = Math.random();
      if (roll < 0.55) {
        // mejora directa: una bendición aleatoria (puede repetir las acumulables)
        const b = E.pick(BOONS);
        b.apply(this.hero, this);
        this.boons.push(b);
        this.toast('Cofre: ' + b.name + ' — ' + b.desc, '#f0c05a');
        Gfx.F.add(c.x, c.y - 24, b.name, { color: '#f0c05a', size: 1.6 });
      } else if (roll < 0.85) {
        const it = Items.roll(this.roomIndex);
        this.spawnPickup(c.x, c.y - 6, it.kind, 1, it);
        this.toast('Cofre: ¡' + it.name + '!', it.color);
      } else {
        const ess = 12 + Math.floor(Math.random() * 16);
        for (let i = 0; i < 4; i++) this.spawnPickup(c.x + E.rnd(10, -10), c.y + E.rnd(8, -8), 'essence', Math.ceil(ess / 4));
        this.spawnPickup(c.x, c.y, 'heal', 18);
        this.toast('Cofre: esencia y savia', '#b98bff');
      }
    },

    // ---------------- inventario ----------------
    invRows() {
      const rows = [{ kind: 'slot', slot: 'weapon' }, { kind: 'slot', slot: 'armor' }];
      for (let i = 0; i < this.hero.bag.length; i++) rows.push({ kind: 'bag', idx: i });
      return rows;
    },

    updateInventory() {
      const h = this.hero;
      const rows = this.invRows();
      const n = Math.max(1, rows.length);
      if (this.invSel >= n) this.invSel = n - 1;
      if (Input.pressed('down')) { this.invSel = (this.invSel + 1) % n; Snd.sfx('uiMove'); }
      if (Input.pressed('up')) { this.invSel = (this.invSel - 1 + n) % n; Snd.sfx('uiMove'); }
      if (Input.pressed('inventory') || Input.pressed('pause')) { this.state = 'run'; Snd.sfx('ui'); return; }
      const row = rows[this.invSel];
      if (Input.pressed('confirm')) {
        if (row.kind === 'bag') this.equipBagItem(row.idx);
        else if (h.gear[row.slot]) this.unequipSlot(row.slot);
      }
      if (Input.pressed('discard')) {
        if (row.kind === 'bag') {
          const it = h.bag.splice(row.idx, 1)[0];
          if (it) { this.toast(it.name + ' descartado', '#8a7fa0'); Snd.sfx('error'); }
        } else if (h.gear[row.slot]) {
          const it = h.gear[row.slot];
          h.gear[row.slot] = null;
          h.recomputeGear();
          this.toast(it.name + ' descartado', '#8a7fa0');
          Snd.sfx('error');
        }
      }
      // ratón: pasar por encima selecciona, clic equipa o quita
      const L = UI.INV;
      for (let i = 0; i < rows.length; i++) {
        const ry = L.py + L.row0 + i * L.rh;
        if (Input.mouse.x > L.px + 6 && Input.mouse.x < L.px + L.pw - 6 && Input.mouse.y > ry - 9 && Input.mouse.y < ry + 4) {
          this.invSel = i;
          if (Input.mouse.pressed) {
            const rw = rows[i];
            if (rw.kind === 'bag') this.equipBagItem(rw.idx);
            else if (h.gear[rw.slot]) this.unequipSlot(rw.slot);
          }
          break;
        }
      }
    },

    equipBagItem(idx) {
      const h = this.hero;
      const it = h.bag[idx];
      if (!it) return;
      const prev = h.gear[it.kind];
      h.bag.splice(idx, 1);
      h.gear[it.kind] = it;
      if (prev) h.bag.push(prev);
      h.recomputeGear();
      this.toast(it.name + ' equipada — ' + Items.statText(it), it.color);
      Snd.sfx('pick');
    },

    unequipSlot(slot) {
      const h = this.hero;
      const it = h.gear[slot];
      if (!it) return;
      if (h.bag.length >= 10) { this.toast('Inventario lleno', '#f0c05a'); Snd.sfx('error'); return; }
      h.gear[slot] = null;
      h.bag.push(it);
      h.recomputeGear();
      Snd.sfx('ui');
    },

    // ---------------- dibujado ----------------
    draw(ctx) {
      if (this.state === 'title') {
        UI.drawTitle(ctx, this);
        UI.drawFade(ctx, this.fade);
        return;
      }
      if (this.state === 'hub') {
        UI.drawHub(ctx, this);
        UI.drawFade(ctx, this.fade);
        Gfx.F.draw(ctx);
        return;
      }
      if (!this.room) { UI.drawTitle(ctx, this); return; }

      const r = this.room;
      Art.drawBackground(ctx, r, Gfx.cam, this.time);
      Gfx.begin();
      Art.drawFloor(ctx, r, this.time);

      // zonas en el suelo
      for (const z of this.zones) {
        Art.drawZone(ctx, z, this.time);
      }

      // decorado de obstáculos y entidades ordenados por y
      const drawables = [];
      for (const o of r.obstacles) drawables.push({ y: o.y, kind: 'obs', o });
      for (const e of this.enemies) if (e.state !== 'dead') drawables.push({ y: e.y, kind: 'e', o: e });
      if (this.dog) drawables.push({ y: this.dog.y, kind: 'dog', o: this.dog });
      drawables.push({ y: this.hero.y, kind: 'hero', o: this.hero });
      drawables.sort((a, b) => a.y - b.y);

      // Luz local sobre suelo y contornos: los personajes ahora pertenecen
      // al mismo espacio atmosférico que la sala, en vez de flotar encima.
      for (const d of drawables) {
        if (d.kind === 'obs') continue;
        const actor = d.o;
        if (d.kind === 'hero') {
          const hue = actor.castGlow > .2 ? '#b98bff' : r.biome.accent;
          Gfx.glow(actor.x, actor.y - 9, 25 + actor.castGlow * 12, hue, .105);
          if (actor.state === 'heavy') Gfx.glow(actor.x, actor.y - 12, 33, '#ffd08a', .09);
        } else if (d.kind === 'dog') {
          Gfx.glow(actor.x, actor.y - 7, 13, '#d28a54', .07);
        } else {
          const hue = actor.type === 'wisp' ? (actor.elite ? '#bd82ff' : '#70d9ee')
            : actor.type === 'charger' ? '#ef7658'
              : actor.type === 'boss' ? '#c17bf0' : '#d6a55f';
          Gfx.glow(actor.x, actor.y - 10 * (actor.scale || 1), 20 * (actor.scale || 1), hue, actor.elite ? .16 : .095);
        }
      }

      for (const d of drawables) {
        if (d.kind === 'obs') {
          Art.drawObstacle(ctx, r, d.o, this.time);
        } else if (d.kind === 'e') d.o.draw(ctx, this);
        else if (d.kind === 'dog') Art.drawDog(ctx, d.o, this.time);
        else if (d.kind === 'hero') d.o.draw(ctx, this);
      }

      // puertas
      for (const d of this.doors) Art.drawDoor(ctx, d, this);

      // proyectiles
      for (const p of this.projectiles) Art.drawProjectile(ctx, p);

      // partículas y números
      Gfx.P.draw(ctx, 0);
      Gfx.P.draw(ctx, 1);
      Gfx.F.draw(ctx);

      // vfx
      for (const v of this.vfx) {
        const k = E.clamp01(v.t / v.life);
        if (v.kind === 'ring' || v.kind === 'shock') {
          const rr = E.lerp(v.r, v.r2, E.easeOut(k));
          Gfx.ring(v.x, v.y, rr, v.color, (1 - k) * 0.9, v.kind === 'shock' ? 3 : 2);
        } else if (v.kind === 'boom') {
          const rr = E.lerp(v.r, v.r2, E.easeOut(k));
          Gfx.circA(v.x, v.y, rr, v.color, (1 - k) * 0.35);
          Gfx.ring(v.x, v.y, rr, v.color, (1 - k) * 0.9, 2);
        }
      }

      // recogibles
      for (const p of this.pickups) Art.drawPickup(ctx, p, this.time);

      Gfx.end();

      // HUD
      if (this.state !== 'death' && this.state !== 'victory') UI.drawHUD(ctx, this);

      if (this.hero.state === 'dead' && this.state === 'run') {
        ctx.fillStyle = 'rgba(20,4,8,0.55)';
        ctx.fillRect(0, 0, Gfx.W, Gfx.H);
      }

      if (this.state === 'reward') UI.drawRewards(ctx, this);
      if (this.state === 'pause') UI.drawPause(ctx, this);
      if (this.state === 'radial') {
        UI.radialHover = UI.drawRadial(ctx, this);
      }
      if (this.state === 'death') UI.drawDeath(ctx, this);
      if (this.state === 'victory') UI.drawVictory(ctx, this);

      Gfx.Fx.drawFlash();
      Gfx.Fx.vignette(0.42);
      UI.drawFade(ctx, this.fade);
    },

    drawDoor(ctx, d) {
      const open = d.open;
      const x = d.x, y = d.y;
      const w = d.w, h = d.h;
      const col = d.reward.type === 'boon' ? '#c8a0ff' : d.reward.type === 'heal' ? '#6ff08a' : d.reward.type === 'ing' ? '#8fd8e8' : d.reward.type === 'essence' ? '#b98bff' : '#f0c05a';
      const t = this.time;
      const k = E.clamp01(d.t / 0.5);
      // piedra del marco
      ctx.fillStyle = '#0c0a12';
      ctx.beginPath();
      ctx.moveTo(x - w / 2 - 4, y + h);
      ctx.lineTo(x - w / 2 - 4, y + 12);
      ctx.quadraticCurveTo(x, y - 10, x + w / 2 + 4, y + 12);
      ctx.lineTo(x + w / 2 + 4, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2a2136';
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y + h);
      ctx.lineTo(x - w / 2, y + 13);
      ctx.quadraticCurveTo(x, y - 6, x + w / 2, y + 13);
      ctx.lineTo(x + w / 2, y + h);
      ctx.closePath();
      ctx.fill();
      // portal
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + 3, y + h - 4);
      ctx.lineTo(x - w / 2 + 3, y + 14);
      ctx.quadraticCurveTo(x, y - 2, x + w / 2 - 3, y + 14);
      ctx.lineTo(x + w / 2 - 3, y + h - 4);
      ctx.closePath();
      ctx.clip();
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, E.alpha(col, 0.05));
      g.addColorStop(0.45, E.alpha(col, 0.55 + Math.sin(t * 4) * 0.12));
      g.addColorStop(1, E.alpha(col, 0.22));
      ctx.fillStyle = g;
      ctx.fillRect(x - w / 2, y - 10, w, h + 10);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const yy = y + ((t * 22 + i * 13) % h);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - w / 2 + 5, yy, w - 10, 1);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      Gfx.glow(x, y + h * 0.5, 24, col, 0.12 + Math.sin(t * 3) * 0.04);
      // icono
      const iy = y + h * 0.45;
      Gfx.circ(x, iy, 8, 'rgba(8,6,14,0.75)');
      Gfx.ring(x, iy, 8, col, 0.8, 1);
      UI.drawBoonIcon(ctx, d.reward.type === 'heal' ? 'heart' : d.reward.type === 'essence' ? 'coin' : d.reward.type === 'ing' ? 'leaf' : d.reward.type === 'recipe' ? 'flask' : 'star', x, iy, col);
      const near = E.dist(this.hero.x, this.hero.y, x, y + h * 0.7) < 26;
      if (near && k > 0.9) {
        Gfx.text('ENTRAR', x, y + h + 3, { size: 1, align: 'center', color: col, shadow: '#000' });
      }
    },

    drawProj(ctx, p) {
      if (p.shape === 'ring') {
        const k = E.clamp01((p.t || 0) / p.life);
        const rr = (p.maxR || 50) * E.easeOut(k);
        Gfx.ring(p.x, p.y, rr, p.color || '#ffb03a', (1 - k) * 0.9, 3);
        return;
      }
      if (p.shape === 'shard') {
        const a = Math.atan2(p.vy, p.vx);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(a);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(6, 0); ctx.lineTo(-4, 2.4); ctx.lineTo(-2, 0); ctx.lineTo(-4, -2.4);
        ctx.fill();
        ctx.restore();
        return;
      }
      Gfx.glow(p.x, p.y, p.r * 2.6, p.color, 0.45);
      Gfx.circ(p.x, p.y, p.r, p.color);
      Gfx.circ(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.5, '#ffffff');
    },

    drawPickup(ctx, p) {
      const bob = Math.sin(this.time * 4 + p.bob) * 1.5;
      const y = p.y - p.z + bob;
      Gfx.shadow(p.x, p.y, 2.5, 0.25);
      if (p.type === 'essence') {
        Gfx.glow(p.x, y, 7, '#b98bff', 0.45);
        Gfx.poly([[p.x, y - 4], [p.x + 3, y], [p.x, y + 4], [p.x - 3, y]], '#c8a0ff');
        Gfx.poly([[p.x, y - 2], [p.x + 1.4, y], [p.x, y + 2], [p.x - 1.4, y]], '#f0e0ff');
      } else if (p.type === 'ing') {
        const I = Alchemy.ING[p.ing] || Alchemy.ING.savia;
        Gfx.glow(p.x, y, 8, I.color, 0.35);
        Gfx.circ(p.x, y, 4.5, 'rgba(12,10,18,0.8)');
        Alchemy.drawIng(ctx, p.ing, p.x, y, 1);
      } else {
        Gfx.glow(p.x, y, 8, '#6ff08a', 0.35);
        Gfx.circ(p.x, y, 4, '#2a5a2a');
        Gfx.rect(p.x - 1, y - 3, 2, 6, '#8ff08a');
        Gfx.rect(p.x - 3, y - 1, 6, 2, '#8ff08a');
      }
    },
  };

  // entorno del héroe: multiplicadores
  const _takeDamage = Game.hurtHero;
  window.Game = Game;
})();
