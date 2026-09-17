import Phaser from 'phaser';
import { T, GAME_H } from '../config/Tuning';
import { InputSystem } from '../systems/Input';
import { audio } from '../systems/Audio';
import { Player } from '../entities/Player';
import { Mob } from '../entities/Mob';
import { Block } from '../entities/Block';
import { Cup, Wave } from '../entities/Projectiles';
import { LEVELS, nextLevel } from '../data/levels';

type Obj = Phaser.Types.Tilemaps.TiledObject;
type Overlay = { kind: 'result' | 'gameover'; lines: string[]; hint: string } | null;

export class GameScene extends Phaser.Scene {
  inputSys!: InputSystem;
  player!: Player;
  map!: Phaser.Tilemaps.Tilemap;
  ground!: Phaser.Tilemaps.TilemapLayer;
  cards!: Phaser.Physics.Arcade.StaticGroup;
  checkpoints!: Phaser.Physics.Arcade.StaticGroup;
  solids!: Phaser.Physics.Arcade.StaticGroup;
  blocks: Block[] = [];
  mobs: Mob[] = [];
  mobGroup!: Phaser.Physics.Arcade.Group;
  cups!: Phaser.Physics.Arcade.Group;
  waves!: Phaser.Physics.Arcade.Group;
  pickups!: Phaser.Physics.Arcade.Group;
  flag?: Phaser.Physics.Arcade.Image;
  dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  levelKey = LEVELS[0].key;
  spawn = new Phaser.Math.Vector2(64, 200);
  respawnPoint = new Phaser.Math.Vector2(64, 200);
  zoom = 1;
  lookX = 0;
  finished = false;
  overlay: Overlay = null;
  startTime = 0;
  combo = 0;
  comboUntil = 0;
  tookDamage = false;
  totalCards = 0;

  constructor() { super('game'); }

  init(data: { level?: string }) {
    if (data?.level) this.levelKey = data.level;
  }

  create() {
    this.finished = false;
    this.overlay = null;
    this.tookDamage = false;
    this.combo = 0;
    this.blocks = [];
    this.mobs = [];
    this.inputSys = new InputSystem(this);

    // --- map
    this.map = this.make.tilemap({ key: this.levelKey });
    const tiles = this.map.addTilesetImage('tiles', 'tiles')!;
    if (this.map.getLayerIndexByName('back') !== null) this.map.createLayer('back', tiles, 0, 0);
    this.ground = this.map.createLayer('ground', tiles, 0, 0)!;
    this.ground.setCollisionByExclusion([-1]);
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels + 600);
    const groundTop = this.findGroundTop();

    // --- background: far pink hills, near green hills, clouds (parallax)
    const W = this.map.widthInPixels;
    for (let x = -60; x < W * 0.7 + 200; x += 150) this.add.image(x, groundTop + 6, 'spr', 'hill_far_0').setOrigin(0.5, 1).setScrollFactor(0.3, 0.92).setDepth(-8).setAlpha(0.55);
    for (let x = 0; x < W * 0.85 + 200; x += 118) this.add.image(x + (x % 3) * 9, groundTop + 2, 'spr', 'hill_0').setOrigin(0.5, 1).setScrollFactor(0.55, 0.95).setDepth(-6).setAlpha(0.8);
    for (let i = 0; i < Math.ceil(W / 240); i++) this.add.image(i * 240 + (i % 3) * 40, 34 + (i % 4) * 24, 'spr', 'cloud_0').setScrollFactor(0.4, 0.9).setDepth(-5).setAlpha(0.9);

    // --- groups
    this.cards = this.physics.add.staticGroup();
    this.checkpoints = this.physics.add.staticGroup();
    this.solids = this.physics.add.staticGroup();
    this.mobGroup = this.physics.add.group();
    this.cups = this.physics.add.group({ runChildUpdate: false });
    this.waves = this.physics.add.group();
    this.pickups = this.physics.add.group();

    // --- objects
    const objs = (this.map.getObjectLayer('objects')?.objects ?? []) as Obj[];
    const mobDefs: [number, number][] = [];
    for (const o of objs) {
      const type = (o as any).type || (o as any).class || o.name;
      const x = o.x ?? 0, y = o.y ?? 0;
      switch (type) {
        case 'spawn': this.spawn.set(x, y); break;
        case 'card':
        case 'royal': {
          const frame = type === 'royal' ? 'it_karte_gelb_0' : ['it_karte_0', 'it_karte_blau_0', 'it_karte_gruen_0'][Math.floor(x / 32) % 3];
          const c = this.cards.create(x, y, 'spr', frame) as Phaser.Physics.Arcade.Sprite;
          c.setData('value', type === 'royal' ? 10 : 1).setData('royal', type === 'royal').setDepth(4);
          (c.body as Phaser.Physics.Arcade.StaticBody).setSize(18, 22).setOffset(3, 1);
          this.tweens.add({ targets: c, y: y - 4, duration: 520 + ((x / 32) % 4) * 70, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
          this.totalCards += type === 'royal' ? 10 : 1;
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
          (c.body as Phaser.Physics.Arcade.StaticBody).setSize(20, 26).setOffset(2, -2);
          break;
        }
        case 'block': {
          const props = ((o as any).properties ?? []) as { name: string; value: string }[];
          const contents = props.find((p) => p.name === 'contents')?.value ?? 'card';
          const b = new Block(this, x, y, contents);
          b.onSpawn = (blk, what) => this.spawnFromBlock(blk, what);
          this.blocks.push(b);
          this.solids.add(b);
          break;
        }
        case 'pipe': {
          const p = this.solids.create(x + 16, y, 'spr', 'pipe_big_0') as Phaser.Physics.Arcade.Sprite;
          p.setOrigin(0.5, 1).setDepth(2);
          (p.body as Phaser.Physics.Arcade.StaticBody).setSize(32, 64).setOffset(0, -64 + 64);
          p.refreshBody();
          break;
        }
        case 'mob': mobDefs.push([x, y]); break;
        case 'bush': this.add.image(x, y, 'spr', 'bush_0').setOrigin(0.5, 1).setDepth(-1); break;
        case 'palm': this.add.image(x, y, 'spr', 'palm_0').setOrigin(0.45, 1).setDepth(-1); break;
        case 'sign': this.add.image(x, y, 'spr', 'sign_0').setOrigin(0.5, 1).setDepth(-1); break;
      }
    }
    this.respawnPoint.copy(this.spawn);

    // --- fx
    this.dust = this.add.particles(0, 0, 'spr', {
      frame: 'fx_dust_0', speed: { min: 20, max: 70 }, angle: { min: 200, max: 340 }, lifespan: { min: 180, max: 380 },
      gravityY: 320, scale: { start: 1, end: 0.2 }, alpha: { start: 0.9, end: 0 }, quantity: 6, emitting: false,
    }).setDepth(9);
    this.sparks = this.add.particles(0, 0, 'spr', {
      frame: 'fx_spark_0', speed: { min: 60, max: 160 }, angle: { min: 0, max: 360 }, lifespan: { min: 200, max: 420 },
      gravityY: 400, scale: { start: 1, end: 0 }, quantity: 8, emitting: false,
    }).setDepth(12);

    // --- player
    this.player = new Player(this, this.spawn.x, this.spawn.y);
    this.player.spawnAt(this.spawn.x, this.spawn.y + 16);
    this.player.setForm((this.registry.get('form') as 'base' | 'kaffee') ?? 'base');
    this.player.onLand = (x, y, speed) => this.dust.emitParticleAt(x, y, speed > 8 ? 8 : 4);
    this.player.onJump = (x, y) => this.dust.emitParticleAt(x, y, 4);
    this.player.onThrow = (x, y, dir) => this.cups.add(new Cup(this, x, y, dir));

    // --- mobs
    for (const [x, y] of mobDefs) {
      const m = new Mob(this, x, y, this.ground);
      m.onShout = (sx, sy, dir) => this.waves.add(new Wave(this, sx, sy, dir));
      this.mobs.push(m);
      this.mobGroup.add(m);
    }

    // --- collisions
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.solids, (_p, s) => this.onSolid(s as Phaser.Physics.Arcade.Image));
    this.physics.add.collider(this.mobGroup, this.ground);
    this.physics.add.collider(this.mobGroup, this.solids);
    this.physics.add.collider(this.pickups, this.ground);
    this.physics.add.collider(this.pickups, this.solids);
    this.physics.add.overlap(this.player, this.cards, (_p, c) => this.collect(c as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.player, this.checkpoints, (_p, c) => this.hitCheckpoint(c as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.player, this.mobGroup, (_p, m) => this.playerVsMob(m as Mob));
    this.physics.add.overlap(this.player, this.waves, (_p, w) => this.playerVsWave(w as Wave));
    this.physics.add.overlap(this.player, this.pickups, (_p, k) => this.collectPickup(k as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.cups, this.mobGroup, (c, m) => this.cupVsMob(c as Cup, m as Mob));
    this.physics.add.collider(this.cups, this.ground, (c) => this.breakCup(c as Cup));
    this.physics.add.collider(this.cups, this.solids, (c) => this.breakCup(c as Cup));
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
    if (!this.registry.has('hearts') || this.registry.get('hearts') <= 0) this.registry.set('hearts', 3);
    this.startTime = this.time.now;
    const def = LEVELS.find((l) => l.key === this.levelKey);
    this.events.emit('msg', def ? def.name : '', 1400);
    this.events.emit('overlay', null);
    this.input.on('pointerdown', this.onTapOverlay, this);
    this.input.keyboard?.on('keydown-SPACE', this.onTapOverlay, this);
    this.input.keyboard?.on('keydown-ENTER', this.onTapOverlay, this);
  }

  private findGroundTop() {
    for (let ty = 0; ty < this.map.height; ty++) {
      for (let tx = 0; tx < Math.min(this.map.width, 8); tx++) if (this.ground.getTileAt(tx, ty)) return ty * 32;
    }
    return this.map.heightInPixels - 64;
  }

  applyZoom() {
    this.zoom = this.scale.height / GAME_H;
    const cam = this.cameras.main;
    cam.setZoom(this.zoom);
    cam.setDeadzone(T.CAM_DEADZONE_W, T.CAM_DEADZONE_H);
  }

  // ------------------------------------------------------------ interactions
  private onSolid(s: Phaser.Physics.Arcade.Image) {
    if (s instanceof Block && this.player.body.touching.up && this.player.body.velocity.y <= 0) {
      s.bump();
      this.player.body.setVelocityY(40);
    }
  }

  spawnFromBlock(blk: Block, what: string) {
    if (what === 'kaffee') {
      const k = this.pickups.create(blk.x, blk.y - 8, 'spr', 'it_kaffee_0') as Phaser.Physics.Arcade.Sprite;
      k.setDepth(1).setData('kind', 'kaffee');
      (k.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setSize(20, 20).setOffset(2, 2);
      this.tweens.add({ targets: k, y: blk.y - 40, duration: 380, ease: 'Quad.out', onComplete: () => {
        k.setDepth(6); (k.body as Phaser.Physics.Arcade.Body).setAllowGravity(true).setGravityY(T.GRAVITY * 0.5).setVelocityX(60).setBounce(0.3);
      } });
    } else {
      // card pops out and is banked automatically (Mario coin style)
      const n = 1;
      for (let i = 0; i < n; i++) {
        const c = this.add.image(blk.x, blk.y - 16, 'spr', 'it_karte_0').setDepth(12);
        this.tweens.add({ targets: c, y: blk.y - 70, duration: 260, ease: 'Quad.out', yoyo: true, onComplete: () => c.destroy() });
      }
      this.bankCards(1, blk.x, blk.y - 40, false);
    }
  }

  collectPickup(k: Phaser.Physics.Arcade.Sprite) {
    if (k.getData('kind') === 'kaffee') {
      this.player.setForm('kaffee');
      audio.powerup();
      this.events.emit('msg', 'KAFFEE POWER!  WURF-KNOPF = TASSE', 1500);
      this.sparks.emitParticleAt(k.x, k.y, 10);
    }
    k.destroy();
  }

  bankCards(v: number, x: number, y: number, royal: boolean) {
    const now = this.time.now;
    this.combo = now < this.comboUntil ? this.combo + 1 : 1;
    this.comboUntil = now + T.COMBO_WINDOW;
    this.registry.inc('cards', v);
    this.registry.set('combo', this.combo);
    if (royal) audio.royal(); else audio.card(this.combo);
    if (this.combo >= 3) {
      const t = this.add.text(x, y - 16, `x${this.combo}`, { fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#FF4FA3' }).setOrigin(0.5).setDepth(13);
      this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 500, onComplete: () => t.destroy() });
    }
  }

  collect(c: Phaser.Physics.Arcade.Sprite) {
    const v = (c.getData('value') as number) || 1;
    const royal = !!c.getData('royal');
    const ghost = this.add.image(c.x, c.y, 'spr', c.frame.name).setDepth(12);
    this.tweens.add({ targets: ghost, y: c.y - 26, alpha: 0, scale: 1.4, duration: 240, ease: 'Quad.out', onComplete: () => ghost.destroy() });
    if (royal) { this.registry.inc('royals', 1); this.sparks.emitParticleAt(c.x, c.y, 12); }
    c.destroy();
    this.bankCards(v, c.x, c.y, royal);
  }

  hitCheckpoint(c: Phaser.Physics.Arcade.Sprite) {
    if (c.getData('done')) return;
    c.setData('done', true).setAlpha(1);
    this.tweens.add({ targets: c, scaleX: 1.2, scaleY: 1.2, duration: 120, yoyo: true });
    this.respawnPoint.set(c.x, c.y);
    audio.checkpoint();
    this.events.emit('msg', 'CHECKPOINT', 900);
  }

  playerVsMob(m: Mob) {
    if (!m.alive || this.player.dead || this.finished) return;
    const p = this.player.body;
    const stomp = p.velocity.y > 0 && p.bottom < m.body.top + 18;
    if (stomp) {
      m.kill();
      this.player.bounce();
      this.hitstop();
      this.dust.emitParticleAt(m.x, m.body.top, 6);
      this.registry.inc('stomps', 1);
    } else {
      this.damagePlayer(Math.sign(this.player.x - m.x) || 1);
    }
  }

  playerVsWave(w: Wave) {
    if (this.player.dead || this.finished) return;
    if (this.damagePlayer(w.dir)) w.destroy();
  }

  cupVsMob(c: Cup, m: Mob) {
    if (!m.alive) return;
    m.kill();
    this.sparks.emitParticleAt(c.x, c.y, 6);
    c.destroy();
    this.hitstop();
  }

  breakCup(c: Cup) {
    audio.splash();
    this.dust.emitParticleAt(c.x, c.y, 5);
    c.destroy();
  }

  damagePlayer(fromDir: number): boolean {
    const hit = this.player.hurt(fromDir);
    if (!hit) return false;
    this.tookDamage = true;
    this.cameras.main.shake(140, 0.006);
    this.hitstop();
    if ((this.registry.get('hearts') as number) <= 0) this.loseLife();
    return true;
  }

  hitstop() {
    this.physics.world.pause();
    this.time.delayedCall(T.HITSTOP_MS, () => { if (!this.overlay) this.physics.world.resume(); });
  }

  loseLife() {
    if (this.player.dead) return;
    this.player.dead = true;
    audio.die();
    this.registry.inc('lives', -1);
    const lives = this.registry.get('lives') as number;
    this.cameras.main.shake(160, 0.01);
    this.player.body.setVelocity(0, -300);
    this.player.body.setAllowGravity(true);
    this.tweens.add({ targets: this.player.gfx, angle: 360, duration: 500 });
    if (lives < 0) {
      this.time.delayedCall(600, () => this.gameOver());
    } else {
      this.time.delayedCall(650, () => this.respawn());
    }
  }

  die() {
    if (this.player.dead || this.finished) return;
    this.registry.set('hearts', 0);
    this.loseLife();
  }

  respawn() {
    this.cameras.main.fadeOut(120, 15, 13, 12);
    this.time.delayedCall(130, () => {
      this.registry.set('hearts', 3);
      this.player.gfx.setAngle(0);
      this.player.setForm('base');
      this.player.spawnAt(this.respawnPoint.x, this.respawnPoint.y);
      this.cameras.main.centerOn(this.respawnPoint.x, this.respawnPoint.y);
      this.cameras.main.fadeIn(140, 15, 13, 12);
    });
  }

  gameOver() {
    audio.gameover();
    this.physics.world.pause();
    this.overlay = { kind: 'gameover', lines: ['GAME OVER', '', 'LIFE IS CAMBIO'], hint: 'TIPPEN FUER NEUSTART' };
    this.events.emit('overlay', this.overlay);
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    audio.clear();
    const secs = ((this.time.now - this.startTime) / 1000);
    const cards = this.registry.get('cards') as number;
    const noDmg = !this.tookDamage;
    this.player.body.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);
    this.cameras.main.flash(220, 255, 79, 163);
    this.registry.set('lastResult', { cards, secs, noDmg });
    this.time.delayedCall(700, () => {
      this.physics.world.pause();
      this.overlay = {
        kind: 'result',
        lines: ['CAMBIO!', '', `KARTEN   ${cards} / ${this.totalCards}`, `ZEIT     ${secs.toFixed(1)}s`, noDmg ? 'OHNE SCHADEN  +500' : ''],
        hint: 'TIPPEN FUER WEITER',
      };
      this.events.emit('overlay', this.overlay);
    });
  }

  private onTapOverlay() {
    if (!this.overlay) return;
    const kind = this.overlay.kind;
    this.overlay = null;
    this.events.emit('overlay', null);
    this.physics.world.resume();
    if (kind === 'gameover') {
      this.registry.set('lives', 3);
      this.registry.set('hearts', 3);
      this.registry.set('form', 'base');
      this.scene.restart({ level: this.levelKey });
    } else {
      this.registry.set('form', this.player.form);
      this.scene.restart({ level: nextLevel(this.levelKey).key });
    }
  }

  // ------------------------------------------------------------ loop
  update(_time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    this.inputSys.update();
    if (this.overlay) return;
    if (this.finished) { this.player.syncGfx(); return; }
    if (!this.player.dead) this.player.update(this.inputSys, dt);
    else this.player.syncGfx();

    const now = this.time.now;
    for (const m of this.mobs) m.update(dt, this.player);
    this.cups.getChildren().forEach((c) => { const cup = c as Cup; if (cup.expired(now) || cup.y > this.map.heightInPixels + 50) cup.destroy(); });
    this.waves.getChildren().forEach((w) => { const wave = w as Wave; if (wave.expired(now)) wave.destroy(); });
    if (now > this.comboUntil && this.combo) { this.combo = 0; this.registry.set('combo', 0); }

    const cam = this.cameras.main;
    this.lookX = Phaser.Math.Linear(this.lookX, -this.player.facing * T.CAM_LOOKAHEAD, 0.08);
    cam.setFollowOffset(this.lookX, 16);
    cam.setLerp(T.CAM_LERP, T.CAM_LERP);

    if (!this.player.dead && this.player.y > this.map.heightInPixels + 96) this.die();
  }
}
