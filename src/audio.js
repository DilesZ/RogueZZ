// ============================================================
//  Sonido: sintetizador procedural (SFX + música) — v2
//  Música por capas: pad de acordes, bajo, arpegio con eco,
//  melodía compuesta y percusión sintetizada. Reverb por
//  convolución + compresor en máster. SFX resintetizados.
// ============================================================
(function () {
  // PRNG determinista (mulberry32) para frases musicales estables
  function mulberry32(seed) {
    let a = seed | 0;
    return function () {
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const Snd = {
    ctx: null,
    master: null,
    comp: null,
    musicGain: null,
    sfxGain: null,
    verb: null,
    delayIn: null,
    ready: false,
    muted: false,
    musicVol: 0.32,
    sfxVol: 0.55,
    cur: null,
    step: 0,
    bar: 0,
    nextTime: 0,
    _phraseA: null,
    _phraseB: null,
    _phraseFor: null,
    _noiseBuf: null,
    _brownBuf: null,

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch (e) { return; }
      const c = this.ctx;
      // buffers de ruido reutilizables (blanco + marrón)
      const len = c.sampleRate;
      this._noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const nd = this._noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;
      this._brownBuf = c.createBuffer(1, len, c.sampleRate);
      const bd = this._brownBuf.getChannelData(0);
      let acc = 0;
      for (let i = 0; i < len; i++) {
        acc += (Math.random() * 2 - 1) * 0.04;
        acc *= 0.996;
        bd[i] = acc;
      }
      let peak = 0;
      for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(bd[i]));
      if (peak > 0) for (let i = 0; i < len; i++) bd[i] = (bd[i] / peak) * 0.85;
      // máster con compresor suave (cohesión y sin clipeos)
      this.comp = c.createDynamicsCompressor();
      this.comp.threshold.value = -16;
      this.comp.knee.value = 22;
      this.comp.ratio.value = 3.5;
      this.comp.attack.value = 0.004;
      this.comp.release.value = 0.24;
      this.comp.connect(c.destination);
      this.master = c.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.comp);
      this.musicGain = c.createGain();
      this.musicGain.gain.value = this.musicVol;
      this.musicGain.connect(this.master);
      this.sfxGain = c.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.master);
      // reverb por convolución con impulso generado (2 canales)
      const irLen = Math.floor(c.sampleRate * 1.9);
      const ir = c.createBuffer(2, irLen, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < irLen; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.6);
        }
      }
      this.verb = c.createConvolver();
      this.verb.buffer = ir;
      const vout = c.createGain();
      vout.gain.value = 0.55;
      this.verb.connect(vout);
      vout.connect(this.master);
      // eco con realimentación filtrada (cola musical)
      this.delayIn = c.createGain();
      const dl = c.createDelay(1);
      dl.delayTime.value = 0.29;
      const fb = c.createGain();
      fb.gain.value = 0.32;
      const fl = c.createBiquadFilter();
      fl.type = 'lowpass';
      fl.frequency.value = 2400;
      const dout = c.createGain();
      dout.gain.value = 0.4;
      this.delayIn.connect(dl);
      dl.connect(fl);
      fl.connect(fb);
      fb.connect(dl);
      fl.connect(dout);
      dout.connect(this.master);
      dout.connect(this.verb);
      this.ready = true;
      this.nextTime = c.currentTime + 0.1;
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

    // --------------------------------------------------------
    //  Primitivas de voz (con paneo, reverb y eco opcionales)
    // --------------------------------------------------------
    tone(o) {
      if (!this.ready || this.muted) return;
      const c = this.ctx;
      const dur = o.dur || 0.2;
      const t0 = (o.at !== undefined ? o.at : c.currentTime) + (o.delay || 0);
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(Math.max(20, o.freq || 440), t0);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
      if (o.det) osc.detune.setValueAtTime(o.det, t0);
      if (o.vib) {
        const lfo = c.createOscillator();
        const lg = c.createGain();
        lfo.frequency.value = o.vibRate || 5;
        lg.gain.value = o.vib;
        lfo.connect(lg);
        lg.connect(osc.detune);
        lfo.start(t0);
        lfo.stop(t0 + dur + 0.1);
      }
      const env = o.gain === undefined ? 0.3 : o.gain;
      const atk = o.attack || 0.005;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(env, t0 + atk);
      if (o.hold) g.gain.setValueAtTime(env, t0 + Math.max(atk, o.hold));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      let node = osc;
      if (o.filter) {
        const f = c.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(o.filter, t0);
        if (o.filterTo) f.frequency.exponentialRampToValueAtTime(Math.max(60, o.filterTo), t0 + dur);
        f.Q.value = o.q || 1;
        node.connect(f);
        node = f;
      }
      node.connect(g);
      let out = g;
      if (o.pan !== undefined && c.createStereoPanner) {
        const p = c.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, o.pan));
        g.connect(p);
        out = p;
      }
      out.connect(o.bus || this.sfxGain);
      if (o.verb) {
        const vs = c.createGain();
        vs.gain.value = o.verb;
        out.connect(vs);
        vs.connect(this.verb);
      }
      if (o.echo && this.delayIn) {
        const es = c.createGain();
        es.gain.value = o.echo;
        out.connect(es);
        es.connect(this.delayIn);
      }
      osc.start(t0);
      osc.stop(t0 + dur + 0.06);
    },

    noise(o) {
      if (!this.ready || this.muted) return;
      const c = this.ctx;
      const dur = o.dur || 0.15;
      const t0 = (o.at !== undefined ? o.at : c.currentTime) + (o.delay || 0);
      const buf = o.brown ? this._brownBuf : this._noiseBuf;
      if (!buf) return;
      const src = c.createBufferSource();
      src.buffer = buf;
      const maxOff = Math.max(0, buf.duration - dur - 0.05);
      const off = Math.random() * maxOff;
      const f = c.createBiquadFilter();
      f.type = o.type || 'bandpass';
      f.frequency.setValueAtTime(Math.max(30, o.freq || 1200), t0);
      if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.to), t0 + dur);
      f.Q.value = o.q || 1.2;
      const g = c.createGain();
      const env = o.gain === undefined ? 0.3 : o.gain;
      const atk = o.attack || 0.002;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(env, t0 + atk);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f);
      f.connect(g);
      let out = g;
      if (o.pan !== undefined && c.createStereoPanner) {
        const p = c.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, o.pan));
        g.connect(p);
        out = p;
      }
      out.connect(o.bus || this.sfxGain);
      if (o.verb) {
        const vs = c.createGain();
        vs.gain.value = o.verb;
        out.connect(vs);
        vs.connect(this.verb);
      }
      if (o.echo && this.delayIn) {
        const es = c.createGain();
        es.gain.value = o.echo;
        out.connect(es);
        es.connect(this.delayIn);
      }
      src.start(t0, off);
      src.stop(t0 + dur + 0.02);
    },

    // --------------------------------------------------------
    //  Percusión sintetizada (bus de música)
    // --------------------------------------------------------
    kick(t, v) {
      if (!this.ready || this.muted) return;
      const c = this.ctx;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(148, t);
      o.frequency.exponentialRampToValueAtTime(41, t + 0.1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.42 * v, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
      o.connect(g);
      g.connect(this.musicGain);
      o.start(t);
      o.stop(t + 0.2);
      this.noise({ freq: 2200, dur: 0.018, gain: 0.07 * v, type: 'highpass', at: t, bus: this.musicGain });
    },
    snare(t, v) {
      this.noise({ freq: 1750, to: 900, dur: 0.14, gain: 0.16 * v, q: 0.9, at: t, bus: this.musicGain, verb: 0.18 });
      this.tone({ freq: 205, to: 128, dur: 0.08, type: 'triangle', gain: 0.09 * v, at: t, bus: this.musicGain });
    },
    hat(t, v, open) {
      this.noise({ freq: 7600, dur: open ? 0.12 : 0.038, gain: 0.075 * v, type: 'highpass', q: 0.6, at: t, bus: this.musicGain });
    },

    // --------------------------------------------------------
    //  SFX resintetizados (capas + variación aleatoria)
    // --------------------------------------------------------
    sfx(name) {
      if (!this.ready || this.muted) return;
      const rr = (a) => 1 + (Math.random() * 2 - 1) * a;
      const pan = (a) => (Math.random() * 2 - 1) * a;
      switch (name) {
        case 'swing':
          this.noise({ freq: 2400 * rr(0.15), to: 620, dur: 0.13, gain: 0.15, q: 0.9, pan: pan(0.4), verb: 0.12 });
          this.noise({ freq: 3600 * rr(0.2), to: 900, dur: 0.1, gain: 0.06, q: 1.4, delay: 0.012, pan: pan(0.5) });
          break;
        case 'swing2':
          this.noise({ freq: 1800 * rr(0.15), to: 460, dur: 0.16, gain: 0.17, q: 1, pan: pan(0.4), verb: 0.12 });
          this.tone({ freq: 190 * rr(0.1), to: 85, dur: 0.12, type: 'sawtooth', gain: 0.05, filter: 700 });
          break;
        case 'hit': {
          const p = rr(0.12);
          this.noise({ freq: 1300 * p, to: 240, dur: 0.09, gain: 0.28, q: 0.8, type: 'lowpass', pan: pan(0.3), verb: 0.18 });
          this.tone({ freq: 215 * p, to: 66, dur: 0.085, type: 'sine', gain: 0.2 });
          this.noise({ freq: 3100, dur: 0.016, gain: 0.1, type: 'highpass' });
          break;
        }
        case 'crit': {
          const p = rr(0.1);
          this.noise({ freq: 1500 * p, to: 220, dur: 0.15, gain: 0.3, q: 0.7, type: 'lowpass', verb: 0.25, pan: pan(0.35) });
          this.tone({ freq: 110 * p, to: 36, dur: 0.18, type: 'sawtooth', gain: 0.16, filter: 420 });
          this.tone({ freq: 1180, dur: 0.26, type: 'sine', gain: 0.06, verb: 0.35, echo: 0.2 });
          this.noise({ freq: 3200, dur: 0.03, gain: 0.09, type: 'highpass' });
          break;
        }
        case 'hurt': {
          const p = rr(0.1);
          this.tone({ freq: 210 * p, to: 82, dur: 0.22, type: 'sawtooth', gain: 0.2, filter: 850, filterTo: 260, vib: 14, vibRate: 9 });
          this.noise({ freq: 560 * p, to: 150, dur: 0.16, gain: 0.16, q: 1 });
          this.tone({ freq: 105, to: 58, dur: 0.14, type: 'sine', gain: 0.12 });
          break;
        }
        case 'dash':
          this.noise({ freq: 480, to: 3200 * rr(0.15), dur: 0.18, gain: 0.11, q: 0.55, type: 'highpass', pan: pan(0.35), verb: 0.1 });
          this.tone({ freq: 230, to: 520, dur: 0.14, type: 'sine', gain: 0.04 });
          break;
        case 'step':
          this.noise({ freq: 480 * rr(0.3), to: 240, dur: 0.05, gain: 0.05, q: 0.8, type: 'lowpass', pan: pan(0.25) });
          break;
        case 'ui':
          this.tone({ freq: 740, dur: 0.06, type: 'sine', gain: 0.08 });
          this.tone({ freq: 1110, dur: 0.09, type: 'triangle', gain: 0.022, delay: 0.018, verb: 0.15 });
          break;
        case 'uiMove':
          this.tone({ freq: 470 * rr(0.06), dur: 0.04, type: 'triangle', gain: 0.05 });
          break;
        case 'pick':
          this.tone({ freq: 760, to: 720, dur: 0.13, type: 'triangle', gain: 0.1, echo: 0.3, verb: 0.2 });
          this.tone({ freq: 1140, dur: 0.16, type: 'sine', gain: 0.07, delay: 0.07, echo: 0.3, verb: 0.25 });
          break;
        case 'coin':
          this.tone({ freq: 1245, dur: 0.06, type: 'sine', gain: 0.09, echo: 0.25 });
          this.tone({ freq: 1865, dur: 0.1, type: 'sine', gain: 0.06, delay: 0.045, echo: 0.25, verb: 0.2 });
          this.noise({ freq: 6000, dur: 0.03, gain: 0.025, type: 'highpass', delay: 0.04 });
          break;
        case 'heal':
          [523, 659, 784].forEach((f, i) =>
            this.tone({ freq: f, to: f * 1.06, dur: 0.3, type: 'sine', gain: 0.1, delay: i * 0.09, vib: 5, verb: 0.35, echo: 0.2 }));
          this.noise({ freq: 5200, to: 7400, dur: 0.35, gain: 0.03, type: 'highpass', verb: 0.4 });
          break;
        case 'cast':
          this.tone({ freq: 300 * rr(0.12), to: 920, dur: 0.17, type: 'sawtooth', gain: 0.09, filter: 2000, filterTo: 3400, verb: 0.2 });
          this.noise({ freq: 2800, to: 5200, dur: 0.18, gain: 0.04, type: 'highpass', verb: 0.3 });
          break;
        case 'fire': {
          this.noise({ freq: 950 * rr(0.2), to: 260, dur: 0.34, gain: 0.18, q: 0.6, type: 'lowpass', brown: true, verb: 0.2 });
          this.tone({ freq: 150 * rr(0.15), to: 58, dur: 0.3, type: 'sawtooth', gain: 0.1, filter: 500 });
          for (let i = 0; i < 3; i++) {
            this.noise({ freq: 2400 + i * 900, dur: 0.03, gain: 0.05, type: 'bandpass', q: 2, delay: 0.05 + i * 0.09 + Math.random() * 0.04 });
          }
          break;
        }
        case 'ice':
          this.tone({ freq: 1560 * rr(0.08), to: 2240, dur: 0.17, type: 'triangle', gain: 0.1, verb: 0.35, echo: 0.25 });
          this.tone({ freq: 2090, dur: 0.14, type: 'sine', gain: 0.06, delay: 0.05, verb: 0.35 });
          this.noise({ freq: 4200, to: 2600, dur: 0.22, gain: 0.06, type: 'highpass', verb: 0.3 });
          break;
        case 'shoot':
          this.tone({ freq: 700 * rr(0.1), to: 300, dur: 0.12, type: 'triangle', gain: 0.09, pan: pan(0.25) });
          this.noise({ freq: 1900, to: 800, dur: 0.08, gain: 0.05, q: 1.2 });
          break;
        case 'explode': {
          const p = rr(0.08);
          this.noise({ freq: 1100 * p, to: 80, dur: 0.5, gain: 0.3, q: 0.5, type: 'lowpass', brown: true, verb: 0.3 });
          this.tone({ freq: 92 * p, to: 30, dur: 0.46, type: 'sine', gain: 0.26 });
          this.noise({ freq: 2600, to: 700, dur: 0.2, gain: 0.08, q: 0.8, delay: 0.04, verb: 0.25 });
          break;
        }
        case 'levelup':
          [523, 659, 784, 1046].forEach((f, i) => {
            this.tone({ freq: f, dur: 0.2, type: 'triangle', gain: 0.12, delay: i * 0.075, echo: 0.3, verb: 0.3 });
            this.tone({ freq: f * 2, dur: 0.14, type: 'sine', gain: 0.04, delay: i * 0.075, verb: 0.3 });
          });
          this.tone({ freq: 523, dur: 0.8, type: 'sine', gain: 0.05, attack: 0.25, delay: 0.3, verb: 0.4 });
          break;
        case 'door':
          this.tone({ freq: 84, to: 46, dur: 0.38, type: 'sine', gain: 0.2 });
          this.noise({ freq: 320, to: 110, dur: 0.45, gain: 0.12, q: 1.4, verb: 0.25 });
          this.tone({ freq: 190, to: 150, dur: 0.5, type: 'sawtooth', gain: 0.045, filter: 260, attack: 0.1 });
          break;
        case 'death':
          this.tone({ freq: 265, to: 52, dur: 0.85, type: 'sawtooth', gain: 0.2, filter: 1100, filterTo: 140, vib: 9, vibRate: 6, verb: 0.3 });
          this.tone({ freq: 132, to: 38, dur: 0.8, type: 'sine', gain: 0.14 });
          this.noise({ freq: 700, to: 120, dur: 0.7, gain: 0.1, q: 0.8, type: 'lowpass', verb: 0.3 });
          break;
        case 'roar':
          this.tone({ freq: 88 * rr(0.1), to: 44, dur: 0.85, type: 'sawtooth', gain: 0.22, filter: 560, vib: 16, vibRate: 6.5, verb: 0.3 });
          this.tone({ freq: 96, to: 50, dur: 0.8, type: 'sawtooth', gain: 0.14, filter: 420, det: 9 });
          this.noise({ freq: 280, to: 105, dur: 0.8, gain: 0.16, q: 2, verb: 0.2 });
          this.tone({ freq: 55, to: 30, dur: 0.8, type: 'sine', gain: 0.18 });
          break;
        case 'bark':
          this.tone({ freq: 400 * rr(0.12), to: 210, dur: 0.08, type: 'sawtooth', gain: 0.13, filter: 1400 });
          this.tone({ freq: 360 * rr(0.12), to: 190, dur: 0.09, type: 'sawtooth', gain: 0.11, filter: 1200, delay: 0.11 });
          this.noise({ freq: 900, to: 400, dur: 0.06, gain: 0.05, q: 1, delay: 0.02 });
          break;
        case 'slam':
          this.tone({ freq: 72 * rr(0.1), to: 26, dur: 0.5, type: 'sine', gain: 0.3 });
          this.noise({ freq: 480 * rr(0.15), to: 70, dur: 0.42, gain: 0.28, q: 0.6, type: 'lowpass', brown: true, verb: 0.28 });
          this.noise({ freq: 2800, dur: 0.025, gain: 0.1, type: 'highpass' });
          break;
        case 'block':
          [740, 1170, 1730].forEach((f, i) =>
            this.tone({ freq: f * rr(0.05), to: f * 0.92, dur: 0.16 - i * 0.03, type: 'sine', gain: 0.09 - i * 0.025, verb: 0.3 }));
          this.noise({ freq: 3200, dur: 0.05, gain: 0.06, q: 1.5, type: 'bandpass' });
          this.tone({ freq: 160, to: 90, dur: 0.08, type: 'sine', gain: 0.08 });
          break;
        case 'error':
          this.tone({ freq: 196, dur: 0.09, type: 'square', gain: 0.07, filter: 900 });
          this.tone({ freq: 174, dur: 0.12, type: 'square', gain: 0.07, filter: 800, delay: 0.12 });
          break;
        case 'teleport':
          this.tone({ freq: 220, to: 1760, dur: 0.34, type: 'sine', gain: 0.09, verb: 0.3, echo: 0.3 });
          this.noise({ freq: 1800, to: 6400, dur: 0.3, gain: 0.045, type: 'highpass', verb: 0.35 });
          break;
        case 'relic':
          [392, 523, 659].forEach((f, i) => {
            this.tone({ freq: f, dur: 0.8, type: 'sine', gain: 0.09, delay: i * 0.13, verb: 0.45, echo: 0.25 });
            this.tone({ freq: f * 2.76, dur: 0.5, type: 'sine', gain: 0.028, delay: i * 0.13, verb: 0.45 });
            this.tone({ freq: f * 5.4, dur: 0.3, type: 'sine', gain: 0.012, delay: i * 0.13, verb: 0.45 });
          });
          break;
      }
    },

    // --------------------------------------------------------
    //  Música: canciones por bioma (formato compatible; campos
    //  nuevos opcionales: prog, drums, bassPat)
    // --------------------------------------------------------
    SONGS: {
      title: { bpm: 74, root: 55, scale: [0, 3, 5, 7, 10], arp: [0, 7, 12, 7, 3, 10, 7, 5], lead: true, prog: [0, 3, 2, 1], drums: 'air', bassPat: 'sparse' },
      hub: { bpm: 88, root: 49, scale: [0, 2, 3, 7, 8], arp: [0, 12, 7, 15, 3, 12, 7, 10], lead: false, prog: [0, 2, 1, 3], drums: 'soft', bassPat: 'groove' },
      jungla: { bpm: 104, root: 50, scale: [0, 3, 5, 6, 10], arp: [0, 7, 10, 7, 12, 10, 7, 3], lead: true, prog: [0, 3, 1, 2], drums: 'full', bassPat: 'groove' },
      cavernas: { bpm: 92, root: 45, scale: [0, 1, 5, 7, 8], arp: [0, 5, 7, 12, 7, 5, 1, 5], lead: true, prog: [0, 1, 0, 3], drums: 'soft', bassPat: 'sparse' },
      omnitopia: { bpm: 118, root: 52, scale: [0, 2, 5, 7, 9], arp: [0, 2, 7, 9, 12, 9, 7, 2], lead: true, prog: [0, 2, 3, 1], drums: 'drive', bassPat: 'drive' },
      boss: { bpm: 136, root: 43, scale: [0, 1, 3, 6, 7], arp: [0, 3, 6, 7, 6, 3, 12, 7], lead: true, prog: [0, 3, 0, 2], drums: 'drive', bassPat: 'drive' },
      death: { bpm: 60, root: 43, scale: [0, 3, 5, 6, 10], arp: [12, 7, 3, 0, 3, 7, 12, 7], lead: false, prog: [0, 2, 1, 0], drums: 'air', bassPat: 'sparse' },
    },

    // patrones de bajo por compás doble (16 corcheas)
    BASS: {
      sparse: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      groove: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0],
      drive: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1],
    },

    hz(root, semis) { return root * Math.pow(2, semis / 12) * 4; },

    music(id) {
      if (this.cur === id) return;
      this.cur = id;
      this.step = 0;
      this.bar = 0;
      this.nextTime = this.now() + 0.05;
      if (!this.ready) return;
      const song = this._norm(id);
      if (song) {
        this._phraseA = this._makePhrase(song, 0);
        this._phraseB = this._makePhrase(song, 1);
        this._phraseFor = id;
      }
    },

    // completa campos por defecto (compatible con temas externos)
    _norm(id) {
      const raw = this.SONGS[id];
      if (!raw) return null;
      if (raw._v2) return raw._v2;
      const s = Object.assign({}, raw);
      if (!s.prog) s.prog = [0, 2, 1, 3];
      if (!s.drums) s.drums = s.bpm >= 120 ? 'drive' : s.bpm >= 95 ? 'full' : s.bpm >= 80 ? 'soft' : 'air';
      if (!s.bassPat) s.bassPat = s.drums === 'drive' ? 'drive' : s.drums === 'air' ? 'sparse' : 'groove';
      raw._v2 = s;
      return s;
    },

    // tríada construida sobre la escala (grados con octava envolvente)
    _chord(song, deg) {
      const sc = song.scale, n = sc.length;
      const pick = (k) => (k < n ? sc[k] : sc[k % n] + 12 * Math.floor(k / n));
      return [pick(deg), pick(deg + 2), pick(deg + 4)];
    },

    // frase melódica de 16 pasos, determinista por tema y variante
    _makePhrase(song, variant) {
      const rng = mulberry32(((song.root || 50) * 131 + Math.round(song.bpm || 100) * 7 + variant * 977) | 0);
      const sc = song.scale, n = sc.length;
      const slots = new Array(16).fill(null);
      let s = Math.floor(rng() * 3);
      while (s < 16) {
        const b = Math.floor(s / 8);
        const chord = this._chord(song, song.prog[b % song.prog.length]);
        let semi;
        if (s % 4 === 0) semi = chord[Math.floor(rng() * 3)];
        else semi = sc[Math.floor(rng() * n)];
        if (rng() < 0.24) semi += 12;
        slots[s] = semi;
        s += 1 + Math.floor(rng() * 3) + (rng() < 0.18 ? 1 : 0);
      }
      return slots;
    },

    update() {
      if (!this.ready || this.muted || !this.cur) return;
      const song = this._norm(this.cur);
      if (!song) return;
      if (this._phraseFor !== this.cur) {
        this._phraseA = this._makePhrase(song, 0);
        this._phraseB = this._makePhrase(song, 1);
        this._phraseFor = this.cur;
      }
      const sd = 60 / song.bpm / 2;
      const now = this.now();
      if (this.nextTime < now - 0.1) this.nextTime = now + 0.05; // resincroniza tras pausas
      let guard = 0;
      while (this.nextTime < now + 0.25 && guard++ < 16) {
        this._schedStep(song, this.nextTime, this.step, this.bar, sd);
        this.step = (this.step + 1) % 16;
        if (this.step === 0) this.bar++;
        this.nextTime += sd;
      }
    },

    _schedStep(song, t, s, bar, sd) {
      const chord = this._chord(song, song.prog[bar % song.prog.length]);
      // pad de acordes al inicio de cada compás
      if (s === 0) {
        const dur = sd * 8;
        for (let i = 0; i < 3; i++) {
          this.tone({ freq: this.hz(song.root, chord[i]), type: 'sawtooth', dur: dur * 1.02, gain: 0.026, attack: dur * 0.35, hold: dur * 0.42, at: t, bus: this.musicGain, filter: 720, verb: 0.5, pan: i === 0 ? -0.3 : i === 2 ? 0.3 : 0, det: (i - 1) * 5 });
          this.tone({ freq: this.hz(song.root, chord[i]), type: 'triangle', dur: dur * 1.02, gain: 0.02, attack: dur * 0.3, hold: dur * 0.4, at: t, bus: this.musicGain, filter: 950, verb: 0.35, det: (1 - i) * 4 });
        }
      }
      // bajo con groove
      const pat = this.BASS[song.bassPat] || this.BASS.groove;
      if (pat[s]) {
        const semi = chord[0] - (s === 15 ? 0 : 12);
        this.tone({ freq: this.hz(song.root, semi), type: 'triangle', dur: sd * 1.9, gain: 0.15, attack: 0.012, at: t, bus: this.musicGain, filter: 520 });
        this.tone({ freq: this.hz(song.root, semi - 12), type: 'sine', dur: sd * 1.7, gain: 0.1, attack: 0.012, at: t, bus: this.musicGain });
      }
      // arpegio con eco y paneo alternado
      const air = song.drums === 'air';
      if (!air || s % 2 === 0) {
        const deg = song.arp[s % song.arp.length];
        const saw = s % 4 === 2;
        this.tone({ freq: this.hz(song.root, deg), type: saw ? 'sawtooth' : 'triangle', dur: sd * 1.5, gain: saw ? 0.02 : 0.038, at: t, bus: this.musicGain, filter: saw ? 1800 : 2800, pan: s % 2 ? 0.3 : -0.3, echo: 0.3, verb: 0.12 });
      }
      // melodía compuesta (frases A/B)
      if (song.lead) {
        const ph = bar % 2 === 0 ? this._phraseA : this._phraseB;
        const semi = ph ? ph[s] : null;
        if (semi !== null && semi !== undefined) {
          this.tone({ freq: this.hz(song.root, semi + 12), type: 'sine', dur: sd * 2.6, gain: 0.052, attack: 0.04, hold: sd * 0.8, at: t, bus: this.musicGain, vib: 7, vibRate: 5.2, verb: 0.3, pan: 0.1, det: 3 });
          this.tone({ freq: this.hz(song.root, semi + 12), type: 'triangle', dur: sd * 2, gain: 0.016, attack: 0.06, at: t, bus: this.musicGain, filter: 2200, verb: 0.22, det: -6 });
        }
      }
      // percusión según estilo
      const bs = s % 8, d = song.drums;
      if (d === 'drive') {
        if (bs === 0 || bs === 6) this.kick(t, 1);
        if (bs === 4) this.snare(t, 1);
        this.hat(t, s % 2 ? 0.45 : 0.9, s === 7);
      } else if (d === 'full') {
        if (bs === 0) this.kick(t, 0.85);
        if (bs === 4) this.snare(t, 0.75);
        if (s % 2 === 0) this.hat(t, bs % 4 === 2 ? 0.7 : 0.4);
      } else if (d === 'soft') {
        if (bs === 0 && bar % 2 === 0) this.kick(t, 0.55);
        if (bs === 4 && bar % 2 === 1) this.snare(t, 0.4);
        if (s % 4 === 2) this.hat(t, 0.35);
      } else if (d === 'air') {
        if (bs === 0 && bar % 4 === 0) this.kick(t, 0.4);
        if (s % 8 === 6) this.hat(t, 0.28);
      }
    },
  };

  window.Snd = Snd;
})();
