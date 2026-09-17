import Phaser from 'phaser';
import { T } from '../config/Tuning';
import { audio } from '../systems/Audio';

type State = 'patrol' | 'notice' | 'run' | 'attack' | 'cooldown' | 'stunned' | 'flung' | 'dead';
export type Variant = 'basic' | 'nuckel' | 'schal' | 'fahne' | 'trommler' | 'fanblock';

export const VARIANT_INFO: Record<Variant, { prop: string | null; tint: number; name: string }> = {
  basic: { prop: null, tint: 0xffffff, name: 'MEISTERSAGER' },
  nuckel: { prop: 'it_nuckel_0', tint: 0xcfe6ff, name: 'NJUCKEL-WERFER' },
  schal: { prop: 'it_schal_0', tint: 0xffd6d6, name: 'SCHAL-SCHWINGER' },
  fahne: { prop: 'it_fahne_0', tint: 0xffffff, name: 'FAHNENTRAEGER' },
  trommler: { prop: 'prop_drum_0', tint: 0xfff0c0, name: 'TROMMLER' },
  fanblock: { prop: null, tint: 0xffffff, name: 'FAN-BLOCK' },
};

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
  onThrow?: (x: number, y: number, vx: number, vy: number) => void;
  onDrum?: () => void;
  /** baby talk in a bubble (GameScene draws it) */
  onSay?: (text: string) => void;
  /** parade walker: fixed direction, never notices, vanishes past despawnX */
  parade = 0;
  despawnX?: number;
  /** storm runner: charges from the start and never gives up */
  aggro = false;
  gone = false;
  speedMul = 1;
  /** temporary buff from a Fahnentraeger / Trommler beat */
  buff = 1;
  variant: Variant = 'basic';
  prop?: Phaser.GameObjects.Image;
  members = 1;
  extra: Phaser.GameObjects.Sprite[] = [];
  /** confused (sprayed): walks the wrong way, slower */
  confusedUntil = 0;
  flungUntil = 0;
  private paintTint = false;

  constructor(scene: Phaser.Scene, x: number, groundY: number, ground: Phaser.Tilemaps.TilemapLayer, speedMul = 1, variant: Variant = 'basic') {
    super(scene, x, groundY - 26, 'spr', 'meister_idle_0');
    this.speedMul = speedMul;
    this.variant = variant;
    this.ground = ground;
    this.spawnX = x; this.spawnY = groundY;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVisible(false);
    this.members = variant === 'fanblock' ? 3 : 1;
    this.body.setSize(24 * this.members, 50).setOffset(12 - 12 * (this.members - 1), 8);
    this.body.setGravityY(T.GRAVITY);
    this.body.setMaxVelocityY(T.TERMINAL_V);
    this.gfx = scene.add.sprite(x, groundY, 'spr', 'meister_idle_0').setOrigin(0.5, 58 / 64).setDepth(8);
    this.gfx.play('meister_walk');
    const info = VARIANT_INFO[variant];
    if (info.tint !== 0xffffff) this.gfx.setTint(info.tint);
    if (info.prop) this.prop = scene.add.image(x, groundY, 'spr', info.prop).setDepth(9).setScale(variant === 'fahne' ? 1 : 0.8);
    for (let i = 1; i < this.members; i++) {
      const e = scene.add.sprite(x, groundY, 'spr', 'meister_idle_0').setOrigin(0.5, 58 / 64).setDepth(8 - i * 0.01);
      e.play('meister_walk');
      this.extra.push(e);
    }
    if (variant === 'trommler') { this.state = 'cooldown'; this.timer = 1200; }
  }

  /** Where damage from a projectile/punch is blocked: Schal-Schwinger blocks the front side. */
  blocksFrom(dirOfAttack: number) {
    return this.variant === 'schal' && this.alive && this.state !== 'stunned' && dirOfAttack === -this.dir;
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
    const mul = this.speedMul * worldScale * (conf ? 0.5 : 1) * this.buff;
    const keepDist = this.variant === 'nuckel' ? 150 : 0;
    if (conf !== this.paintTint) { this.paintTint = conf; if (conf) this.gfx.setTint(0xff9ec9); else this.gfx.clearTint(); }

    switch (this.state) {
      case 'patrol':
        if (this.parade) {
          this.dir = this.parade;
          b.setVelocityX(this.dir * T.MOB_WALK * 1.4 * mul);
          if (this.despawnX !== undefined && (this.parade > 0 ? this.x > this.despawnX : this.x < this.despawnX)) { this.despawn(); return; }
          break;
        }
        if (this.aggro && !player.dead) { this.state = 'run'; break; }
        if (b.blocked.left) this.dir = 1;
        else if (b.blocked.right) this.dir = -1;
        else if (grounded && this.ledgeAhead()) this.dir = -this.dir;
        b.setVelocityX(this.dir * T.MOB_WALK * mul);
        if (!conf && !player.dead && adx < T.MOB_NOTICE && ady < 90 && Math.sign(dx) === this.dir) {
          this.state = 'notice'; this.timer = 450; b.setVelocityX(0); audio.notice(); audio.say('baby', 'gaga'); this.onSay?.('GAGA?');
        }
        break;
      case 'notice':
        b.setVelocityX(0);
        if (this.timer <= 0) this.state = 'run';
        break;
      case 'run':
        this.dir = (Math.sign(dx) || this.dir) * (conf ? -1 : 1);
        if (keepDist && adx < keepDist) b.setVelocityX(0);               // Nuckel-Werfer keeps his distance
        else if (grounded && this.ledgeAhead()) b.setVelocityX(0);
        else b.setVelocityX(this.dir * T.MOB_RUN * mul);
        if (!conf && ady < 70 && (keepDist ? adx < keepDist + 40 : adx < T.MOB_ATTACK_RANGE)) { this.state = 'attack'; this.timer = T.MOB_TELEGRAPH; b.setVelocityX(0); audio.say('baby', 'waeh'); this.onSay?.(this.variant === 'nuckel' ? 'DADA!' : 'WÄÄH!'); }
        else if (!this.aggro && (adx > T.MOB_LOSE || player.dead || conf)) this.state = 'patrol';
        break;
      case 'attack':
        b.setVelocityX(0);
        if (this.timer <= 0) {
          if (this.variant === 'nuckel') {
            audio.throw(); audio.say('baby', 'dada');
            const vx = Math.sign(dx) * Math.min(260, 120 + adx * 0.9), vy = -260 - Math.max(0, -(player.y - this.y)) * 1.5;
            this.onThrow?.(this.x + this.dir * 12, b.center.y - 10, vx, vy);
          } else {
            audio.shout(); audio.say('baby', 'meister'); this.onSay?.('MEITHHTER!');
            this.onShout?.(this.x + this.dir * 16, b.center.y - 4, this.dir);
          }
          this.state = 'cooldown'; this.timer = this.variant === 'nuckel' ? 1600 : 1100;
        }
        break;
      case 'cooldown':
        b.setVelocityX(0);
        if (this.variant === 'trommler') {
          if (this.timer <= 0) { this.timer = 1200; this.onDrum?.(); this.scene.tweens.add({ targets: [this.gfx, this.prop].filter(Boolean), scaleY: 0.85, duration: 80, yoyo: true }); }
          this.dir = Math.sign(dx) || this.dir;
          break;
        }
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
    this.syncExtras();
  }

  private syncExtras() {
    const b = this.body;
    const cx = Math.round(b.center.x), by = Math.round(b.bottom);
    if (this.members > 1) {
      const w = 24;
      this.gfx.setPosition(cx - w * (this.members - 1) / 2, by);
      this.extra.forEach((e, i) => { e.setPosition(cx - w * (this.members - 1) / 2 + w * (i + 1), by).setFlipX(this.gfx.flipX); if (e.anims.currentAnim?.key !== this.gfx.anims.currentAnim?.key && this.gfx.anims.currentAnim) e.play(this.gfx.anims.currentAnim.key, true); });
    }
    if (this.prop) {
      const v = this.variant;
      if (v === 'fahne') this.prop.setPosition(cx - this.dir * 14, by - 46).setFlipX(this.dir < 0);
      else if (v === 'trommler') this.prop.setPosition(cx + this.dir * 16, by - 8).setFlipX(this.dir < 0);
      else if (v === 'schal') this.prop.setPosition(cx, by - 40);
      else if (v === 'nuckel') this.prop.setPosition(cx + this.dir * 8, by - 44);
    }
  }

  /** Fan-Block: one member falls per side hit. Returns true when the whole block is gone. */
  loseMember() {
    if (this.members <= 1) { this.kill(); return true; }
    this.members--;
    const e = this.extra.pop();
    if (e) { this.scene.tweens.add({ targets: e, y: e.y - 60, alpha: 0, angle: 180, duration: 600, onComplete: () => e.destroy() }); }
    this.body.setSize(24 * this.members, 50).setOffset(12 - 12 * (this.members - 1), 8);
    audio.stomp();
    return false;
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
    audio.stomp(); audio.say('baby', 'hick');
    this.prop?.setVisible(false);
    this.extra.forEach((e) => e.setVisible(false));
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

  /** Parade walkers leave the stage for good. */
  despawn() {
    this.state = 'dead'; this.gone = true;
    this.body.enable = false;
    this.prop?.destroy(); this.extra.forEach((e) => e.destroy());
    this.gfx.destroy();
    this.destroy();
  }

  respawn() {
    if (!this.scene || this.gone) return;
    this.state = 'patrol';
    this.dir = -1;
    this.confusedUntil = 0;
    this.body.enable = true;
    this.body.reset(this.spawnX, this.spawnY - 26);
    this.gfx.setVisible(true).setAlpha(0).setScale(1, 1).setAngle(0).setOrigin(0.5, 58 / 64).setPosition(this.spawnX, this.spawnY);
    this.scene.tweens.add({ targets: this.gfx, alpha: 1, duration: 300 });
    this.gfx.play('meister_walk');
    const info = VARIANT_INFO[this.variant];
    if (info.tint !== 0xffffff) this.gfx.setTint(info.tint);
    this.prop?.setVisible(true);
    if (this.variant === 'fanblock') {
      this.members = 3;
      this.extra.forEach((e) => e.destroy());
      this.extra = [];
      for (let i = 1; i < 3; i++) { const e = this.scene.add.sprite(this.spawnX, this.spawnY, 'spr', 'meister_idle_0').setOrigin(0.5, 58 / 64).setDepth(8 - i * 0.01); e.play('meister_walk'); this.extra.push(e); }
      this.body.setSize(72, 50).setOffset(-12, 8);
    }
    if (this.variant === 'trommler') { this.state = 'cooldown'; this.timer = 1200; }
  }
}
