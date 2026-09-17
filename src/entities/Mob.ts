import Phaser from 'phaser';
import { T } from '../config/Tuning';
import { audio } from '../systems/Audio';

type State = 'patrol' | 'notice' | 'run' | 'attack' | 'cooldown' | 'stunned' | 'flung' | 'dead';

/** Der Meistersager – the one and only mob. Patrols, notices you, runs, shouts MEITHHTER!, gets stomped, becomes an angel. */
export class Mob extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  gfx: Phaser.GameObjects.Sprite;
  state: State = 'patrol';
  dir = -1;
  timer = 0;
  spawnX: number;
  spawnY: number;
  ground: Phaser.Tilemaps.TilemapLayer;
  onShout?: (x: number, y: number, dir: number) => void;
  speedMul = 1;
  /** confused (sprayed): walks the wrong way, slower */
  confusedUntil = 0;
  flungUntil = 0;
  private paintTint = false;

  constructor(scene: Phaser.Scene, x: number, groundY: number, ground: Phaser.Tilemaps.TilemapLayer, speedMul = 1) {
    super(scene, x, groundY - 26, 'spr', 'meister_idle_0');
    this.speedMul = speedMul;
    this.ground = ground;
    this.spawnX = x; this.spawnY = groundY;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVisible(false);
    this.body.setSize(24, 50).setOffset(12, 8);
    this.body.setGravityY(T.GRAVITY);
    this.body.setMaxVelocityY(T.TERMINAL_V);
    this.gfx = scene.add.sprite(x, groundY, 'spr', 'meister_idle_0').setOrigin(0.5, 58 / 64).setDepth(8);
    this.gfx.play('meister_walk');
  }

  get alive() { return this.state !== 'dead'; }
  get flung() { return this.state === 'flung'; }
  get confused() { return this.scene.time.now < this.confusedUntil; }

  private ledgeAhead() {
    const b = this.body;
    const tile = this.ground.getTileAtWorldXY(b.center.x + this.dir * (b.halfWidth + 6), b.bottom + 6);
    return !tile;
  }

  update(dt: number, player: { x: number; y: number; dead: boolean }, worldScale = 1) {
    if (this.state === 'dead') return;
    const b = this.body;
    const dx = player.x - this.x;
    const adx = Math.abs(dx), ady = Math.abs(player.y - this.y);
    const sdt = dt * worldScale;
    this.timer -= sdt * 1000;
    const grounded = b.blocked.down;
    const conf = this.confused;
    const mul = this.speedMul * worldScale * (conf ? 0.5 : 1);
    if (conf !== this.paintTint) { this.paintTint = conf; if (conf) this.gfx.setTint(0xff9ec9); else this.gfx.clearTint(); }

    switch (this.state) {
      case 'patrol':
        if (b.blocked.left) this.dir = 1;
        else if (b.blocked.right) this.dir = -1;
        else if (grounded && this.ledgeAhead()) this.dir = -this.dir;
        b.setVelocityX(this.dir * T.MOB_WALK * mul);
        if (!conf && !player.dead && adx < T.MOB_NOTICE && ady < 90 && Math.sign(dx) === this.dir) {
          this.state = 'notice'; this.timer = 450; b.setVelocityX(0); audio.notice();
        }
        break;
      case 'notice':
        b.setVelocityX(0);
        if (this.timer <= 0) this.state = 'run';
        break;
      case 'run':
        this.dir = (Math.sign(dx) || this.dir) * (conf ? -1 : 1);
        if (grounded && this.ledgeAhead()) b.setVelocityX(0);
        else b.setVelocityX(this.dir * T.MOB_RUN * mul);
        if (!conf && adx < T.MOB_ATTACK_RANGE && ady < 70) { this.state = 'attack'; this.timer = T.MOB_TELEGRAPH; b.setVelocityX(0); }
        else if (adx > T.MOB_LOSE || player.dead || conf) this.state = 'patrol';
        break;
      case 'attack':
        b.setVelocityX(0);
        if (this.timer <= 0) {
          audio.shout();
          this.onShout?.(this.x + this.dir * 16, b.center.y - 4, this.dir);
          this.state = 'cooldown'; this.timer = 1100;
        }
        break;
      case 'cooldown':
        b.setVelocityX(0);
        if (this.timer <= 0) this.state = adx < T.MOB_LOSE && !player.dead ? 'run' : 'patrol';
        break;
      case 'stunned':
        b.setVelocityX(b.velocity.x * 0.9);
        if (this.timer <= 0) this.state = 'patrol';
        break;
      case 'flung':
        if (this.scene.time.now > this.flungUntil || b.blocked.left || b.blocked.right || (grounded && this.scene.time.now > this.flungUntil - 500)) {
          this.kill();
          return;
        }
        this.gfx.angle += this.dir * 18;
        break;
    }
    if (this.state !== 'flung') this.animate();
    this.gfx.setPosition(Math.round(b.center.x), Math.round(b.bottom));
  }

  private animate() {
    const g = this.gfx;
    let key = 'meister_walk';
    if (this.state === 'run') key = 'meister_run';
    else if (this.state === 'notice' || this.state === 'cooldown') key = 'meister_idle';
    if (this.state === 'attack') {
      if (g.frame.name !== 'meister_attack_0') { g.anims.stop(); g.setTexture('spr', 'meister_attack_0'); }
      g.setOrigin(24 / 96, 58 / 64);
    } else if (this.state === 'stunned') {
      if (g.frame.name !== 'meister_hit_0') { g.anims.stop(); g.setTexture('spr', 'meister_hit_0'); }
      g.setOrigin(0.5, 58 / 64);
    } else {
      if (g.originX !== 0.5) g.setOrigin(0.5, 58 / 64);
      if (g.anims.currentAnim?.key !== key || !g.anims.isPlaying) g.play(key, true);
    }
    g.setFlipX(this.dir < 0);   // side frames face right by default
  }

  /** Sprayed: walks the wrong way for a while. */
  confuse(ms: number) {
    if (this.state === 'dead') return;
    this.confusedUntil = this.scene.time.now + ms;
    if (this.state === 'attack' || this.state === 'notice') this.state = 'patrol';
    this.dir = -this.dir;
  }

  /** DJ wave / light punch: pushed back without dying (falls off ledges!). */
  push(dir: number, strength: number, vy = -120) {
    if (this.state === 'dead' || this.state === 'flung') return;
    this.state = 'stunned';
    this.timer = 450;
    this.body.setVelocity(dir * strength, vy);
  }

  /** Boxer third punch: becomes a projectile that kills other mobs. */
  fling(dir: number) {
    if (this.state === 'dead') return;
    this.state = 'flung';
    this.dir = dir;
    this.flungUntil = this.scene.time.now + 1100;
    this.body.setVelocity(dir * T.FLING_VX, -T.FLING_VY);
    this.gfx.anims.stop();
    this.gfx.setTexture('spr', 'meister_hit_0').setOrigin(0.5, 0.5);
    audio.stomp();
  }

  /** Stomped, punched or hit by a projectile. */
  kill() {
    if (this.state === 'dead') return;
    this.state = 'dead';
    this.body.enable = false;
    this.body.setVelocity(0, 0);
    audio.stomp();
    const g = this.gfx;
    g.anims.stop();
    g.clearTint();
    g.setAngle(0).setTexture('spr', 'meister_hit_0').setOrigin(0.5, 58 / 64).setFlipX(false);
    g.setPosition(Math.round(this.body.center.x), Math.round(this.body.bottom));
    this.scene.tweens.add({ targets: g, scaleX: 1.25, scaleY: 0.75, duration: 90, yoyo: true });
    this.scene.time.delayedCall(220, () => {
      if (this.state !== 'dead') return;
      g.setTexture('spr', 'meister_defeat_0').setOrigin(0.5, 63 / 64).setScale(1, 1);
      this.scene.tweens.add({ targets: g, y: g.y - 70, alpha: 0, duration: 1100, ease: 'Sine.out',
        onComplete: () => { g.setVisible(false); } });
    });
    this.scene.time.delayedCall(T.MOB_RESPAWN_MS, () => this.respawn());
  }

  respawn() {
    if (!this.scene) return;
    this.state = 'patrol';
    this.dir = -1;
    this.confusedUntil = 0;
    this.body.enable = true;
    this.body.reset(this.spawnX, this.spawnY - 26);
    this.gfx.setVisible(true).setAlpha(0).setScale(1, 1).setAngle(0).setOrigin(0.5, 58 / 64).setPosition(this.spawnX, this.spawnY);
    this.scene.tweens.add({ targets: this.gfx, alpha: 1, duration: 300 });
    this.gfx.play('meister_walk');
  }
}
