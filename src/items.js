// ============================================================
//  Equipo: armas y armaduras con rareza, generadas al azar
//  Dropean de enemigos (y de cofres) y se equipan en el inventario.
// ============================================================
(function () {
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  const RARITIES = [
    { id: 'comun', name: 'Común', color: '#a8b8c4', mul: 1.0, w: 56 },
    { id: 'raro', name: 'Raro', color: '#6fd8e8', mul: 1.45, w: 27 },
    { id: 'epico', name: 'Épico', color: '#c88fff', mul: 2.0, w: 13 },
    { id: 'legendario', name: 'Legendario', color: '#ffb347', mul: 2.7, w: 4 },
  ];

  const WEAPON_TYPES = [
    { id: 'espada', name: 'Espada', dmg: [0.10, 0.20], crit: [0.02, 0.05] },
    { id: 'daga', name: 'Daga', dmg: [0.06, 0.12], crit: [0.06, 0.13] },
    { id: 'hacha', name: 'Hacha', dmg: [0.16, 0.28], crit: [0.0, 0.02] },
    { id: 'lanza', name: 'Lanza', dmg: [0.12, 0.22], crit: [0.02, 0.06] },
  ];

  const ARMOR_TYPES = [
    { id: 'coraza', name: 'Coraza', def: [0.08, 0.15], hp: [8, 18], speed: 0 },
    { id: 'tunica', name: 'Túnica', def: [0.04, 0.08], hp: [14, 28], speed: 0 },
    { id: 'capa', name: 'Capa', def: [0.03, 0.06], hp: [4, 10], speed: [0.04, 0.09] },
    { id: 'egida', name: 'Égida', def: [0.13, 0.22], hp: [6, 14], speed: [-0.05, -0.02] },
  ];

  const NAMES = {
    comun: ['de Hierro', 'del Viajero', 'de Pedernal', 'Humilde', 'de Retoño'],
    raro: ['Voraz', 'Templada', 'Ágil', 'del Zorro', 'Cerniente'],
    epico: ['del Eclipse', 'de Ceniza', 'Rúnica', 'Astral', 'del Abismo'],
    legendario: ['del Descenso', 'Eterna', 'del Alba Dorada', 'Milenaria'],
  };

  const Items = {
    rarities: RARITIES,

    pickWeighted(list) {
      let total = 0;
      for (const r of list) total += r.w;
      let v = Math.random() * total;
      for (const r of list) {
        v -= r.w;
        if (v <= 0) return r;
      }
      return list[list.length - 1];
    },

    // Genera una pieza de equipo; `depth` (0-11) escala las stats.
    roll(depth) {
      depth = depth || 0;
      const kind = Math.random() < 0.5 ? 'weapon' : 'armor';
      const rar = this.pickWeighted(RARITIES);
      const types = kind === 'weapon' ? WEAPON_TYPES : ARMOR_TYPES;
      const t = types[(Math.random() * types.length) | 0];
      const s = rar.mul * (1 + depth * 0.05);
      const r1 = (range) => (range[0] + Math.random() * (range[1] - range[0])) * s;
      const adjs = NAMES[rar.id];
      const it = {
        kind,
        type: t.id,
        name: t.name + ' ' + adjs[(Math.random() * adjs.length) | 0],
        rarity: rar.id,
        color: rar.color,
      };
      if (kind === 'weapon') {
        it.dmg = clamp(r1(t.dmg), 0, 1.3);
        it.crit = clamp(r1(t.crit), 0, 0.3);
      } else {
        it.def = clamp(r1(t.def), 0, 0.4);
        it.hp = Math.round(clamp(r1(t.hp), 0, 60));
        it.speed = t.speed ? clamp(r1(t.speed), -0.12, 0.12) : 0;
      }
      return it;
    },

    statText(it) {
      if (!it) return '';
      if (it.kind === 'weapon') {
        let s = '+' + Math.round(it.dmg * 100) + '% daño';
        if (it.crit) s += ' · +' + Math.round(it.crit * 100) + '% crít';
        return s;
      }
      let s = Math.round(it.def * 100) + '% defensa';
      if (it.hp) s += ' · +' + it.hp + ' vida';
      if (it.speed) s += ' · ' + (it.speed > 0 ? '+' : '') + Math.round(it.speed * 100) + '% vel.';
      return s;
    },
  };

  window.Items = Items;
})();
