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

/** The Meistersager's MEITHHTER! shockwave. No gravity, short life, pushes Bario back. */
export class Wave extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  born: number;
  dir: number;
  constructor(scene: Phaser.Scene, x: number, y: number, dir: number) {
    super(scene, x, y, 'spr', 'fx_wave_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.dir = dir;
    this.setDepth(9).setFlipX(dir < 0).setAlpha(0.95);
    this.body.setAllowGravity(false);
    this.body.setSize(14, 30).setOffset(3, 3);
    this.body.setVelocityX(dir * T.WAVE_SPEED);
    this.born = scene.time.now;
    scene.tweens.add({ targets: this, scaleX: 1.35, scaleY: 1.25, alpha: 0.35, duration: T.WAVE_LIFE, ease: 'Quad.out' });
  }
  expired(now: number) { return now - this.born > T.WAVE_LIFE; }
}
