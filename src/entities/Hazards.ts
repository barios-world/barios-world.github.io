import Phaser from 'phaser';
import { T } from '../config/Tuning';

/** Hot coffee puddle on the ground: touching it hurts (World 2). */
export class Puddle extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.StaticBody;
  constructor(scene: Phaser.Scene, x: number, groundY: number) {
    super(scene, x, groundY, 'spr', 'haz_puddle_0');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOrigin(0.5, 1).setDepth(3);
    this.body.setSize(28, 6).setOffset(2, 2);
    scene.tweens.add({ targets: this, alpha: 0.75, duration: 500, yoyo: true, repeat: -1 });
  }
}

/** Steam vent: lifts Bario high when he stands in the steam (World 2 "Aufwind"). */
export class Vent extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.StaticBody;
  steam: Phaser.GameObjects.Image;
  constructor(scene: Phaser.Scene, x: number, groundY: number) {
    super(scene, x, groundY, 'spr', 'haz_vent_0');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOrigin(0.5, 1).setDepth(3);
    this.body.setSize(28, 120).setOffset(2, -112);
    this.steam = scene.add.image(x, groundY - 8, 'spr', 'deco_steam_0').setOrigin(0.5, 1).setDepth(2).setAlpha(0.7).setScale(1.4, 2.4);
    scene.tweens.add({ targets: this.steam, alpha: 0.35, scaleY: 3.2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
}

/** Rolling football (World 4). Hurts on contact, can be stomped away. */
export class Ball extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  born: number;
  constructor(scene: Phaser.Scene, x: number, y: number, dir: number) {
    super(scene, x, y, 'spr', 'haz_ball_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(7);
    this.body.setCircle(10, 2, 2);
    this.body.setGravityY(T.GRAVITY * 0.7);
    this.body.setBounce(0.55, 0.4);
    this.body.setVelocity(dir * 150, -80);
    this.body.setAngularVelocity(dir * 360);
    this.born = scene.time.now;
  }
  expired(now: number) { return now - this.born > 9000; }
}

/** Spawns balls toward the player every few seconds (World 4). */
export class BallSpawner {
  next = 0;
  constructor(public x: number, public y: number, public every = 3200) {}
}

/** Playing-card platform that flips: solid, then flips over and lets you fall (World 3). */
export class CardPlatform extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.StaticBody;
  solidPhase = true;
  constructor(scene: Phaser.Scene, x: number, y: number, phase = 0) {
    super(scene, x, y, 'spr', 'plat_card_0');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(3);
    this.body.setSize(60, 10).setOffset(2, 0);
    const loop = () => {
      // 1.8s solid -> flip (0.35s) -> 0.9s open -> flip back
      scene.time.delayedCall(1800, () => {
        if (!this.active) return;
        scene.tweens.add({ targets: this, scaleX: 0, duration: 170, yoyo: true, onYoyo: () => { this.setTexture('spr', 'plat_card_back_0'); this.solidPhase = false; this.body.enable = false; },
          onComplete: () => scene.time.delayedCall(900, () => {
            if (!this.active) return;
            scene.tweens.add({ targets: this, scaleX: 0, duration: 170, yoyo: true, onYoyo: () => { this.setTexture('spr', 'plat_card_0'); this.solidPhase = true; this.body.enable = true; }, onComplete: loop });
          }) });
      });
    };
    scene.time.delayedCall(phase, loop);
  }
}

/** Moving platform (horizontal or vertical). Immovable + friction carries Bario. */
export class MovingPlatform extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.Body;
  x0: number; y0: number; range: number; speed: number; vertical: boolean;
  constructor(scene: Phaser.Scene, x: number, y: number, range = 96, speed = 60, vertical = false) {
    super(scene, x, y, 'spr', 'plat_move_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(3);
    this.x0 = x; this.y0 = y; this.range = range; this.speed = speed; this.vertical = vertical;
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setFriction(1, 0);
    this.body.setSize(64, 14).setOffset(0, 0);
    if (vertical) this.body.setVelocityY(speed); else this.body.setVelocityX(speed);
  }
  tick() {
    if (this.vertical) {
      if (this.y > this.y0 + this.range) this.body.setVelocityY(-this.speed);
      else if (this.y < this.y0 - this.range) this.body.setVelocityY(this.speed);
    } else {
      if (this.x > this.x0 + this.range) this.body.setVelocityX(-this.speed);
      else if (this.x < this.x0 - this.range) this.body.setVelocityX(this.speed);
    }
  }
}
