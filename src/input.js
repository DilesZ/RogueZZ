// ============================================================
//  Entrada: teclado, ratón y mando
// ============================================================
(function () {
  const MAP = {
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    light: ['KeyJ'],
    heavy: ['KeyK'],
    dash: ['Space', 'ShiftLeft', 'ShiftRight'],
    cast: ['KeyQ'],
    radial: ['Tab'],
    interact: ['KeyE'],
    inventory: ['KeyI'],
    discard: ['KeyX'],
    pause: ['Escape'],
    confirm: ['Enter'],
    slot1: ['Digit1'], slot2: ['Digit2'], slot3: ['Digit3'], slot4: ['Digit4'],
    mute: ['KeyM'],
    help: ['F1'],
  };

  const Input = {
    keys: Object.create(null),
    pressedKeys: Object.create(null),
    releasedKeys: Object.create(null),
    mouse: { x: 240, y: 135, cx: 0, cy: 0, down: false, pressed: false, released: false, moved: 0, inside: false },
    gp: { connected: false, ax: 0, ay: 0, aimx: 0, aimy: 0, buttons: [], prev: [] },
    anyPressed: false,
    canvas: null,

    init(canvas) {
      this.canvas = canvas;
      window.addEventListener('keydown', (e) => {
        if (e.repeat) {
          if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
          return;
        }
        this.keys[e.code] = true;
        this.pressedKeys[e.code] = true;
        this.anyPressed = true;
        if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1'].includes(e.code)) e.preventDefault();
      });
      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
        this.releasedKeys[e.code] = true;
      });
      const setMouse = (e) => {
        const r = canvas.getBoundingClientRect();
        this.mouse.cx = e.clientX - r.left;
        this.mouse.cy = e.clientY - r.top;
        // Coordenadas lógicas del juego (480×270): apuntado, menú radial y
        // menús comparan contra este espacio. Antes se convertía al espacio
        // ráster del canvas (960×540) y el cursor quedaba al doble de
        // distancia de donde el juego creía, desviando la puntería.
        const gw = (window.Gfx && Gfx.W) || 480;
        const gh = (window.Gfx && Gfx.H) || 270;
        this.mouse.x = this.mouse.cx / Math.max(1, r.width) * gw;
        this.mouse.y = this.mouse.cy / Math.max(1, r.height) * gh;
        this.mouse.moved = 0;
        this.mouse.inside = true;
      };
      window.addEventListener('mousemove', setMouse);
      // El puntero salió de la ventana: el apuntado pasa al respaldo
      // (movimiento/última mira) hasta que vuelva a entrar.
      document.documentElement.addEventListener('mouseleave', () => {
        this.mouse.inside = false;
      });
      window.addEventListener('mousedown', (e) => {
        setMouse(e);
        if (e.button === 0) {
          this.mouse.down = true;
          this.mouse.pressed = true;
        }
        if (e.button === 2) {
          this.mouse.down2 = true;
          this.mouse.pressed2 = true;
        }
      });
      window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
          this.mouse.down = false;
          this.mouse.released = true;
        }
        if (e.button === 2) {
          this.mouse.down2 = false;
          this.mouse.pressed2 = true;
        }
      });
      window.addEventListener('contextmenu', (e) => e.preventDefault());
      window.addEventListener('blur', () => {
        this.keys = Object.create(null);
        this.mouse.down = false;
        this.mouse.down2 = false;
      });
    },

    update(dt) {
      this.mouse.moved += dt;
      this.pollPad();
    },

    endFrame() {
      this.pressedKeys = Object.create(null);
      this.releasedKeys = Object.create(null);
      this.mouse.pressed = false;
      this.mouse.released = false;
      this.mouse.pressed2 = false;
      // La mira sigue al ratón aunque esté quieto: no caduca por tiempo.
    },

    pollPad() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      let p = null;
      for (const q of pads) if (q && q.connected) { p = q; break; }
      if (!p) { this.gp.connected = false; return; }
      const g = this.gp;
      g.connected = true;
      const dz = (v) => (Math.abs(v) < 0.22 ? 0 : v);
      g.ax = dz(p.axes[0] || 0);
      g.ay = dz(p.axes[1] || 0);
      g.aimx = dz(p.axes[2] || 0);
      g.aimy = dz(p.axes[3] || 0);
      const map = ['light', 'dash', 'heavy', 'interact', 'slot1', 'slot2', 'radial', 'pause'];
      const bmap = [0, 1, 2, 3, 6, 7, 4, 9];
      for (let i = 0; i < bmap.length; i++) {
        const b = p.buttons[bmap[i]];
        const on = !!(b && (b.pressed || b.value > 0.5));
        g.buttons[map[i]] = on;
      }
      // flanco
      for (const k of map) {
        if (g.buttons[k] && !g.prev[k]) this.pressedKeys['gp_' + k] = true;
        g.prev[k] = g.buttons[k];
      }
      if (g.buttons.light) this.mouse.down = true;
      else if (g.prevLightWas) this.mouse.down = false;
      g.prevLightWas = g.buttons.light;
    },

    down(action) {
      if (this.gp.connected && this.gp.buttons[action] && action !== 'cast') return true;
      const codes = MAP[action] || [action];
      for (const c of codes) if (this.keys[c]) return true;
      return false;
    },
    pressed(action) {
      if (this.pressedKeys['gp_' + action]) return true;
      const codes = MAP[action] || [action];
      for (const c of codes) if (this.pressedKeys[c]) return true;
      return false;
    },
    key(code) { return !!this.keys[code]; },
    keyPressed(code) { return !!this.pressedKeys[code]; },

    axis() {
      let x = 0, y = 0;
      if (this.down('left')) x -= 1;
      if (this.down('right')) x += 1;
      if (this.down('up')) y -= 1;
      if (this.down('down')) y += 1;
      if (this.gp.connected) { x += this.gp.ax; y += this.gp.ay; }
      const m = Math.hypot(x, y);
      if (m > 1) { x /= m; y /= m; }
      return { x, y, m: Math.min(1, m) };
    },

    aimFrom(px, py, fallback) {
      if (this.gp.connected && (Math.abs(this.gp.aimx) + Math.abs(this.gp.aimy)) > 0.3) {
        return Math.atan2(this.gp.aimy, this.gp.aimx);
      }
      // El ratón vive en coordenadas de pantalla lógicas y el héroe en
      // coordenadas de mundo: hay que pasar el punto de referencia a pantalla
      // antes de comparar (screenX/screenY ya incluyen zoom, shake y offset
      // de cámara). Válido aunque el ratón esté quieto: la mira no caduca.
      if (this.mouse.inside) return E.angTo(Gfx.screenX(px), Gfx.screenY(py), this.mouse.x, this.mouse.y);
      return fallback;
    },

    attackHeld() { return this.mouse.down || this.down('light'); },
    attackPressed() { return this.mouse.pressed || this.pressed('light'); },
    heavyHeld() { return !!this.mouse.down2 || this.down('heavy'); },
    heavyPressed() { return !!this.mouse.pressed2 || this.pressed('heavy'); },
    any() {
      if (this.anyPressed) return true;
      for (const k in this.pressedKeys) if (!k.startsWith('gp_')) return true;
      return this.mouse.pressed || this.mouse.pressed2;
    },
  };

  window.Input = Input;
})();
