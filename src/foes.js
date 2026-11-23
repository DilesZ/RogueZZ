// ============================================================
//  Enemigos y jefes
// ============================================================
(function () {
  const PI = Math.PI;

  class Enemy {
    constructor(type, x, y, o) {
      o = o || {};
      this.type = type;
      this.x = x; this.y = y;
      this.vx = 0; this.vy = 0;
      this.r = 7;
      this.team = 'foe';
      this.elite = !!o.elite;
      this.boss = false;
      this.alive = true;
      this.remove = false;
      this.state = 'spawn';
      this.t = 0;
      this.spawnT = 0.45;
      this.hp = 20; this.maxHp = 20;
      this.damage = 8;
      this.speed = 40;
      this.flash = 0;
      this.stun = 0;
      this.deadT = 0;
      this.pose = Rig.defaultPose();
      this.face = 1;
      this.animT = 0;
      this.telegraph = 0;
      this.armorMul = 1;
      this.xp = 6;
      this.essence = 1;
      this.scale = 1;
      this.phase = 0;
      this.noKnock = false;
      this.hover = 0;
      this.pal = {};
      this.weapon = null;
      this.bulk = 1;
      this.hurtCount = 0;
      this.slowT = 0;
      this.slowMul = 1;
      this.spawnY = y;
    }

    get cx() { return this.x; }
    get cy() { return this.y - 14 * this.scale; }

    setup(type, o) {
      switch (type) {
        case 'grub':
          this.hp = 26; this.maxHp = 26; this.damage = 9; this.speed = 46; this.r = 7;
          this.xp = 6; this.essence = 1;
          break;
        case 'wisp':
          this.hp = 20; this.maxHp = 20; this.damage = 8; this.speed = 52; this.r = 6;
          this.xp = 7; this.essence = 1; this.flying = true;
          break;
        case 'charger':
          this.hp = 46; this.maxHp = 46; this.damage = 13; this.speed = 58; this.r = 10;
          this.xp = 11; this.essence = 2;
          break;
        case 'brute':
          this.hp = 110; this.maxHp = 110; this.damage = 18; this.speed = 30; this.r = 12;
          this.xp = 20; this.essence = 3; this.noKnock = true; this.scale = 1.45;
          break;
        case 'spitter':
          this.hp = 38; this.maxHp = 38; this.damage = 10; this.speed = 26; this.r = 9;
          this.xp = 12; this.essence = 2;
          break;
      }
      if (o.elite) {
        this.hp = Math.round(this.hp * 2.5);
        this.maxHp = this.hp;
        this.damage = Math.round(this.damage * 1.35);
        this.speed *= 0.94;
        this.scale *= 1.22;
        this.r *= 1.15;
        this.xp = Math.round(this.xp * 3);
        this.essence *= 4;
        this.noKnock = true;
      }
      this.hpBarT = 2;
    }

    takeDamage(dmg, o) {
      if (!this.alive || this.state === 'spawn') return 0;
      o = o || {};
      dmg *= this.armorMul;
      this.hp -= dmg;
      this.flash = 1;
      this.hpBarT = 2.2;
      this.hurtCount++;
      if (this.hp <= 0) {
        this.die(o);
        return dmg;
      }
      if (!this.noKnock) {
        const a = o.dir !== undefined ? o.dir : 0;
        const k = Math.min(220, (o.knock || 60) / (this.boss ? 8 : this.elite ? 2.2 : 1));
        this.vx += Math.cos(a) * k;
        this.vy += Math.sin(a) * k;
        this.stun = Math.max(this.stun, (o.stun || 0) + (this.elite ? 0.05 : 0.12));
      }
      return dmg;
    }

    die(o) {
      this.alive = false;
      this.state = 'dead';
      this.deadT = 0;
      this.hp = 0;
      const c = this.deathColor || '#c8b8a0';
      Gfx.P.burst(this.x, this.y - 10 * this.scale, 16, {
        color: [c, '#ffffff', '#2b1d16'], speed: 120, life: 0.7, size: 2.2, glow: true, grav: 120,
      });
      Gfx.P.burst(this.x, this.y - 10 * this.scale, 8, { color: c, speed: 60, life: 1.0, size: 1.4, glow: true, grav: -30 });
      Snd.sfx('hit');
      if (window.Game && Game.onEnemyDeath) Game.onEnemyDeath(this, o);
    }

    applySlow(f, dur) {
      this.slowMul = Math.min(this.slowMul, 1 - f);
      this.slowT = Math.max(this.slowT, dur);
    }

    updateCommon(dt, g) {
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 4);
      if (this.hpBarT > 0) this.hpBarT -= dt;
      if (this.slowT > 0) {
        this.slowT -= dt;
        if (this.slowT <= 0) this.slowMul = 1;
      }
      if (this.stun > 0) {
        this.stun -= dt;
        this.vx *= 0.9; this.vy *= 0.9;
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.animT += dt;
        if (!this.flying) g.room.collide(this, dt);
        return true;
      }
      return false;
    }

    update(dt, g) {
      this.t += dt;
      this.animT += dt;
      if (this.state === 'dead') {
        this.deadT += dt;
        if (this.deadT > 0.45) this.remove = true;
        return;
      }
      if (this.state === 'spawn') {
        if (this.t >= this.spawnT) {
          this.state = 'chase';
          this.t = 0;
        }
        return;
      }
      if (this.updateCommon(dt, g)) return;
      this.ai(dt, g);
      const sp = Math.hypot(this.vx, this.vy);
      if (sp > 1) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= Math.exp(-5 * dt);
        this.vy *= Math.exp(-5 * dt);
      }
      if (!this.flying) g.room.collide(this, dt);
      const hero = g.hero;
      if (Math.abs(hero.x - this.x) > 3) this.face = hero.x > this.x ? 1 : -1;
    }

    moveToward(tx, ty, dt, mul) {
      const a = E.angTo(this.x, this.y, tx, ty);
      const sp = this.speed * (mul === undefined ? 1 : mul) * this.slowMul;
      this.vx = E.smooth(this.vx, Math.cos(a) * sp, 6, dt);
      this.vy = E.smooth(this.vy, Math.sin(a) * sp, 6, dt);
    }

    drawSpawn(ctx) {
      const k = E.clamp01(this.t / this.spawnT);
      const r = 12 * (1 - k) + 4;
      Gfx.ring(this.x, this.y - 2, r + k * 8, '#b06be8', 0.8 * (1 - k), 2);
      Gfx.glow(this.x, this.y - 10, 16, '#8a4bd8', 0.35 * (1 - k));
    }

    drawBar(ctx) {
      if (this.hpBarT <= 0 && !this.boss) return;
      const w = this.boss ? 0 : 22 * this.scale;
      if (!w) return;
      const y = this.y - 34 * this.scale;
      const frac = E.clamp01(this.hp / this.maxHp);
      ctx.globalAlpha = E.clamp01(this.hpBarT);
      Gfx.rect(this.x - w / 2 - 1, y - 1, w + 2, 4, 'rgba(0,0,0,0.6)');
      Gfx.rect(this.x - w / 2, y, w * frac, 2, this.elite ? '#f0c05a' : '#d84a3f');
      ctx.globalAlpha = 1;
    }

    draw(ctx, g) {
      if (this.state === 'dead') return;
      Art.drawFoe(ctx, this, g.time);
      if (this.elite) {
        Gfx.ring(this.x, this.y - 14 * this.scale, 16 * this.scale, '#f0c05a', 0.35 + Math.sin(g.time * 4) * 0.1, 1);
        Gfx.text('✦', this.x, this.y - 40 * this.scale, { size: 1, color: '#f0c05a', align: 'center' });
      }
      this.drawBar(ctx);
    }

    drawGrub(ctx, g) {
      const t = this.animT;
      const wig = Math.sin(t * 8) * 1.5;
      const sx = this.x, sy = this.y + Math.sin(t * 9) * 0.8;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(this.face * this.scale, this.scale);
      // cuerpo segmentado
      const body = this.elite ? '#8a6bd8' : '#6b7f3a';
      const dark = this.elite ? '#4a2f8a' : '#3c4a1e';
      for (let i = 0; i < 3; i++) {
        const bx = -4 + i * 3.4;
        const by = -5 - Math.sin(t * 8 + i) * 1;
        const rr = 4.2 - i * .35;
        Gfx.circ(bx, by, rr, '#161018');
        const shell = ctx.createRadialGradient(bx - 1.5, by - 2, .2, bx, by, rr);
        shell.addColorStop(0, E.shade(body, .24)); shell.addColorStop(.5, i === 2 ? body : E.shade(body, -.08));
        shell.addColorStop(1, dark);
        ctx.fillStyle = shell; ctx.beginPath(); ctx.arc(bx, by - .4, 3.5 - i * .3, 0, TAU); ctx.fill();
        Gfx.circ(bx - 1.1, by - 2.1, .65, E.alpha('#fff6c8', .46));
      }
      // cabeza
      Gfx.circ(4.5, -7 + wig * 0.3, 4.3, '#161018');
      const head = ctx.createRadialGradient(3.2, -9.2 + wig * .3, .2, 4.5, -7.4 + wig * .3, 4.5);
      head.addColorStop(0, E.shade(body, .24)); head.addColorStop(.65, E.shade(body, .08)); head.addColorStop(1, dark);
      ctx.fillStyle = head; ctx.beginPath(); ctx.arc(4.5, -7.4 + wig * .3, 3.5, 0, TAU); ctx.fill();
      // mandíbulas
      ctx.strokeStyle = '#d8cfae';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(7, -6 + wig * 0.3); ctx.lineTo(9.5, -7.5 + wig * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7, -5 + wig * 0.3); ctx.lineTo(9.5, -3.5 + wig * 0.3); ctx.stroke();
      // ojos
      ctx.fillStyle = this.telegraph > 0 ? '#ff5a4a' : '#ffd24a';
      ctx.fillRect(5.4, -9, 1.6, 1.6);
      ctx.fillRect(3.2, -9.2, 1.4, 1.4);
      // patas
      ctx.strokeStyle = dark;
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) {
        const lx = -4 + i * 3.6;
        ctx.beginPath(); ctx.moveTo(lx, -2.5); ctx.lineTo(lx - 1.4, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lx, -2.5); ctx.lineTo(lx + 1.2, 0); ctx.stroke();
      }
      if (this.flash > 0) {
        Gfx.glow(this.x, this.y - 6 * this.scale, 16 * this.scale, '#ffffff', this.flash * 0.4);
      }
      ctx.restore();
      if (this.telegraph > 0) Gfx.ring(this.x, this.y - 6, 14, '#ff5a4a', this.telegraph * 0.6, 1.5);
    }

    drawWisp(ctx, g) {
      const t = this.animT;
      const fy = Math.sin(t * 2.6) * 3;
      const y = this.y - 16 + fy;
      Gfx.glow(this.x, y, 16, this.elite ? '#c8a0ff' : '#6de8ff', 0.5);
      // tentáculos
      ctx.strokeStyle = this.elite ? '#8a6bd8' : '#4fbfe0';
      ctx.lineWidth = 1.2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(this.x + i * 2, y + 2);
        ctx.quadraticCurveTo(this.x + i * 4 + Math.sin(t * 6 + i) * 3, y + 8, this.x + i * 5 + Math.sin(t * 5 + i) * 4, y + 13);
        ctx.stroke();
      }
      Gfx.circ(this.x, y, 4.6, this.elite ? '#3a1f6a' : '#1a4a5c');
      const core = ctx.createRadialGradient(this.x - 1.2, y - 1.5, .3, this.x, y, 4.6);
      core.addColorStop(0, '#ffffff'); core.addColorStop(.3, this.elite ? '#eadbff' : '#d8fbff');
      core.addColorStop(.72, this.elite ? '#a98bff' : '#8fe8ff'); core.addColorStop(1, this.elite ? '#4a2a75' : '#28657b');
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(this.x, y, 3.6, 0, TAU); ctx.fill();
      Gfx.arc(this.x, y, 7.2, t * 1.7, t * 1.7 + 2.2, this.elite ? '#e2caff' : '#c8f8ff', .4, .8);
      Gfx.circ(this.x - 0.8, y - 0.8, 2.2, '#ffffff');
      ctx.fillStyle = '#14101a';
      ctx.fillRect(this.x - 1.6, y - 1, 1.4, 1.6);
      ctx.fillRect(this.x + 0.6, y - 1, 1.4, 1.6);
      if (this.telegraph > 0) {
        Gfx.ring(this.x, y, 9 + this.telegraph * 4, '#ff5a4a', 0.7, 1);
        Gfx.glow(this.x, y, 12, '#ff5a4a', 0.4);
      }
      if (this.flash > 0) { ctx.globalCompositeOperation = 'lighter'; Gfx.glow(this.x, y, 14, '#fff', this.flash * 0.5); ctx.globalCompositeOperation = 'source-over'; }
    }

    drawCharger(ctx, g) {
      const t = this.animT;
      const s = this.scale;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(this.face * s, s);
      const body = this.elite ? '#7a4a8a' : '#8a4a3a';
      const light = this.elite ? '#a87ab8' : '#b06a52';
      const dark = this.elite ? '#43204a' : '#4a2118';
      // patas
      const ph = t * (this.state === 'charge' ? 26 : 8);
      const lp = Math.sin(ph) * 2.4;
      ctx.strokeStyle = dark; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(-5 + lp, -0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, -6); ctx.lineTo(5 - lp, -0.5); ctx.stroke();
      // cuerpo
      ctx.fillStyle = '#1a1210';
      ctx.beginPath(); ctx.ellipse(0, -8, 9, 6, 0, 0, PI * 2); ctx.fill();
      const hide = ctx.createLinearGradient(-1, -14, 3, -3);
      hide.addColorStop(0, E.shade(light, .18)); hide.addColorStop(.38, body); hide.addColorStop(1, dark);
      ctx.fillStyle = hide;
      ctx.beginPath(); ctx.ellipse(0, -8, 8.3, 5.3, 0, 0, PI * 2); ctx.fill();
      // lomo
      ctx.fillStyle = dark;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 4 - 1.5, -12.6);
        ctx.lineTo(i * 4, -16.5);
        ctx.lineTo(i * 4 + 1.6, -12);
        ctx.fill();
      }
      ctx.strokeStyle = E.alpha(this.elite ? '#d7aaff' : '#ffd2a1', .38);
      ctx.lineWidth = .7;
      ctx.beginPath(); ctx.moveTo(-5, -11.2); ctx.quadraticCurveTo(0, -13.5, 5, -11.2); ctx.stroke();
      // cabeza
      ctx.fillStyle = '#1a1210';
      ctx.beginPath(); ctx.ellipse(8, -9, 5.4, 4.8, 0, 0, PI * 2); ctx.fill();
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.ellipse(8, -9, 4.7, 4.1, 0, 0, PI * 2); ctx.fill();
      ctx.fillStyle = '#2a1a12';
      ctx.beginPath(); ctx.ellipse(12, -8, 2.4, 2, 0, 0, PI * 2); ctx.fill();
      // colmillos
      ctx.fillStyle = '#f0e6cc';
      ctx.beginPath(); ctx.moveTo(10, -7); ctx.lineTo(13.4, -9.6); ctx.lineTo(10.6, -6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(12.6, -3.4); ctx.lineTo(10.2, -5.6); ctx.fill();
      // ojo
      ctx.fillStyle = this.telegraph > 0 ? '#ff3a2a' : '#ffd24a';
      ctx.fillRect(8.4, -11.2, 1.8, 1.6);
      // oreja
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(5, -12); ctx.lineTo(3, -15.6); ctx.lineTo(7, -12.4); ctx.fill();
      if (this.flash > 0) {
        Gfx.glow(this.x, this.y - 8 * this.scale, 18 * this.scale, '#ffffff', this.flash * 0.4);
      }
      ctx.restore();
      if (this.state === 'windup') {
        const a = this.chargeAng || 0;
        Gfx.line(this.x, this.y - 8, this.x + Math.cos(a) * 34, this.y - 8 + Math.sin(a) * 34, E.alpha('#ff4a3a', 0.35 * this.telegraph), 2);
      }
    }

    drawBrute(ctx, g) {
      const p = this.pose;
      Rig.draw(ctx, {
        x: this.x, y: this.y, s: this.scale, face: this.face, pose: p,
        pal: {
          skin: this.elite ? '#8a6bd8' : '#7a8a5a', hair: '#2a2a20',
          cloth: this.elite ? '#4a2f8a' : '#3a4a2a', cloth2: '#2a3520',
          leather: '#4a3a2a', metal: '#8a8a7a', metalDark: '#4a4a3a',
          accent: '#c8a06a', cape: '#243018', outline: '#12100c',
          eye: '#ff6a3a', horn: '#d8cfae',
        },
        weapon: 'club', horns: true, bulk: 1.25, wLen: 17,
        hurt: this.flash, cape: 0.3, t: g.time,
      });
      if (this.state === 'windup') {
        Gfx.ring(this.x, this.y - 10, 26 * this.telegraph, '#ff5a4a', 0.5 * (1 - this.telegraph), 2);
      }
      if (this.state === 'slam') {
        Gfx.ring(this.x, this.y, 24 + (1 - this.telegraph) * 40, '#ffb03a', this.telegraph * 0.6, 2);
      }
    }

    drawSpitter(ctx, g) {
      const t = this.animT;
      const s = this.scale;
      const bob = Math.sin(t * 3) * 1;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(s, s);
      Gfx.circ(0, -4, 6.5, '#1a1210');
      const shell = ctx.createRadialGradient(-2.5, -8, .4, 0, -4.5, 8);
      shell.addColorStop(0, this.elite ? '#ead8ff' : '#ffe0ca');
      shell.addColorStop(.42, this.elite ? '#c8a0ff' : '#e8a0b0');
      shell.addColorStop(1, this.elite ? '#4a2e67' : '#74404a');
      ctx.fillStyle = shell;
      ctx.beginPath(); ctx.ellipse(0, -4.5, 5.8, 5.8, 0, 0, PI * 2); ctx.fill();
      ctx.fillStyle = this.elite ? '#e6caff' : '#fff0df';
      ctx.beginPath(); ctx.ellipse(0, -7.5 + bob, 8, 5.5, 0, PI, PI * 2); ctx.fill();
      ctx.fillStyle = '#f0d8e0';
      for (let i = -1; i <= 1; i++) Gfx.circ(i * 3.4, -9.6 + bob + Math.abs(i) * 0.6, 1.5, '#f0e0e8');
      ctx.fillStyle = '#2a1a20';
      Gfx.circ(-1.8, -4.4, 1.1, '#2a1a20');
      Gfx.circ(1.8, -4.4, 1.1, '#2a1a20');
      if (this.telegraph > 0) Gfx.glow(0, -8, 12, '#ff5a4a', 0.5 * this.telegraph);
      if (this.flash > 0) {
        Gfx.glow(this.x, this.y - 5 * this.scale, 14 * this.scale, '#ffffff', this.flash * 0.4);
      }
      ctx.restore();
    }
  }

  // ---------------- IA por tipo ----------------
  class Grub extends Enemy {
    constructor(x, y, o) {
      super('grub', x, y, o);
      this.setup('grub', o || {});
      this.pal = { body: '#6b7f3a' };
      this.deathColor = '#8aa04a';
      this.telegraph = 0;
    }
    ai(dt, g) {
      const hero = g.hero;
      const d = E.dist(this.x, this.y, hero.x, hero.y);
      this.telegraph = Math.max(0, this.telegraph - dt * 2.5);
      if (this.state === 'chase') {
        if (d < 26) { this.state = 'windup'; this.t = 0; this.telegraph = 1; }
        else this.moveToward(hero.x, hero.y, dt, 1);
      } else if (this.state === 'windup') {
        this.vx *= 0.85; this.vy *= 0.85;
        this.telegraph = 1 - this.t / 0.45;
        if (this.t > 0.45) {
          this.state = 'recover'; this.t = 0;
          const a = E.angTo(this.x, this.y, hero.x, hero.y);
          g.addHit({
            x: this.x + Math.cos(a) * 12, y: this.y - 8 + Math.sin(a) * 8, r: 15,
            damage: this.damage, knock: 120, team: 'foe', life: 0.12, source: this, kind: 'bite', dir: a,
          });
          Snd.sfx('swing');
          this.vx += Math.cos(a) * 80; this.vy += Math.sin(a) * 80;
        }
      } else if (this.state === 'recover') {
        this.vx *= 0.9; this.vy *= 0.9;
        if (this.t > 0.5) { this.state = 'chase'; this.t = 0; }
      }
    }
  }

  class Wisp extends Enemy {
    constructor(x, y, o) {
      super('wisp', x, y, o);
      this.setup('wisp', o || {});
      this.deathColor = '#8fe8ff';
      this.shootCd = E.rnd(1.6, 0.4);
      this.orbit = E.rnd(TAU, 0);
    }
    ai(dt, g) {
      const hero = g.hero;
      const d = E.dist(this.x, this.y, hero.x, hero.y);
      this.telegraph = Math.max(0, this.telegraph - dt * 2);
      this.orbit += dt * 0.8;
      if (this.state === 'chase') {
        const want = 72;
        const a = E.angTo(this.x, this.y, hero.x, hero.y);
        const rad = d < want - 18 ? 1 : d > want + 26 ? -1 : 0;
        const sp = this.speed * this.slowMul;
        this.vx = E.smooth(this.vx, Math.cos(a) * sp * rad + Math.cos(this.orbit) * 18, 4, dt);
        this.vy = E.smooth(this.vy, Math.sin(a) * sp * rad + Math.sin(this.orbit) * 14, 4, dt);
        this.shootCd -= dt;
        if (this.shootCd <= 0 && d < 170) { this.state = 'windup'; this.t = 0; }
      } else if (this.state === 'windup') {
        this.vx *= 0.9; this.vy *= 0.9;
        this.telegraph = Math.min(1, this.t / 0.45);
        if (this.t > 0.45) {
          this.state = 'chase'; this.t = 0;
          this.shootCd = E.rnd(2.4, 1.4);
          const a = E.angTo(this.x, this.y - 16, hero.x, hero.y - 14);
          g.spawnProj({
            x: this.x, y: this.y - 16, vx: Math.cos(a) * 105, vy: Math.sin(a) * 105,
            r: 4, life: 3, color: '#8fe8ff', trail: '#dff7ff', team: 'foe',
            damage: this.damage, knock: 60, kind: 'ice', homing: 0.6,
          });
          Snd.sfx('shoot');
        }
      }
    }
  }

  class Charger extends Enemy {
    constructor(x, y, o) {
      super('charger', x, y, o);
      this.setup('charger', o || {});
      this.deathColor = '#b06a52';
      this.chargeAng = 0;
      this.chargeHits = 0;
    }
    ai(dt, g) {
      const hero = g.hero;
      const d = E.dist(this.x, this.y, hero.x, hero.y);
      this.telegraph = Math.max(0, this.telegraph - dt * 2);
      if (this.state === 'chase') {
        if (d < 140) { this.state = 'windup'; this.t = 0; this.chargeAng = E.angTo(this.x, this.y, hero.x, hero.y); }
        else this.moveToward(hero.x, hero.y, dt, 0.8);
      } else if (this.state === 'windup') {
        this.vx *= 0.86; this.vy *= 0.86;
        this.telegraph = 1 - this.t / 0.6;
        if (this.t > 0.6) {
          this.state = 'charge'; this.t = 0;
          this.chargeHits = 0;
          Snd.sfx('dash');
          Gfx.P.burst(this.x, this.y, 10, { color: '#a08060', speed: 60, life: 0.5, grav: 60 });
        }
      } else if (this.state === 'charge') {
        this.vx = Math.cos(this.chargeAng) * 250;
        this.vy = Math.sin(this.chargeAng) * 250;
        this.chargeHits += dt;
        if (E.dist(this.x, this.y, hero.x, hero.y) < 16 + this.r && this.chargeHits < 0.4) {
          this.chargeHits = 9;
          g.hurtHero(this.damage, { dir: this.chargeAng, knock: 160 });
          Gfx.shake(4);
        }
        if (this.t > 0.55) {
          this.state = 'stun'; this.t = 0;
          this.stun = 0.9;
          Gfx.shake(3);
          Snd.sfx('slam');
        }
      } else if (this.state === 'stun') {
        if (this.t > 0.9) { this.state = 'chase'; this.t = 0; }
      }
    }
  }

  class Brute extends Enemy {
    constructor(x, y, o) {
      super('brute', x, y, o);
      this.setup('brute', o || {});
      this.deathColor = '#9aa87a';
      this.slamCD = 1;
    }
    ai(dt, g) {
      const hero = g.hero;
      const d = E.dist(this.x, this.y, hero.x, hero.y);
      this.telegraph = Math.max(0, this.telegraph - dt * 2);
      this.pose = this.pose || Rig.defaultPose();
      if (this.state === 'chase') {
        this.moveToward(hero.x, hero.y, dt, 1);
        if (d < 46) {
          this.state = 'windup'; this.t = 0;
        }
        this.setArm(null);
      } else if (this.state === 'windup') {
        this.vx *= 0.85; this.vy *= 0.85;
        this.telegraph = 1 - this.t / 0.7;
        this.setArm('up');
        if (this.t > 0.7) {
          this.state = 'slam'; this.t = 0;
          this.telegraph = 1;
          Gfx.shake(6);
          Snd.sfx('slam');
          g.addHit({
            x: this.x + Math.cos(this.face > 0 ? 0 : PI) * 20, y: this.y - 8,
            r: 34, damage: this.damage, knock: 220, team: 'foe', life: 0.16, source: this, kind: 'quake', dir: this.face > 0 ? 0 : PI, stun: 0.3,
          });
          g.spawnProj({
            x: this.x, y: this.y - 4, r: 8, life: 0.5, team: 'foe', damage: 0,
            kind: 'shock', shape: 'ring', expand: 240, maxR: 52, color: '#ffb03a',
          });
        }
      } else if (this.state === 'slam') {
        this.vx *= 0.8; this.vy *= 0.8;
        this.telegraph = Math.max(0, 1 - this.t / 0.5);
        this.setArm('down');
        if (this.t > 0.55) { this.state = 'chase'; this.t = 0; }
      }
    }
    setArm(kind) {
      if (!this.pose) return;
      const p = this.pose;
      if (kind === 'up') {
        p.armF = E.smooth(p.armF, -2.3, 0.4, 1);
        p.armB = E.smooth(p.armB, -2.1, 0.4, 1);
        p.wAng = -2.6;
      } else if (kind === 'down') {
        p.armF = E.smooth(p.armF, 1.3, 0.5, 1);
        p.wAng = 1.5;
      } else {
        p.armF = E.smooth(p.armF, PI / 2 + 0.3, 0.1, 1);
        p.armB = E.smooth(p.armB, PI / 2 - 0.2, 0.1, 1);
        p.wAng = 1.0;
      }
    }
  }

  class Spitter extends Enemy {
    constructor(x, y, o) {
      super('spitter', x, y, o);
      this.setup('spitter', o || {});
      this.deathColor = '#e8a0b0';
      this.shootCd = 1.6;
    }
    ai(dt, g) {
      const hero = g.hero;
      const d = E.dist(this.x, this.y, hero.x, hero.y);
      this.telegraph = Math.max(0, this.telegraph - dt * 2);
      if (this.state === 'chase') {
        if (d > 90) this.moveToward(hero.x, hero.y, dt, 0.8);
        else { this.vx *= 0.9; this.vy *= 0.9; }
        this.shootCd -= dt;
        if (this.shootCd <= 0) { this.shootCd = 2.4; this.state = 'windup'; this.t = 0; }
      } else if (this.state === 'windup') {
        this.telegraph = Math.min(1, this.t / 0.5);
        if (this.t > 0.5) {
          this.state = 'chase'; this.t = 0;
          const base = E.angTo(this.x, this.y - 12, hero.x, hero.y - 14);
          for (let i = -1; i <= 1; i++) {
            const a = base + i * 0.35;
            g.spawnProj({
              x: this.x, y: this.y - 12, vx: Math.cos(a) * 92, vy: Math.sin(a) * 92,
              r: 4, life: 2.6, color: '#d88aa0', trail: '#ffd0e0', team: 'foe',
              damage: this.damage, knock: 50, kind: 'spore',
            });
          }
          Snd.sfx('shoot');
        }
      }
    }
  }

  // ---------------- JEFES ----------------
  class Boss extends Enemy {
    constructor(id, x, y) {
      super('boss', x, y, {});
      this.boss = true;
      this.id = id;
      this.noKnock = true;
      this.armorMul = 1;
      this.phaseMax = 2;
      this.t = 0;
      this.moveT = 0;
      this.moveId = null;
      this.addCD = 0;
      this.alive = true;
      this.state = 'idle';
      this.spawnT = 1.1;
      this.deathColor = '#c8a06a';
      const cfg = {
        guardian: { hp: 260, dmg: 18, scale: 2.15, name: 'GUARDIÁN DE RAÍCES' },
        custodian: { hp: 330, dmg: 20, scale: 2.0, name: 'CUSTODIO DE SAL' },
        alchemist: { hp: 430, dmg: 22, scale: 2.05, name: 'EL ALQUIMISTA HUECO' },
      }[id];
      this.cfg = cfg;
      this.name = cfg.name;
      this.maxHp = cfg.hp;
      this.hp = cfg.hp;
      this.damage = cfg.dmg;
      this.scale = cfg.scale;
      this.r = 14 * (cfg.scale / 2);
      this.speed = 34;
      this.hpBarT = 999;
      this.xp = 90;
      this.essence = 26;
      this.pose = Rig.defaultPose();
      this.bulk = 1.15;
      this.introT = 0;
      this.attackQueue = [];
      this.patternT = 0;
      this.curAttack = null;
      this.projCount = 0;
    }

    takeDamage(dmg, o) {
      if (this.state === 'spawn' || this.state === 'intro') return 0;
      this.hp -= dmg;
      this.flash = 1;
      this.hurtCount++;
      if (this.hp <= 0) {
        this.hp = 0;
        this.die(o);
        return dmg;
      }
      const p = this.hp / this.maxHp;
      const wantPhase = p > 0.66 ? 0 : p > 0.33 ? 1 : 2;
      if (wantPhase > this.phase) {
        this.phase = wantPhase;
        this.patternT = 0;
        Gfx.shake(6);
        Gfx.Fx.flash('#ffffff', 0.3);
        Snd.sfx('roar');
        Game.toast('¡' + this.name + ' se enfurece!', '#f0c05a');
        if (this.phase === 2) this.armorMul = 0.9;
        Game.spawnMinions(this);
      }
      return dmg;
    }

    die(o) {
      this.alive = false;
      this.state = 'dead';
      this.deadT = 0;
      Gfx.shake(10);
      Gfx.Fx.flash('#ffffff', 0.6);
      for (let i = 0; i < 5; i++) {
        Gfx.P.burst(this.x + E.rnd(30, -30), this.y - E.rnd(30, 4), 14, {
          color: ['#f0c05a', '#ffffff', '#c8463c'], speed: 160, life: 1.1, size: 2.4, glow: true, grav: 100,
        });
      }
      Snd.sfx('explode');
      if (window.Game && Game.onBossDeath) Game.onBossDeath(this, o);
    }

    ai(dt, g) {
      const hero = g.hero;
      const dx = hero.x - this.x, dy = hero.y - this.y;
      const d = Math.hypot(dx, dy);
      if (this.face !== (dx > 0 ? 1 : -1)) this.face = dx > 0 ? 1 : -1;
      this.telegraph = Math.max(0, this.telegraph - dt * 2);
      const speedMul = 1 + this.phase * 0.22;

      if (this.state === 'intro') {
        if (this.t > 1.2) { this.state = 'idle'; this.t = 0; this.patternT = 0.6; }
        return;
      }

      if (!this.curAttack) {
        this.patternT -= dt;
        // movimiento base
        if (d > 70) this.moveToward(hero.x, hero.y, dt, 0.85 * speedMul);
        else { this.vx *= 0.93; this.vy *= 0.93; }
        if (this.patternT <= 0) this.pickAttack(g, d);
        this.setIdlePose(dt);
      } else {
        this.vx *= 0.9; this.vy *= 0.9;
        this.runAttack(dt, g);
      }
    }

    pickAttack(g, d) {
      const hero = g.hero;
      const pool = [];
      if (d < 70) pool.push('slam', 'slam', 'dash');
      else pool.push('dash', 'nova');
      pool.push('zones', 'summon');
      if (this.id === 'alchemist') pool.push('nova', 'teleport');
      if (this.id === 'custodian') pool.push('thrust', 'geyser');
      if (this.id === 'guardian') pool.push('roots', 'slam');
      const pick = E.pick(pool);
      this.curAttack = pick;
      this.patternT = 0;
      this.t = 0;
      this.attackStage = 0;
      this.telegraph = 1;
      this.targetAng = E.angTo(this.x, this.y, hero.x, hero.y);
      Snd.sfx(this.curAttack === 'nova' ? 'cast' : 'swing');
      if (this.curAttack === 'teleport') Snd.sfx('teleport');
    }

    endAttack(g, cd) {
      this.curAttack = null;
      this.t = 0;
      this.patternT = cd || E.rnd(1.5, 0.7) / (1 + this.phase * 0.15);
    }

    runAttack(dt, g) {
      const hero = g.hero;
      const s = this.scale / 2.05;
      switch (this.curAttack) {
        case 'slam': {
          if (this.t < 0.7) {
            this.telegraph = 1 - this.t / 0.7;
            this.setPose('raise', dt);
          } else if (this.t < 0.78) {
            this.telegraph = 1;
            Gfx.shake(7);
            Snd.sfx('slam');
            this.setPose('down', dt);
            g.addHit({ x: this.x, y: this.y - 6, r: 46 * s, damage: this.damage, knock: 260, team: 'foe', life: 0.18, source: this, kind: 'quake', dir: this.targetAng, stun: 0.4 });
            g.spawnShock(this.x, this.y, '#ffb03a', 90 * s, 0.5);
            for (let i = 0; i < 10; i++) g.spawnDebris(this.x, this.y, '#8a7a5a');
          } else if (this.t > 1.3) this.endAttack(g, 1.1);
          break;
        }
        case 'dash': {
          if (this.t < 0.55) {
            this.telegraph = 1 - this.t / 0.55;
            this.targetAng = E.angTo(this.x, this.y, hero.x, hero.y);
            this.setPose('crouch', dt);
          } else if (this.t < 1.05) {
            this.telegraph = 0;
            this.vx = Math.cos(this.targetAng) * 300 * (1 + this.phase * 0.1);
            this.vy = Math.sin(this.targetAng) * 300 * (1 + this.phase * 0.1);
            this.setPose('lunge', dt);
            if (!this.dashHit && E.dist(this.x, this.y, hero.x, hero.y) < 22 + this.r) {
              this.dashHit = true;
              g.hurtHero(this.damage, { dir: this.targetAng, knock: 220 });
            }
            if (this.t < 0.62) this.dashHit = false;
            if (Math.random() < 0.6) Gfx.P.spawn({ x: this.x + E.rnd(10, -10), y: this.y - E.rnd(20, 2), vx: -this.vx * 0.2, vy: -this.vy * 0.2, life: 0.35, size: 2.2, color: '#a08060', glow: true });
          } else {
            this.vx *= 0.8; this.vy *= 0.8;
            if (this.t > 1.5) this.endAttack(g, 1);
          }
          break;
        }
        case 'nova': {
          if (this.t < 0.65) {
            this.telegraph = 1 - this.t / 0.65;
            this.setPose('cast', dt);
            Gfx.glow(this.x, this.y - 20, 24, '#c8a0ff', 0.4 * this.telegraph);
          } else if (!this.didHit) {
            this.didHit = true;
            const n = 10 + this.phase * 4;
            const off = E.rnd(TAU, 0);
            for (let i = 0; i < n; i++) {
              const a = off + (i / n) * TAU;
              g.spawnProj({
                x: this.x, y: this.y - 18, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95,
                r: 4, life: 2.6, color: '#b98bff', trail: '#e0d0ff', team: 'foe',
                damage: this.damage * 0.6, knock: 70, kind: 'void',
              });
            }
            Snd.sfx('explode');
            Gfx.shake(4);
          } else if (this.t > 1.5) { this.didHit = false; this.endAttack(g, 1.2); }
          break;
        }
        case 'zones': {
          if (this.t < 0.9) {
            this.telegraph = 1 - this.t / 0.9;
            this.setPose('cast', dt);
            if (!this.zonesSpawned) {
              this.zonesSpawned = [];
              for (let i = 0; i < 3 + this.phase; i++) {
                const a = E.rnd(TAU, 0);
                const rr = E.rnd(70, 20);
                this.zonesSpawned.push({ x: this.x + Math.cos(a) * rr, y: this.y + Math.sin(a) * rr });
              }
            }
            for (const z of this.zonesSpawned) Gfx.ring(z.x, z.y, 12, '#ff5a4a', 0.4, 1.5);
          } else if (!this.didHit) {
            this.didHit = true;
            for (const z of this.zonesSpawned) {
              g.spawnZone({ x: z.x, y: z.y, r: 22, life: 0.55, dps: this.damage * 0.8, color: '#c8a06a', team: 'foe', kind: 'spike', burst: true });
            }
            Snd.sfx('slam');
          } else if (this.t > 1.5) { this.didHit = false; this.zonesSpawned = null; this.endAttack(g, 1); }
          break;
        }
        case 'summon': {
          if (this.t < 0.8) {
            this.setPose('cast', dt);
            this.telegraph = 1 - this.t / 0.8;
            Gfx.glow(this.x, this.y - 20, 26, '#8a4bd8', 0.4);
          } else if (!this.didHit) {
            this.didHit = true;
            Game.spawnMinions(this, 2 + this.phase);
            Gfx.shake(3);
          } else if (this.t > 1.5) { this.didHit = false; this.endAttack(g, 1.4); }
          break;
        }
        case 'teleport': {
          if (this.t < 0.35) {
            this.setPose('cast', dt);
            Gfx.P.burst(this.x, this.y - 10, 8, { color: '#a98bff', speed: 90, life: 0.3, size: 2, glow: true });
          } else if (!this.didHit) {
            this.didHit = true;
            const a = E.rnd(TAU, 0);
            const dist = 80;
            const nx = hero.x + Math.cos(a) * dist;
            const ny = hero.y + Math.sin(a) * dist;
            this.x = g.room.canStand(nx, ny) ? nx : hero.x;
            this.y = g.room.canStand(nx, ny) ? ny : hero.y;
            Gfx.P.burst(this.x, this.y - 10, 16, { color: '#c8a0ff', speed: 110, life: 0.4, size: 2, glow: true });
            Snd.sfx('teleport');
            this.patternT = 0;
          } else if (this.t > 0.6) { this.didHit = false; this.endAttack(g, 0.5); }
          break;
        }
        case 'thrust': {
          if (this.t < 0.45) {
            this.telegraph = 1 - this.t / 0.45;
            this.targetAng = E.angTo(this.x, this.y, hero.x, hero.y);
            this.setPose('crouch', dt);
          } else if (this.t < 0.75) {
            this.vx = Math.cos(this.targetAng) * 340;
            this.vy = Math.sin(this.targetAng) * 340;
            this.setPose('lunge', dt);
            if (!this.dashHit) {
              this.dashHit = true;
              g.addHit({ x: this.x, y: this.y - 12, r: 22, damage: this.damage * 0.8, knock: 180, team: 'foe', life: 0.3, source: this, kind: 'spear', dir: this.targetAng });
            }
          } else if (this.t < 0.85) {
            this.dashHit = false;
            if (this.attackStage < 2 + this.phase) {
              this.attackStage++;
              this.t = 0.4;
            } else {
              this.attackStage = 0;
              this.endAttack(g, 1);
            }
          }
          break;
        }
        case 'geyser': {
          if (this.t < 0.8) {
            this.telegraph = 1 - this.t / 0.8;
            this.setPose('cast', dt);
            if (!this.zonesSpawned) {
              this.zonesSpawned = [{ x: hero.x, y: hero.y }];
              for (let i = 0; i < 2 + this.phase; i++) {
                const a = E.rnd(TAU, 0);
                this.zonesSpawned.push({ x: hero.x + Math.cos(a) * E.rnd(60, 24), y: hero.y + Math.sin(a) * E.rnd(50, 20) });
              }
            }
            for (const z of this.zonesSpawned) {
              Gfx.ring(z.x, z.y, 14, '#8fd8e8', 0.5, 2);
              Gfx.circA(z.x, z.y, 10, '#8fd8e8', 0.15);
            }
          } else if (!this.didHit) {
            this.didHit = true;
            for (const z of this.zonesSpawned) {
              g.spawnZone({ x: z.x, y: z.y, r: 20, life: 0.7, dps: this.damage, color: '#8fd8e8', team: 'foe', kind: 'geyser', burst: true });
            }
            Snd.sfx('ice');
            Gfx.shake(4);
          } else if (this.t > 1.6) { this.didHit = false; this.zonesSpawned = null; this.endAttack(g, 1.2); }
          break;
        }
      }
    }

    setPose(kind, dt) {
      const p = this.pose;
      let tgt;
      switch (kind) {
        case 'raise': tgt = { armF: -2.4, armB: -2.1, lean: -0.3, wAng: -2.8, legF: 1.2, legB: 2.0 }; break;
        case 'down': tgt = { armF: 1.2, armB: 1.0, lean: 0.4, wAng: 1.4, legF: 1.6, legB: 1.4 }; break;
        case 'crouch': tgt = { armF: 1.9, armB: 1.4, lean: 0.45, wAng: 2.2, legF: 2.2, legB: 1.2, bob: 2 }; break;
        case 'lunge': tgt = { armF: 0.2, armB: -0.4, lean: 0.6, wAng: 0.1, legF: 2.4, legB: 0.9, bob: 1 }; break;
        case 'cast': tgt = { armF: -0.3, armB: -0.5, lean: -0.15, wAng: 2.6, legF: 1.5, legB: 1.9 }; break;
        default: tgt = { armF: PI / 2 + 0.2, armB: PI / 2 - 0.2, lean: 0, wAng: 1 };
      }
      const rate = kind === 'lunge' ? 34 : 12;
      for (const k in tgt) p[k] = E.smooth(p[k], tgt[k], rate, dt);
      if (kind === 'down' || kind === 'lunge') p.wAng = tgt.wAng;
    }
    setIdlePose(dt) {
      const p = this.pose;
      const br = Math.sin(this.animT * 2);
      p.armF = E.smooth(p.armF, PI / 2 + 0.2 + br * 0.04, 6, dt);
      p.armB = E.smooth(p.armB, PI / 2 - 0.2, 6, dt);
      p.wAng = 1.1;
      p.lean = E.smooth(p.lean, 0, 6, dt);
      p.bob = br * 0.6;
      p.legF = E.smooth(p.legF, PI / 2 + 0.1, 6, dt);
      p.legB = E.smooth(p.legB, PI / 2 - 0.1, 6, dt);
    }

    draw(ctx, g) {
      if (this.state === 'dead') return;
      Art.drawBoss(ctx, this, g.time);
    }
  }

  const TAU = Math.PI * 2;

  const Foes = {
    make(type, x, y, o) {
      switch (type) {
        case 'grub': return new Grub(x, y, o);
        case 'wisp': return new Wisp(x, y, o);
        case 'charger': return new Charger(x, y, o);
        case 'brute': return new Brute(x, y, o);
        case 'spitter': return new Spitter(x, y, o);
        default: return new Grub(x, y, o);
      }
    },
    boss(id, x, y) { return new Boss(id, x, y); },
  };

  window.Foes = Foes;
  window.EnemyBase = Enemy;
  window.BossClass = Boss;
})();
