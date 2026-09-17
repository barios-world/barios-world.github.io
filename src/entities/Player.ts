import Phaser from 'phaser';
import { T } from '../config/Tuning';
import type { InputSystem } from '../systems/Input';
import { audio } from '../systems/Audio';
import { FORMS, type Form } from '../data/forms';

const approach = (v: number, target: number, delta: number) =>
  v < target ? Math.min(v + delta, target) : Math.max(v - delta, target);

/**
 * Physics body (invisible) + visual sprite that follows it, so squash & stretch never touch the hitbox.
 * Frame is 48x64 with the feet on row 58 -> body 26x52 at offset (11, 6).
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  gfx: Phaser.GameObjects.Sprite;
  aura: Phaser.GameObjects.Sprite;
  facing = 1;
  coyote = 0;
  buffer = 0;
  jumping = false;
  wasGrounded = false;
  grounded = false;
  dead = false;
  form: Form = 'base';
  invulnUntil = 0;
  attackCooldown = 0;
  posUntil = 0;
  controlLock = 0;
  /** multipliers applied by specials (Kaffee Power) */
  boostSpeed = 1;
  boostJump = 1;
  noCooldown = false;
  /** permanent multiplier from the shop */
  upgradeSpeed = 1;
  private blinkTween?: Phaser.Tweens.Tween;
  private scaleTween?: Phaser.Tweens.Tween;
  onLand?: (x: number, y: number, speed: number) => void;
  onJump?: (x: number, y: number) => void;
  onAttack?: (form: Form, x: number, y: number, dir: number) => number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'spr', 'bario_idle_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVisible(false);
    this.body.setSize(26, 52).setOffset(11, 6);
    this.body.setMaxVelocityY(T.TERMINAL_V);
    this.body.setGravityY(T.GRAVITY);
    this.aura = scene.add.sprite(x, y, 'spr', 'bario_idle_0').setOrigin(0.5, 58 / 64).setDepth(9).setVisible(false).setAlpha(0.55).setScale(1.18, 1.12);
    this.gfx = scene.add.sprite(x, y, 'spr', 'bario_idle_0').setOrigin(0.5, 58 / 64).setDepth(10);
    this.gfx.play('bario_idle');
  }

  get def() { return FORMS[this.form]; }

  /** Place the feet on a ground line. */
  spawnAt(x: number, groundY: number) {
    this.body.reset(x, groundY - 26);
    this.body.setVelocity(0, 0);
    this.dead = false;
    this.jumping = false;
    this.coyote = 0;
    this.buffer = 0;
    this.controlLock = 0;
    this.stopBlink();
    this.gfx.setScale(1, 1).setAlpha(1);
    this.syncGfx();
  }

  get invulnerable() { return this.scene.time.now < this.invulnUntil; }

  setForm(f: Form) {
    this.form = f;
    this.scene.registry.set('form', f);
  }

  /** Aura for specials: gold (Kaffee Power) or pink (Khusra ready). */
  setAura(color: number | null) {
    if (color === null) { this.aura.setVisible(false); return; }
    this.aura.setVisible(true).setTint(color);
  }

  /** Returns true if the hit connected (not invulnerable). */
  hurt(fromDir: number): boolean {
    if (this.dead || this.invulnerable) return false;
    this.invulnUntil = this.scene.time.now + T.INVULN_MS;
    this.controlLock = 220;
    this.body.setVelocity(fromDir * T.KNOCKBACK_X, -T.KNOCKBACK_Y);
    this.startBlink();
    if (this.form !== 'base') {
      const lost = this.def.name;
      this.setForm('base');
      audio.downgrade();
      this.scene.events.emit('msg', `${lost} WEG!`, 700);
      return true;
    }
    audio.hurt();
    this.scene.registry.inc('hearts', -1);
    return true;
  }

  bounce() {
    this.body.setVelocityY(-T.JUMP_V * T.STOMP_BOUNCE);
    this.jumping = true;
    this.stretch();
  }

  update(inp: InputSystem, dt: number) {
    const b = this.body;
    const def = this.def;
    const grounded = (this.grounded = b.blocked.down || b.touching.down);
    this.controlLock = Math.max(0, this.controlLock - dt * 1000);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt * 1000);
    const locked = this.controlLock > 0;
    const jumpV = T.JUMP_V * def.jumpMul * this.boostJump;

    // --- timers
    this.coyote = grounded ? T.COYOTE_MS : Math.max(0, this.coyote - dt * 1000);
    this.buffer = inp.jumpPressed && !locked ? T.BUFFER_MS : Math.max(0, this.buffer - dt * 1000);

    // --- jump (buffered + coyote)
    if (this.buffer > 0 && this.coyote > 0) {
      b.setVelocityY(-jumpV);
      this.buffer = 0; this.coyote = 0; this.jumping = true;
      this.stretch();
      audio.jump();
      this.onJump?.(this.x, b.bottom);
    }
    if (this.jumping && !inp.jumpHeld && b.velocity.y < -jumpV * T.JUMP_CUT) b.setVelocityY(-jumpV * T.JUMP_CUT);
    if (b.velocity.y >= 0) this.jumping = false;

    // --- gravity: apex hang, fast fall
    let g = T.GRAVITY;
    if (b.velocity.y > 0) g *= T.FALL_MULT;
    else if (!grounded && Math.abs(b.velocity.y) < T.APEX_WINDOW) g *= T.APEX_MULT;
    b.setGravityY(g);

    // --- horizontal
    const ax = locked ? 0 : inp.axis;
    let vx = b.velocity.x;
    const speedMul = def.speedMul * this.boostSpeed * this.upgradeSpeed;
    if (ax !== 0) {
      const max = (Math.abs(ax) > T.RUN_THRESHOLD ? T.RUN_MAX : T.WALK_MAX) * speedMul;
      const target = Math.sign(ax) * max;
      let acc = (grounded ? T.GROUND_ACC : T.AIR_ACC) * def.accelMul;
      if (vx !== 0 && Math.sign(ax) !== Math.sign(vx)) acc *= T.TURN_BOOST;
      vx = approach(vx, target, acc * dt);
      this.facing = Math.sign(ax);
    } else if (!locked) {
      vx = approach(vx, 0, (grounded ? T.GROUND_FRIC : T.AIR_DRAG) * def.fricMul * dt);
    }
    b.setVelocityX(vx);

    // --- attack
    const ultReady = ((this.scene.registry.get('khusra') as number) || 0) >= 100;
    if (inp.attackPressed && !locked && (this.attackCooldown <= 0 || ultReady)) {
      const cd = this.onAttack?.(this.form, this.x + this.facing * 18, b.center.y - 6, this.facing) ?? 0;
      if (cd > 0) {
        this.attackCooldown = this.noCooldown ? Math.min(cd, 90) : cd;
        this.posUntil = this.scene.time.now + 200;
      }
    }

    // --- landing
    if (grounded && !this.wasGrounded) {
      this.squash();
      audio.land();
      this.onLand?.(this.x, b.bottom, Math.abs(b.prev.y - b.y));
    }
    this.wasGrounded = grounded;

    this.animate(vx, grounded);
    this.syncGfx();
  }

  private animate(vx: number, grounded: boolean) {
    const g = this.gfx;
    const def = this.def;
    if (this.scene.time.now < this.posUntil && def.hero) {
      if (g.frame.name !== def.hero) { g.anims.stop(); g.setTexture('spr', def.hero); }
      const fw = g.frame.width;
      // side poses (72 wide) anchor at x=24, front hero poses anchor centered
      g.setOrigin(fw === 72 ? 24 / 72 : 0.5, 58 / 64).setFlipX(this.facing < 0);
      this.aura.setTexture('spr', g.frame.name).setOrigin(g.originX, g.originY).setFlipX(g.flipX);
      return;
    }
    if (g.originX !== 0.5) g.setOrigin(0.5, 58 / 64);
    let key: string;
    const a = def.anims;
    if (!grounded) key = a ? a.jump : 'bario_jump';
    else if (Math.abs(vx) < 12) key = a ? a.idle : 'bario_idle';
    else if (Math.abs(vx) < T.WALK_MAX + 20) key = a ? a.walk : 'bario_walk';
    else key = a ? a.run : 'bario_run';
    if (a && key === a.jump) {
      if (g.frame.name !== key) { g.anims.stop(); g.setTexture('spr', key); }
    } else if (g.anims.currentAnim?.key !== key || !g.anims.isPlaying) {
      g.play(key, true);
    }
    g.setFlipX(this.facing < 0);
    if (this.aura.visible) { this.aura.setTexture('spr', g.frame.name).setOrigin(0.5, 58 / 64).setFlipX(g.flipX); }
  }

  syncGfx() {
    const x = Math.round(this.body.center.x), y = Math.round(this.body.bottom);
    this.gfx.setPosition(x, y);
    this.aura.setPosition(x, y + 1);
  }

  private startBlink() {
    this.stopBlink();
    this.blinkTween = this.scene.tweens.add({ targets: this.gfx, alpha: 0.25, duration: 80, yoyo: true, repeat: Math.floor(T.INVULN_MS / 160), onComplete: () => this.gfx.setAlpha(1) });
  }

  private stopBlink() {
    this.blinkTween?.stop();
    this.blinkTween = undefined;
    this.gfx.setAlpha(1);
  }

  private stretch() {
    this.scaleTween?.stop();
    this.gfx.setScale(0.82, 1.22);
    this.scaleTween = this.scene.tweens.add({ targets: this.gfx, scaleX: 1, scaleY: 1, duration: 160, ease: 'Quad.out' });
  }

  private squash() {
    this.scaleTween?.stop();
    this.gfx.setScale(1.25, 0.78);
    this.scaleTween = this.scene.tweens.add({ targets: this.gfx, scaleX: 1, scaleY: 1, duration: 140, ease: 'Back.out' });
  }
}
