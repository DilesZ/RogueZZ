// ============================================================
//  Sonido: sintetizador procedural (SFX + música)
// ============================================================
(function () {
  const Snd = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    ready: false,
    muted: false,
    musicVol: 0.32,
    sfxVol: 0.55,
    cur: null,
    step: 0,
    nextTime: 0,
    bar: 0,

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch (e) { return; }
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVol;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.master);
      this.ready = true;
      this.nextTime = this.ctx.currentTime + 0.1;
    },

    resume() {
      if (!this.ready) this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },

    now() { return this.ctx ? this.ctx.currentTime : 0; },

    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.9;
    },
    setMusicVol(v) {
      this.musicVol = v;
      if (this.musicGain) this.musicGain.gain.value = v;
    },
    setSfxVol(v) {
      this.sfxVol = v;
      if (this.sfxGain) this.sfxGain.gain.value = v;
    },

    tone(o) {
      if (!this.ready || this.muted) return;
      const c = this.ctx;
      const t0 = (o.at !== undefined ? o.at : c.currentTime) + (o.delay || 0);
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(o.freq || 440, t0);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + (o.dur || 0.2));
      const env = o.gain === undefined ? 0.3 : o.gain;
      const atk = o.attack || 0.005;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(env, t0 + atk);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + (o.dur || 0.2));
      let node = osc;
      if (o.filter) {
        const f = c.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(o.filter, t0);
        if (o.filterTo) f.frequency.exponentialRampToValueAtTime(o.filterTo, t0 + (o.dur || 0.2));
        f.Q.value = o.q || 1;
        node.connect(f);
        node = f;
      }
      node.connect(g);
      g.connect(o.bus || this.sfxGain);
      osc.start(t0);
      osc.stop(t0 + (o.dur || 0.2) + 0.05);
    },

    noise(o) {
      if (!this.ready || this.muted) return;
      const c = this.ctx;
      const t0 = (o.at !== undefined ? o.at : c.currentTime) + (o.delay || 0);
      const dur = o.dur || 0.15;
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource();
      src.buffer = buf;
      const f = c.createBiquadFilter();
      f.type = o.type || 'bandpass';
      f.frequency.setValueAtTime(o.freq || 1200, t0);
      if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(60, o.to), t0 + dur);
      f.Q.value = o.q || 1.2;
      const g = c.createGain();
      g.gain.setValueAtTime(o.gain === undefined ? 0.3 : o.gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f); f.connect(g);
      g.connect(o.bus || this.sfxGain);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
    },

    sfx(name) {
      if (!this.ready || this.muted) return;
      const t = this.ctx.currentTime;
      switch (name) {
        case 'swing':
          this.noise({ freq: 2600, to: 700, dur: 0.12, gain: 0.16, q: 0.8 });
          break;
        case 'swing2':
          this.noise({ freq: 3400, to: 900, dur: 0.14, gain: 0.18, q: 0.9 });
          break;
        case 'hit':
          this.noise({ freq: 900, to: 200, dur: 0.1, gain: 0.32, q: 0.7 });
          this.tone({ freq: 210, to: 80, dur: 0.09, type: 'square', gain: 0.14 });
          break;
        case 'crit':
          this.noise({ freq: 1600, to: 260, dur: 0.14, gain: 0.38, q: 0.6 });
          this.tone({ freq: 640, to: 120, dur: 0.14, type: 'sawtooth', gain: 0.14 });
          break;
        case 'hurt':
          this.tone({ freq: 220, to: 90, dur: 0.22, type: 'sawtooth', gain: 0.22, filter: 900 });
          this.noise({ freq: 500, to: 120, dur: 0.18, gain: 0.2 });
          break;
        case 'dash':
          this.noise({ freq: 700, to: 2600, dur: 0.16, gain: 0.14, q: 0.5, type: 'highpass' });
          break;
        case 'ui':
          this.tone({ freq: 660, dur: 0.05, type: 'square', gain: 0.07 });
          break;
        case 'uiMove':
          this.tone({ freq: 480, dur: 0.04, type: 'square', gain: 0.05 });
          break;
        case 'pick':
          this.tone({ freq: 880, dur: 0.06, type: 'triangle', gain: 0.12 });
          this.tone({ freq: 1320, dur: 0.07, type: 'triangle', gain: 0.09, delay: 0.05 });
          break;
        case 'coin':
          this.tone({ freq: 1180, dur: 0.05, type: 'square', gain: 0.09 });
          this.tone({ freq: 1760, dur: 0.09, type: 'square', gain: 0.07, delay: 0.04 });
          break;
        case 'heal':
          this.tone({ freq: 520, to: 780, dur: 0.28, type: 'sine', gain: 0.16 });
          this.tone({ freq: 780, to: 1040, dur: 0.3, type: 'sine', gain: 0.1, delay: 0.08 });
          break;
        case 'cast':
          this.tone({ freq: 300, to: 900, dur: 0.16, type: 'sawtooth', gain: 0.1, filter: 2200 });
          break;
        case 'fire':
          this.noise({ freq: 1400, to: 300, dur: 0.3, gain: 0.2, q: 0.5 });
          this.tone({ freq: 180, to: 60, dur: 0.3, type: 'sawtooth', gain: 0.12, filter: 700 });
          break;
        case 'ice':
          this.tone({ freq: 1400, to: 2200, dur: 0.15, type: 'triangle', gain: 0.12 });
          this.noise({ freq: 3200, to: 1800, dur: 0.25, gain: 0.1, type: 'highpass' });
          break;
        case 'shoot':
          this.tone({ freq: 700, to: 320, dur: 0.12, type: 'square', gain: 0.1 });
          break;
        case 'explode':
          this.noise({ freq: 900, to: 60, dur: 0.42, gain: 0.34, q: 0.4 });
          this.tone({ freq: 110, to: 38, dur: 0.4, type: 'sawtooth', gain: 0.2, filter: 500 });
          break;
        case 'levelup':
          [523, 659, 784, 1046].forEach((f, i) =>
            this.tone({ freq: f, dur: 0.18, type: 'triangle', gain: 0.14, delay: i * 0.07 }));
          break;
        case 'door':
          this.tone({ freq: 120, to: 60, dur: 0.4, type: 'sine', gain: 0.2 });
          this.noise({ freq: 300, to: 90, dur: 0.5, gain: 0.13 });
          break;
        case 'death':
          this.tone({ freq: 300, to: 60, dur: 0.9, type: 'sawtooth', gain: 0.22, filter: 1200, filterTo: 200 });
          break;
        case 'roar':
          this.tone({ freq: 90, to: 48, dur: 0.9, type: 'sawtooth', gain: 0.28, filter: 600 });
          this.noise({ freq: 260, to: 100, dur: 0.9, gain: 0.2, q: 2 });
          break;
        case 'bark':
          this.tone({ freq: 420, to: 240, dur: 0.09, type: 'square', gain: 0.12 });
          this.tone({ freq: 380, to: 210, dur: 0.09, type: 'square', gain: 0.1, delay: 0.1 });
          break;
        case 'slam':
          this.noise({ freq: 400, to: 50, dur: 0.5, gain: 0.35, q: 0.5 });
          this.tone({ freq: 80, to: 30, dur: 0.5, type: 'sine', gain: 0.3 });
          break;
        case 'block':
          this.tone({ freq: 900, to: 500, dur: 0.1, type: 'square', gain: 0.1, filter: 3000 });
          break;
        case 'error':
          this.tone({ freq: 180, dur: 0.12, type: 'square', gain: 0.1 });
          break;
        case 'teleport':
          this.tone({ freq: 200, to: 1400, dur: 0.3, type: 'sine', gain: 0.1 });
          break;
        case 'relic':
          [392, 523, 659].forEach((f, i) => this.tone({ freq: f, dur: 0.5, type: 'sine', gain: 0.09, delay: i * 0.12 }));
          break;
      }
    },

    music(id) {
      if (this.cur === id) return;
      this.cur = id;
      this.step = 0;
      this.bar = 0;
      this.nextTime = this.now() + 0.05;
      if (!this.ready) return;
    },

    // escalas
    SONGS: {
      title: { bpm: 74, root: 55, scale: [0, 3, 5, 7, 10], arp: [0, 7, 12, 7, 3, 10, 7, 5], lead: true },
      hub: { bpm: 88, root: 49, scale: [0, 2, 3, 7, 8], arp: [0, 12, 7, 15, 3, 12, 7, 10], lead: false },
      jungla: { bpm: 104, root: 50, scale: [0, 3, 5, 6, 10], arp: [0, 7, 10, 7, 12, 10, 7, 3], lead: true },
      cavernas: { bpm: 92, root: 45, scale: [0, 1, 5, 7, 8], arp: [0, 5, 7, 12, 7, 5, 1, 5], lead: true },
      omnitopia: { bpm: 118, root: 52, scale: [0, 2, 5, 7, 9], arp: [0, 2, 7, 9, 12, 9, 7, 2], lead: true },
      boss: { bpm: 136, root: 43, scale: [0, 1, 3, 6, 7], arp: [0, 3, 6, 7, 6, 3, 12, 7], lead: true },
      death: { bpm: 60, root: 43, scale: [0, 3, 5, 6, 10], arp: [12, 7, 3, 0, 3, 7, 12, 7], lead: false },
    },

    hz(root, semis) { return root * Math.pow(2, semis / 12) * 4; },

    update() {
      if (!this.ready || this.muted || !this.cur) return;
      const song = this.SONGS[this.cur];
      if (!song) return;
      const stepDur = 60 / song.bpm / 2;
      const now = this.now();
      let guard = 0;
      while (this.nextTime < now + 0.2 && guard++ < 8) {
        const t = this.nextTime;
        const s = this.step;
        const fifth = song.scale[0] + 7;
        // bajo
        if (s % 4 === 0) {
          const n = song.scale[Math.floor(s / 4) % song.scale.length];
          this.tone({
            freq: this.hz(song.root, n - 12), type: 'triangle', dur: stepDur * 3.4,
            gain: 0.16, attack: 0.01, at: t, bus: this.musicGain, filter: 420,
          });
        }
        // arpegio
        const deg = song.arp[s % song.arp.length];
        this.tone({
          freq: this.hz(song.root, deg), type: s % 2 ? 'square' : 'triangle',
          dur: stepDur * 1.6, gain: 0.045, at: t, bus: this.musicGain, filter: 3000,
        });
        if (s % 8 === 0 && song.lead) {
          const n = song.scale[(this.bar * 3) % song.scale.length];
          this.tone({
            freq: this.hz(song.root, n + 12), type: 'sine', dur: stepDur * 7,
            gain: 0.05, attack: 0.2, at: t, bus: this.musicGain,
          });
        }
        // percusión
        if (s % 2 === 0) {
          const src = this.noise;
          this.noise({ freq: s % 4 === 0 ? 180 : 3000, dur: 0.06, gain: s % 4 === 0 ? 0.09 : 0.03, q: 0.7, at: t, bus: this.musicGain, type: s % 4 === 0 ? 'lowpass' : 'highpass' });
        }
        this.step = (s + 1) % 16;
        if (this.step === 0) this.bar++;
        this.nextTime += stepDur;
      }
    },
  };

  window.Snd = Snd;
})();
