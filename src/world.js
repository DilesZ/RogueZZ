// ============================================================
//  Mundo: biomas, salas, decorado y colisiones
// ============================================================
(function () {
  const BIOMES = [
    {
      id: 'jungla',
      name: 'JUNGLA DE CENIZA',
      short: 'JUNGLA',
      music: 'jungla',
      sky: ['#101c1a', '#0a1210'],
      floor: '#2a2a1e', floor2: '#1d2116', wall: '#1a2418', wall2: '#0d1410',
      accent: '#7fe36b', fog: '#1b2b22', dustColor: '#6b5b47',
      enemies: ['grub', 'grub', 'wisp', 'charger', 'spitter'],
      elite: ['charger', 'brute'],
      boss: 'guardian',
      bossName: 'GUARDIÁN DE RAÍCES',
      desc: 'Donde la savia aún recuerda ser bosque.',
    },
    {
      id: 'cavernas',
      name: 'CAVERNAS DE SAL',
      short: 'CAVERNAS',
      music: 'cavernas',
      sky: ['#0b1620', '#060c12'],
      floor: '#22303a', floor2: '#18242c', wall: '#13202a', wall2: '#0a1016',
      accent: '#8fd8e8', fog: '#0f2028', dustColor: '#8fa8b8',
      enemies: ['wisp', 'wisp', 'charger', 'brute', 'grub'],
      elite: ['brute', 'wisp'],
      boss: 'custodian',
      bossName: 'CUSTODIO DE SAL',
      desc: 'Un mar que se olvidó de ser agua.',
    },
    {
      id: 'omnitopia',
      name: 'OMNITOPIA',
      short: 'OMNITOPIA',
      music: 'omnitopia',
      sky: ['#160d22', '#0a0612'],
      floor: '#2a1f36', floor2: '#1e1628', wall: '#251a32', wall2: '#120b1c',
      accent: '#c8a0ff', fog: '#1a1028', dustColor: '#8a7aa8',
      enemies: ['brute', 'wisp', 'spitter', 'charger', 'grub'],
      elite: ['brute', 'charger'],
      boss: 'alchemist',
      bossName: 'EL ALQUIMISTA HUECO',
      desc: 'La máquina que soñó con ser jardín.',
    },
  ];

  function makeFloorPattern(biome, seed) {
    const rng = E.rng(seed);
    const S = 128;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const x = c.getContext('2d');
    x.fillStyle = biome.floor;
    x.fillRect(0, 0, S, S);

    // manchas grandes
    for (let i = 0; i < 26; i++) {
      const px = rng() * S, py = rng() * S;
      const rr = 8 + rng() * 30;
      x.fillStyle = rng() > 0.45
        ? E.alpha(biome.floor2, 0.18 + rng() * 0.16)
        : E.alpha('#ffffff', 0.015 + rng() * 0.025);
      x.beginPath();
      x.ellipse(px, py, rr, rr * (0.5 + rng() * 0.5), rng() * Math.PI, 0, Math.PI * 2);
      x.fill();
    }

    if (biome.id === 'jungla') {
      // losas de tierra húmeda
      const tile = 32;
      for (let ty = 0; ty < S; ty += tile) {
        for (let tx = 0; tx < S; tx += tile) {
          const ox = Math.floor(rng() * 3);
          const oy = Math.floor(rng() * 3);
          x.strokeStyle = E.alpha('#0a0c08', 0.22);
          x.lineWidth = 1;
          x.strokeRect(tx + 0.5 + ox - 1, ty + 0.5 + oy - 1, tile - 2, tile - 2);
          x.strokeStyle = E.alpha('#6a7a4a', 0.05);
          x.strokeRect(tx + 1.5 + ox, ty + 1.5 + oy, tile - 3, tile - 2);
          if (rng() > 0.55) {
            x.fillStyle = E.alpha('#3e5a2e', 0.16);
            x.beginPath();
            x.ellipse(tx + rng() * tile, ty + rng() * tile, 2 + rng() * 6, 1 + rng() * 3, rng() * 3, 0, Math.PI * 2);
            x.fill();
          }
        }
      }
      // raíces y hojarasca
      for (let i = 0; i < 7; i++) {
        let px = rng() * S, py = rng() * S;
        x.strokeStyle = E.alpha('#191209', 0.5);
        x.lineWidth = 0.8 + rng() * 1.4;
        x.beginPath();
        x.moveTo(px, py);
        for (let k = 0; k < 4; k++) {
          px += (rng() - 0.5) * 26; py += (rng() - 0.5) * 20;
          x.quadraticCurveTo(px + 4, py - 4, px, py);
        }
        x.stroke();
      }
      for (let i = 0; i < 20; i++) {
        x.fillStyle = E.alpha(rng() > 0.5 ? '#5a6a30' : '#6a4a2a', 0.28 + rng() * 0.2);
        x.fillRect(rng() * S, rng() * S, 1 + rng() * 2.2, 1);
      }
    } else if (biome.id === 'cavernas') {
      // losas de sal, juntas irregulares
      const tile = 40;
      for (let ty = 0; ty < S; ty += tile) {
        for (let tx = 0; tx < S; tx += tile) {
          x.strokeStyle = E.alpha('#0a141a', 0.3);
          x.lineWidth = 1;
          x.strokeRect(tx + 0.5, ty + 0.5, tile - 1, tile - 1);
          x.strokeStyle = E.alpha('#cfe8f0', 0.05);
          x.beginPath();
          x.moveTo(tx + 2, ty + 2); x.lineTo(tx + tile * 0.4, ty + 2);
          x.stroke();
        }
      }
      for (let i = 0; i < 12; i++) {
        const px = rng() * S, py = rng() * S;
        x.strokeStyle = E.alpha('#8fd8e8', 0.14 + rng() * 0.1);
        x.lineWidth = 0.8;
        x.beginPath();
        x.moveTo(px, py);
        x.lineTo(px + (rng() - 0.5) * 22, py + (rng() - 0.5) * 16);
        x.lineTo(px + (rng() - 0.5) * 30, py + (rng() - 0.5) * 24);
        x.stroke();
      }
      for (let i = 0; i < 16; i++) {
        x.fillStyle = E.alpha('#e8fbff', 0.16 + rng() * 0.2);
        x.fillRect(rng() * S, rng() * S, 1, 1);
      }
    } else {
      // placas de metal y circuitos
      const tile = 32;
      for (let ty = 0; ty < S; ty += tile) {
        for (let tx = 0; tx < S; tx += tile) {
          x.strokeStyle = E.alpha('#0a0612', 0.4);
          x.strokeRect(tx + 0.5, ty + 0.5, tile - 1, tile - 1);
          x.strokeStyle = E.alpha('#c8a0ff', 0.06);
          x.beginPath();
          x.moveTo(tx + 2, ty + tile - 2);
          x.lineTo(tx + tile - 2, ty + 2);
          x.stroke();
          if (rng() > 0.72) {
            x.fillStyle = E.alpha('#a98bff', 0.15);
            x.fillRect(tx + 12, ty + 12, 8, 2);
            x.fillRect(tx + 18, ty + 12, 2, 8);
          }
        }
      }
    }

    // grano fino
    for (let i = 0; i < 260; i++) {
      const px = Math.floor(rng() * S), py = Math.floor(rng() * S);
      x.fillStyle = rng() > 0.5 ? E.alpha('#000000', 0.14) : E.alpha('#ffffff', 0.05);
      x.fillRect(px, py, 1 + Math.floor(rng() * 2), 1);
    }
    return c;
  }

  class Room {
    constructor(biomeId, kind, seed, depth) {
      this.biomeId = biomeId;
      this.biome = BIOMES.find((b) => b.id === biomeId) || BIOMES[0];
      this.kind = kind || 'combat';
      this.seed = seed || 1;
      this.depth = depth || 0;
      const rng = E.rng(this.seed * 7919 + 13);
      this.rng = rng;
      if (this.kind === 'boss') { this.w = 560; this.h = 318; }
      else if (this.kind === 'rest') { this.w = 480; this.h = 270; }
      else { this.w = 500; this.h = 282; }
      this.x = 0; this.y = 0;
      this.obstacles = [];
      this.decor = [];
      this.pattern = null;
      this.patternCanvas = makeFloorPattern(this.biome, this.seed);
      this.spawns = [];
      this.dustColor = this.biome.dustColor;
      this.motes = [];
      this.build(rng);
      this.time = 0;
      this.doorHint = 0;
    }

    get bounds() { return { x: 14, y: 26, w: this.w - 28, h: this.h - 46 }; }

    build(rng) {
      const b = this.biome;
      const W = this.w, H = this.h;
      const cx = W / 2, cy = H / 2;

      // pilares / obstáculos
      const nObs = this.kind === 'boss' ? 4 : this.kind === 'rest' ? 0 : 2 + Math.floor(rng() * 2);
      const tries = [];
      for (let i = 0; i < nObs; i++) {
        let ok = false, ox = 0, oy = 0, rr = 0;
        for (let k = 0; k < 30 && !ok; k++) {
          rr = 7 + rng() * 5;
          ox = 60 + rng() * (W - 120);
          oy = 60 + rng() * (H - 120);
          ok = E.dist(ox, oy, cx, cy) > 74;
          if (ok) for (const t of tries) if (E.dist(ox, oy, t.x, t.y) < 70) ok = false;
        }
        if (ok) {
          tries.push({ x: ox, y: oy, r: rr });
          this.obstacles.push({ x: ox, y: oy, r: rr, h: 22 + rng() * 18, kind: b.id === 'omnitopia' ? 'pylon' : b.id === 'cavernas' ? 'crystal' : 'tree' });
        }
      }

      // decorado de fondo
      const nd = 14;
      for (let i = 0; i < nd; i++) {
        this.decor.push({
          x: rng() * (W + 80) - 40,
          y: 8 + rng() * 30,
          s: 0.7 + rng() * 1.1,
          k: rng(),
          type: b.id === 'jungla' ? 'fern' : b.id === 'cavernas' ? 'stalactite' : 'pylon',
        });
      }
      // motas
      for (let i = 0; i < 26; i++) {
        this.motes.push({
          x: rng() * W, y: 30 + rng() * (H - 40),
          sp: 0.3 + rng() * 1.2, ph: rng() * 6.28, r: 0.6 + rng() * 1.3,
        });
      }

      // manchas y grietas del suelo
      this.decals = [];
      const decalN = 20;
      for (let i = 0; i < decalN; i++) {
        this.decals.push({
          x: 24 + rng() * (W - 48),
          y: 42 + rng() * (H - 66),
          r: 4 + rng() * 16,
          k: rng(),
          kind: rng() > 0.45 ? 'patch' : 'crack',
        });
      }
      // maleza en el borde inferior
      this.fore = [];
      for (let i = 0; i < 22; i++) {
        this.fore.push({ x: rng() * W, k: rng(), s: 0.5 + rng() * 1.3 });
      }

      // puntos de aparición
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        this.spawns.push({
          x: cx + Math.cos(a) * (W * 0.36),
          y: cy + Math.sin(a) * (H * 0.34),
        });
      }
    }

    update(dt) { this.time += dt; }

    isInside(x, y, pad) {
      pad = pad || 0;
      const b = this.bounds;
      return x > b.x + pad && x < b.x + b.w - pad && y > b.y + pad && y < b.y + b.h - pad;
    }

    canStand(x, y) {
      if (!this.isInside(x, y, 6)) return false;
      for (const o of this.obstacles) if (E.dist(x, y, o.x, o.y) < o.r + 6) return false;
      return true;
    }

    collide(e, dt) {
      const b = this.bounds;
      const pad = (e.r || 6) * 0.8;
      if (e.x < b.x + pad) { e.x = b.x + pad; if (e.vx < 0) e.vx *= -0.25; }
      if (e.x > b.x + b.w - pad) { e.x = b.x + b.w - pad; if (e.vx > 0) e.vx *= -0.25; }
      if (e.y < b.y + pad) { e.y = b.y + pad; if (e.vy < 0) e.vy *= -0.25; }
      if (e.y > b.y + b.h - pad) { e.y = b.y + b.h - pad; if (e.vy > 0) e.vy *= -0.25; }
      for (const o of this.obstacles) {
        const d = E.dist(e.x, e.y, o.x, o.y);
        const min = o.r + (e.r || 6) * 0.7;
        if (d < min && d > 0.001) {
          const nx = (e.x - o.x) / d, ny = (e.y - o.y) / d;
          e.x = o.x + nx * min;
          e.y = o.y + ny * min;
          const dot = e.vx * nx + e.vy * ny;
          if (dot < 0) { e.vx -= nx * dot * 1.4; e.vy -= ny * dot * 1.4; }
        }
      }
    }

    drawBackground(ctx, cam, time) {
      const b = this.biome;
      const W = Gfx.W, H = Gfx.H;
      // cielo
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, b.sky[0]);
      g.addColorStop(1, b.sky[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const px = (cam.x - this.w / 2) * 0.22;
      const py = (cam.y - this.h / 2) * 0.12;

      // capa lejana
      ctx.save();
      ctx.translate(-px, -py);
      if (b.id === 'jungla') {
        for (let i = 0; i < 9; i++) {
          const x = i * 70 + ((i * 37) % 23) - 30;
          const hh = 70 + ((i * 53) % 46);
          ctx.fillStyle = E.alpha('#0e1a16', 0.85);
          ctx.beginPath();
          ctx.moveTo(x - 34, 200);
          ctx.quadraticCurveTo(x, 200 - hh, x + 34, 200);
          ctx.fill();
          ctx.fillStyle = E.alpha('#132219', 0.9);
          ctx.fillRect(x - 2, 150, 4, 50);
        }
      } else if (b.id === 'cavernas') {
        for (let i = 0; i < 12; i++) {
          const x = i * 56 - 20;
          const hh = 60 + ((i * 41) % 70);
          ctx.fillStyle = E.alpha('#101c26', 0.9);
          ctx.beginPath();
          ctx.moveTo(x - 26, 200);
          ctx.lineTo(x, 200 - hh);
          ctx.lineTo(x + 26, 200);
          ctx.fill();
        }
      } else {
        for (let i = 0; i < 10; i++) {
          const x = i * 62 - 20;
          const hh = 60 + ((i * 71) % 80);
          ctx.fillStyle = E.alpha('#1a1028', 0.9);
          ctx.fillRect(x - 14, 200 - hh, 28, hh + 40);
          ctx.fillStyle = E.alpha('#c8a0ff', 0.10);
          ctx.fillRect(x - 2, 200 - hh, 2, hh);
        }
      }
      ctx.restore();

      // Siluetas monumentales y luz direccional: el fondo gana escala sin
      // competir con las criaturas ni con la lectura del combate.
      ctx.save();
      ctx.translate(-px * 0.55, -py * 0.45);
      if (b.id === 'jungla') {
        // Raíces de árboles colosales y una corona de hojas contra la bruma.
        for (let i = 0; i < 7; i++) {
          const x = i * 104 - 35;
          const sway = Math.sin(time * 0.35 + i * 2) * 2;
          ctx.fillStyle = i % 2 ? 'rgba(8,17,13,.82)' : 'rgba(12,24,17,.72)';
          ctx.beginPath();
          ctx.moveTo(x - 9, 184); ctx.lineTo(x - 7, 72); ctx.lineTo(x - 19, 42);
          ctx.lineTo(x - 3, 57); ctx.lineTo(x + sway, 17 + (i % 3) * 9);
          ctx.lineTo(x + 9, 61); ctx.lineTo(x + 23, 37); ctx.lineTo(x + 15, 77);
          ctx.lineTo(x + 17, 184); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(77,112,55,.2)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x + 2, 84); ctx.lineTo(x + 1, 176); ctx.stroke();
          for (let j = 0; j < 3; j++) {
            const ly = 46 + j * 25 + (i % 2) * 8;
            ctx.fillStyle = 'rgba(57,91,43,.2)';
            ctx.beginPath(); ctx.ellipse(x + (j % 2 ? 13 : -12), ly, 15, 3, j ? -.45 : .45, 0, Math.PI * 2); ctx.fill();
          }
        }
        const beam = ctx.createLinearGradient(200, 25, 260, 190);
        beam.addColorStop(0, 'rgba(208,226,142,.12)'); beam.addColorStop(1, 'rgba(208,226,142,0)');
        ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(182, 22); ctx.lineTo(222, 22); ctx.lineTo(300, 190); ctx.lineTo(134, 190); ctx.fill();
      } else if (b.id === 'cavernas') {
        // Estalactitas facetadas y un arco de sal iluminado desde una grieta.
        ctx.fillStyle = 'rgba(5,12,18,.9)';
        for (let i = 0; i < 18; i++) {
          const x = i * 32 - 12, len = 18 + ((i * 37) % 48);
          ctx.beginPath(); ctx.moveTo(x - 8, 0); ctx.lineTo(x + 9, 0); ctx.lineTo(x + 2, len * .55); ctx.lineTo(x, len); ctx.lineTo(x - 4, len * .62); ctx.closePath(); ctx.fill();
        }
        ctx.strokeStyle = 'rgba(100,156,176,.16)'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(240, 176, 94, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
        ctx.strokeStyle = 'rgba(194,234,239,.13)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(240, 176, 88, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
        for (let i = 0; i < 9; i++) {
          const x = 18 + i * 57, y = 78 + (i * 29) % 65;
          ctx.fillStyle = 'rgba(129,214,231,.13)';
          ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x, y - 10 - (i % 3) * 4); ctx.lineTo(x + 4, y); ctx.fill();
          Gfx.glow(x, y - 7, 12, b.accent, .08);
        }
      } else {
        // Arcos de una maquinaria imposible, con un núcleo violeta suspendido.
        ctx.strokeStyle = 'rgba(113,71,154,.2)'; ctx.lineWidth = 12;
        ctx.beginPath(); ctx.arc(240, 190, 102, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
        ctx.strokeStyle = 'rgba(211,166,255,.22)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(240, 190, 95, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const x = i * 68 - 18, h = 38 + (i * 31) % 72;
          ctx.fillStyle = 'rgba(17,10,28,.88)';
          ctx.beginPath(); ctx.moveTo(x, 194); ctx.lineTo(x + 5, 194 - h); ctx.lineTo(x + 17, 194 - h - 12); ctx.lineTo(x + 30, 194 - h); ctx.lineTo(x + 34, 194); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(197,134,255,.16)'; ctx.fillRect(x + 16, 194 - h + 8, 2, h - 16);
        }
        Gfx.glow(240, 117, 74, '#a767e8', .13 + Math.sin(time * 1.5) * .025);
        Gfx.ring(240, 117, 27 + Math.sin(time * 1.2) * 2, '#d6b4ff', .16, 1);
      }
      ctx.restore();

      // niebla baja
      const fog = ctx.createLinearGradient(0, H * .45, 0, H);
      fog.addColorStop(0, E.alpha(b.fog, .04));
      fog.addColorStop(.45, E.alpha(b.fog, .28));
      fog.addColorStop(1, E.alpha(b.fog, .58));
      ctx.fillStyle = fog;
      ctx.fillRect(0, H * 0.45, W, H * 0.55);
      const horizon = ctx.createLinearGradient(0, 0, W, 0);
      horizon.addColorStop(0, E.alpha('#05050a', .5)); horizon.addColorStop(.24, E.alpha(b.accent, .035));
      horizon.addColorStop(.76, E.alpha(b.accent, .035)); horizon.addColorStop(1, E.alpha('#05050a', .5));
      ctx.fillStyle = horizon; ctx.fillRect(0, 145, W, 42);
    }

    drawFloor(ctx, time) {
      const b = this.biome;
      if (!this.pattern) {
        this.pattern = ctx.createPattern(this.patternCanvas, 'repeat');
      }
      const r = { x: 16, y: 34, w: this.w - 32, h: this.h - 52 };

      // suelo
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      ctx.fillStyle = this.pattern;
      ctx.fillRect(r.x, r.y, r.w, r.h);

      // Sello antiguo en el corazón de cada sala. El grabado queda muy tenue
      // para conservar el contraste de telegráficos y proyectiles.
      const sealX = r.x + r.w / 2, sealY = r.y + r.h * .52;
      ctx.save();
      ctx.translate(sealX, sealY);
      ctx.strokeStyle = E.alpha(b.accent, b.id === 'omnitopia' ? .105 : .075);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, 73, 31, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 63, 25, 0, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        const x1 = Math.cos(a) * 65, y1 = Math.sin(a) * 26;
        const x2 = Math.cos(a) * (i % 3 ? 69 : 75), y2 = Math.sin(a) * (i % 3 ? 28 : 33);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      ctx.restore();

      // luz ambiental central
      const cx = r.x + r.w / 2, cy = r.y + r.h * 0.55;
      const lg = ctx.createRadialGradient(cx, cy, 30, cx, cy, Math.max(r.w, r.h) * 0.62);
      lg.addColorStop(0, E.alpha(b.accent, 0.045));
      lg.addColorStop(0.55, 'rgba(0,0,0,0)');
      lg.addColorStop(1, 'rgba(0,0,0,0.42)');
      ctx.fillStyle = lg;
      ctx.fillRect(r.x, r.y, r.w, r.h);

      // manchas, raíces y grietas
      for (const d of this.decals) {
        if (d.kind === 'patch') {
          ctx.fillStyle = E.alpha(b.id === 'omnitopia' ? '#c8a0ff' : b.id === 'cavernas' ? '#8fd8e8' : '#1a160e', 0.08 + d.k * 0.08);
          ctx.beginPath();
          ctx.ellipse(d.x, d.y, d.r, d.r * 0.55, d.k * 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = E.alpha(b.id === 'omnitopia' ? '#a98bff' : '#0c0a06', 0.18 + d.k * 0.18);
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          const a = d.k * 6;
          ctx.moveTo(d.x - Math.cos(a) * d.r, d.y - Math.sin(a) * d.r * 0.5);
          ctx.lineTo(d.x, d.y);
          ctx.lineTo(d.x + Math.cos(a + 1.4) * d.r * 0.8, d.y + Math.sin(a + 1.4) * d.r * 0.4);
          ctx.stroke();
        }
      }
      // sombra del borde superior sobre el suelo
      const eg = ctx.createLinearGradient(0, r.y, 0, r.y + 22);
      eg.addColorStop(0, 'rgba(0,0,0,0.5)');
      eg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eg;
      ctx.fillRect(r.x, r.y, r.w, 22);
      ctx.restore();

      // borde de pared
      ctx.fillStyle = b.wall2;
      ctx.fillRect(r.x - 10, r.y - 14, r.w + 20, 14);
      ctx.fillRect(r.x - 10, r.y - 14, 10, r.h + 20);
      ctx.fillRect(r.x + r.w, r.y - 14, 10, r.h + 20);
      // sillares
      ctx.fillStyle = E.alpha(b.wall, 0.85);
      ctx.fillRect(r.x - 6, r.y - 10, r.w + 12, 8);
      for (let x = r.x - 6; x < r.x + r.w + 6; x += 26) {
        Gfx.rect(x, r.y - 11, 1, 10, E.alpha('#000', 0.35));
        Gfx.rect(x + 1, r.y - 10, 1, 8, E.alpha(b.accent, 0.05));
      }
      for (let y = r.y - 12; y < r.y + r.h + 6; y += 22) {
        Gfx.rect(r.x - 10, y, 10, 1, E.alpha('#000', 0.35));
        Gfx.rect(r.x + r.w, y, 10, 1, E.alpha('#000', 0.35));
      }
      Gfx.rect(r.x - 6, r.y - 3, r.w + 12, 2, E.alpha(b.accent, 0.35));
      Gfx.rect(r.x - 6, r.y + r.h - 2, r.w + 12, 2, E.alpha('#000', 0.4));

      // Apliques rituales: proyectan luz sobre la piedra y dan profundidad
      // vertical a las salas sin cubrir el campo de combate.
      const lampXs = [r.x + 34, r.x + r.w * .5, r.x + r.w - 34];
      const lampColor = b.id === 'jungla' ? '#e4b96c' : b.id === 'cavernas' ? '#8fe6ef' : '#d69bff';
      for (let i = 0; i < lampXs.length; i++) {
        const lx = lampXs[i], ly = r.y - 3;
        const flicker = .84 + Math.sin(time * 7 + i * 2.1) * .12;
        Gfx.glow(lx, ly + 8, 27, lampColor, .12 * flicker);
        Gfx.rect(lx - 5, ly - 2, 10, 3, b.wall2);
        Gfx.rect(lx - 3, ly + 1, 6, 5, E.shade(b.wall, .12));
        Gfx.poly([[lx - 3, ly + 4], [lx, ly - 2 - flicker * 3], [lx + 3, ly + 4]], lampColor);
        Gfx.circ(lx, ly + 3, 1.1, '#fff1ce');
        Gfx.rect(lx - 7, ly + 6, 14, 1, E.alpha('#050408', .5));
      }

      // Relieves en piedra, calibrados al color del lugar.
      for (let i = 0; i < 7; i++) {
        const rx = r.x + 20 + i * (r.w - 40) / 6;
        const ry = r.y - 9;
        ctx.strokeStyle = E.alpha(b.accent, .12); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(rx - 4, ry); ctx.lineTo(rx, ry - 3); ctx.lineTo(rx + 4, ry); ctx.lineTo(rx, ry + 2); ctx.closePath(); ctx.stroke();
        Gfx.rect(rx - .5, ry - .5, 1, 1, E.alpha(b.accent, .24));
      }

      // enredaderas / cables colgando de la pared superior
      for (let i = 0; i < 12; i++) {
        const vx = r.x + 12 + (i * 83) % Math.max(20, r.w - 24);
        const len = 5 + ((i * 29) % 18);
        const sway = Math.sin(time * 0.5 + i) * 1.2;
        if (b.id === 'jungla') {
          ctx.strokeStyle = E.alpha('#2e4a26', 0.85);
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(vx, r.y - 10);
          ctx.quadraticCurveTo(vx + sway, r.y - 2, vx + sway * 2, r.y + len);
          ctx.stroke();
          ctx.fillStyle = E.alpha('#4a7a34', 0.5);
          ctx.fillRect(vx + sway * 2 - 1, r.y + len, 2, 2);
        } else if (b.id === 'cavernas') {
          ctx.fillStyle = E.alpha('#cfe8f0', 0.12);
          ctx.beginPath();
          ctx.moveTo(vx - 1.5, r.y - 10);
          ctx.lineTo(vx + 1.5, r.y - 10);
          ctx.lineTo(vx, r.y + len * 0.8);
          ctx.fill();
        } else {
          ctx.strokeStyle = E.alpha('#a98bff', 0.15);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(vx, r.y - 10);
          ctx.lineTo(vx + sway, r.y + len);
          ctx.stroke();
        }
      }

      // esquinas
      for (const [cx2, cy2] of [[r.x - 10, r.y - 14], [r.x + r.w, r.y - 14], [r.x - 10, r.y + r.h], [r.x + r.w, r.y + r.h]]) {
        Gfx.rect(cx2 - 2, cy2 - 2, 12, 12, b.wall2);
        Gfx.rect(cx2 - 2, cy2 - 2, 12, 1, E.alpha(b.accent, 0.18));
      }

      // vegetación / escombros en el borde inferior
      for (const f of this.fore) {
        const fx = r.x + f.x % r.w;
        const fy = r.y + r.h - 2;
        if (b.id === 'jungla') {
          ctx.strokeStyle = E.alpha('#1a2a18', 0.9);
          ctx.lineWidth = 1.2 * f.s;
          for (let k = -1; k <= 1; k++) {
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.quadraticCurveTo(fx + k * 3 * f.s, fy - 5 * f.s, fx + k * 6 * f.s + Math.sin(time * 0.8 + f.k * 8), fy - 8 * f.s);
            ctx.stroke();
          }
        } else if (b.id === 'cavernas') {
          ctx.fillStyle = E.alpha('#8fd8e8', 0.12);
          ctx.beginPath();
          ctx.moveTo(fx - 3 * f.s, fy);
          ctx.lineTo(fx, fy - 5 * f.s);
          ctx.lineTo(fx + 3 * f.s, fy);
          ctx.fill();
        } else {
          Gfx.rect(fx - 2, fy - 2, 4, 2, E.alpha('#a98bff', 0.2));
        }
      }
    }

    drawDecorBack(ctx, time) {
      const b = this.biome;
      const r = { x: 16, y: 34, w: this.w - 32, h: this.h - 52 };
      // maleza / raíces que invaden el borde del suelo
      ctx.save();
      for (const d of this.decor) {
        const edge = d.k % 4;
        let bx, by, ang;
        if (edge === 0) { bx = r.x + d.k * r.w; by = r.y; ang = -Math.PI / 2; }
        else if (edge === 1) { bx = r.x + d.k * r.w; by = r.y + r.h; ang = Math.PI / 2; }
        else if (edge === 2) { bx = r.x; by = r.y + d.k * r.h; ang = Math.PI; }
        else { bx = r.x + r.w; by = r.y + d.k * r.h; ang = 0; }
        const sway = Math.sin(time * 0.6 + d.k * 9) * 1.4;
        if (b.id === 'jungla') {
          ctx.strokeStyle = E.alpha('#1a2a1c', 0.85);
          ctx.lineWidth = 1.5 * d.s;
          for (let i = -2; i <= 2; i++) {
            const a = ang + i * 0.22 + sway * 0.02;
            const len = (10 + Math.abs(i) * 4) * d.s;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.quadraticCurveTo(bx + Math.cos(a) * len * 0.6, by + Math.sin(a) * len * 0.6,
              bx + Math.cos(a + i * 0.3) * len, by + Math.sin(a + i * 0.3) * len);
            ctx.stroke();
          }
          ctx.fillStyle = E.alpha('#1d3324', 0.55);
          ctx.beginPath();
          ctx.ellipse(bx + Math.cos(ang) * 6, by + Math.sin(ang) * 6, 7 * d.s, 3.4 * d.s, ang, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.id === 'cavernas') {
          ctx.fillStyle = E.alpha('#16262f', 0.75);
          ctx.beginPath();
          const a = ang;
          ctx.moveTo(bx - Math.cos(a + Math.PI / 2) * 8 * d.s, by - Math.sin(a + Math.PI / 2) * 8 * d.s);
          ctx.lineTo(bx + Math.cos(a) * (16 + d.k * 10) * d.s, by + Math.sin(a) * (16 + d.k * 10) * d.s);
          ctx.lineTo(bx + Math.cos(a + Math.PI / 2) * 8 * d.s, by + Math.sin(a + Math.PI / 2) * 8 * d.s);
          ctx.fill();
        } else {
          ctx.strokeStyle = E.alpha('#c8a0ff', 0.10);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(ang) * (18 + d.k * 16), by + Math.sin(ang) * (18 + d.k * 16));
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    drawObstacles(ctx, time, list) {
      const b = this.biome;
      const items = list || this.obstacles.slice().sort((a, c) => a.y - c.y);
      for (const o of items) {
        const top = o.y - o.h;
        Gfx.shadow(o.x, o.y + 2, o.r + 4, 0.45);
        if (o.kind === 'tree') {
          // raíces
          ctx.strokeStyle = '#1a110b';
          ctx.lineWidth = 2;
          for (let i = -1; i <= 1; i += 2) {
            ctx.beginPath();
            ctx.moveTo(o.x + i * 2, o.y - 2);
            ctx.quadraticCurveTo(o.x + i * (o.r * 0.9), o.y + 1, o.x + i * (o.r + 5), o.y + 3);
            ctx.stroke();
          }
          // tronco retorcido
          ctx.fillStyle = '#3a2a1a';
          ctx.beginPath();
          ctx.moveTo(o.x - 2.2, o.y);
          ctx.quadraticCurveTo(o.x - 3.6, top + o.h * 0.4, o.x - 2.4, top);
          ctx.lineTo(o.x + 2.4, top);
          ctx.quadraticCurveTo(o.x + 3.4, top + o.h * 0.45, o.x + 2.2, o.y);
          ctx.closePath();
          ctx.fill();
          Gfx.rect(o.x - 2, top, 1.6, o.h, E.alpha('#000', 0.3));
          Gfx.rect(o.x + 1.4, top, 1, o.h, E.alpha('#7a5a36', 0.4));
          for (let i = 0; i < 4; i++) {
            const yy = top + 4 + i * (o.h / 5);
            Gfx.rect(o.x - 2, yy, 3, 1, E.alpha('#120c08', 0.45));
          }
          // copa por capas
          const sway = Math.sin(time * 0.7 + o.x * 0.1) * 1.5;
          Gfx.circ(o.x - 4 + sway * 0.4, top - 3, o.r + 3, '#122417');
          Gfx.circ(o.x + 4 + sway * 0.6, top - 2, o.r + 1, '#16301c');
          Gfx.circ(o.x + sway, top - 7, o.r + 4, '#1b3a21');
          Gfx.circ(o.x - 3 + sway, top - 10, o.r * 0.72, '#27512c');
          Gfx.circ(o.x + 3 + sway, top - 12, o.r * 0.5, E.alpha('#3f7a3a', 0.65));
          // hojas iluminadas y vetas para separar copa y tronco del fondo.
          for (let i = 0; i < 4; i++) {
            const lx = o.x + sway + (i - 1.5) * o.r * .62;
            const ly = top - 7 - (i % 2) * 5;
            ctx.fillStyle = E.alpha(i % 2 ? '#93bb55' : '#68964a', .22);
            ctx.beginPath(); ctx.ellipse(lx, ly, 3.8, 1.2, -.55, 0, Math.PI * 2); ctx.fill();
          }
          Gfx.circ(o.x - 1 + sway, top - 14, o.r * 0.3, E.alpha(b.accent, 0.22));
          // hojas sueltas
          for (let i = 0; i < 5; i++) {
            const a = time * 0.3 + i * 1.7;
            Gfx.rect(o.x + Math.cos(a) * (o.r + 3), top - 4 + Math.sin(a * 1.3) * 8, 1.2, 1.2, E.alpha('#4a7a34', 0.4));
          }
        } else if (o.kind === 'crystal') {
          // base de sales
          Gfx.circ(o.x, o.y + 1, o.r + 4, '#122029');
          Gfx.circ(o.x, o.y, o.r + 1, '#1b2f3a');
          // cristales
          const shards = [
            { dx: -o.r * 0.55, hh: o.h * 0.7, w: 3.4 },
            { dx: o.r * 0.5, hh: o.h * 0.55, w: 2.8 },
            { dx: 0, hh: o.h * 1.05, w: 4.2 },
          ];
          for (const s of shards) {
            const bx = o.x + s.dx;
            const ty = o.y - s.hh;
            ctx.fillStyle = '#1d3644';
            ctx.beginPath();
            ctx.moveTo(bx - s.w, o.y - 1);
            ctx.lineTo(bx - s.w * 0.6, ty + 5);
            ctx.lineTo(bx, ty);
            ctx.lineTo(bx + s.w * 0.7, ty + 6);
            ctx.lineTo(bx + s.w, o.y - 1);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = E.alpha(b.accent, 0.32);
            ctx.beginPath();
            ctx.moveTo(bx - s.w * 0.2, o.y - 2);
            ctx.lineTo(bx - s.w * 0.1, ty + 6);
            ctx.lineTo(bx + s.w * 0.5, ty + 10);
            ctx.lineTo(bx + s.w * 0.5, o.y - 2);
            ctx.closePath();
            ctx.fill();
            Gfx.rect(bx - 0.4, ty + 4, 1, s.hh - 6, E.alpha('#ffffff', 0.18));
            ctx.fillStyle = E.alpha('#f2ffff', .22);
            ctx.beginPath(); ctx.moveTo(bx, ty); ctx.lineTo(bx + s.w * .7, ty + 6); ctx.lineTo(bx + s.w * .12, ty + 8); ctx.closePath(); ctx.fill();
          }
          Gfx.ring(o.x, o.y - o.h * .35, o.r * .52, b.accent, .18 + Math.sin(time * 2 + o.y) * .05, 1);
          Gfx.glow(o.x, top + 4, 20, b.accent, 0.2 + Math.sin(time * 2 + o.x) * 0.05);
          Gfx.circ(o.x + Math.sin(time * 1.4 + o.y) * 2, top + 2, 1, E.alpha('#e8fbff', 0.7));
        } else {
          // pilar de la máquina
          Gfx.rect(o.x - o.r * 0.9, top, o.r * 1.8, o.h + 3, '#1a1226');
          Gfx.rect(o.x - o.r * 0.6, top + 2, o.r * 1.2, o.h - 2, '#241a34');
          for (let y = top + 5; y < o.y; y += 9) {
            Gfx.rect(o.x - o.r * 0.7, y, o.r * 1.4, 2, '#120c1c');
          }
          const pulse = 0.25 + Math.sin(time * 3 + o.x * 0.2) * 0.12;
          Gfx.rect(o.x - 1, top + 4, 2, o.h - 8, E.alpha(b.accent, pulse + 0.25));
          Gfx.glow(o.x, top + o.h * 0.45, 16, b.accent, pulse);
          Gfx.rect(o.x - o.r * 0.9, top, o.r * 1.8, 2, E.alpha(b.accent, 0.35));
          ctx.strokeStyle = E.alpha(b.accent, 0.12 + pulse * 0.2);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(o.x - o.r, top + 8);
          ctx.lineTo(o.x + o.r, top + 10);
          ctx.lineTo(o.x + o.r * 0.6, top + 18);
          ctx.stroke();
        }
      }
    }

    drawMotes(ctx, time) {
      const b = this.biome;
      for (let i = 0; i < this.motes.length; i++) {
        const m = this.motes[i];
        const y = m.y + Math.sin(time * m.sp + m.ph) * 6;
        const x = m.x + Math.cos(time * m.sp * 0.7 + m.ph) * 4;
        const pulse = 0.32 + Math.sin(time * 2 + m.ph) * 0.2;
        if (i % 4 === 0) Gfx.glow(x, y, 5 + m.r * 2, b.accent, 0.065 + pulse * .035);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.translate(x, y); ctx.rotate(time * (i % 2 ? .35 : -.24) + m.ph);
        ctx.fillStyle = '#e6d9b5';
        ctx.fillRect(-m.r * .55, -m.r * .55, m.r * 1.1, m.r * 1.1);
        ctx.fillStyle = b.accent;
        ctx.fillRect(-m.r * .22, -m.r * 1.8, m.r * .44, m.r * 3.6);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }

  const World = {
    BIOMES,
    Room,
    build(biomeId, kind, seed, depth) { return new Room(biomeId, kind, seed, depth); },
    biome(id) { return BIOMES.find((b) => b.id === id) || BIOMES[0]; },
  };

  window.World = World;
})();
