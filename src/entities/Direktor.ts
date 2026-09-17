import Phaser from 'phaser';
import { T } from '../config/Tuning';
import { audio } from '../systems/Audio';

export type BossState = 'intro' | 'idle' | 'walk' | 'tele_glasses' | 'tele_kick' | 'dash' | 'kick' | 'open' | 'tele_rain' | 'rain'
  | 'tele_crystal' | 'crystal' | 'teleport' | 'transition' | 'stunned' | 'dead';

/** Der Direktor – final boss. Three phases, telegraphed attacks, a 1.2 s window after every combo. */
export class Direktor extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  gfx: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  ghosts: Phaser.GameObjects.Sprite[] = [];
  hp = 100;
  maxHp = 100;
  phase = 1;
  state: BossState = 'intro';
  timer = 1600;
  dir = -1;
  flashUntil = 0;
  homeX: number;
  homeY: number;
  rainWave = 0;
  crystalIdx = 0;
  onGlasses?: (x: number, y: number, dir: number) => void;
  onKick?: (x: number, y: number, dir: number) => void;
  onRain?: (wave: number) => void;
  onCrystal?: (x: number, y: number) => void;
  onPhase?: (phase: number) => void;
  onTeleport?: (x: number) => void;
  onDead?: () => void;

  constructor(scene: Phaser.Scene, x: number, groundY: number) {
    super(scene, x, groundY - 26, 'spr', 'direktor_idle_0');
    this.homeX = x; this.homeY = groundY;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVisible(false);
    this.body.setSize(26, 52).setOffset(11, 6);
    this.body.setGravityY(T.GRAVITY);
    this.body.setMaxVelocityY(T.TERMINAL_V);
    this.shadow = scene.add.ellipse(x, groundY, 30, 8, 0x000000, 0.35).setDepth(7);
    this.gfx = scene.add.sprite(x, groundY, 'spr', 'direktor_idle_0').setOrigin(0.5, 58 / 64).setDepth(8);
    this.gfx.play('direktor_idle');
  }

  get alive() { return this.state !== 'dead'; }
  /** Bario can hurt him now (and takes no contact damage). */
  get vulnerable() { return this.state === 'open' || this.state === 'stunned' || this.state === 'idle' || this.state === 'walk'; }
  get harmless() { return this.state === 'open' || this.state === 'stunned' || this.state === 'teleport' || this.state === 'transition' || this.state === 'dead' || this.state === 'intro'; }

  private speedMul() { return this.phase === 3 ? 1.35 : this.phase === 2 ? 1.15 : 1; }
  private tele(ms: number) { return ms / this.speedMul(); }

  private go(s: BossState, ms: number) { this.state = s; this.timer = ms; }

  private setFrame2(name: string, originX = 0.5, originY = 58 / 64) {
    const g = this.gfx;
    if (g.frame.name !== name) { g.anims.stop(); g.setTexture('spr', name); }
    g.setOrigin(originX, originY);
  }

  update(dt: number, player: { x: number; y: number; dead: boolean }) {
    if (this.state === 'dead') return;
    const b = this.body;
    const dx = player.x - this.x;
    const adx = Math.abs(dx);
    this.timer -= dt * 1000;
    if (this.state !== 'dash' && this.state !== 'teleport') this.dir = Math.sign(dx) || this.dir;

    switch (this.state) {
      case 'intro':
        b.setVelocityX(0);
        if (this.timer <= 0) this.go('idle', 400);
        break;
      case 'idle':
        b.setVelocityX(0);
        if (this.timer <= 0) this.choose(adx);
        break;
      case 'walk':
        b.setVelocityX(this.dir * 90 * this.speedMul());
        if (adx < 150 || this.timer <= 0) this.choose(adx, true);
        break;
      case 'tele_glasses':
        b.setVelocityX(0);
        if (this.timer <= 0) {
          audio.glasses();
          this.onGlasses?.(this.x + this.dir * 14, b.center.y - 12, this.dir);
          this.go('open', this.phase === 1 ? 900 : 700);
        }
        break;
      case 'tele_kick':
        b.setVelocityX(0);
        if (this.timer <= 0) { this.go('dash', 380); b.setVelocityX(this.dir * 420 * this.speedMul()); }
        break;
      case 'dash':
        if (this.timer <= 0 || adx < 40 || b.blocked.left || b.blocked.right) {
          b.setVelocityX(this.dir * 60);
          this.go('kick', 260);
          this.onKick?.(this.x + this.dir * 30, b.center.y, this.dir);
        }
        break;
      case 'kick':
        if (this.timer <= 0) { b.setVelocityX(0); this.go('open', 1200); }
        break;
      case 'open':
        b.setVelocityX(0);
        if (this.timer <= 0) this.go('idle', 300);
        break;
      case 'tele_rain':
        b.setVelocityX(0);
        if (this.timer <= 0) { this.rainWave = 0; this.go('rain', 0); }
        break;
      case 'rain':
        b.setVelocityX(0);
        if (this.timer <= 0) {
          if (this.rainWave < 3) { this.onRain?.(this.rainWave++); this.timer = 520; }
          else this.go('open', 1000);
        }
        break;
      case 'tele_crystal':
        b.setVelocityX(0);
        if (this.timer <= 0) { this.crystalIdx = 0; this.go('crystal', 0); }
        break;
      case 'crystal':
        b.setVelocityX(0);
        if (this.timer <= 0) {
          if (this.crystalIdx < 6) { this.onCrystal?.(this.x + this.dir * (40 + this.crystalIdx * 46), this.homeY); this.crystalIdx++; this.timer = 130; }
          else this.go('open', 900);
        }
        break;
      case 'teleport':
        b.setVelocityX(0);
        if (this.timer <= 0) {
          const nx = Phaser.Math.Clamp(player.x - this.dir * 150, 80, 46 * 32 - 80);
          this.onTeleport?.(nx);
          b.reset(nx, this.homeY - 26);
          this.gfx.setAlpha(1);
          this.dir = Math.sign(player.x - nx) || 1;
          this.go(Math.random() < 0.5 ? 'tele_glasses' : 'tele_kick', this.tele(350));
        }
        break;
      case 'transition':
        b.setVelocityX(0);
        if (this.timer <= 0) this.go('idle', 300);
        break;
      case 'stunned':
        b.setVelocityX(0);
        if (this.timer <= 0) this.go('idle', 200);
        break;
    }
    this.animate();
    const cx = Math.round(b.center.x), by = Math.round(b.bottom);
    this.gfx.setPosition(cx, by);
    this.shadow.setPosition(cx, this.homeY).setVisible(this.state !== 'teleport');
    this.ghosts.forEach((g, i) => {
      const lag = (i + 1) * 0.12;
      g.setPosition(Phaser.Math.Linear(g.x, cx - this.dir * (i + 1) * 40, lag), by).setFlipX(this.gfx.flipX).setVisible(this.state !== 'teleport' && this.state !== 'transition');
      if (g.frame.name !== this.gfx.frame.name) { g.setTexture('spr', this.gfx.frame.name); g.setOrigin(this.gfx.originX, this.gfx.originY); }
    });
    if (this.scene.time.now < this.flashUntil) this.gfx.setTintFill(0xffffff); else this.applyTint();
  }

  private applyTint() {
    if (this.state === 'stunned') this.gfx.setTint(0x9fd8f0);
    else if (this.phase >= 2) this.gfx.setTint(0xffb3d4);
    else this.gfx.clearTint();
  }

  /** Pick the next pattern based on phase and distance. */
  private choose(adx: number, afterWalk = false) {
    const r = Math.random();
    if (this.phase === 3 && r < 0.35) { audio.teleport(); this.go('teleport', 300); this.scene.tweens.add({ targets: this.gfx, alpha: 0, duration: 250 }); return; }
    if (this.phase >= 2 && r < 0.55) {
      if (Math.random() < 0.5) this.go('tele_rain', this.tele(600)); else this.go('tele_crystal', this.tele(500));
      return;
    }
    if (adx > 170 && !afterWalk) { this.go('walk', 1500); return; }
    if (Math.random() < 0.55) this.go('tele_glasses', this.tele(500)); else this.go('tele_kick', this.tele(420));
  }

  private animate() {
    const g = this.gfx;
    switch (this.state) {
      case 'walk': case 'dash':
        if (g.anims.currentAnim?.key !== 'direktor_walk' || !g.anims.isPlaying) g.play('direktor_walk', true);
        g.setOrigin(0.5, 58 / 64);
        break;
      case 'tele_glasses': this.setFrame2('direktor_brille_0', 24 / 80, 58 / 64); break;
      case 'kick': this.setFrame2('direktor_kick_0', 24 / 72, 58 / 64); break;
      case 'tele_rain': case 'rain': this.setFrame2('direktor_regen_0', (16 + 20) / 72, 58 / 64); break;
      case 'transition': this.setFrame2('direktor_rage_0', 0.5, 58 / 64); break;
      case 'tele_kick': case 'tele_crystal': case 'crystal': this.setFrame2('direktor_idle_1', 0.5, 58 / 64); break;
      default:
        if (g.anims.currentAnim?.key !== 'direktor_idle' || !g.anims.isPlaying) g.play('direktor_idle', true);
        g.setOrigin(0.5, 58 / 64);
    }
    g.setFlipX(this.dir < 0);
  }

  /** Damage from Bario. Returns the damage actually dealt. */
  hit(dmg: number) {
    if (!this.alive || this.state === 'intro' || this.state === 'transition') return 0;
    const real = this.state === 'stunned' ? dmg * 2 : dmg;
    this.hp = Math.max(0, this.hp - real);
    this.flashUntil = this.scene.time.now + 120;
    audio.bossHit();
    if (this.hp <= 0) { this.die(); return real; }
    if (this.phase === 1 && this.hp <= 66) this.enterPhase(2);
    else if (this.phase === 2 && this.hp <= 33) this.enterPhase(3);
    return real;
  }

  stun(ms: number) {
    if (!this.alive || this.state === 'transition') return;
    this.go('stunned', ms);
    this.body.setVelocityX(0);
  }

  private enterPhase(p: number) {
    this.phase = p;
    audio.phase();
    this.go('transition', 1300);
    this.body.setVelocityX(0);
    this.onPhase?.(p);
    if (p === 3 && this.ghosts.length === 0) {
      for (let i = 0; i < 2; i++) {
        const gh = this.scene.add.sprite(this.x, this.homeY, 'spr', 'direktor_idle_0').setOrigin(0.5, 58 / 64).setDepth(7.5).setAlpha(0.32).setTint(0xff4fa3);
        this.ghosts.push(gh);
      }
    }
  }

  private die() {
    this.state = 'dead';
    this.body.enable = false;
    this.ghosts.forEach((g) => g.destroy());
    this.ghosts = [];
    const g = this.gfx;
    g.anims.stop(); g.clearTint();
    g.setTexture('spr', 'direktor_idle_0').setOrigin(0.5, 58 / 64);
    // Squash is cosmetic; the defeat frame + victory chain run off the scene clock so they never depend on tween timing.
    this.scene.tweens.add({ targets: g, scaleY: 0.6, scaleX: 1.3, y: g.y, duration: 500, ease: 'Quad.in' });
    this.scene.time.delayedCall(500, () => {
      if (!g.active) return;
      this.scene.tweens.killTweensOf(g);
      g.setTexture('spr', 'direktor_defeat_0').setOrigin(0.5, 1).setScale(1, 1);
      this.shadow.setVisible(false);
      this.onDead?.();
    });
  }
}
