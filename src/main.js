// ============================================================
//  Arranque y bucle principal
// ============================================================
(function () {
  const canvas = document.getElementById('game');
  Gfx.init(canvas);
  Input.init(canvas);
  Game.init();
  Game.draw(Gfx.ctx);

  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;
  let frames = 0;

  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (!isFinite(dt) || dt < 0) dt = 0;
    dt = Math.min(dt, 0.12);
    Input.update(dt);
    acc += dt;
    let guard = 0;
    while (acc >= STEP && guard++ < 5) {
      Game.update(STEP);
      acc -= STEP;
    }
    Game.draw(Gfx.ctx);
    Input.endFrame();
    frames++;
    requestAnimationFrame(frame);
  }

  const boot = document.getElementById('boot');
  if (boot) boot.classList.add('hide');

  const startAudio = () => {
    Snd.resume();
    if (!Snd.cur) Snd.music('title');
    if (Game.state === 'title') Snd.music('title');
  };
  window.addEventListener('pointerdown', startAudio);
  window.addEventListener('keydown', startAudio);
  window.addEventListener('focus', () => { last = performance.now(); });

  requestAnimationFrame(frame);
  window.__GAME = Game;
})();
