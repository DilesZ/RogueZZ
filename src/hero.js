// ============================================================
//  Héroe: movimiento, combos, dash, hechizos
// ============================================================
(function () {
  const PI = Math.PI;

  class Hero {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = 0; this.vy = 0;
      this.r = 6;
      this.team = 'hero';
      this.maxHp = 100;
      this.hp = 100;
      this.aim = 0;
      this.face = 1;
      this.state = 'idle';
      this.t = 0;
      this.speed = 104;
      this.dashCharges = 2;
      this.dashMax = 2;
      this.dashTimer = 0;
      this.iframe = 0;
      this.hurtTimer = 0;
      this.attackIndex = 0;
      this.comboTimer = 0;
      this.buffer = false;
      this.bufferHeavy = false;
      this.didHit = false;
      this.snapW = false;
      this.animT = 0;
      this.pose = Rig.defaultPose();
      this.ghosts = [];
      this.weapon = 'blade';
      this.pal = {
        skin: '#e8b48c', hair: '#241a16', cloth: '#2f6b6b', cloth2: '#20494f',
        leather: '#6b4a2f', metal: '#d6cdbb', metalDark: '#6b6472',
        accent: '#e0503f', cape: '#1b3d45', eye: '#14101a', outline: '#100c14',
      };
      this.shield = 0;
      this.shieldTimer = 0;
      this.healPool = 0;
      this.healRate = 0;
      this.lifesteal = 0;
      this.lifestealT = 0;
      this.permLifesteal = 0;
      this.level = 1;
      this.xp = 0;
      this.xpNext = 24;
      this.showHurt = 0;
      this.dead = false;
      this.walkPhase = 0;
      this.dashDirX = 1; this.dashDirY = 0;
      this.hitFlash = 0;
      this.damageMult = 1;
      this.critChance = 0.08;
      this.chargeGlow = 0;
      this.slash = null;
      this.castGlow = 0;
      this.stepT = 0;
      this.lastGroundY = y;
    }

    get cx() { return this.x; }
    get cy() { return this.y - 14; }

    reset(x, y) {
      this.x = x; this.y = y;
      this.hp = this.maxHp;
      this.state = 'idle'; this.t = 0;
      this.dead = false;
      this.iframe = 1;
      this.shield = 0;
      this.healPool = 0;
      this.lifesteal = 0;
      this.lifestealT = 0;
      this.aim = 0;
      this.pose = Rig.defaultPose();
      this.ghosts.length = 0;
    }

    addHeal(amount, dur) {
      this.healPool += amount;
      this.healRate = amount / Math.max(0.2, dur);
    }

    gainXp(n, g) {
      this.xp += n;
      while (this.xp >= this.xpNext) {
        this.xp -= this.xpNext;
        this.level++;
        this.xpNext = Math.round(this.xpNext * 1.32 + 6);
        this.maxHp += 8;
        this.hp = Math.min(this.maxHp, this.hp + 24);
        this.damageMult += 0.06;
        if (g) {
          g.levelUp();
          Gfx.F.add(this.x, this.y - 32, 'NIVEL ' + this.level, { color: '#f0c05a', life: 1.4, size: 2 });
        }
      }
    }

    dashChargesFrac() {
      return this.dashCharges / this.dashMax;
    }

    canDash() { return this.dashCharges >= 1 && this.state !== 'dead' && this.state !== 'hurt'; }

    startDash() {
      this.state = 'dash';
      this.t = 0;
      this.dashCharges--;
      this.dashTimer = 0.5;
      this.iframe = Math.max(this.iframe, 0.26);
      const a = Input.axis();
      const dx = a.x || a.y ? Math.cos(Math.atan2(a.y, a.x)) : Math.cos(this.aim);
      const dy = a.x || a.y ? Math.sin(Math.atan2(a.y, a.x)) : Math.sin(this.aim);
      this.dashDirX = dx; this.dashDirY = dy;
      this.aim = Math.atan2(dy, dx);
      if (this.dashShield) {
        this.shield = Math.min(this.maxHp, this.shield + this.dashShield);
        this.shieldTimer = 6;
      }
      this.dashHitSet = new Set();
      Snd.sfx('dash');
      Gfx.P.burst(this.x, this.y - 2, 8, { color: ['#9fd8ff', '#ffffff'], speed: 60, life: 0.3, size: 1.4, glow: true, grav: -20 });
    }

    startAttack() {
      const idx = this.comboTimer > 0 ? (this.attackIndex + 1) % 3 : 0;
      this.attackIndex = idx;
      this.state = 'attack';
      this.t = 0;
      this.didHit = false;
      this.comboTimer = 0;
      this.hitboxDone = false;
      Snd.sfx(idx === 2 ? 'swing2' : 'swing');
      this.vx += Math.cos(this.aim) * (idx === 2 ? 90 : 55);
      this.vy += Math.sin(this.aim) * (idx === 2 ? 90 : 55);
    }

    startHeavy() {
      this.state = 'heavy';
      this.t = 0;
      this.didHit = false;
      this.chargeGlow = 0;
    }

    startCast() {
      this.state = 'cast';
      this.t = 0;
      this.didHit = false;
      this.castGlow = 1;
    }

    takeDamage(dmg, o) {
      if (this.state === 'dead') return 0;
      if (this.iframe > 0) return 0;
      o = o || {};
      if (this.shield > 0) {
        const absorbed = Math.min(this.shield, dmg);
        this.shield -= absorbed;
        dmg -= absorbed;
        Gfx.P.burst(this.x, this.y - 14, 6, { color: '#c8a06a', speed: 60, life: 0.3, size: 1.5, glow: true });
        Snd.sfx('block');
        if (dmg <= 0) { this.iframe = 0.3; return 0; }
      }
      if (dmg <= 0) return 0;
      this.hp -= dmg;
      this.showHurt = 1;
      this.iframe = 0.75;
      Gfx.shake(3.5);
      Gfx.Fx.flash('#c8463c', 0.16);
      Snd.sfx('hurt');
      Gfx.F.add(this.x, this.y - 30, '-' + Math.round(dmg), { color: '#ff8a7a', size: 2, life: 0.8 });
      Gfx.P.burst(this.x, this.y - 14, 10, { color: ['#e0503f', '#ffb0a0'], speed: 90, life: 0.45, size: 1.8, glow: true });
      if (this.hp <= 0) {
        this.hp = 0;
        this.state = 'dead';
        this.t = 0;
        this.dead = true;
        Snd.sfx('death');
        Gfx.shake(7);
      } else {
        this.state = 'hurt';
        this.t = 0;
        const a = o.dir !== undefined ? o.dir : 0;
        this.vx = Math.cos(a) * (o.knock || 120);
        this.vy = Math.sin(a) * (o.knock || 120);
      }
      return dmg;
    }

    onDealDamage(dmg) {
      if (this.lifesteal > 0) {
        const heal = Math.max(1, dmg * this.lifesteal);
        this.hp = Math.min(this.maxHp, this.hp + heal);
        Gfx.P.burst(this.x, this.y - 16, 2, { color: '#e0503f', speed: 40, life: 0.5, size: 1.6, glow: true, grav: -40 });
      }
    }

    update(dt, g) {
      this.t += dt;
      // Reloj continuo del sprite: alimenta respiración, pasos, pelo y capa.
      this.animT += dt;
      if (this.iframe > 0) this.iframe -= dt;
      if (this.showHurt > 0) this.showHurt = Math.max(0, this.showHurt - dt * 3);
      if (this.shieldTimer > 0) {
        this.shieldTimer -= dt;
        if (this.shieldTimer <= 0) this.shield = 0;
      }
      if (this.lifesteal > 0) {
        this.lifestealT -= dt;
        if (this.lifestealT <= 0) {
          this.lifestealT = 0;
          this.lifesteal = this.permLifesteal || 0;
        }
      }
      if (this.comboTimer > 0) this.comboTimer -= dt;
      this.castGlow = Math.max(0, this.castGlow - dt * 3);

      if (this.healPool > 0) {
        const h = Math.min(this.healPool, this.healRate * dt);
        this.healPool -= h;
        this.hp = Math.min(this.maxHp, this.hp + h);
        if (Math.random() < 0.3) Gfx.P.spawn({
          x: this.x + E.rnd(7, -7), y: this.y - E.rnd(20, 2), vy: -22, life: 0.6,
          size: 1.4, color: '#6ff08a', glow: true, shape: 'circle',
        });
      }

      // regeneración de esquivas
      if (this.dashCharges < this.dashMax) {
        this.dashTimer -= dt;
        if (this.dashTimer <= 0) {
          this.dashCharges++;
          this.dashTimer = 0.62;
          if (this.dashCharges < this.dashMax) Snd.sfx('uiMove');
        }
      }

      if (this.state === 'dead') {
        this.vx *= 0.9; this.vy *= 0.9;
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.updatePose(dt, g);
        return;
      }

      // apuntado
      this.aim = Input.aimFrom(this.x, this.y - 14, this.aim);
      const dx = Math.cos(this.aim);
      if (Math.abs(dx) > 0.16) this.face = dx > 0 ? 1 : -1;

      // entrada de acciones
      if (Input.attackPressed()) {
        if (this.state === 'idle' || this.state === 'run') this.startAttack();
        else if (this.state === 'attack' && this.t > 0.16) this.buffer = true;
        else if (this.state === 'dash' || this.state === 'cast' || this.state === 'heavy') this.buffer = true;
      }
      if (Input.heavyPressed() && (this.state === 'idle' || this.state === 'run')) this.startHeavy();
      if (Input.pressed('dash') && this.canDash() && this.state !== 'dash') {
        this.startDash();
        return;
      }
      if (Input.pressed('cast') && (this.state === 'idle' || this.state === 'run')) this.startCast();

      const ax = Input.axis();

      switch (this.state) {
        case 'idle':
        case 'run': {
          const targetVx = ax.x * this.speed;
          const targetVy = ax.y * this.speed;
          const acc = 9;
          this.vx = E.smooth(this.vx, targetVx, acc, dt);
          this.vy = E.smooth(this.vy, targetVy, acc, dt);
          const sp = Math.hypot(this.vx, this.vy);
          this.state = sp > 8 ? 'run' : 'idle';
          if (ax.x || ax.y) { this.walkPhase += dt * (6 + sp * 0.065); }
          else this.walkPhase += dt * 1.6;
          // pasos
          if (sp > 40) {
            this.stepT -= dt;
            if (this.stepT <= 0) {
              this.stepT = 0.26;
              Gfx.P.spawn({ x: this.x + E.rnd(3, -3), y: this.y, vx: E.rnd(12, -12), vy: -6, life: 0.35, size: 1.6, color: g.room.dustColor || '#6b5b47', fade: 0.5 });
              Snd.sfx('step');
            }
          }
          break;
        }
        case 'dash': {
          const speed = 235 * (1 - this.t * 1.6);
          this.vx = this.dashDirX * Math.max(90, speed);
          this.vy = this.dashDirY * Math.max(90, speed);
          if (this.dashDamage) {
            this.dashHitT = (this.dashHitT || 0) - dt;
            if (this.dashHitT <= 0) {
              this.dashHitT = 0.07;
              g.addHit({
                x: this.x, y: this.y - 10, r: 13, damage: this.dashDamage,
                knock: 70, team: 'hero', life: 0.05, kind: 'dash', source: this,
              });
            }
          }
          if (this.t > 0.055 && this.ghosts.length < 6) {
            this.ghosts.push({ x: this.x, y: this.y, face: this.face, pose: Rig.copyPose(this.pose), life: 0.28 });
          }
          if (this.t > 0.17) {
            this.state = 'idle';
            this.t = 0;
            this.vx *= 0.3; this.vy *= 0.3;
          }
          break;
        }
        case 'attack': {
          const atk = [{ w: 0.055, a: 0.11, r: 0.13 }, { w: 0.05, a: 0.1, r: 0.15 }, { w: 0.09, a: 0.14, r: 0.2 }][this.attackIndex];
          const tot = atk.w + atk.a + atk.r;
          this.vx *= 0.86; this.vy *= 0.86;
          if (!this.didHit && this.t >= atk.w) {
            this.didHit = true;
            this.spawnSlash(g, this.attackIndex, atk.a);
          }
          if (this.t >= tot) {
            this.state = 'idle';
            this.t = 0;
            this.comboTimer = this.attackIndex < 2 ? 0.34 : 0;
            if (this.buffer) { this.buffer = false; this.startAttack(); }
          } else if (this.buffer && this.t >= atk.w + atk.a) {
            this.buffer = false;
            this.startAttack();
          }
          break;
        }
        case 'heavy': {
          this.vx *= 0.9; this.vy *= 0.9;
          this.chargeGlow = Math.min(1, this.chargeGlow + dt * 5);
          if (this.t < 0.2) {
            this.chargeGlow = Math.min(1, this.chargeGlow + dt * 4);
          }
          if (!this.didHit && this.t >= 0.2) {
            this.didHit = true;
            this.spawnSlash(g, 9, 0.16);
            Gfx.shake(4);
            this.vx += Math.cos(this.aim) * 130;
            this.vy += Math.sin(this.aim) * 130;
          }
          if (this.t >= 0.56) { this.state = 'idle'; this.t = 0; }
          break;
        }
        case 'cast': {
          this.vx *= 0.7; this.vy *= 0.7;
          if (this.t >= 0.1 && !this.didHit) {
            this.didHit = true;
            const id = Alchemy.slots[Alchemy.selected];
            if (id) Alchemy.cast(id, g, this);
            else { g.toast('Sin hechizo en la ranura'); Snd.sfx('error'); }
          }
          if (this.t >= 0.32) { this.state = 'idle'; this.t = 0; }
          break;
        }
        case 'hurt': {
          this.vx *= 0.88; this.vy *= 0.88;
          if (this.t > 0.24) { this.state = 'idle'; this.t = 0; }
          break;
        }
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      g.room.collide(this, dt);

      for (let i = this.ghosts.length - 1; i >= 0; i--) {
        this.ghosts[i].life -= dt;
        if (this.ghosts[i].life <= 0) this.ghosts.splice(i, 1);
      }

      this.updatePose(dt, g);
    }

    spawnSlash(g, index, active) {
      const a = this.aim;
      const dist = index === 9 ? 15 : 17;
      const rad = index === 9 ? 34 : index === 2 ? 30 : 26;
      const base = (index === 9 ? 26 : index === 2 ? 16 : 11) * (this.effDmgMul || this.damageMult);
      const dmg = base * (index === 9 ? (this.heavyMul || 1) : 1);
      const crit = Math.random() < this.critChance;
      g.addHit({
        x: this.x + Math.cos(a) * dist,
        y: this.y - 14 + Math.sin(a) * dist,
        r: rad,
        damage: dmg * (crit ? (this.critMul || 1.7) : 1),
        knock: index === 9 ? 240 : index === 2 ? 150 : 70,
        team: 'hero', life: active + 0.04, crit, source: this,
        kind: index === 9 ? 'heavy' : 'slash',
        stun: index === 9 ? 0.35 : 0,
      });
      this.slash = {
        ang: a, t: 0, life: index === 9 ? 0.34 : index === 2 ? 0.29 : 0.22,
        r: index === 9 ? 34 : index === 2 ? 33 : index === 1 ? 29 : 25,
        dir: index === 1 ? -1 : 1, heavy: index === 9, index,
      };
      if (index === 9) Snd.sfx('hit');
      if (index === 2) {
        Gfx.shake(2.2);
        Gfx.Fx.flash('#e8caff', 0.1);
      }
      Gfx.P.burst(this.x + Math.cos(a) * 18, this.y - 14 + Math.sin(a) * 14, index === 2 ? 13 : 6, {
        color: index === 2 ? ['#fff7d9', '#ffd08a', '#e6a8ff'] : index === 1 ? ['#fff1f8', '#f49be2', '#a98bff'] : ['#ffffff', '#9fe8ff', '#b8caff'],
        angle: a, spread: index === 2 ? 1.05 : 0.7, speed: index === 2 ? 150 : 105,
        life: index === 2 ? 0.32 : 0.2, size: index === 2 ? 2 : 1.4, glow: true,
      });
    }

    updatePose(dt, g) {
      const p = Rig.defaultPose();
      const t = this.t;
      const sp = Math.hypot(this.vx, this.vy);
      let rate = 14;
      this.snapW = false;

      if (this.state === 'dead') {
        p.lean = 0.6; p.armF = -1.2; p.armB = -1.6; p.legF = 2.2; p.legB = 2.6; p.head = 1;
        p.bob = 6;
        rate = 6;
      } else if (this.state === 'hurt') {
        p.lean = -0.5; p.head = -0.4;
        p.armF = -0.9; p.armB = -1.4; p.elbF = 0.2;
        p.legF = 1.9; p.legB = 1.3;
      } else if (this.state === 'dash') {
        p.lean = 0.55; p.bob = 1.5;
        p.armF = -0.6; p.armB = -1.9; p.elbF = 0.9;
        p.legF = 2.3; p.legB = 1.0; p.kneeF = -1.2; p.kneeB = -0.2;
        rate = 26;
      } else if (this.state === 'attack') {
        const idx = this.attackIndex;
        const atk = [{ w: 0.055, a: 0.11, r: 0.13 }, { w: 0.05, a: 0.1, r: 0.15 }, { w: 0.09, a: 0.14, r: 0.2 }][idx];
        const tot = atk.w + atk.a + atk.r;
        if (t < atk.w) {
          if (idx === 0) { p.armF = -2.0; p.elbF = -0.5; p.wAng = -2.1; p.lean = -0.2; p.legF = 1.4; p.legB = 1.9; }
          else if (idx === 1) { p.armF = -0.4; p.elbF = 1.6; p.wAng = 1.2; p.lean = 0.15; p.legF = 1.7; p.legB = 1.5; }
          else { p.armF = 2.2; p.elbF = -0.4; p.wAng = 2.6; p.lean = 0.35; p.legF = 2.0; p.legB = 1.4; }
          rate = 34;
        } else if (t < atk.w + atk.a) {
          if (idx === 0) { p.armF = 0.55; p.elbF = 0.15; p.wAng = 0.5; p.lean = 0.3; }
          else if (idx === 1) { p.armF = 2.6; p.elbF = 0.2; p.wAng = 2.5; p.lean = 0.3; }
          else { p.armF = -2.4; p.elbF = -0.2; p.wAng = -2.6; p.lean = -0.1; }
          p.legF = 1.5; p.legB = 1.9;
          rate = 40; this.snapW = true;
        } else {
          if (idx === 0) { p.armF = 0.9; p.elbF = 0.5; p.wAng = 0.9; }
          else if (idx === 1) { p.armF = 2.2; p.elbF = 0.5; p.wAng = 2.2; }
          else { p.armF = -1.9; p.elbF = 0.3; p.wAng = -1.9; }
          p.lean = 0.12;
          rate = 16; this.snapW = true;
        }
        p.legF = 1.5 + Math.sin(t * 40) * 0.05;
        p.legB = 1.9;
        p.bob = 0;
      } else if (this.state === 'heavy') {
        if (t < 0.2) {
          p.armF = -2.5; p.elbF = -0.5; p.wAng = -2.7; p.lean = -0.45;
          p.legF = 1.2; p.legB = 2.0; p.bob = 1.5;
          rate = 12;
        } else if (t < 0.36) {
          p.armF = 0.2; p.elbF = 0.0; p.wAng = -0.1; p.lean = 0.4;
          p.legF = 1.7; p.legB = 1.6;
          rate = 44; this.snapW = true;
        } else {
          p.armF = 1.1; p.elbF = 0.4; p.wAng = 1.3; p.lean = 0.2;
          rate = 14;
        }
      } else if (this.state === 'cast') {
        p.armF = 0.1; p.elbF = -0.3; p.armB = -0.6; p.elbB = 0.4;
        p.wAng = 2.4; p.lean = -0.15; p.legF = 1.4; p.legB = 1.9;
        p.bob = -0.5;
        rate = 18;
      } else if (sp > 12) {
        const ph = this.walkPhase;
        const s = Math.sin(ph), c = Math.cos(ph);
        p.legF = PI / 2 + s * 0.62;
        p.legB = PI / 2 - s * 0.62;
        p.kneeF = -0.1 - Math.max(0, -s) * 0.85;
        p.kneeB = -0.1 - Math.max(0, s) * 0.85;
        p.armF = PI / 2 - s * 0.55 + 0.1;
        p.armB = PI / 2 + s * 0.5 - 0.05;
        p.elbF = 0.55; p.elbB = 0.4;
        p.bob = Math.abs(s) * 1.1;
        p.lean = 0.12 + Math.min(0.2, sp / 700);
        p.wAng = 1.1 + Math.sin(ph) * 0.15;
        rate = 22;
      } else {
        const br = Math.sin(this.t * 2.2);
        p.bob = br * 0.5;
        p.armF = PI / 2 + 0.26 + br * 0.04;
        p.armB = PI / 2 - 0.22 - br * 0.04;
        p.elbF = 0.45; p.elbB = 0.32;
        p.legF = PI / 2 + 0.1; p.legB = PI / 2 - 0.1;
        p.wAng = 0.95;
        rate = 8;
      }

      const pose = this.pose;
      for (const k in p) {
        if (k === 'wAng' && this.snapW) { pose[k] = p[k]; continue; }
        pose[k] = pose[k] === undefined ? p[k] : E.smooth(pose[k], p[k], rate, dt);
      }

      if (this.slash) {
        this.slash.t += dt;
        if (this.slash.t > this.slash.life) this.slash = null;
      }
    }

    draw(ctx, g) {
      // sombra
      Gfx.shadow(this.x, this.y + 0.5, 7, 0.36);

      // fantasmas del dash
      for (const gh of this.ghosts) {
        NaraArt.drawHero(ctx, {
          x: gh.x, y: gh.y, vx: 0, vy: 0, state: 'idle', face: gh.face,
          animT: 0, aim: this.aim, castGlow: 0, showHurt: 0,
        }, g.time, (gh.life / 0.28) * 0.32);
      }

      if (this.iframe > 0 && this.state !== 'dead' && Math.floor(this.iframe * 26) % 2 === 0) {
        ctx.globalAlpha = 0.55;
      }

      // aura de escudo
      if (this.shield > 0) {
        Gfx.ring(this.x, this.y - 14, 16 + Math.sin(g.time * 6) * 1.2, '#c8a06a', 0.5, 1.5);
        Gfx.ring(this.x, this.y - 14, 15, '#f0c05a', 0.2, 1);
      }

      NaraArt.drawHero(ctx, this, g.time);
      ctx.globalAlpha = 1;

      // estela del arma
      if (this.slash) {
        const s = this.slash;
        const k = 1 - s.t / s.life;
        const idx = s.index === undefined ? 0 : s.index;
        const finisher = idx === 2;
        const sweep = finisher ? 1.95 : idx === 1 ? 1.7 : 1.45;
        const a0 = s.ang - s.dir * sweep * k;
        const a1 = s.ang + s.dir * (finisher ? .72 : .48);
        const cx = this.x, cy = this.y - 14;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // Cada golpe del combo tiene su propio gesto: azul de ida, rosa de
        // vuelta y un remate dorado de mayor amplitud.
        for (let i = 0; i < 4; i++) {
          const rr = s.r + 1 - i * (finisher ? 2.4 : 2.1);
          ctx.globalAlpha = (finisher ? [.2, .27, .4, .92] : [.13, .2, .3, .82])[i] * k;
          ctx.strokeStyle = i === 3 ? '#fff8e6' : s.heavy ? (i === 0 ? '#ff773d' : '#ffd08a')
            : finisher ? (i === 0 ? '#b565dc' : '#ffd08a')
              : idx === 1 ? (i === 0 ? '#bd67e8' : '#f49be2')
                : (i === 0 ? '#527fe0' : '#9fe8ff');
          ctx.lineWidth = (finisher ? [13, 8, 4, 1.25] : [8, 5, 3, 1])[i] + (s.heavy && i === 0 ? 2 : 0);
          ctx.beginPath();
          ctx.arc(cx, cy, rr, Math.min(a0, a1), Math.max(a0, a1));
          ctx.stroke();
        }
        if (finisher) {
          ctx.globalAlpha = .36 * k; ctx.strokeStyle = '#fff0c1'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cx, cy, s.r + 7, a0 - .14, a1 + .12); ctx.stroke();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // brillo de carga
      if (this.state === 'heavy' && this.t < 0.2) {
        Gfx.glow(this.x + Math.cos(this.aim) * 12, this.y - 14 + Math.sin(this.aim) * 10, 6 + this.chargeGlow * 8, '#ffd08a', 0.35);
      }
      if (this.castGlow > 0) {
        Gfx.glow(this.x + Math.cos(this.aim) * 12, this.y - 16 + Math.sin(this.aim) * 8, 10 * this.castGlow, '#c8a8ff', 0.4);
      }
    }
  }

  window.Hero = Hero;
})();
