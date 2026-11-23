// ============================================================
// Arte original del juego: sprites vectoriales pre-renderizados y escenarios
// ============================================================
(function () {
  const TAU = Math.PI * 2;
  const SCALE = 3;
  const SPRITES = Object.create(null);
  const BACKDROPS = Object.create(null);
  const FLOORS = Object.create(null);
  const ARENAS = new WeakMap();

  const PALETTE = {
    jungla: { sky0: '#17232a', sky1: '#33463c', floor: '#38443a', stone: '#4c5344', light: '#d5ae6c', accent: '#91c477', ink: '#0c1115' },
    cavernas: { sky0: '#101d32', sky1: '#273d52', floor: '#344650', stone: '#526477', light: '#b8e3e6', accent: '#76cddd', ink: '#08111b' },
    omnitopia: { sky0: '#211530', sky1: '#3c2850', floor: '#3c3049', stone: '#5d4668', light: '#e6c17c', accent: '#d29dff', ink: '#100b19' },
  };

  function sprite(w, h, paint) {
    const c = document.createElement('canvas');
    c.width = w * SCALE; c.height = h * SCALE;
    const x = c.getContext('2d');
    x.scale(SCALE, SCALE);
    x.lineJoin = 'round'; x.lineCap = 'round';
    paint(x, w, h);
    return c;
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

  function path(ctx, points, fill, stroke, width) {
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 1; ctx.stroke(); }
  }

  function ellipse(ctx, x, y, rx, ry, fill, stroke, width) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 1; ctx.stroke(); }
  }

  function getHeroFrame(frame) {
    const key = 'hero' + frame;
    if (SPRITES[key]) return SPRITES[key];
    return SPRITES[key] = sprite(48, 60, (c) => {
      const steps = [0, 3, 1, -3, -1];
      const step = steps[frame] || 0;
      // Capa corta de viaje, con borde bordado.
      c.fillStyle = '#10121b';
      c.beginPath(); c.moveTo(17, 20); c.quadraticCurveTo(8, 28, 11, 39 + step);
      c.lineTo(8, 50 + step); c.quadraticCurveTo(19, 55, 34, 50 - step);
      c.lineTo(31, 25); c.closePath(); c.fill();
      c.fillStyle = linear(c, 11, 20, 34, 51, ['#70405c', '#442940', '#1d1b2a']);
      c.beginPath(); c.moveTo(17, 20); c.quadraticCurveTo(10, 29, 14, 39 + step);
      c.lineTo(11, 49 + step); c.quadraticCurveTo(20, 52, 31, 48 - step);
      c.lineTo(29, 25); c.closePath(); c.fill();
      c.strokeStyle = '#d38a68'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(14, 42 + step); c.quadraticCurveTo(21, 47, 31, 44 - step); c.stroke();
      // Piernas, grebas y botas.
      path(c, [[18, 39], [25, 40], [24 + step * 2, 50], [21 + step * 2, 54], [16, 53], [17, 47]], '#211d29', '#0c0d15', 1.2);
      path(c, [[26, 39], [32, 39], [34 - step * 2, 49], [32 - step * 2, 54], [26, 53], [25, 46]], '#302431', '#0c0d15', 1.2);
      path(c, [[14 + step, 51], [22 + step, 51], [24 + step, 55], [13 + step, 56], [11 + step, 54]], '#604436', '#17131a', .9);
      path(c, [[26 - step, 51], [33 - step, 51], [38 - step, 55], [25 - step, 56]], '#6a4939', '#17131a', .9);
      c.strokeStyle = '#d5a36a'; c.lineWidth = .75;
      c.beginPath(); c.moveTo(13 + step, 54); c.lineTo(21 + step, 54); c.moveTo(27 - step, 54); c.lineTo(35 - step, 54); c.stroke();
      // Chaqueta de cuero y jubón verde petróleo.
      path(c, [[16, 22], [21, 19], [30, 20], [34, 27], [32, 41], [25, 44], [16, 40], [14, 29]], '#17151f', '#090b11', 1.5);
      path(c, [[17, 23], [21, 21], [29, 22], [32, 28], [30, 39], [24, 41], [17, 38], [16, 29]], linear(c, 17, 22, 31, 42, ['#6c9a83', '#326960', '#193c46']), '#a6b08b', .6);
      path(c, [[18, 27], [24, 29], [21, 39], [17, 37]], '#234b4d');
      path(c, [[27, 24], [31, 29], [29, 36], [25, 30]], '#87ad91');
      // Banda de cuero diagonal, hebilla y bolsita de viaje.
      c.strokeStyle = '#432b2a'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(17, 25); c.lineTo(30, 38); c.stroke();
      c.strokeStyle = '#d1a96b'; c.lineWidth = .8; c.beginPath(); c.moveTo(17, 25); c.lineTo(30, 38); c.stroke();
      path(c, [[17, 34], [22, 35], [22, 40], [16, 39]], '#80523a', '#211720', .8);
      c.fillStyle = '#d5b577'; c.fillRect(20, 34, 2, 2);
      // Capa de hombro con chapa tallada.
      path(c, [[15, 22], [20, 20], [23, 24], [21, 31], [16, 29], [13, 25]], '#2b2c39', '#11111a', 1.3);
      path(c, [[15, 23], [19, 21], [21, 24], [19, 28], [15, 27]], linear(c, 14, 22, 21, 29, ['#ead6a5', '#a77b5b', '#52394a']), '#f1d38e', .7);
      c.strokeStyle = '#f4dba6'; c.lineWidth = .65; c.beginPath(); c.moveTo(16, 24); c.lineTo(19, 26); c.lineTo(17, 27); c.stroke();
      // Brazos animados: el libre contrapesa la zancada y el del arma prepara
      // la muñeca antes del barrido.
      path(c, [[18, 24], [22, 25], [21 + step * .35, 30], [18 + step * .55, 32], [15 + step * .5, 29]], linear(c, 16, 24, 22, 32, ['#82a78e', '#34665f', '#1e3a43']), '#17131e', 1);
      path(c, [[15 + step * .5, 28], [18 + step * .55, 30], [17 + step * .55, 33], [14 + step * .5, 31]], '#c89b73', '#47313a', .65);
      path(c, [[27, 22], [30, 22], [34, 26 + step * .2], [32, 29 + step * .2], [28, 27]], linear(c, 28, 21, 34, 29, ['#88aa93', '#456a64', '#252c39']), '#17131e', .9);
      path(c, [[31, 26 + step * .2], [35, 27 + step * .2], [35, 29 + step * .2], [32, 29 + step * .2]], '#c79571', '#4b3038', .6);
      // Cuello alto y bufanda.
      path(c, [[17, 22], [18, 18], [28, 18], [31, 22], [27, 26], [20, 25]], '#c27859', '#321d28', .8);
      path(c, [[19, 20], [28, 20], [27, 24], [21, 24]], '#e0b26f');
      // Rostro de perfil, sombra y cicatriz luminosa.
      ellipse(c, 26, 14, 7.2, 8.4, '#16131d', '#090a10', 1.3);
      ellipse(c, 27, 13, 5.8, 6.8, linear(c, 22, 9, 32, 19, ['#fff0ca', '#e9b18c', '#9d5e68']));
      path(c, [[30, 13], [36, 14.7], [30, 17.2]], '#dfa07b');
      // Gran ojo anime: iris ámbar facetado, dos brillos y pestañas marcadas.
      ellipse(c, 30.5, 11.8, 1.65, 2.25, '#34213a', '#281928', .65);
      ellipse(c, 30.55, 12.1, 1.12, 1.65, radial(c, 30, 11.7, 1.8, ['#fff4b6', '#ffc46d', '#d87552', '#543557']));
      ellipse(c, 30.7, 12.2, .48, .95, '#392344');
      ellipse(c, 30.12, 11.15, .52, .62, '#fff9e6');
      ellipse(c, 31.2, 12.8, .25, .3, '#fff5df');
      c.strokeStyle = '#351e2d'; c.lineWidth = .8; c.beginPath(); c.moveTo(28.5, 10.1); c.quadraticCurveTo(30.8, 8.6, 32.1, 10.3); c.stroke();
      c.strokeStyle = '#653847'; c.lineWidth = .55; c.beginPath(); c.moveTo(29, 15.7); c.lineTo(31, 15.1); c.stroke();
      c.strokeStyle = 'rgba(203,101,115,.52)'; c.lineWidth = .45; c.beginPath(); c.moveTo(27, 16.3); c.lineTo(29, 16.8); c.moveTo(27.5, 17.1); c.lineTo(29.2, 17.3); c.stroke();
      // Cabello oscuro, mechones y broche de cobre.
      path(c, [[20, 14], [17, 9], [20, 4], [27, 2], [34, 6], [37, 12], [34, 15], [32, 10], [29, 12], [25, 9]], linear(c, 19, 3, 34, 15, ['#a98591', '#513748', '#211a29']), '#0c0c13', 1.2);
      path(c, [[22, 6], [25, 2], [27, 9], [25, 14], [21, 12]], '#694354');
      path(c, [[28, 4], [33, 6], [37, 12], [33, 11], [30, 13]], '#302333');
      path(c, [[22, 11], [25, 8], [27, 13], [25, 17], [22, 14]], '#563647');
      path(c, [[33, 12], [37, 12], [35, 19], [32, 21]], '#382737');
      ellipse(c, 22, 8, 1.7, 1.7, '#d7a360', '#704348', .7);
      c.fillStyle = '#fff1cf'; c.fillRect(21.6, 7.3, .7, .7);
      // Mano con brazal y hueco para la hoja.
      path(c, [[30, 26], [34, 27], [35, 32], [32, 34], [29, 31]], '#d49b78', '#4b2c36', .8);
      path(c, [[29, 24], [33, 25], [34, 28], [30, 28]], '#c9b17c', '#51433d', .65);
    });
  }

  function getDogFrame(frame) {
    const key = 'dog' + frame;
    if (SPRITES[key]) return SPRITES[key];
    return SPRITES[key] = sprite(44, 34, (c) => {
      const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
      // Cola curva, cuerpo de perro cobrizo y patas articuladas.
      c.strokeStyle = '#422a24'; c.lineWidth = 3; c.beginPath(); c.moveTo(9, 20); c.quadraticCurveTo(2, 18 + step, 5, 10 + step); c.stroke();
      c.strokeStyle = linear(c, 3, 10, 9, 20, ['#f1bd77', '#8d4e36']); c.lineWidth = 1.7; c.beginPath(); c.moveTo(9, 20); c.quadraticCurveTo(2, 18 + step, 5, 10 + step); c.stroke();
      for (let i = 0; i < 4; i++) {
        const x = 15 + (i % 2) * 11, y = i < 2 ? 22 : 24;
        c.strokeStyle = '#332229'; c.lineWidth = 3.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (i % 2 ? 1 : -1) + step * (i % 2 ? -1 : 1), 30); c.stroke();
        c.strokeStyle = i < 2 ? '#bf7950' : '#e0a164'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (i % 2 ? 1 : -1) + step * (i % 2 ? -1 : 1), 29); c.stroke();
        ellipse(c, x + (i % 2 ? 1 : -1) + step * (i % 2 ? -1 : 1), 30, 2, 1.2, '#281a20');
      }
      ellipse(c, 22, 20, 14, 8, '#241a1c', '#0e0c12', 1.2);
      ellipse(c, 23, 18, 13, 7, linear(c, 14, 12, 27, 26, ['#f0bd72', '#b36b45', '#693c35']));
      // Pelaje del lomo, pecho y marcas crema.
      path(c, [[12, 17], [16, 11], [21, 15], [19, 18], [15, 20]], '#704039');
      path(c, [[21, 20], [29, 18], [32, 21], [28, 25], [21, 24]], '#e5b77b');
      c.strokeStyle = '#f4d093'; c.lineWidth = .7; c.beginPath(); c.moveTo(17, 16); c.quadraticCurveTo(23, 13, 28, 17); c.stroke();
      // Cabeza, orejas caídas y hocico.
      ellipse(c, 32, 14, 7, 6, '#2a1a1d', '#0c0b12', 1.1);
      ellipse(c, 32, 13, 6, 5, linear(c, 27, 8, 36, 18, ['#f3c37b', '#c57a4f', '#78433a']));
      path(c, [[28, 10], [25, 3], [31, 8], [31, 12]], '#603536', '#281b22', .7);
      path(c, [[34, 9], [39, 4], [37, 12], [34, 13]], '#704039', '#281b22', .7);
      ellipse(c, 37, 15, 3.6, 2.6, '#e8b37a');
      ellipse(c, 39.5, 14.4, 1.15, .95, '#22151a');
      ellipse(c, 34, 11.8, 1.15, 1.35, '#fff0c6'); ellipse(c, 34.4, 12, .45, .8, '#27202a');
      // Collar rojo de cuero con medallón de cobre.
      c.strokeStyle = '#542a32'; c.lineWidth = 3.1; c.beginPath(); c.moveTo(28, 18); c.quadraticCurveTo(32, 21, 35, 18); c.stroke();
      c.strokeStyle = '#df7155'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(28, 18); c.quadraticCurveTo(32, 21, 35, 18); c.stroke();
      ellipse(c, 32, 21, 1.7, 1.8, '#f0c178', '#704137', .6);
      c.fillStyle = '#fff1c5'; c.fillRect(31.7, 20.4, .5, .7);
      // Bigotes, cejas y motas del pelaje.
      c.strokeStyle = '#f1d09e'; c.lineWidth = .45; c.beginPath(); c.moveTo(38, 16); c.lineTo(42, 15); c.moveTo(38, 17); c.lineTo(42, 18); c.stroke();
      ellipse(c, 18, 16, .55, .45, '#f8d396'); ellipse(c, 24, 14.5, .45, .4, '#f8d396');
    });
  }

  function getFoeSprite(type) {
    const key = 'foe_' + type;
    if (SPRITES[key]) return SPRITES[key];
    return SPRITES[key] = sprite(48, 48, (c) => {
      if (type === 'grub') {
        const shell = ['#b2b967', '#718a48', '#3b573b'];
        for (let i = 0; i < 4; i++) {
          const x = 11 + i * 7.2, y = 31 - Math.sin(i * 1.4) * 1.8, r = 6.5 - i * .45;
          ellipse(c, x, y + 2, r + .6, r, '#17141b', '#080b10', 1);
          ellipse(c, x, y, r, r - .5, radial(c, x - 1, y - 2, r + 2, [shell[0], shell[1], shell[2]]), '#344235', .7);
          c.strokeStyle = '#d3d47a'; c.lineWidth = .7; c.beginPath(); c.arc(x, y, r - 1.2, 3.3, 5.2); c.stroke();
          ellipse(c, x - 1.8, y - 2.1, .8, .55, '#fff3bd');
        }
        for (let i = 0; i < 5; i++) {
          const x = 12 + i * 5;
          path(c, [[x, 25], [x + 1, 19 - (i % 2) * 2], [x + 3, 25]], '#d0cb7a', '#354037', .5);
        }
        ellipse(c, 38, 28, 7, 6, radial(c, 36, 26, 8, ['#c4c56b', '#71854a', '#364834']), '#12151b', 1.2);
        ellipse(c, 40, 26, 1.15, 1.3, '#ffe19b'); ellipse(c, 40.4, 26.2, .45, .9, '#252029');
        c.strokeStyle = '#eee0b2'; c.lineWidth = 1; c.beginPath(); c.moveTo(42, 31); c.lineTo(46, 28); c.moveTo(42, 32); c.lineTo(46, 35); c.stroke();
      } else if (type === 'wisp') {
        c.save(); c.globalAlpha = .72;
        path(c, [[24, 9], [31, 13], [36, 21], [31, 29], [34, 37], [27, 32], [23, 42], [20, 33], [12, 38], [17, 28], [12, 20], [18, 13]], radial(c, 23, 24, 20, ['#f6ffff', '#9ae6ec', '#4b91a7', '#312c57']), '#c5faff', 1.2);
        c.restore();
        for (let i = 0; i < 3; i++) {
          c.strokeStyle = ['#c4fbef', '#9fe5ff', '#c39cff'][i]; c.lineWidth = 1.1;
          c.beginPath(); c.moveTo(19 + i * 4, 28); c.bezierCurveTo(9 + i * 5, 35, 17 + i * 4, 39, 11 + i * 4, 45); c.stroke();
        }
        ellipse(c, 22, 21, 7.5, 8, radial(c, 20, 18, 9, ['#ffffff', '#b9f4f4', '#6cb9d0', '#365073']), '#d5ffff', .9);
        ellipse(c, 20, 18, 2.1, 2.4, '#fff');
        ellipse(c, 22, 22, 1.3, 1.8, '#172038'); ellipse(c, 27, 22, 1.3, 1.8, '#172038');
        c.strokeStyle = '#e9ffff'; c.lineWidth = .8; c.beginPath(); c.arc(24, 24, 14, 4.1, 5.5); c.stroke();
      } else if (type === 'charger') {
        // Bestia acorazada de seis patas, placas y cuernos de obsidiana.
        for (let i = 0; i < 3; i++) {
          const x = 12 + i * 8;
          c.strokeStyle = '#33202a'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x, 30); c.lineTo(x - 2, 41); c.lineTo(x + 1, 44); c.stroke();
          c.strokeStyle = '#c17c65'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, 30); c.lineTo(x - 2, 40); c.stroke();
          c.strokeStyle = '#33202a'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x + 3, 30); c.lineTo(x + 5, 41); c.lineTo(x + 3, 44); c.stroke();
        }
        ellipse(c, 23, 29, 15, 8, '#19141d', '#08090f', 1.5);
        ellipse(c, 22, 27, 14, 7, linear(c, 12, 19, 29, 36, ['#f09a70', '#a64f4d', '#522c3b']), '#291c29', 1);
        for (let i = 0; i < 4; i++) path(c, [[12 + i * 7, 24], [14 + i * 7, 16 - (i % 2) * 2], [18 + i * 6, 25]], '#352536', '#b76b61', .8);
        ellipse(c, 35, 26, 7.5, 6, radial(c, 34, 23, 8, ['#f1bd91', '#c2765d', '#623448']), '#241822', 1.2);
        path(c, [[31, 23], [27, 14], [34, 21]], '#e0c49c', '#3b2931', .8);
        path(c, [[37, 23], [41, 14], [39, 25]], '#e0c49c', '#3b2931', .8);
        ellipse(c, 38, 25, 1, 1.2, '#ffe59a');
      } else if (type === 'brute') {
        // Guardián bestial en placas de piedra y cuero.
        path(c, [[12, 43], [13, 31], [15, 22], [19, 16], [28, 15], [34, 21], [36, 34], [39, 43], [31, 45], [27, 40], [21, 45]], '#241a22', '#080a12', 1.7);
        path(c, [[15, 41], [17, 29], [18, 22], [22, 18], [29, 18], [33, 23], [34, 38], [29, 41], [26, 36], [21, 42]], linear(c, 18, 17, 33, 42, ['#c5b477', '#75835e', '#343a39']), '#414a3a', 1);
        path(c, [[16, 23], [9, 19], [6, 25], [12, 31], [18, 29]], '#8c795b', '#201b25', 1.2);
        path(c, [[31, 22], [38, 18], [42, 24], [35, 31], [31, 29]], '#967e5d', '#201b25', 1.2);
        path(c, [[17, 22], [9, 11], [19, 17]], '#e3d5b3', '#493947', 1);
        path(c, [[31, 21], [39, 10], [36, 23]], '#e3d5b3', '#493947', 1);
        path(c, [[17, 31], [25, 25], [33, 31], [30, 39], [20, 39]], '#4a594b', '#cab078', 1);
        ellipse(c, 28, 26, 1.25, 1.2, '#ff8f53'); ellipse(c, 29, 26, .4, .7, '#fff6d1');
        path(c, [[18, 37], [22, 33], [23, 40]], '#d6bd82', '#59443e', .7);
        c.strokeStyle = '#d3bb82'; c.lineWidth = .8; c.beginPath(); c.moveTo(14, 32); c.lineTo(20, 35); c.moveTo(33, 32); c.lineTo(29, 35); c.stroke();
      } else {
        // Hongo de las criptas: cuerpo nacarado y corona de esporas.
        ellipse(c, 24, 34, 10, 8, linear(c, 17, 28, 30, 41, ['#ffe7db', '#d58c98', '#805168']), '#271c2b', 1.3);
        path(c, [[12, 25], [14, 17], [19, 13], [24, 15], [30, 11], [36, 17], [38, 24], [31, 29], [17, 29]], linear(c, 14, 13, 30, 30, ['#ffe5c9', '#e594a0', '#8c5474']), '#382339', 1.3);
        for (let i = 0; i < 5; i++) ellipse(c, 17 + i * 4, 20 - Math.abs(2 - i) * 2, 1.2, 1.4, '#fff1de');
        ellipse(c, 21, 31, 1.1, 1.3, '#2a1c29'); ellipse(c, 27, 31, 1.1, 1.3, '#2a1c29');
        c.strokeStyle = '#f8c7b3'; c.lineWidth = .7; c.beginPath(); c.arc(24, 33, 3.8, .2, 2.5); c.stroke();
      }
      // Marcas de rango para los élites, compartidas por todos los diseños.
      c.strokeStyle = '#f0ca77'; c.lineWidth = .8;
      c.beginPath(); c.moveTo(24, 4); c.lineTo(27, 9); c.lineTo(24, 14); c.lineTo(21, 9); c.closePath(); c.stroke();
    });
  }

  function getBossSprite(id) {
    const key = 'boss_' + id;
    if (SPRITES[key]) return SPRITES[key];
    return SPRITES[key] = sprite(60, 76, (c) => {
      // Capa/silueta común de jefe.
      path(c, [[17, 24], [22, 16], [38, 16], [45, 25], [48, 61], [39, 67], [31, 61], [22, 68], [13, 61]], '#17151f', '#070910', 2);
      if (id === 'guardian') {
        // Titán de raíces con corona de ramas y placas de corteza.
        path(c, [[20, 26], [25, 19], [36, 19], [42, 28], [41, 58], [31, 64], [19, 57]], linear(c, 20, 20, 42, 62, ['#b7b577', '#66784f', '#273f3b']), '#c6a971', 1.3);
        for (let i = 0; i < 4; i++) {
          c.strokeStyle = '#5d432e'; c.lineWidth = 2.2;
          c.beginPath(); c.moveTo(30 + (i % 2) * 3, 24); c.bezierCurveTo(24 + i * 2, 15, 18 + i * 7, 9, 12 + i * 10, 3 + (i % 2) * 4); c.stroke();
          c.fillStyle = i % 2 ? '#839d59' : '#a1ad66';
          c.beginPath(); c.ellipse(13 + i * 10, 5 + (i % 2) * 4, 4, 1.5, -.5, 0, TAU); c.fill();
        }
        path(c, [[20, 31], [13, 24], [19, 22], [25, 29]], '#8b6c4c', '#30262a', 1);
        path(c, [[38, 29], [45, 22], [48, 26], [41, 34]], '#8b6c4c', '#30262a', 1);
        path(c, [[23, 36], [31, 29], [40, 37], [38, 49], [23, 49]], '#475d46', '#c39c65', 1.3);
        ellipse(c, 35, 35, 2, 2.5, '#e9a35a'); ellipse(c, 35.5, 35, .55, 1, '#fff1c9');
        c.strokeStyle = '#d6bd7b'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(26, 46); c.lineTo(32, 41); c.lineTo(37, 46); c.stroke();
        path(c, [[15, 44], [7, 48], [15, 52]], '#596b4d', '#171820', 1.5);
        path(c, [[44, 44], [52, 48], [44, 53]], '#596b4d', '#171820', 1.5);
      } else if (id === 'custodian') {
        // Gólem de sal facetado con placas cristalinas y corazón azul.
        path(c, [[20, 25], [24, 18], [37, 18], [42, 25], [43, 56], [36, 63], [30, 58], [23, 64], [17, 57]], linear(c, 20, 18, 43, 62, ['#e7f4e8', '#79a7b7', '#2c4b67']), '#d3f2ed', 1.4);
        path(c, [[24, 20], [29, 8], [34, 21]], '#b6e6e7', '#e7ffff', 1);
        path(c, [[34, 20], [42, 10], [40, 28]], '#91cbdc', '#e7ffff', 1);
        path(c, [[18, 29], [8, 22], [12, 39], [21, 43]], '#638ca2', '#c7eff0', 1.3);
        path(c, [[41, 29], [51, 20], [46, 41], [40, 44]], '#83b7c8', '#d7f7f1', 1.3);
        path(c, [[23, 30], [31, 24], [39, 31], [37, 43], [24, 43]], '#456f8c', '#d4f2e7', 1);
        ellipse(c, 33, 34, 4.3, 5.4, radial(c, 32, 32, 6, ['#ffffff', '#9df8ff', '#43a7d4', '#233c77']), '#dafcff', 1);
        c.strokeStyle = '#e5ffff'; c.lineWidth = 1; c.beginPath(); c.moveTo(27, 49); c.lineTo(35, 44); c.lineTo(39, 52); c.stroke();
        for (let i = 0; i < 3; i++) path(c, [[14 + i * 2, 42 + i * 4], [10 + i * 2, 48 + i * 4], [16 + i * 2, 46 + i * 4]], '#9bcbd5', '#efffff', .55);
      } else {
        // Alquimista hueco: máscara de porcelana, túnica en capas y corona.
        path(c, [[21, 25], [18, 18], [24, 15], [37, 15], [43, 22], [47, 61], [36, 67], [30, 58], [18, 66], [12, 60]], linear(c, 15, 19, 46, 66, ['#9a6cac', '#4c315e', '#211a32']), '#d2a5d2', 1.5);
        path(c, [[21, 28], [25, 23], [37, 23], [40, 33], [37, 58], [30, 63], [21, 57]], '#302438', '#d79d78', 1);
        for (let i = 0; i < 3; i++) {
          c.strokeStyle = i === 1 ? '#d3a0ef' : '#76538e'; c.lineWidth = 1.2;
          c.beginPath(); c.moveTo(20 + i * 5, 32); c.lineTo(17 + i * 5, 57); c.stroke();
        }
        path(c, [[23, 19], [22, 8], [29, 15], [34, 4], [36, 15], [44, 9], [40, 22]], '#382544', '#e1b4dc', 1.2);
        path(c, [[25, 24], [31, 21], [38, 25], [38, 39], [31, 45], [24, 39]], linear(c, 24, 22, 39, 42, ['#f0dfd6', '#b8a0ad', '#695173']), '#f0c5cd', 1);
        ellipse(c, 35, 31, 1.4, 2, '#ff6077'); ellipse(c, 35.5, 30.5, .45, .8, '#fff3dc');
        path(c, [[27, 36], [32, 39], [37, 36]], null, '#60445e', .8);
        c.strokeStyle = '#a4865d'; c.lineWidth = 2; c.beginPath(); c.moveTo(47, 18); c.lineTo(51, 68); c.stroke();
        ellipse(c, 51, 17, 4.5, 4.5, radial(c, 49, 15, 5, ['#fff4d7', '#d79aff', '#70418e']), '#f2d5ff', .9);
        c.beginPath(); c.arc(51, 17, 8, .5, 2.6); c.strokeStyle = '#c492df'; c.lineWidth = .8; c.stroke();
      }
      // Sellos grabados en el peto.
      c.strokeStyle = '#e7cd8e'; c.lineWidth = .8; c.beginPath(); c.arc(31, 49, 4, 0, TAU); c.stroke();
      c.fillStyle = '#fff0c4'; c.fillRect(30.5, 47, 1, 4);
    });
  }

  function backdrop(key) {
    if (BACKDROPS[key]) return BACKDROPS[key];
    const p = PALETTE[key] || PALETTE.jungla;
    const c = document.createElement('canvas'); c.width = 720; c.height = 400;
    const x = c.getContext('2d');
    let sky = x.createLinearGradient(0, 0, 0, 400);
    sky.addColorStop(0, p.sky0); sky.addColorStop(.58, p.sky1); sky.addColorStop(1, p.ink);
    x.fillStyle = sky; x.fillRect(0, 0, 720, 400);
    // Nebula / eclipse with a broad, soft halo.
    const moonX = 360, moonY = 180;
    const halo = x.createRadialGradient(moonX, moonY, 10, moonX, moonY, 170);
    halo.addColorStop(0, key === 'cavernas' ? 'rgba(112,202,223,.28)' : key === 'omnitopia' ? 'rgba(188,112,235,.23)' : 'rgba(216,174,102,.23)');
    halo.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = halo; x.fillRect(180, 0, 360, 360);
    const moon = x.createRadialGradient(350, 160, 2, moonX, moonY, 42);
    moon.addColorStop(0, key === 'cavernas' ? '#d5f7ed' : '#f6d29c'); moon.addColorStop(.72, p.accent); moon.addColorStop(1, 'rgba(40,22,45,0)');
    x.fillStyle = moon; x.beginPath(); x.arc(moonX, moonY, 46, 0, TAU); x.fill();

    if (key === 'jungla') {
      // Siluetas escalonadas, contrafuertes y lianas para el bosque de ruinas.
      for (let i = 0; i < 11; i++) {
        const bx = i * 73 - 25, h = 120 + (i * 47) % 105;
        x.fillStyle = i % 2 ? '#10191c' : '#172329';
        x.beginPath(); x.moveTo(bx - 38, 306); x.lineTo(bx - 19, 306 - h * .48); x.lineTo(bx - 6, 306 - h);
        x.lineTo(bx + 2, 306 - h * .57); x.lineTo(bx + 25, 306 - h * .82); x.lineTo(bx + 43, 306); x.closePath(); x.fill();
        x.fillStyle = 'rgba(91,130,83,.18)'; x.fillRect(bx + 1, 306 - h + 30, 2, h - 40);
        x.strokeStyle = 'rgba(131,165,99,.23)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(bx + 4, 80); x.bezierCurveTo(bx + 16, 130, bx - 3, 180, bx + 10, 250); x.stroke();
      }
      x.fillStyle = '#192723'; x.beginPath(); x.moveTo(0, 310); x.lineTo(100, 260); x.lineTo(200, 290); x.lineTo(310, 245); x.lineTo(440, 298); x.lineTo(570, 254); x.lineTo(720, 300); x.lineTo(720, 400); x.lineTo(0, 400); x.fill();
      for (let i = 0; i < 35; i++) {
        const px = (i * 97 + 23) % 720, py = 75 + (i * 67) % 225;
        x.fillStyle = i % 3 ? 'rgba(199,230,140,.58)' : 'rgba(239,180,106,.54)';
        x.fillRect(px, py, 2, 2);
      }
    } else if (key === 'cavernas') {
      x.fillStyle = '#0d1826'; x.beginPath(); x.moveTo(0, 0); x.lineTo(720, 0); x.lineTo(720, 65);
      for (let i = 10; i >= 0; i--) x.lineTo(i * 72 + 30, 54 + ((i * 43) % 95));
      x.closePath(); x.fill();
      for (let i = 0; i < 14; i++) {
        const bx = i * 58 - 4, h = 40 + (i * 23) % 95;
        path(x, [[bx - 24, 330], [bx - 13, 290], [bx, 306 - h], [bx + 6, 286], [bx + 25, 330]], i % 2 ? '#203649' : '#1a2b3b');
        path(x, [[bx, 306 - h], [bx + 6, 286], [bx + 8, 327]], 'rgba(136,211,221,.28)');
      }
      x.strokeStyle = 'rgba(173,226,228,.3)'; x.lineWidth = 3; x.beginPath(); x.ellipse(360, 246, 150, 82, 0, Math.PI, TAU); x.stroke();
      x.fillStyle = '#152431'; x.beginPath(); x.moveTo(0, 313); x.lineTo(118, 270); x.lineTo(245, 304); x.lineTo(365, 264); x.lineTo(515, 307); x.lineTo(720, 268); x.lineTo(720, 400); x.lineTo(0, 400); x.fill();
    } else {
      for (let i = 0; i < 9; i++) {
        const bx = i * 88 - 12, h = 105 + (i * 37) % 105;
        x.fillStyle = i % 2 ? '#1b1427' : '#241a33';
        x.beginPath(); x.moveTo(bx, 322); x.lineTo(bx + 8, 322 - h); x.lineTo(bx + 25, 322 - h - 20); x.lineTo(bx + 40, 322 - h); x.lineTo(bx + 50, 322); x.closePath(); x.fill();
        x.strokeStyle = 'rgba(212,153,255,.28)'; x.lineWidth = 2; x.beginPath(); x.moveTo(bx + 25, 322 - h); x.lineTo(bx + 25, 320); x.stroke();
      }
      for (let r = 1; r <= 3; r++) {
        x.strokeStyle = `rgba(204,151,255,${.22 / r})`; x.lineWidth = r === 1 ? 4 : 1.2;
        x.beginPath(); x.ellipse(360, 275, 100 + r * 18, 48 + r * 12, 0, Math.PI, TAU); x.stroke();
      }
      x.fillStyle = '#191326'; x.beginPath(); x.moveTo(0, 315); x.lineTo(145, 278); x.lineTo(250, 304); x.lineTo(355, 258); x.lineTo(490, 305); x.lineTo(620, 272); x.lineTo(720, 300); x.lineTo(720, 400); x.lineTo(0, 400); x.fill();
    }
    // Atmospheric foreground haze and a restrained vignette.
    const haze = x.createLinearGradient(0, 240, 0, 390);
    haze.addColorStop(0, 'rgba(8,10,17,0)'); haze.addColorStop(.55, 'rgba(8,10,17,.24)'); haze.addColorStop(1, 'rgba(6,7,12,.72)');
    x.fillStyle = haze; x.fillRect(0, 220, 720, 180);
    BACKDROPS[key] = c;
    return c;
  }

  function floorTile(key) {
    if (FLOORS[key]) return FLOORS[key];
    const p = PALETTE[key] || PALETTE.jungla;
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const x = c.getContext('2d');
    const base = x.createLinearGradient(0, 0, 52, 64);
    base.addColorStop(0, p.floor); base.addColorStop(.55, p.stone); base.addColorStop(1, p.ink);
    x.fillStyle = base; x.fillRect(0, 0, 64, 64);
    if (key === 'jungla') {
      x.strokeStyle = 'rgba(13,18,18,.7)'; x.lineWidth = 1;
      x.strokeRect(2, 2, 28, 27); x.strokeRect(33, 2, 28, 27); x.strokeRect(2, 32, 28, 29); x.strokeRect(33, 32, 28, 29);
      x.strokeStyle = 'rgba(178,190,128,.17)'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(3, 10); x.bezierCurveTo(16, 12, 10, 27, 29, 25); x.moveTo(45, 3); x.bezierCurveTo(42, 19, 56, 24, 60, 31); x.stroke();
      for (let i = 0; i < 12; i++) {
        x.fillStyle = i % 2 ? 'rgba(141,175,106,.33)' : 'rgba(178,124,78,.3)'; x.fillRect((i * 19) % 62, (i * 31) % 62, 1 + i % 2, 1);
      }
    } else if (key === 'cavernas') {
      x.strokeStyle = 'rgba(13,22,33,.72)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(0, 1); x.lineTo(63, 1); x.moveTo(0, 31); x.lineTo(63, 31); x.moveTo(30, 1); x.lineTo(30, 31); x.moveTo(9, 32); x.lineTo(9, 63); x.moveTo(48, 32); x.lineTo(48, 63); x.stroke();
      x.strokeStyle = 'rgba(196,235,236,.44)'; x.lineWidth = .8;
      x.beginPath(); x.moveTo(13, 10); x.lineTo(23, 18); x.lineTo(18, 25); x.moveTo(39, 39); x.lineTo(53, 47); x.lineTo(47, 57); x.stroke();
      x.fillStyle = 'rgba(205,244,239,.26)'; x.fillRect(5, 5, 2, 1); x.fillRect(54, 38, 2, 1);
    } else {
      x.strokeStyle = 'rgba(12,9,21,.75)'; x.lineWidth = 1; x.strokeRect(2, 2, 28, 28); x.strokeRect(34, 2, 28, 28); x.strokeRect(2, 34, 28, 28); x.strokeRect(34, 34, 28, 28);
      x.strokeStyle = 'rgba(207,154,255,.55)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(5, 23); x.lineTo(18, 23); x.lineTo(18, 12); x.lineTo(27, 12); x.moveTo(40, 47); x.lineTo(48, 47); x.lineTo(48, 39); x.lineTo(60, 39); x.stroke();
      x.fillStyle = 'rgba(221,170,255,.55)'; x.fillRect(25, 9, 2, 2); x.fillRect(46, 44, 2, 2);
    }
    x.strokeStyle = 'rgba(238,220,179,.09)'; x.lineWidth = 1; x.strokeRect(.5, .5, 63, 63);
    FLOORS[key] = c; return c;
  }

  function arena(room) {
    if (ARENAS.has(room)) return ARENAS.get(room);
    const c = document.createElement('canvas'); c.width = room.w * 2; c.height = room.h * 2;
    const x = c.getContext('2d'); x.scale(2, 2);
    const b = PALETTE[room.biomeId] || PALETTE.jungla;
    const wall = x.createLinearGradient(0, 8, 0, 48);
    wall.addColorStop(0, b.ink); wall.addColorStop(.6, b.stone); wall.addColorStop(1, '#11131b');
    x.fillStyle = wall; x.fillRect(0, 0, room.w, room.h);
    // Floor cut into large, irregular slabs.
    const f = x.createLinearGradient(15, 35, room.w - 20, room.h - 10);
    f.addColorStop(0, b.floor); f.addColorStop(.55, b.stone); f.addColorStop(1, b.ink);
    x.fillStyle = f; x.fillRect(16, 34, room.w - 32, room.h - 52);
    x.save(); x.beginPath(); x.rect(16, 34, room.w - 32, room.h - 52); x.clip();
    x.fillStyle = x.createPattern(floorTile(room.biomeId), 'repeat'); x.fillRect(16, 34, room.w - 32, room.h - 52);
    // Quiet central engraving: a broken alchemical seal in the stone.
    x.strokeStyle = room.biomeId === 'omnitopia' ? 'rgba(219,174,255,.18)' : room.biomeId === 'cavernas' ? 'rgba(175,225,230,.16)' : 'rgba(220,189,127,.15)';
    x.lineWidth = 1.1; x.beginPath(); x.ellipse(room.w / 2, room.h * .53, 70, 32, 0, 0, TAU); x.stroke();
    x.beginPath(); x.ellipse(room.w / 2, room.h * .53, 62, 26, 0, 0, TAU); x.stroke();
    for (let i = 0; i < 16; i++) {
      const a = i * TAU / 16, cx = room.w / 2, cy = room.h * .53;
      x.beginPath(); x.moveTo(cx + Math.cos(a) * 63, cy + Math.sin(a) * 27); x.lineTo(cx + Math.cos(a) * (i % 4 ? 67 : 74), cy + Math.sin(a) * (i % 4 ? 29 : 34)); x.stroke();
    }
    // Room seed controls chips, hairline cracks and fallen leaves.
    let seed = ((room.seed || 1) * 1664525 + 1013904223) >>> 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 120; i++) {
      const px = 20 + rnd() * (room.w - 40), py = 38 + rnd() * (room.h - 62);
      if (i % 5 === 0) {
        x.strokeStyle = 'rgba(11,12,17,.35)'; x.lineWidth = .6;
        x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - .5) * 8, py + (rnd() - .5) * 5); x.stroke();
      } else {
        x.fillStyle = i % 2 ? 'rgba(234,219,178,.12)' : 'rgba(6,10,13,.22)'; x.fillRect(px, py, .8 + rnd() * 1.2, .7);
      }
    }
    x.restore();
    // Raised border, chipped blocks and inset gold reveal.
    x.fillStyle = '#0b0e15'; x.fillRect(6, 16, room.w - 12, 19); x.fillRect(6, 34, 10, room.h - 46); x.fillRect(room.w - 16, 34, 10, room.h - 46);
    x.fillStyle = b.stone; x.fillRect(12, 22, room.w - 24, 9); x.fillRect(11, 33, 5, room.h - 44); x.fillRect(room.w - 16, 33, 5, room.h - 44);
    x.fillStyle = 'rgba(239,206,143,.28)'; x.fillRect(12, 30, room.w - 24, 1);
    for (let px = 18; px < room.w - 18; px += 28) {
      x.strokeStyle = 'rgba(5,7,12,.45)'; x.lineWidth = 1; x.beginPath(); x.moveTo(px, 22); x.lineTo(px, 31); x.stroke();
      x.fillStyle = 'rgba(236,210,157,.16)'; x.fillRect(px + 2, 24, 8, 1);
    }
    const shade = x.createRadialGradient(room.w / 2, room.h * .57, 24, room.w / 2, room.h * .57, room.w * .66);
    shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,.36)');
    x.fillStyle = shade; x.fillRect(16, 34, room.w - 32, room.h - 52);
    ARENAS.set(room, c); return c;
  }

  const Art = {
    drawBackground(ctx, room, cam, time) {
      const img = backdrop(room.biomeId);
      const dx = -120 - (cam.x - room.w / 2) * .055;
      const dy = -74 - (cam.y - room.h / 2) * .045;
      ctx.drawImage(img, dx, dy, 720, 400);
      // drifting ash and fireflies, tied to the biome.
      const col = room.biomeId === 'cavernas' ? '#b6f1ef' : room.biomeId === 'omnitopia' ? '#d8a7ff' : '#f3c178';
      for (let i = 0; i < 16; i++) {
        const x = (i * 97 + Math.sin(time * .24 + i * 1.7) * 16 + 480) % 480;
        const y = (i * 43 + time * (4 + i % 4) + 270) % 270;
        if (i % 3 === 0) Gfx.glow(x, y, 5, col, .07);
        Gfx.circ(x, y, i % 4 === 0 ? 1.1 : .55, col);
      }
    },

    drawFloor(ctx, room, time) {
      ctx.save(); ctx.imageSmoothingEnabled = true;
      ctx.drawImage(arena(room), 0, 0, room.w, room.h);
      ctx.restore();
      const p = PALETTE[room.biomeId] || PALETTE.jungla;
      const x = 16, y = 34, w = room.w - 32, h = room.h - 52;
      // pools of colored light roll softly across the newly painted stone.
      const sweep = x + w * (.5 + Math.sin(time * .18) * .18);
      Gfx.glow(sweep, y + h * .54, 112, p.accent, .052);
      Gfx.glow(room.w * .5, y + h * .52, 54, p.light, .036);
    },

    drawObstacle(ctx, room, o, time) {
      const p = PALETTE[room.biomeId] || PALETTE.jungla;
      const top = o.y - o.h;
      Gfx.shadow(o.x, o.y + 2, o.r + 6, .48);
      if (o.kind === 'tree') {
        // Old growth stump grown around a ruined shrine.
        ctx.strokeStyle = '#17151a'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.bezierCurveTo(o.x - 5, top + 16, o.x + 3, top + 8, o.x + 1, top); ctx.stroke();
        ctx.strokeStyle = linear(ctx, o.x - 3, top, o.x + 3, o.y, ['#b07c4b', '#684536', '#2a2426']); ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.bezierCurveTo(o.x - 4, top + 16, o.x + 2, top + 8, o.x + 1, top); ctx.stroke();
        for (let i = -1; i <= 1; i += 2) {
          ctx.strokeStyle = '#40302c'; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(o.x, o.y - 1); ctx.quadraticCurveTo(o.x + i * o.r * .7, o.y + 5, o.x + i * (o.r + 4), o.y + 2); ctx.stroke();
        }
        const sway = Math.sin(time * .6 + o.x * .04) * 1.2;
        const leaves = ['#182c27', '#254636', '#376345', '#52764a', '#87935a'];
        for (let i = 0; i < 8; i++) {
          const a = i * 2.399, rr = o.r * (.25 + (i % 3) * .2), cx = o.x + Math.cos(a) * rr + sway, cy = top - 4 + Math.sin(a) * rr * .42;
          ellipse(ctx, cx, cy, o.r * (.42 + (i % 2) * .06), o.r * .29, leaves[i % leaves.length], '#17271f', .7);
          ellipse(ctx, cx - 2, cy - 2, o.r * .2, .9, 'rgba(203,224,142,.34)');
        }
        Gfx.glow(o.x + sway, top - 5, o.r + 4, p.accent, .09);
      } else if (o.kind === 'crystal') {
        ellipse(ctx, o.x, o.y, o.r + 5, 4, '#142434');
        const shards = [-.56, -.15, .24, .58];
        for (let i = 0; i < shards.length; i++) {
          const bx = o.x + shards[i] * o.r, hh = o.h * ([.55, .92, .68, .47][i]), sw = 2.3 + (i % 2) * 1.3, ty = o.y - hh;
          path(ctx, [[bx - sw, o.y], [bx - sw * .65, ty + 6], [bx, ty], [bx + sw * .7, ty + 7], [bx + sw, o.y]], linear(ctx, bx - sw, ty, bx + sw, o.y, ['#e6ffff', '#79cbd7', '#244962']), '#d1f8f2', .7);
          path(ctx, [[bx - .3, o.y - 2], [bx, ty + 2], [bx + sw * .5, ty + 9], [bx + sw * .38, o.y - 2]], 'rgba(245,255,244,.46)');
          ctx.strokeStyle = 'rgba(221,250,240,.56)'; ctx.lineWidth = .65; ctx.beginPath(); ctx.moveTo(bx, ty + 4); ctx.lineTo(bx + sw * .4, o.y - 5); ctx.stroke();
        }
        Gfx.glow(o.x, top + 5, 20, '#7ed6e2', .18 + Math.sin(time * 2 + o.x) * .03);
      } else {
        // Obsidian pylon with a floating lens and engraved concentric glyphs.
        path(ctx, [[o.x - o.r, o.y], [o.x - o.r * .72, top + 7], [o.x, top], [o.x + o.r * .72, top + 7], [o.x + o.r, o.y]], linear(ctx, o.x - o.r, top, o.x + o.r, o.y, ['#30263e', '#79648c', '#211a2d']), '#d4a5ff', .75);
        path(ctx, [[o.x - o.r * .48, o.y - 2], [o.x - o.r * .35, top + 9], [o.x, top + 4], [o.x + o.r * .35, top + 9], [o.x + o.r * .48, o.y - 2]], '#382b48', '#a678ca', .6);
        const pulse = .6 + Math.sin(time * 3 + o.x * .1) * .12;
        Gfx.glow(o.x, top + o.h * .45, 18, '#cf8fff', .3);
        Gfx.ring(o.x, top + o.h * .42, 4 + pulse, '#efd4ff', .8, 1);
        ctx.strokeStyle = 'rgba(238,199,255,.6)'; ctx.lineWidth = .65; ctx.beginPath(); ctx.moveTo(o.x - o.r * .55, top + 13); ctx.lineTo(o.x, top + 18); ctx.lineTo(o.x + o.r * .55, top + 13); ctx.stroke();
      }
    },

    drawHero(ctx, hero, time, alpha) {
      const speed = Math.hypot(hero.vx, hero.vy);
      const walking = speed > 14 && hero.state !== 'dash' && hero.state !== 'dead';
      const gait = hero.walkPhase || hero.animT * 12;
      const stride = Math.sin(gait);
      const frame = walking ? 1 + Math.floor((((gait % TAU) + TAU) % TAU) / (TAU / 4)) : 0;
      let bob = walking ? Math.abs(stride) * 1.8 : Math.sin(time * 2.5) * .55;
      let lean = 0, lunge = 0, bladeOffset = 0, cutting = false, strike = hero.attackIndex || 0;
      if (hero.state === 'attack') {
        const wind = [.055, .05, .09][strike] || .055;
        const active = [.11, .10, .14][strike] || .11;
        const recover = [.13, .15, .20][strike] || .13;
        const u = E.clamp01(hero.t / wind);
        if (hero.t < wind) {
          // Frame one: pull back and coil the shoulders before the cut.
          lean = [-.17, .16, -.21][strike]; lunge = -2.2 * u;
          bladeOffset = [-1.15, 1.25, -1.75][strike] * u;
          bob = 0;
        } else if (hero.t < wind + active) {
          // Distinct trajectories: horizontal draw, returning crosscut, then
          // a wide rising finisher with a full-body follow through.
          const p = E.clamp01((hero.t - wind) / active);
          cutting = true;
          lean = strike === 0 ? .16 : strike === 1 ? -.17 : .22 + .10 * Math.sin(p * Math.PI);
          lunge = (strike === 2 ? 7 : 4.2) * Math.sin(p * Math.PI * .5);
          bladeOffset = strike === 0 ? .55 - p * .12 : strike === 1 ? -.62 + p * .15 : -1.65 + p * 2.7;
          if (strike === 2) bob = -1.8 * Math.sin(p * Math.PI);
        } else {
          const p = E.clamp01((hero.t - wind - active) / recover);
          lean = [ .1, -.1, .2 ][strike] * (1 - p);
          lunge = (strike === 2 ? 7 : 4.2) * (1 - p) * .35;
          bladeOffset = [ .95, -1.1, 1.45 ][strike] * (1 - p);
        }
      } else if (hero.state === 'heavy') {
        const p = E.clamp01(hero.t / .2);
        lean = -.18 * p; lunge = hero.t > .2 ? 3.5 : -1.5 * p;
        bladeOffset = hero.t < .2 ? -1.65 * p : .65;
        cutting = hero.t >= .2 && hero.t < .34;
      } else if (hero.state === 'dash') {
        lean = .32; lunge = 1.2; bob = -1.2;
      }
      if (walking) {
        const forward = E.clamp((hero.vx * (hero.face || 1)) / Math.max(1, speed), -1, 1);
        lean += forward * .13;
        bladeOffset = Math.sin(gait * .5) * .16;
      }
      const plant = walking ? Math.max(0, Math.cos(gait * 2)) : 0;
      const squashX = hero.state === 'dash' ? 1.13 : 1 + plant * .025;
      const squashY = hero.state === 'dash' ? .84 : 1 - plant * .035 + (walking ? 0 : Math.sin(time * 2.5) * .008);
      const img = getHeroFrame(frame), w = 43, h = 54;
      Gfx.shadow(hero.x, hero.y + 1, 8, .38);
      ctx.save();
      ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
      ctx.translate(hero.x + Math.cos(hero.aim) * lunge, hero.y + bob); ctx.scale((hero.face || 1) * squashX, squashY); ctx.rotate(lean);
      if (walking || hero.state === 'dash') {
        const wind = 3 + Math.min(7, speed * .035) + Math.sin(time * 13) * 1.6;
        path(ctx, [[-2, -35], [-8 - wind, -38], [-15 - wind, -34 + Math.sin(time * 17) * 2], [-9, -30]], linear(ctx, -17 - wind, -38, -2, -30, ['#efb17b', '#b36774', '#53334e']), '#322233', .65);
        ctx.strokeStyle = 'rgba(255,226,176,.7)'; ctx.lineWidth = .55;
        ctx.beginPath(); ctx.moveTo(-5, -34); ctx.quadraticCurveTo(-10 - wind, -36, -13 - wind, -34 + Math.sin(time * 17) * 2); ctx.stroke();
      }
      ctx.imageSmoothingEnabled = true; ctx.drawImage(img, -w / 2, -h + 4, w, h);
      // The blade follows aim independently of the body pose.
      const worldAngle = hero.aim + bladeOffset;
      const angle = hero.face < 0 ? Math.PI - worldAngle : worldAngle;
      const hx = 7, hy = -28;
      ctx.translate(hx, hy); ctx.rotate(angle);
      ctx.strokeStyle = '#241c2a'; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(14, 0); ctx.stroke();
      ctx.strokeStyle = '#d3a873'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(3, 0); ctx.stroke();
      path(ctx, [[4, -3], [6, -2], [6, 2], [4, 3]], '#d3ad70', '#49363a', .7);
      const bladeLight = hero.state === 'heavy' ? '#ffd08a' : strike === 2 && hero.state === 'attack' ? '#f3b7ff' : '#9ce7e8';
      path(ctx, [[7, -1.8], [23, -.6], [34, 0], [23, .6], [7, 1.8]], linear(ctx, 7, -2, 34, 1, ['#fff7dc', bladeLight, '#527a8e']), '#f3e5c5', .55);
      ctx.strokeStyle = cutting ? '#fff9e7' : 'rgba(255,255,255,.82)'; ctx.lineWidth = cutting ? .9 : .5; ctx.beginPath(); ctx.moveTo(9, -.7); ctx.lineTo(29, 0); ctx.stroke();
      Gfx.glow(31, 0, cutting ? 8 : 5, bladeLight, cutting ? .56 : .3);
      ctx.restore();
      if (cutting) {
        // Manga speed accents, different shape and color for each combo beat.
        const col = strike === 2 ? '#ffc783' : strike === 1 ? '#f29bdf' : '#96efff';
        const a = hero.aim + (strike === 1 ? -.45 : .22);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = strike === 2 ? .48 : .28;
        for (let i = 0; i < (strike === 2 ? 4 : 2); i++) {
          const ox = hero.x + Math.cos(a) * (14 + i * 4), oy = hero.y - 23 + Math.sin(a) * (14 + i * 4);
          ctx.strokeStyle = i === 0 ? '#fff7dc' : col; ctx.lineWidth = strike === 2 ? 1.4 : .8;
          ctx.beginPath(); ctx.moveTo(ox - Math.sin(a) * 5, oy + Math.cos(a) * 5);
          ctx.lineTo(ox + Math.cos(a) * (strike === 2 ? 13 : 8), oy + Math.sin(a) * (strike === 2 ? 13 : 8)); ctx.stroke();
        }
        ctx.restore();
        Gfx.glow(hero.x + Math.cos(hero.aim) * 18, hero.y - 22 + Math.sin(hero.aim) * 13, strike === 2 ? 21 : 13, col, strike === 2 ? .2 : .12);
      }
      if (hero.showHurt > 0) Gfx.glow(hero.x, hero.y - 29, 16, '#fff2df', hero.showHurt * .35);
    },

    drawDog(ctx, dog, time) {
      const speed = Math.hypot(dog.vx, dog.vy), frame = speed > 10 ? (Math.sin(dog.phase * 2) > 0 ? 1 : 2) : 0;
      const img = getDogFrame(frame), down = dog.state === 'down';
      Gfx.shadow(dog.x, dog.y + 1, 7, down ? .17 : .33);
      ctx.save(); ctx.globalAlpha *= dog.alpha;
      ctx.translate(dog.x, dog.y + (down ? 0 : Math.sin(dog.phase * 2) * .45));
      ctx.scale(dog.face || 1, down ? .72 : 1);
      if (down) ctx.rotate(.1);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(img, -17.5, -28, 35, 27);
      if (dog.hurtFlash > 0) Gfx.glow(1, -20, 14, '#fff0df', dog.hurtFlash * .48);
      ctx.restore();
      if (down) Gfx.text('…', dog.x, dog.y - 21, { size: 1, color: '#cab8a4', align: 'center' });
      else if (dog.state === 'lunge') Gfx.glow(dog.x + dog.lungeDir.x * 9, dog.y - 17, 7, '#e3a65d', .12);
    },

    drawFoe(ctx, foe, time) {
      const img = getFoeSprite(foe.type);
      const scale = (foe.scale || 1) * (foe.state === 'spawn' ? .72 + .28 * E.clamp01(foe.t / foe.spawnT) : 1);
      const bob = foe.type === 'wisp' ? Math.sin(time * 2.7 + foe.x) * 2.5 : Math.sin(foe.animT * 5) * .35;
      const w = foe.type === 'charger' ? 37 : foe.type === 'brute' ? 36 : foe.type === 'wisp' ? 27 : 33;
      const h = foe.type === 'brute' ? 39 : foe.type === 'wisp' ? 36 : 33;
      Gfx.shadow(foe.x, foe.y + 1, (foe.r || 7) + 2, foe.type === 'wisp' ? .12 : .38);
      if (foe.type === 'wisp') Gfx.glow(foe.x, foe.y - 18 + bob, 19 * scale, foe.elite ? '#c19aff' : '#80dfeb', .42);
      ctx.save(); ctx.globalAlpha *= foe.state === 'spawn' ? E.clamp01(foe.t / foe.spawnT) : 1;
      ctx.translate(foe.x, foe.y + bob); ctx.scale((foe.face || 1) * scale, scale);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(img, -w / 2, foe.type === 'grub' ? -h * .82 : -h, w, h);
      if (foe.flash > 0) Gfx.glow(0, -h * .55, w * .65, '#ffffff', foe.flash * .4);
      ctx.restore();
      if (foe.elite) {
        Gfx.ring(foe.x, foe.y - h * scale * .48, 13 * scale, '#f2cb7e', .46 + Math.sin(time * 4) * .1, .8);
        Gfx.glow(foe.x, foe.y - h * scale * .55, 16, '#e0b36f', .1);
      }
      if (foe.telegraph > .15) Gfx.glow(foe.x, foe.y - h * .46, 15 * scale, '#ff695c', .18 * foe.telegraph);
    },

    drawBoss(ctx, boss, time) {
      const img = getBossSprite(boss.id), scale = boss.scale || 1;
      const intro = boss.state === 'spawn' || boss.state === 'intro';
      const alpha = intro ? E.clamp01(boss.t / 1.2) : 1;
      const wobble = Math.sin(time * 1.6) * .65;
      Gfx.shadow(boss.x, boss.y + 2, 19 * scale * .5, .5);
      Gfx.glow(boss.x, boss.y - 35 * scale, boss.phase >= 2 ? 48 : 30, boss.id === 'custodian' ? '#83e2ed' : boss.id === 'alchemist' ? '#ce8bff' : '#e1ad67', .14 + Math.sin(time * 2) * .025);
      ctx.save(); ctx.globalAlpha *= alpha;
      ctx.translate(boss.x, boss.y + wobble); ctx.scale((boss.face || 1) * scale, scale);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(img, -23, -52, 46, 58);
      if (boss.flash > 0) Gfx.glow(0, -33, 25, '#fff5da', boss.flash * .42);
      ctx.restore();
      if (boss.phase >= 2) {
        Gfx.ring(boss.x, boss.y - 27 * scale, 22 * scale + Math.sin(time * 4) * 2, '#ff6959', .48, 1.4);
        Gfx.glow(boss.x, boss.y - 25 * scale, 27 * scale, '#ff553f', .16);
      }
      if (boss.curAttack && boss.telegraph > .45) {
        Gfx.ring(boss.x, boss.y - 10, 30 * scale + boss.telegraph * 14, '#ff7865', .32, 1.4);
      }
    },

    drawProjectile(ctx, p) {
      if (p.shape === 'ring') {
        const k = E.clamp01((p.t || 0) / p.life), rr = (p.maxR || 50) * E.easeOut(k);
        Gfx.glow(p.x, p.y, rr * .65, p.color || '#ffd08a', (1 - k) * .1);
        Gfx.ring(p.x, p.y, rr, p.color || '#ffd08a', (1 - k) * .9, 1.5);
        Gfx.ring(p.x, p.y, rr * .88, '#fff1d0', (1 - k) * .42, .6);
        return;
      }
      const a = Math.atan2(p.vy, p.vx);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
      if (p.shape === 'shard') {
        Gfx.glow(0, 0, p.r * 3.4, p.color, .3);
        path(ctx, [[p.r * 2.5, 0], [p.r * .25, -p.r * .8], [-p.r * 1.5, -p.r * .38], [-p.r * .75, 0], [-p.r * 1.5, p.r * .38], [p.r * .25, p.r * .8]], linear(ctx, -p.r, 0, p.r * 2, 0, ['#fff5db', p.color, '#4d375f']), '#fff1d0', .6);
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(p.r * 1.8, 0); ctx.lineTo(-p.r * .8, 0); ctx.stroke();
      } else {
        Gfx.glow(0, 0, p.r * 3.5, p.color, .34);
        ellipse(ctx, 0, 0, p.r * 1.25, p.r, radial(ctx, -.5, -.5, p.r * 1.5, ['#fff9de', p.color, '#2b2037']), '#fff0c9', .65);
        Gfx.arc(0, 0, p.r * 1.7, .3, 2.4, '#fff4d8', .65, .65);
        ellipse(ctx, -p.r * .28, -p.r * .33, p.r * .3, p.r * .25, 'rgba(255,255,255,.86)');
      }
      ctx.restore();
    },

    drawPickup(ctx, p, time) {
      const bob = Math.sin(time * 3.8 + p.bob) * 1.4, yy = p.y - p.z + bob;
      Gfx.shadow(p.x, p.y, 4, .22);
      const color = p.type === 'essence' ? '#dab3ff' : p.type === 'heal' ? '#e88f76' : ((Alchemy.ING[p.ing] || Alchemy.ING.savia).color || '#93cf89');
      Gfx.glow(p.x, yy, 13, color, .23 + Math.sin(time * 4 + p.bob) * .04);
      Gfx.ring(p.x, yy + 1, 5 + Math.sin(time * 3 + p.bob) * .7, color, .3, .7);
      if (p.type === 'essence') {
        ctx.save(); ctx.translate(p.x, yy); ctx.rotate(Math.PI / 4 + Math.sin(time * 1.8 + p.bob) * .12);
        path(ctx, [[0, -6], [4, -1], [2, 5], [-3, 4], [-5, -1]], linear(ctx, -4, -4, 4, 4, ['#fff6dc', '#dfbaff', '#714eac']), '#f3deff', .75);
        path(ctx, [[0, -3], [2, -1], [0, 3], [-2, 0]], 'rgba(255,255,255,.65)');
        ctx.restore();
      } else if (p.type === 'heal') {
        path(ctx, [[p.x, yy - 5], [p.x + 4, yy - 1], [p.x + 3, yy + 4], [p.x, yy + 6], [p.x - 4, yy + 3], [p.x - 4, yy - 1]], linear(ctx, p.x - 4, yy - 5, p.x + 4, yy + 5, ['#fff1c9', '#ef886f', '#743f56']), '#ffd6a3', .7);
        ctx.strokeStyle = '#fff1c7'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, yy - 2); ctx.lineTo(p.x, yy + 3); ctx.moveTo(p.x - 2, yy); ctx.lineTo(p.x + 2, yy); ctx.stroke();
      } else {
        const item = Alchemy.ING[p.ing] || Alchemy.ING.savia;
        ellipse(ctx, p.x, yy, 5.2, 5.2, '#11151a', color, .75);
        ctx.save(); ctx.translate(p.x, yy); ctx.rotate(Math.sin(time + p.bob) * .25);
        path(ctx, [[-3, 1], [-2, -2], [0, -4], [1, -1], [4, -2], [2, 1], [3, 3], [0, 2], [-2, 4]], linear(ctx, -3, -3, 3, 3, ['#fff2cd', color, E.shade(color, -.48)]), '#e8ddb8', .6);
        ctx.strokeStyle = '#f3e5b9'; ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(-2, 2); ctx.quadraticCurveTo(0, 0, 2, -2); ctx.stroke();
        ctx.restore();
      }
    },

    drawZone(ctx, z, time) {
      const k = E.clamp01(z.life / .5), pulse = .7 + Math.sin(time * 8) * .15;
      if (z.kind === 'spike') {
        ellipse(ctx, z.x, z.y + 2, z.r, z.r * .72, 'rgba(38,28,28,.36)', 'rgba(235,143,95,.48)', .8);
        for (let i = 0; i < 8; i++) {
          const a = i * TAU / 8, px = z.x + Math.cos(a) * z.r * .55, py = z.y + Math.sin(a) * z.r * .35;
          const hh = 8 + Math.sin(time * 12 + i) * 2;
          path(ctx, [[px - 3, py + 2], [px + Math.cos(a) * 3, py - hh], [px + 3, py + 2]], linear(ctx, px - 2, py, px + 1, py - hh, ['#edc793', '#9b684d', '#463542']), '#392936', .65);
          ctx.strokeStyle = 'rgba(255,220,164,.58)'; ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(px, py - hh + 2); ctx.lineTo(px + .7, py - 2); ctx.stroke();
        }
        return;
      }
      Gfx.glow(z.x, z.y, z.r * .8, z.color, .12 * pulse * k);
      ellipse(ctx, z.x, z.y + 1, z.r, z.r * .78, E.alpha(z.color, .13 * k), E.alpha(z.color, .6 * k), .85);
      ellipse(ctx, z.x, z.y + 1, z.r * (.62 + Math.sin(time * 6) * .025), z.r * .46, E.alpha(z.color, .11 * k), E.alpha('#fff1d1', .32 * k), .55);
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6 + time * .12, rr = z.r * .82;
        const px = z.x + Math.cos(a) * rr, py = z.y + Math.sin(a) * rr * .65;
        Gfx.circ(px, py, 1 + (i % 2) * .35, E.alpha('#fff3d0', .55 * k));
      }
    },

    drawDoor(ctx, door, game) {
      const x = door.x, y = door.y, w = door.w, h = door.h, t = game.time;
      const cols = { boon: '#d5a8ff', heal: '#e99b79', ing: '#83d8c3', essence: '#d1a1ff', recipe: '#e8c477' };
      const col = cols[door.reward.type] || '#d5a8ff';
      const k = E.clamp01(door.t / .5), pulse = .78 + Math.sin(t * 3) * .12;
      Gfx.shadow(x, y + h, w * .58, .42);
      Gfx.glow(x, y + h * .55, 30, col, .16 * pulse);
      path(ctx, [[x - w * .58, y + h], [x - w * .58, y + 12], [x - w * .38, y + 2], [x, y - 8], [x + w * .38, y + 2], [x + w * .58, y + 12], [x + w * .58, y + h]], '#17151d', '#090a10', 1.5);
      path(ctx, [[x - w * .46, y + h - 2], [x - w * .46, y + 13], [x - w * .3, y + 4], [x, y - 4], [x + w * .3, y + 4], [x + w * .46, y + 13], [x + w * .46, y + h - 2]], linear(ctx, x - w * .5, y, x + w * .5, y + h, ['#d1b584', '#725e50', '#362b35']), '#ecd09a', 1);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(x - w * .36, y + h - 3); ctx.lineTo(x - w * .36, y + 14); ctx.quadraticCurveTo(x, y - 3, x + w * .36, y + 14); ctx.lineTo(x + w * .36, y + h - 3); ctx.closePath(); ctx.clip();
      const portal = ctx.createLinearGradient(x, y, x, y + h);
      portal.addColorStop(0, E.alpha(col, .12)); portal.addColorStop(.42, E.alpha(col, .58 * k)); portal.addColorStop(1, E.alpha('#171225', .94));
      ctx.fillStyle = portal; ctx.fillRect(x - w, y - 8, w * 2, h + 12);
      for (let i = 0; i < 5; i++) {
        const yy = y + ((t * (12 + i * 2) + i * 11) % h);
        ctx.strokeStyle = E.alpha('#fff5d7', .18 + pulse * .12); ctx.lineWidth = .65;
        ctx.beginPath(); ctx.moveTo(x - w * .32, yy); ctx.bezierCurveTo(x - 3, yy - 3, x + 4, yy + 3, x + w * .3, yy); ctx.stroke();
      }
      ctx.restore();
      for (let i = 0; i < 4; i++) {
        const sy = y + 13 + i * 7;
        Gfx.rect(x - w * .53, sy, 3, 2, i % 2 ? '#9b7e62' : '#d8bd89');
        Gfx.rect(x + w * .43, sy, 3, 2, i % 2 ? '#d8bd89' : '#9b7e62');
      }
      Gfx.ring(x, y + h * .48, 8 + Math.sin(t * 2) * .7, col, .62, .8);
      Gfx.glow(x, y + h * .48, 8, col, .2);
      if (door.open) {
        const icon = door.reward.type === 'heal' ? '♥' : door.reward.type === 'essence' ? '✦' : door.reward.type === 'ing' ? '❧' : door.reward.type === 'recipe' ? '⌘' : '✧';
        Gfx.text(icon, x, y + h * .42, { size: 1, align: 'center', color: '#fff1d5', outline: '#432e4b' });
      }
      if (E.dist(game.hero.x, game.hero.y, x, y + h * .7) < 26 && k > .9) Gfx.text('ENTRAR', x, y + h + 4, { size: 1, align: 'center', color: col, shadow: '#090910' });
    },
  };

  window.Art = Art;
})();
