import Phaser from 'phaser';
import { T, GAME_H } from '../config/Tuning';
import { InputSystem } from '../systems/Input';
import { Player } from '../entities/Player';

type Obj = Phaser.Types.Tilemaps.TiledObject;

export class GameScene extends Phaser.Scene {
  inputSys!: InputSystem;
  player!: Player;
  map!: Phaser.Tilemaps.Tilemap;
  ground!: Phaser.Tilemaps.TilemapLayer;
  cards!: Phaser.Physics.Arcade.StaticGroup;
  flag?: Phaser.Physics.Arcade.Image;
  checkpoints!: Phaser.Physics.Arcade.StaticGroup;
  dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  levelKey = 'lvl_t1';
  spawn = new Phaser.Math.Vector2(64, 200);
  respawnPoint = new Phaser.Math.Vector2(64, 200);
  zoom = 1;
  lookX = 0;
  finished = false;
  startTime = 0;

  constructor() { super('game'); }

  init(data: { level?: string }) {
    if (data?.level) this.levelKey = data.level;
  }

  create() {
    this.finished = false;
    this.inputSys = new InputSystem(this);

    // --- map
    this.map = this.make.tilemap({ key: this.levelKey });
    const tiles = this.map.addTilesetImage('tiles', 'tiles')!;
    if (this.map.getLayerIndexByName('back') !== null) this.map.createLayer('back', tiles, 0, 0);
    this.ground = this.map.createLayer('ground', tiles, 0, 0)!;
    this.ground.setCollisionByExclusion([-1]);
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels + 600);

    // --- sky decor (parallax clouds)
    for (let i = 0; i < Math.ceil(this.map.widthInPixels / 260); i++) {
      this.add.image(i * 260 + (i % 3) * 40, 40 + (i % 4) * 22, 'spr', 'cloud_0').setScrollFactor(0.4, 0.9).setDepth(-5).setAlpha(0.9);
    }

    // --- objects
    this.cards = this.physics.add.staticGroup();
    this.checkpoints = this.physics.add.staticGroup();
    const objs = (this.map.getObjectLayer('objects')?.objects ?? []) as Obj[];
    for (const o of objs) {
      const type = (o as any).type || (o as any).class || o.name;
      const x = o.x ?? 0, y = o.y ?? 0;
      switch (type) {
        case 'spawn': this.spawn.set(x, y); break;
        case 'card':
        case 'royal': {
          const frame = type === 'royal' ? 'it_karte_gelb_0' : ['it_karte_0', 'it_karte_blau_0', 'it_karte_gruen_0'][Math.floor(x / 32) % 3];
          const c = this.cards.create(x, y, 'spr', frame) as Phaser.Physics.Arcade.Sprite;
          c.setData('value', type === 'royal' ? 10 : 1).setDepth(4);
          (c.body as Phaser.Physics.Arcade.StaticBody).setSize(18, 22).setOffset(3, 1);
          this.tweens.add({ targets: c, y: y - 4, duration: 520 + ((x / 32) % 4) * 70, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
          break;
        }
        case 'flag': {
          this.flag = this.physics.add.staticImage(x, y, 'spr', 'flagpole_0').setOrigin(0.5, 1).setDepth(3);
          (this.flag.body as Phaser.Physics.Arcade.StaticBody).setSize(8, 68).setOffset(4, 0);
          break;
        }
        case 'checkpoint': {
          const c = this.checkpoints.create(x, y, 'spr', 'it_fahne_0') as Phaser.Physics.Arcade.Sprite;
          c.setOrigin(0.5, 1).setDepth(3).setAlpha(0.7);
          (c.body as Phaser.Physics.Arcade.StaticBody).setSize(20, 26).setOffset(2, -26 + 24);
          break;
        }
        case 'bush': this.add.image(x, y, 'spr', 'bush_0').setOrigin(0.5, 1).setDepth(-1); break;
        case 'palm': this.add.image(x, y, 'spr', 'palm_0').setOrigin(0.45, 1).setDepth(-1); break;
      }
    }
    this.respawnPoint.copy(this.spawn);

    // --- fx
    this.dust = this.add.particles(0, 0, 'spr', {
      frame: 'fx_dust_0', speed: { min: 20, max: 70 }, angle: { min: 200, max: 340 }, lifespan: { min: 180, max: 380 },
      gravityY: 320, scale: { start: 1, end: 0.2 }, alpha: { start: 0.9, end: 0 }, quantity: 6, emitting: false,
    }).setDepth(9);

    // --- player
    this.player = new Player(this, this.spawn.x, this.spawn.y);
    this.player.spawnAt(this.spawn.x, this.spawn.y + 16);
    this.player.onLand = (x, y, speed) => this.dust.emitParticleAt(x, y, speed > 8 ? 8 : 4);
    this.player.onJump = (x, y) => this.dust.emitParticleAt(x, y, 4);
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.overlap(this.player, this.cards, (_p, c) => this.collect(c as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.player, this.checkpoints, (_p, c) => this.hitCheckpoint(c as Phaser.Physics.Arcade.Sprite));
    if (this.flag) this.physics.add.overlap(this.player, this.flag, () => this.finish());

    // --- camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.map.widthInPixels, Math.max(this.map.heightInPixels, GAME_H));
    cam.setBackgroundColor('#FFC2DC');
    cam.startFollow(this.player, true, T.CAM_LERP, T.CAM_LERP);
    cam.setDeadzone(T.CAM_DEADZONE_W, T.CAM_DEADZONE_H);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.applyZoom, this));

    // --- run state
    this.registry.set('cards', 0);
    if (!this.registry.has('lives')) this.registry.set('lives', 3);
    if (!this.registry.has('hearts')) this.registry.set('hearts', 3);
    this.startTime = this.time.now;
    this.events.emit('msg', '');
  }

  applyZoom() {
    this.zoom = this.scale.height / GAME_H;
    const cam = this.cameras.main;
    cam.setZoom(this.zoom);
    cam.setDeadzone(T.CAM_DEADZONE_W, T.CAM_DEADZONE_H);
  }

  collect(c: Phaser.Physics.Arcade.Sprite) {
    const v = (c.getData('value') as number) || 1;
    this.registry.inc('cards', v);
    const ghost = this.add.image(c.x, c.y, 'spr', c.frame.name).setDepth(12);
    this.tweens.add({ targets: ghost, y: c.y - 26, alpha: 0, scale: 1.4, duration: 240, ease: 'Quad.out', onComplete: () => ghost.destroy() });
    c.destroy();
  }

  hitCheckpoint(c: Phaser.Physics.Arcade.Sprite) {
    if (c.getData('done')) return;
    c.setData('done', true).setAlpha(1);
    this.tweens.add({ targets: c, scaleX: 1.2, scaleY: 1.2, duration: 120, yoyo: true });
    this.respawnPoint.set(c.x, c.y);
    this.events.emit('msg', 'CHECKPOINT');
    this.time.delayedCall(900, () => this.events.emit('msg', ''));
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    const secs = ((this.time.now - this.startTime) / 1000).toFixed(1);
    this.events.emit('msg', `CAMBIO!  ${this.registry.get('cards')} Karten  ${secs}s`);
    this.player.body.setVelocity(0, 0);
    this.cameras.main.flash(200, 255, 79, 163);
    this.time.delayedCall(1800, () => this.scene.restart({ level: this.levelKey }));
  }

  die() {
    if (this.player.dead) return;
    this.player.dead = true;
    this.cameras.main.shake(120, 0.008);
    this.cameras.main.fadeOut(160, 15, 13, 12);
    this.time.delayedCall(180, () => {
      this.player.spawnAt(this.respawnPoint.x, this.respawnPoint.y);
      this.cameras.main.centerOn(this.respawnPoint.x, this.respawnPoint.y);
      this.cameras.main.fadeIn(140, 15, 13, 12);
    });
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    this.inputSys.update();
    if (this.finished) { this.player.syncGfx(); return; }
    if (!this.player.dead) this.player.update(this.inputSys, dt);

    const cam = this.cameras.main;
    this.lookX = Phaser.Math.Linear(this.lookX, -this.player.facing * T.CAM_LOOKAHEAD, 0.08);
    cam.setFollowOffset(this.lookX, 16);
    cam.setLerp(T.CAM_LERP, T.CAM_LERP);

    if (this.player.y > this.map.heightInPixels + 96) this.die();
  }
}
