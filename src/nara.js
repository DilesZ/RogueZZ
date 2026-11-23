// Nara — heroína original de Ecos de Evermore.
// Arte dibujado en canvas de alta resolución; se reduce al mundo del juego.
(function () {
  const TAU = Math.PI * 2;
  const cache = Object.create(null);

  function gradient(c, x0, y0, x1, y1, colors) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    colors.forEach((v, i) => g.addColorStop(i / (colors.length - 1), v));
    return g;
  }

  function shape(c, pts, fill, stroke, width) {
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width || 1; c.stroke(); }
  }

  function path(c, points, color, width) {
    c.beginPath(); c.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]);
    c.strokeStyle = color; c.lineWidth = width || 1; c.stroke();
  }

  function ellipse(c, x, y, rx, ry, fill, stroke, width) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width || 1; c.stroke(); }
  }

  function makeBody() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 440;
    const x = c.getContext('2d'); x.scale(2, 2); x.lineJoin = 'round'; x.lineCap = 'round';
    const ink = '#211522', gold = '#dfa96b', paleGold = '#f6d394';

    // Cola alta, mechones sueltos y capa de viaje.
    shape(x, [[57,43],[48,57],[39,76],[35,102],[43,111],[57,94],[68,70]], gradient(x,38,54,67,105,['#5d253c','#9e394c','#34182c']), ink, 2.2);
    path(x, [[51,53],[42,76],[42,99],[53,82]], 'rgba(244,139,123,.72)', 1.7);
    shape(x, [[54,64],[33,79],[22,111],[29,141],[46,152],[64,134],[65,96]], gradient(x,27,73,61,146,['#7c314a','#4b203a','#201b31']), ink, 2.3);
    shape(x, [[29,102],[35,120],[31,138],[45,130],[52,106]], null, '#d16a6e', 1.5);
    shape(x, [[74,64],[92,72],[105,99],[102,124],[91,146],[72,134],[66,104]], gradient(x,72,70,102,142,['#b84c5c','#6d2b48','#301a34']), ink, 2.4);
    path(x, [[93,86],[99,105],[91,129],[82,137]], 'rgba(249,156,140,.7)', 1.7);
    shape(x, [[69,63],[90,73],[103,104],[94,135],[77,145],[57,132],[48,102]], gradient(x,52,67,94,138,['#5b263f','#9b394d','#371a34']), ink, 2.4);
    path(x, [[62,81],[75,93],[72,118],[61,131]], 'rgba(245,145,124,.62)', 1.6);

    // Botas y piernas: cuero oscuro, placas lacadas y costuras de cobre.
    shape(x, [[52,116],[65,119],[64,143],[60,165],[58,183],[47,194],[35,191],[40,178],[41,156],[44,133]], gradient(x,38,120,60,185,['#604255','#39273d','#231d2c']), ink, 2.4);
    shape(x, [[69,117],[82,116],[86,139],[79,158],[77,180],[88,190],[84,198],[68,197],[59,185],[64,165],[63,143]], gradient(x,62,119,84,186,['#5f4554','#342739','#221c2c']), ink, 2.4);
    shape(x, [[39,174],[59,174],[58,189],[49,198],[30,201],[26,196],[33,188]], gradient(x,29,177,55,198,['#493040','#1c1928']), ink, 2.2);
    shape(x, [[69,177],[81,175],[89,188],[101,194],[98,200],[75,201],[67,193]], gradient(x,68,179,96,198,['#493040','#1c1928']), ink, 2.2);
    shape(x, [[40,139],[61,141],[59,159],[43,161],[38,155]], gradient(x,39,142,61,159,['#b16c68','#653d50']), gold, 1.2);
    shape(x, [[64,139],[79,139],[82,155],[70,160],[63,155]], gradient(x,64,141,80,157,['#a76663','#59374c']), gold, 1.2);
    path(x, [[41,147],[57,149],[55,153],[40,151]], paleGold, .9);
    path(x, [[66,147],[79,145],[80,150],[66,153]], paleGold, .9);
    path(x, [[31,195],[52,194],[48,198],[29,199]], '#d2a06e', 1.2);
    path(x, [[75,195],[98,197],[96,200],[75,198]], '#d2a06e', 1.2);

    // Falda corta marfil en paneles sobre la armadura.
    shape(x, [[46,90],[74,92],[85,119],[75,140],[65,135],[61,114],[53,139],[40,132],[37,114]], gradient(x,40,95,80,136,['#f7e9d0','#d9c5b0','#f1dfc3']), ink, 2);
    shape(x, [[61,98],[73,99],[78,124],[69,132],[64,118]], '#c8b1a3', '#90767d', 1);
    path(x, [[45,103],[57,111],[52,130]], 'rgba(255,255,255,.72)', 1.1);
    path(x, [[45,135],[59,139],[72,136]], gold, 1.4);

    // Cuerpo y peto verde petróleo con ribetes grabados.
    shape(x, [[49,59],[61,54],[77,57],[88,68],[84,96],[76,111],[61,115],[43,105],[40,80]], gradient(x,41,58,82,109,['#62a69b','#276d6d','#153b4e']), ink, 2.8);
    shape(x, [[46,68],[59,64],[64,91],[57,104],[43,96],[42,80]], gradient(x,43,67,62,103,['#a4d1bb','#4c9a91','#27666c']), '#1d3445', 1.2);
    shape(x, [[64,62],[78,64],[84,78],[78,99],[67,104],[61,91]], gradient(x,64,63,81,99,['#275d68','#163c50','#102d41']), '#b9c9ad', 1.2);
    path(x, [[47,72],[57,71],[60,85],[54,91],[45,84]], 'rgba(232,234,204,.5)', 1.3);
    // Cuero diagonal, hebilla tallada y pequeñas runas turquesa.
    path(x, [[46,76],[77,101]], '#492d35', 5);
    path(x, [[46,76],[77,101]], gold, 1.35);
    shape(x, [[57,83],[65,85],[68,93],[61,98],[54,93]], gradient(x,54,84,66,96,['#f1d38c','#ae704c']), '#422c35', 1.5);
    ellipse(x,61,90,1.4,1.8,'#f4e0a6','#70434a',.7);
    path(x, [[72,72],[76,78],[72,83],[76,87]], '#89e8dc', 1.1);
    ellipse(x,73,80,1.2,1.2,'#d4fff2');

    // Hombros y brazos con guardabrazos articulados.
    shape(x, [[41,62],[51,59],[59,66],[57,77],[45,79],[37,72]], gradient(x,39,61,56,77,['#e6c48d','#8b5f55','#3c3142']), ink, 2.2);
    shape(x, [[73,61],[84,63],[91,72],[85,81],[73,77],[68,68]], gradient(x,70,62,88,79,['#d9bd8b','#8c6559','#3c3042']), ink, 2.2);
    ellipse(x,48,69,4.1,4.2,gradient(x,44,65,52,74,['#f4e3ba','#a97762']),gold,1);
    ellipse(x,82,70,4.2,4.2,gradient(x,78,65,86,75,['#ead5a8','#a06c62']),gold,1);
    shape(x, [[39,76],[49,77],[53,90],[48,102],[39,99],[34,87]], gradient(x,35,78,51,98,['#d9c19a','#775c67','#30283b']), ink, 2);
    shape(x, [[78,77],[88,78],[92,92],[86,101],[77,97],[74,87]], gradient(x,75,78,91,98,['#d9c19a','#775c67','#30283b']), ink, 2);
    path(x, [[37,86],[48,88],[47,91],[36,90]], paleGold, 1);
    path(x, [[77,86],[89,88],[88,91],[76,90]], paleGold, 1);
    ellipse(x,45,103,5,4.3,'#e7b994',ink,1.7);
    ellipse(x,84,103,5,4.3,'#e7b994',ink,1.7);

    // Cuello, rostro anime y ojos ámbar bajo un flequillo asimétrico.
    shape(x, [[57,47],[73,47],[75,61],[67,68],[54,60]], gradient(x,54,47,74,65,['#f2c4a4','#c97f72']), ink, 1.7);
    ellipse(x,65,39,15,18,gradient(x,54,28,75,57,['#ffdfbe','#edb296','#bc726e']),ink,1.8);
    // Sombra lateral y nariz.
    shape(x, [[66,24],[78,31],[78,46],[70,55],[65,48]], 'rgba(157,78,81,.2)');
    path(x, [[69,40],[67,44],[70,45]], '#9c5960', .9);
    // Ojos, delineado, iris oro y brillos.
    shape(x, [[53,35],[61,32],[64,37],[59,40],[53,38]], '#45243c', '#321d36', .7);
    ellipse(x,58.5,36.4,2.2,2.7,gradient(x,57,34,61,39,['#f6d26e','#9d4d46']), '#291b35', .8);
    ellipse(x,59,35.5,.7,.9,'#fff2c7');
    path(x, [[54,32],[60,31]], '#392038', 1.5);
    path(x, [[71,31],[77,33],[78,37],[72,39],[69,36]], '#45243c', '#321d36', .7);
    ellipse(x,73.5,35.8,2.1,2.6,gradient(x,72,33,76,39,['#f7d36f','#a74c45']), '#291b35', .8);
    ellipse(x,74,35,.65,.85,'#fff5d8');
    path(x, [[71,31],[76,32]], '#392038', 1.4);
    path(x, [[63,51],[68,52],[71,50]], '#a7555f', .8);
    ellipse(x,80,43,1.4,2.2,'#e3b66d','#7b4951',.7);

    // Flequillo con mechones dibujados y reflejo cálido.
    shape(x, [[51,37],[49,26],[54,18],[65,15],[78,20],[82,29],[78,36],[72,31],[67,38],[62,31],[57,39]], gradient(x,51,17,80,39,['#bd5361','#712942','#361a35']), ink, 2.1);
    path(x, [[54,25],[60,19],[68,18]], 'rgba(255,179,147,.76)', 1.3);
    path(x, [[73,22],[78,28],[75,32]], 'rgba(244,128,121,.7)', 1.1);

    // Pañuelo vino, broche y cola corta en movimiento.
    shape(x, [[49,57],[61,61],[76,56],[83,62],[73,69],[57,67],[45,63]], gradient(x,45,58,80,67,['#ce6371','#8d344b','#54213e']), ink, 2);
    shape(x, [[77,60],[91,63],[101,76],[96,87],[84,76]], gradient(x,79,61,99,84,['#a83b56','#55223f','#301a33']), ink, 1.8);
    path(x, [[85,67],[96,78],[93,82]], '#e58b83', 1.3);
    shape(x, [[47,61],[52,63],[51,68],[46,67]], '#e7c47f', '#55333b', 1);
    ellipse(x,49,64.5,1.15,1.4,'#7de2d4','#fbdda3',.7);

    // Broches y remaches que atrapan la luz.
    [ [44,72],[52,76],[78,69],[82,75],[42,88],[86,88],[47,151],[77,150] ].forEach(([a,b]) => {
      ellipse(x,a,b,.9,1.1,'#f0c882','#563744',.45);
    });
    return c;
  }

  const body = makeBody();

  // AutoSprite exports 5 × 5 atlases of 256 px frames.
  const walkSheet = new Image();
  const attackSheet = new Image();
  walkSheet.src = 'assets/nara/Nara-iso_walk_down-v1.png';
  attackSheet.src = 'assets/nara/Nara-iso_attack_down-v1.png';

  function hasSheet(image) { return image.complete && image.naturalWidth >= 1280; }

  function drawSheetFrame(ctx, image, frame, hero, alpha) {
    const column = frame % 5, row = Math.floor(frame / 5);
    const size = 74;
    ctx.save();
    ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.translate(hero.x, hero.y + 1);
    ctx.scale(hero.face < 0 ? -1 : 1, 1);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(image, column * 256, row * 256, 256, 256, -size / 2, -size + 6, size, size);
    ctx.restore();
  }

  function drawImported(ctx, hero, time, alpha) {
    const moving = Math.hypot(hero.vx || 0, hero.vy || 0) > 14;
    if (hero.state === 'attack' && hasSheet(attackSheet)) {
      const windows = [
        { w: .055, a: .11, r: .13, frames: [7, 8, 9, 10, 11, 12] },
        { w: .05, a: .10, r: .15, frames: [12, 13, 14, 15, 16, 17, 18] },
        { w: .09, a: .14, r: .20, frames: [18, 19, 20, 21, 22, 23, 24] },
      ];
      const attack = windows[hero.attackIndex || 0];
      const progress = E.clamp01(hero.t / (attack.w + attack.a + attack.r));
      const frame = attack.frames[Math.min(attack.frames.length - 1, Math.floor(progress * attack.frames.length))];
      drawSheetFrame(ctx, attackSheet, frame, hero, alpha);
      return true;
    }
    if ((hero.state === 'heavy' || hero.state === 'cast') && hasSheet(attackSheet)) {
      const frame = hero.state === 'heavy'
        ? (hero.t < .2 ? 8 : hero.t < .36 ? 11 : 19)
        : 0;
      drawSheetFrame(ctx, attackSheet, frame, hero, alpha);
      return true;
    }
    if (moving && hasSheet(walkSheet)) {
      // AutoSprite's 25-frame export repeats the same five-step walk cycle.
      const frame = Math.floor((time || hero.animT || 0) * 11) % 5;
      drawSheetFrame(ctx, walkSheet, frame, hero, alpha);
      return true;
    }
    if (hasSheet(attackSheet)) {
      drawSheetFrame(ctx, attackSheet, 0, hero, alpha);
      return true;
    }
    return false;
  }

  function drawBlade(c, x, y, aim, power, idx) {
    c.save(); c.translate(x, y); c.rotate(aim);
    const len = idx === 2 ? 38 : 33;
    c.shadowColor = idx === 2 ? '#e7a5ff' : '#55eadb'; c.shadowBlur = power ? 16 : 5;
    path(c, [[0,0],[9,-1.2],[len,-.6],[len+3,0],[len,1],[9,1.2],[0,0]], gradient(c,5,-2,len,2,['#283b50','#87fff0','#dffff4']), '#e3fff5', 1.1);
    c.shadowBlur = 0;
    path(c, [[2,-2],[7,-5],[11,0],[7,5],[2,2]], '#765249', '#f0cf8e', 1.3);
    path(c, [[5,-1],[7,0],[5,1]], '#57e5d9', '#ebf8d8', .7);
    path(c, [[14,0],[len-2,0]], 'rgba(255,255,255,.9)', .8);
    [15,22,29].forEach((v) => {
      if (v < len - 2) {
        path(c, [[v,-1.2],[v+2,0],[v,1.2]], '#bcfff1', .6);
      }
    });
    c.restore();
  }

  function drawHero(ctx, hero, time, alpha) {
    if (drawImported(ctx, hero, time, alpha)) return;
    const moving = Math.hypot(hero.vx || 0, hero.vy || 0) > 14;
    const phase = hero.walkPhase || hero.animT * 9 || 0;
    const idx = hero.attackIndex || 0;
    const limits = [{w:.055,a:.11,r:.13},{w:.05,a:.1,r:.15},{w:.09,a:.14,r:.2}][idx] || {w:.055,a:.11,r:.13};
    let lunge = 0, lean = 0, arc = 0, cut = false;
    if (hero.state === 'attack') {
      const total = limits.w + limits.a + limits.r;
      const p = E.clamp01(hero.t / total);
      const dir = [1,-1,1][idx];
      lunge = Math.sin(p * Math.PI) * (idx === 2 ? 7 : 4.2);
      lean = (idx === 1 ? -.14 : .14) * Math.sin(p * Math.PI);
      arc = dir * (idx === 0 ? -.65 : idx === 1 ? 1.0 : -1.35) * Math.sin(p * Math.PI);
      cut = hero.t >= limits.w && hero.t <= limits.w + limits.a;
    } else if (hero.state === 'heavy') {
      lunge = hero.t > .2 ? 5 : -2; lean = hero.t < .2 ? -.22 : .22; cut = hero.t >= .2 && hero.t < .36;
    } else if (hero.state === 'dash') {
      lunge = 2.5; lean = .3;
    } else if (moving) {
      lean = Math.sin(phase) * .055;
    }

    const aim = Number.isFinite(hero.aim) ? hero.aim : 0;
    const x = hero.x + Math.cos(aim) * lunge;
    const y = hero.y + (moving ? Math.abs(Math.sin(phase)) * -1.2 : Math.sin(time * 2.4) * .35);
    ctx.save();
    ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.translate(x, y); ctx.scale(hero.face < 0 ? -1 : 1, 1); ctx.rotate(lean);
    if (moving || hero.state === 'dash') {
      const flutter = Math.sin(phase * 1.4) * 2.4;
      ctx.globalAlpha *= .28;
      ctx.drawImage(body, -27 - flutter * .25, -54, 54, 54);
      ctx.globalAlpha /= .28;
      ctx.save(); ctx.translate(-2, -33); ctx.rotate(-.25 + Math.sin(phase) * .07);
      ctx.fillStyle = gradient(ctx,-12,-4,9,17,['#a94157','#662848','#301a34']);
      shape(ctx, [[0,0],[-5,5],[-11,17],[-17+flutter,20],[-8,21],[1,13],[6,5]], ctx.fillStyle, '#25182d', .8);
      ctx.restore();
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(body, -27, -54, 54, 54);

    // La hoja sigue la mira; el movimiento del brazo convierte los tres pasos en golpes distintos.
    const localAim = hero.face < 0 ? Math.PI - aim : aim;
    const bladeAim = localAim + arc + (hero.state === 'heavy' ? -.6 : 0);
    const handX = 7 + Math.cos(aim) * 5;
    const handY = -31 + Math.sin(aim) * 2;
    drawBlade(ctx, handX, handY, bladeAim, cut || hero.state === 'heavy', idx);
    ctx.restore();

    if (cut) {
      const col = idx === 2 ? '#ffd28c' : idx === 1 ? '#f6a1e3' : '#8af7eb';
      const power = idx === 2 ? 1 : .65;
      Gfx.glow(x + Math.cos(aim) * 17, y - 24 + Math.sin(aim) * 10, idx === 2 ? 21 : 14, col, idx === 2 ? .24 : .15);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = power * .7;
      ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = idx === 2 ? 2.2 : 1.25;
      const start = aim + (idx === 1 ? -.9 : .9);
      ctx.beginPath(); ctx.arc(x + Math.cos(aim) * 4, y - 25 + Math.sin(aim) * 4, idx === 2 ? 28 : 23, start, start + (idx === 2 ? 2.0 : 1.45)); ctx.stroke();
      ctx.strokeStyle = '#fff6dc'; ctx.lineWidth = .75;
      ctx.beginPath(); ctx.arc(x + Math.cos(aim) * 4, y - 25 + Math.sin(aim) * 4, idx === 2 ? 25 : 20, start + .08, start + (idx === 2 ? 1.84 : 1.32)); ctx.stroke();
      ctx.restore();
    }
    if (hero.showHurt > 0) Gfx.glow(hero.x, hero.y - 31, 17, '#fff1e4', hero.showHurt * .4);
  }

  window.NaraArt = { drawHero };
})();
