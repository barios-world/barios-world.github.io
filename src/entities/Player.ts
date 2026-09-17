import Phaser from 'phaser';
import { T } from '../config/Tuning';
import type { InputSystem } from '../systems/Input';

const approach = (v: number, target: number, delta: number) =>
  v < target ? Math.min(v + delta, target) : Math.max(v - delta, target);

/**
 * Physics body (invisible) + visual sprite that follows it, so squash & stretch never touch the hitbox.
 * Frame is 48x64 with the feet on row 58 -> body 26x52 at offset (11, 6).
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  gfx: Phaser.GameObjects.Sprite;
  facing = 1;
  coyote = 0;
  buffer = 0;
  jumping = false;
  wasGrounded = false;
  grounded = false;
  hurtUntil = 0;
  dead = false;
  onLand?: (x: number, y: number, speed: number) => void;
  onJump?: (x: number, y: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'spr', 'bario_idle_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVisible(false);
    this.body.setSize(26, 52).setOffset(11, 6);
    this.body.setMaxVelocityY(T.TERMINAL_V);
    this.body.setGravityY(T.GRAVITY);
    this.body.setCollideWorldBounds(false);
    this.gfx = scene.add.sprite(x, y, 'spr', 'bario_idle_0').setOrigin(0.5, 58 / 64).setDepth(10);
    this.gfx.play('bario_idle');
  }

  /** Place the feet on a ground line. */
  spawnAt(x: number, groundY: number) {
    this.body.reset(x, groundY - 26);
    this.body.setVelocity(0, 0);
    this.dead = false;
    this.jumping = false;
    this.coyote = 0;
    this.buffer = 0;
    this.gfx.setScale(1, 1).setAlpha(1);
    this.syncGfx();
  }

  update(inp: InputSystem, dt: number) {
    const b = this.body;
    const grounded = (this.grounded = b.blocked.down || b.touching.down);

    // --- timers
    this.coyote = grounded ? T.COYOTE_MS : Math.max(0, this.coyote - dt * 1000);
    this.buffer = inp.jumpPressed ? T.BUFFER_MS : Math.max(0, this.buffer - dt * 1000);

    // --- jump (buffered + coyote)
    if (this.buffer > 0 && this.coyote > 0) {
      b.setVelocityY(-T.JUMP_V);
      this.buffer = 0; this.coyote = 0; this.jumping = true;
      this.stretch();
      this.onJump?.(this.x, b.bottom);
    }
    if (this.jumping && !inp.jumpHeld && b.velocity.y < -T.JUMP_V * T.JUMP_CUT) b.setVelocityY(-T.JUMP_V * T.JUMP_CUT);
    if (b.velocity.y >= 0) this.jumping = false;

    // --- gravity: apex hang, fast fall
    let g = T.GRAVITY;
    if (b.velocity.y > 0) g *= T.FALL_MULT;
    else if (!grounded && Math.abs(b.velocity.y) < T.APEX_WINDOW) g *= T.APEX_MULT;
    b.setGravityY(g);

    // --- horizontal
    const ax = inp.axis;
    let vx = b.velocity.x;
    if (ax !== 0) {
      const max = Math.abs(ax) > T.RUN_THRESHOLD ? T.RUN_MAX : T.WALK_MAX;
      const target = Math.sign(ax) * max;
      let acc = grounded ? T.GROUND_ACC : T.AIR_ACC;
      if (vx !== 0 && Math.sign(ax) !== Math.sign(vx)) acc *= T.TURN_BOOST;
      vx = approach(vx, target, acc * dt);
      this.facing = Math.sign(ax);
    } else {
      vx = approach(vx, 0, (grounded ? T.GROUND_FRIC : T.AIR_DRAG) * dt);
    }
    b.setVelocityX(vx);

    // --- landing
    if (grounded && !this.wasGrounded) {
      this.squash();
      this.onLand?.(this.x, b.bottom, Math.abs(b.prev.y - b.y));
    }
    this.wasGrounded = grounded;

    this.animate(vx, grounded);
    this.syncGfx();
  }

  private animate(vx: number, grounded: boolean) {
    const g = this.gfx;
    let key: string;
    if (!grounded) key = 'bario_jump';
    else if (Math.abs(vx) < 12) key = 'bario_idle';
    else if (Math.abs(vx) < T.WALK_MAX + 20) key = 'bario_walk';
    else key = 'bario_run';
    if (g.anims.currentAnim?.key !== key) g.play(key, true);
    g.setFlipX(this.facing < 0);
  }

  syncGfx() {
    this.gfx.setPosition(Math.round(this.body.center.x), Math.round(this.body.bottom));
  }

  private stretch() {
    this.scene.tweens.killTweensOf(this.gfx);
    this.gfx.setScale(0.82, 1.22);
    this.scene.tweens.add({ targets: this.gfx, scaleX: 1, scaleY: 1, duration: 160, ease: 'Quad.out' });
  }

  private squash() {
    this.scene.tweens.killTweensOf(this.gfx);
    this.gfx.setScale(1.25, 0.78);
    this.scene.tweens.add({ targets: this.gfx, scaleX: 1, scaleY: 1, duration: 140, ease: 'Back.out' });
  }
}
