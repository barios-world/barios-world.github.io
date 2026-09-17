import Phaser from 'phaser';
import { T } from '../config/Tuning';

/** Bario's coffee cup: fast, almost straight, breaks on the ground. */
export class Cup extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  born: number;
  constructor(scene: Phaser.Scene, x: number, y: number, dir: number) {
    super(scene, x, y, 'spr', 'proj_cup_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(9);
    this.body.setSize(10, 10).setOffset(2, 2);
    this.body.setVelocity(dir * T.CUP_SPEED, -50);
    this.body.setGravityY(T.CUP_GRAVITY);
    this.setFlipX(dir < 0);
    this.born = scene.time.now;
  }
  expired(now: number) { return now - this.born > 1400; }
}

/** Cambio Master card: homes in on the nearest mob. */
export class HomingCard extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  born: number;
  target?: { x: number; y: number; alive: boolean };
  constructor(scene: Phaser.Scene, x: number, y: number, dir: number, spread: number) {
    super(scene, x, y, 'spr', 'proj_card_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(9);
    this.body.setAllowGravity(false);
    this.body.setSize(8, 10);
    this.body.setVelocity(dir * 330, spread * 90);
    this.born = scene.time.now;
    scene.tweens.add({ targets: this, angle: dir * 360, duration: 500, repeat: -1 });
  }
  steer(dt: number) {
    if (!this.target || !this.target.alive) return;
    const ang = Math.atan2(this.target.y - 20 - this.y, this.target.x - this.x);
    const v = this.body.velocity;
    const cur = Math.atan2(v.y, v.x);
    const na = Phaser.Math.Angle.RotateTo(cur, ang, 6 * dt);
    const sp = 340;
    this.body.setVelocity(Math.cos(na) * sp, Math.sin(na) * sp);
  }
  expired(now: number) { return now - this.born > 1600; }
}

/** Shockwave. Owner 'mob' hurts Bario; owner 'player' (DJ) pushes mobs. */
export class Wave extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  born: number;
  dir: number;
  owner: 'mob' | 'player';
  strength: number;
  hit = new Set<object>();
  constructor(scene: Phaser.Scene, x: number, y: number, dir: number, owner: 'mob' | 'player' = 'mob', strength = 1) {
    super(scene, x, y, 'spr', 'fx_wave_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.dir = dir;
    this.owner = owner;
    this.strength = strength;
    this.setDepth(9).setFlipX(dir < 0).setAlpha(0.95);
    if (owner === 'player') this.setTint(strength > 1 ? 0xff4fa3 : 0x9b6bd6);
    this.body.setAllowGravity(false);
    this.body.setSize(14, 30).setOffset(3, 3);
    this.body.setVelocityX(dir * T.WAVE_SPEED * (owner === 'player' ? 1.3 : 1));
    this.born = scene.time.now;
    scene.tweens.add({ targets: this, scaleX: 1.35 * strength, scaleY: 1.25 * strength, alpha: 0.35, duration: T.WAVE_LIFE, ease: 'Quad.out' });
  }
  expired(now: number) { return now - this.born > T.WAVE_LIFE; }
}

/** Pacifier thrown by the Njuckel-Werfer: arcs toward Bario, breaks on the ground. */
export class Pacifier extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  born: number;
  constructor(scene: Phaser.Scene, x: number, y: number, vx: number, vy: number) {
    super(scene, x, y, 'spr', 'it_nuckel_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(9).setScale(0.7);
    this.body.setCircle(8, 4, 4);
    this.body.setVelocity(vx, vy);
    this.body.setGravityY(T.GRAVITY * 0.55);
    this.body.setAngularVelocity(vx > 0 ? 300 : -300);
    this.born = scene.time.now;
  }
  expired(now: number) { return now - this.born > 2500; }
}
