// ============================================================
//  El perro: compañero cuadrúpedo
// ============================================================
(function () {
  class Dog {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.vx = 0; this.vy = 0;
      this.r = 5;
      this.team = 'hero';
      this.maxHp = 46;
      this.hp = this.maxHp;
      this.state = 'follow';
      this.t = 0;
      this.phase = 0;
      this.face = 1;
      this.biteCd = 1.2;
      this.target = null;
      this.lungeDir = { x: 1, y: 0 };
      this.hurtFlash = 0;
      this.downTimer = 0;
      this.alpha = 1;
      this.barkCd = 0;
      this.trailT = 0;
    }

    revive() {
      this.hp = this.maxHp;
      this.state = 'follow';
      this.downTimer = 0;
      this.alpha = 1;
      this.x += 20;
    }

    takeDamage(dmg, o) {
      if (this.state === 'down') return;
      this.hp -= dmg;
      this.hurtFlash = 1;
      Gfx.F.add(this.x, this.y - 16, '-' + Math.round(dmg), { color: '#ffb0a0', size: 1 });
      if (this.hp <= 0) {
        this.hp = 0;
        this.state = 'down';
        this.downTimer = 9;
        Snd.sfx('death');
        Gfx.F.add(this.x, this.y - 20, 'AYUDA', { color: '#ff8a7a', size: 1, life: 1.2 });
      }
    }

    update(dt, g) {
      this.t += dt;
      if (this.hurtFlash > 0) this.hurtFlash = Math.max(0, this.hurtFlash - dt * 4);
      if (this.biteCd > 0) this.biteCd -= dt;
      if (this.barkCd > 0) this.barkCd -= dt;

      if (this.state === 'down') {
        this.downTimer -= dt;
        this.vx *= 0.9; this.vy *= 0.9;
        this.x += this.vx * dt; this.y += this.vy * dt;
        if (this.downTimer <= 0) {
          this.revive();
          Gfx.P.burst(this.x, this.y, 14, { color: '#8fd8e8', speed: 70, life: 0.5, size: 1.6, glow: true });
          Snd.sfx('bark');
        }
        return;
      }

      const hero = g.hero;
      const hd = E.dist(this.x, this.y, hero.x, hero.y);

      // encontrar objetivo
      if (!this.target || !this.target.alive || this.target.hp <= 0) this.target = g.nearestEnemy(this.x, this.y, 130);
      const tgt = this.target;
      const td = tgt ? E.dist(this.x, this.y, tgt.x, tgt.y) : 999;

      if (this.state === 'lunge') {
        this.t += 0;
        const sp = 190;
        this.vx = this.lungeDir.x * sp;
        this.vy = this.lungeDir.y * sp;
        if (this.t > 0.14 && !this.bit) {
          this.bit = true;
          if (tgt && E.dist(this.x, this.y, tgt.x, tgt.y) < 22) {
            g.addHit({
              x: this.x, y: this.y - 6, r: 13, damage: (5 + (window.Game ? Game.metaLevel('perro') * 2 : 0)) * (g.dogDmgMul || 1),
              knock: 40, team: 'hero', life: 0.08, source: this, kind: 'bite', crit: false,
            });
            Snd.sfx('bark');
          }
        }
        if (this.t > 0.22) { this.state = 'follow'; this.bit = false; }
      } else if (tgt && td < 120 && this.biteCd <= 0) {
        this.state = 'lunge';
        this.t = 0;
        this.bit = false;
        this.lungeDir.x = Math.cos(E.angTo(this.x, this.y, tgt.x, tgt.y));
        this.lungeDir.y = Math.sin(E.angTo(this.x, this.y, tgt.x, tgt.y));
        this.biteCd = 1.6;
        this.face = this.lungeDir.x > 0 ? 1 : -1;
        Snd.sfx('bark');
        Gfx.F.add(this.x, this.y - 20, '¡GUAU!', { color: '#f0e0b0', size: 1, life: 0.6, vy: -30 });
      } else {
        // seguimiento
        const behindX = hero.x - Math.cos(hero.aim) * 16 - hero.face * 8;
        const behindY = hero.y + 6;
        const dx = behindX - this.x, dy = behindY - this.y;
        const d = Math.hypot(dx, dy);
        if (d > 14) {
          const sp = Math.min(150, 40 + d * 3);
          this.vx = E.smooth(this.vx, (dx / d) * sp, 7, dt);
          this.vy = E.smooth(this.vy, (dy / d) * sp, 7, dt);
        } else {
          this.vx *= 0.86; this.vy *= 0.86;
        }
        if (Math.abs(this.vx) > 10) this.face = this.vx > 0 ? 1 : -1;
        if (hd > 240) { this.x = hero.x - 10; this.y = hero.y + 6; }
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      g.room.collide(this, dt);

      const sp = Math.hypot(this.vx, this.vy);
      this.phase += dt * (4 + sp * 0.09);

      if (sp > 30) {
        this.trailT -= dt;
        if (this.trailT <= 0) {
          this.trailT = 0.12;
          Gfx.P.spawn({ x: this.x, y: this.y, vx: E.rnd(8, -8), vy: -4, life: 0.3, size: 1.4, color: g.room.dustColor || '#6b5b47', fade: 0.4 });
        }
      }
    }

    draw(ctx, g) {
      const s = 1;
      Gfx.shadow(this.x, this.y + 0.5, 6, this.state === 'down' ? 0.15 : 0.3);
      const bob = Math.sin(this.phase * 2) * 0.6;
      const fx = this.face;
      const down = this.state === 'down';

      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, down ? this.y - 1 : this.y + bob);
      ctx.scale(fx, s);
      const body = '#8a5a34', body2 = '#6d4526', light = '#b98450', dark = '#432a18';

      // cola
      const wag = Math.sin(this.t * 14) * 0.5;
      ctx.strokeStyle = body2;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.quadraticCurveTo(-11, -11 + wag * 3, -12, -15 + wag * 4);
      ctx.stroke();

      // patas traseras
      const lp = Math.sin(this.phase) * 2.2;
      ctx.strokeStyle = body2;
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-4 + lp * 0.6, -0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3, -6); ctx.lineTo(3 - lp * 0.6, -0.5); ctx.stroke();

      // cuerpo
      ctx.fillStyle = '#1b1310';
      ctx.beginPath(); ctx.ellipse(0, -8, 8.4, 4.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.ellipse(0, -8, 7.8, 4.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.ellipse(-0.5, -6.4, 6.2, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      // mancha
      ctx.fillStyle = body2;
      ctx.beginPath(); ctx.ellipse(-2.5, -9.6, 3, 2, 0.3, 0, Math.PI * 2); ctx.fill();

      // cabeza
      const hx = down ? 8 : 7.5, hy = down ? -3.5 : -11 - (this.state === 'lunge' ? 1.5 : 0);
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(down ? 0.5 : 0);
      ctx.fillStyle = '#1b1310';
      ctx.beginPath(); ctx.ellipse(0, 0, 5.2, 4.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.ellipse(0, 0, 4.7, 3.7, 0, 0, Math.PI * 2); ctx.fill();
      // hocico
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.ellipse(3.4, 0.8, 2.6, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#20160f';
      Gfx.circ(5.6, 0.2, 1.1, '#20160f');
      // orejas
      ctx.fillStyle = body2;
      ctx.beginPath(); ctx.moveTo(-1, -3.4); ctx.lineTo(-4.6, -8.4); ctx.lineTo(-2.4, -2.4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(2, -3.6); ctx.lineTo(0.4, -8.8); ctx.lineTo(3.4, -2.6); ctx.fill();
      // ojo
      if (!down) {
        ctx.fillStyle = '#f8f0d0';
        ctx.fillRect(1.8, -1.6, 1.6, 1.8);
        ctx.fillStyle = '#1a1208';
        ctx.fillRect(2.5, -1.2, 1.1, 1.4);
      } else {
        ctx.strokeStyle = '#1a1208';
        ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(1.6, -1.2); ctx.lineTo(3.4, -0.2); ctx.moveTo(3.4, -1.2); ctx.lineTo(1.6, -0.2); ctx.stroke();
      }
      ctx.restore();

      // patas delanteras
      ctx.strokeStyle = body;
      ctx.lineWidth = 2.6;
      const lp2 = -Math.sin(this.phase) * 2.2;
      ctx.beginPath(); ctx.moveTo(-1, -6); ctx.lineTo(-1 + lp2 * 0.6, -0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, -6); ctx.lineTo(5 - lp2 * 0.6, -0.5); ctx.stroke();

      // collar
      ctx.strokeStyle = '#c8463c';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(4.2, -11.5); ctx.lineTo(5.2, -8); ctx.stroke();

      if (this.hurtFlash > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = this.hurtFlash * 0.7;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(1, -8, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      if (down) {
        Gfx.text('...', this.x, this.y - 22, { size: 1, color: '#8d8496', align: 'center' });
      }
    }
  }

  window.Dog = Dog;
})();
