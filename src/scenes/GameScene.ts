import Phaser from 'phaser';
import { T, GAME_H } from '../config/Tuning';
import { InputSystem } from '../systems/Input';
import { audio, TRACKS } from '../systems/Audio';
import { save } from '../systems/Save';
import { Player } from '../entities/Player';
import { Mob, type Variant } from '../entities/Mob';
import { Block } from '../entities/Block';
import { Cup, Wave, HomingCard, Pacifier } from '../entities/Projectiles';
import { Puddle, Vent, Ball, BallSpawner, CardPlatform, MovingPlatform } from '../entities/Hazards';
import { LEVELS, nextLevel } from '../data/levels';
import { worldOf } from '../data/worlds';
import { FORMS, SPECIALS, isForm, isSpecial, type Form, type Special } from '../data/forms';

type Obj = Phaser.Types.Tilemaps.TiledObject;
type Overlay = { kind: 'result' | 'gameover'; lines: string[]; hint: string } | null;
const prop = (o: Obj, name: string) => (((o as any).properties ?? []) as { name: string; value: unknown }[]).find((p) => p.name === name)?.value;

export class GameScene extends Phaser.Scene {
  inputSys!: InputSystem;
  player!: Player;
  map!: Phaser.Tilemaps.Tilemap;
  ground!: Phaser.Tilemaps.TilemapLayer;
  cards!: Phaser.Physics.Arcade.StaticGroup;
  checkpoints!: Phaser.Physics.Arcade.StaticGroup;
  solids!: Phaser.Physics.Arcade.StaticGroup;
  puddles!: Phaser.Physics.Arcade.StaticGroup;
  vents!: Phaser.Physics.Arcade.StaticGroup;
  blocks: Block[] = [];
  mobs: Mob[] = [];
  mobGroup!: Phaser.Physics.Arcade.Group;
  cups!: Phaser.Physics.Arcade.Group;
  homing!: Phaser.Physics.Arcade.Group;
  waves!: Phaser.Physics.Arcade.Group;
  balls!: Phaser.Physics.Arcade.Group;
  pacifiers!: Phaser.Physics.Arcade.Group;
  movers!: Phaser.Physics.Arcade.Group;
  pickups!: Phaser.Physics.Arcade.Group;
  spawners: BallSpawner[] = [];
  flag?: Phaser.Physics.Arcade.Image;
  dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  paint!: Phaser.GameObjects.Particles.ParticleEmitter;
  steam!: Phaser.GameObjects.Particles.ParticleEmitter;
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
  punchCombo = 0;
  punchComboUntil = 0;
  special: Special | null = null;
  specialUntil = 0;
  worldScale = 1;
  khusra = 0;
  drumUntil = 0;

  constructor() { super('game'); }

  init(data: { level?: string }) {
    if (data?.level) this.levelKey = data.level;
  }

  create() {
    this.finished = false;
    this.overlay = null;
    this.tookDamage = false;
    this.combo = 0;
    this.punchCombo = 0;
    this.special = null;
    this.worldScale = 1;
    this.drumUntil = 0;
    this.blocks = [];
    this.mobs = [];
    this.spawners = [];
    this.totalCards = 0;
    this.inputSys = new InputSystem(this);
    const level = LEVELS.find((l) => l.key === this.levelKey) ?? LEVELS[0];
    const theme = worldOf(level.world);

    // --- map
    this.map = this.make.tilemap({ key: this.levelKey });
    const tiles = this.map.addTilesetImage('tiles', theme.tiles)!;
    if (this.map.getLayerIndexByName('back') !== null) this.map.createLayer('back', tiles, 0, 0);
    this.ground = this.map.createLayer('ground', tiles, 0, 0)!;
    this.ground.setCollisionByExclusion([-1]);
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels + 600);
    const groundTop = this.findGroundTop();

    // --- background: horizon glow, far/near hills, clouds, world decor (parallax)
    const W = this.map.widthInPixels;
    this.add.rectangle(0, groundTop - 36, W * 2, 90, Phaser.Display.Color.HexStringToColor(theme.horizon).color, 0.55).setOrigin(0, 0.5).setScrollFactor(0.15, 0.95).setDepth(-9);
    for (let x = -60; x < W * 0.7 + 200; x += 150) this.add.image(x, groundTop + 6, 'spr', 'hill_far_0').setOrigin(0.5, 1).setScrollFactor(0.3, 0.92).setDepth(-8).setAlpha(theme.hillFarAlpha).setTint(theme.hillFarTint);
    for (let x = 0; x < W * 0.85 + 200; x += 118) this.add.image(x + (x % 3) * 9, groundTop + 2, 'spr', 'hill_0').setOrigin(0.5, 1).setScrollFactor(0.55, 0.95).setDepth(-6).setAlpha(0.8).setTint(theme.hillNearTint);
    for (let i = 0; i < Math.ceil(W / 240); i++) this.add.image(i * 240 + (i % 3) * 40, 34 + (i % 4) * 24, 'spr', 'cloud_0').setScrollFactor(0.4, 0.9).setDepth(-5).setAlpha(theme.cloudAlpha);
    theme.ambient.forEach((a, ai) => {
      for (let x = a.every / 2 + ai * 70; x < W * a.scroll + 300; x += a.every) {
        this.add.image(x, groundTop + a.yOff, 'spr', a.frame).setOrigin(0.5, 1).setScrollFactor(a.scroll, 0.97).setDepth(-4 + ai * 0.1).setAlpha(a.alpha).setScale(a.scale ?? 1);
      }
    });

    // --- groups. Dynamic groups get their `defaults` cleared: otherwise add() resets velocity/gravity of
    // pre-configured children. Plain groups are no alternative - the Arcade RTree lookup skips them.
    this.cards = this.physics.add.staticGroup();
    this.checkpoints = this.physics.add.staticGroup();
    this.solids = this.physics.add.staticGroup();
    this.puddles = this.physics.add.staticGroup();
    this.vents = this.physics.add.staticGroup();
    this.mobGroup = this.dynGroup();
    this.cups = this.dynGroup();
    this.homing = this.dynGroup();
    this.waves = this.dynGroup();
    this.balls = this.dynGroup();
    this.pacifiers = this.dynGroup();
    this.movers = this.dynGroup();
    this.pickups = this.physics.add.group();

    // --- objects
    const objs = (this.map.getObjectLayer('objects')?.objects ?? []) as Obj[];
    const mobDefs: [number, number, Variant][] = [];
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
          if (type === 'royal') this.tweens.add({ targets: c, angle: 8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
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
          const contents = (prop(o, 'contents') as string) ?? 'card';
          const b = new Block(this, x, y, contents);
          b.onSpawn = (blk, what) => this.spawnFromBlock(blk, what);
          this.blocks.push(b);
          this.solids.add(b);
          break;
        }
        case 'pipe': {
          const p = this.solids.create(x + 16, y, 'spr', 'pipe_big_0') as Phaser.Physics.Arcade.Sprite;
          p.setOrigin(0.5, 1).setDepth(2);
          (p.body as Phaser.Physics.Arcade.StaticBody).setSize(32, 64).setOffset(0, 0);
          p.refreshBody();
          break;
        }
        case 'mob': mobDefs.push([x, y, ((prop(o, 'variant') as Variant) ?? 'basic')]); break;
        case 'puddle': this.puddles.add(new Puddle(this, x, y)); break;
        case 'vent': this.vents.add(new Vent(this, x, y)); break;
        case 'ballspawner': this.spawners.push(new BallSpawner(x, y, T.BALL_EVERY)); this.add.image(x, y, 'spr', 'haz_ball_0').setAlpha(0.35).setDepth(-1); break;
        case 'cardplat': this.solids.add(new CardPlatform(this, x, y, (prop(o, 'phase') as number) ?? 0)); break;
        case 'moveplat': this.movers.add(new MovingPlatform(this, x, y, 96, 60, !!prop(o, 'vertical'))); break;
        case 'deco': this.add.image(x, y, 'spr', (prop(o, 'frame') as string) ?? 'bush_0').setOrigin(0.5, 1).setDepth(-1); break;
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
    this.paint = this.add.particles(0, 0, 'spr', {
      frame: 'fx_dust_0', speed: { min: 40, max: 120 }, lifespan: { min: 250, max: 500 }, gravityY: 200,
      scale: { start: 1.2, end: 0.4 }, alpha: { start: 1, end: 0 }, tint: [0xff4fa3, 0xf4c6d8, 0xffe7f2], quantity: 10, emitting: false,
    }).setDepth(12);
    this.steam = this.add.particles(0, 0, 'spr', {
      frame: 'fx_dust_0', speedY: { min: -160, max: -60 }, speedX: { min: -20, max: 20 }, lifespan: { min: 300, max: 600 },
      scale: { start: 1.4, end: 0.3 }, alpha: { start: 0.7, end: 0 }, quantity: 4, emitting: false,
    }).setDepth(9);

    // --- player
    this.player = new Player(this, this.spawn.x, this.spawn.y);
    this.player.spawnAt(this.spawn.x, this.spawn.y + 16);
    const f = this.registry.get('form') as string;
    this.player.setForm(isForm(f) ? f : 'base');
    this.player.onLand = (x, y, speed) => this.dust.emitParticleAt(x, y, speed > 8 ? 8 : 4);
    this.player.onJump = (x, y) => this.dust.emitParticleAt(x, y, 4);
    this.player.onAttack = (form, x, y, dir) => this.attack(form, x, y, dir);

    // --- mobs
    for (const [x, y, variant] of mobDefs) {
      const m = new Mob(this, x, y, this.ground, save.settings.assist ? 0.7 : 1, variant);
      m.onShout = (sx, sy, dir) => this.waves.add(new Wave(this, sx, sy, dir, 'mob'));
      m.onThrow = (sx, sy, vx, vy) => this.pacifiers.add(new Pacifier(this, sx, sy, vx, vy));
      m.onDrum = () => this.drumBeat();
      this.mobs.push(m);
      this.mobGroup.add(m);
    }

    // --- collisions
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.solids, (_p, s) => this.onSolid(s as Phaser.Physics.Arcade.Image));
    this.physics.add.collider(this.player, this.movers);
    this.physics.add.collider(this.mobGroup, this.ground);
    this.physics.add.collider(this.mobGroup, this.solids);
    this.physics.add.collider(this.mobGroup, this.movers);
    this.physics.add.collider(this.pickups, this.ground);
    this.physics.add.collider(this.pickups, this.solids);
    this.physics.add.collider(this.balls, this.ground);
    this.physics.add.collider(this.balls, this.solids);
    this.physics.add.collider(this.pacifiers, this.ground, (p) => this.breakSmall(p as Phaser.Physics.Arcade.Sprite));
    this.physics.add.collider(this.pacifiers, this.solids, (p) => this.breakSmall(p as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.player, this.cards, (_p, c) => this.collect(c as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.player, this.checkpoints, (_p, c) => this.hitCheckpoint(c as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.player, this.mobGroup, (_p, m) => this.playerVsMob(m as Mob));
    this.physics.add.overlap(this.player, this.waves, (_p, w) => this.playerVsWave(w as Wave));
    this.physics.add.overlap(this.player, this.pickups, (_p, k) => this.collectPickup(k as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.player, this.puddles, () => this.playerVsPuddle());
    this.physics.add.overlap(this.player, this.vents, (_p, v) => this.playerVsVent(v as Vent));
    this.physics.add.overlap(this.player, this.balls, (_p, b) => this.playerVsBall(b as Ball));
    this.physics.add.overlap(this.player, this.pacifiers, (_p, k) => this.playerVsPacifier(k as Pacifier));
    this.physics.add.overlap(this.cups, this.mobGroup, (c, m) => this.projectileVsMob(c as Phaser.Physics.Arcade.Sprite, m as Mob));
    this.physics.add.overlap(this.homing, this.mobGroup, (c, m) => this.projectileVsMob(c as Phaser.Physics.Arcade.Sprite, m as Mob));
    this.physics.add.overlap(this.waves, this.mobGroup, (w, m) => this.waveVsMob(w as Wave, m as Mob));
    this.physics.add.overlap(this.mobGroup, this.mobGroup, (a, b) => this.mobVsMob(a as Mob, b as Mob));
    this.physics.add.collider(this.cups, this.ground, (c) => this.breakCup(c as Cup));
    this.physics.add.collider(this.cups, this.solids, (c) => this.breakCup(c as Cup));
    if (this.flag) this.physics.add.overlap(this.player, this.flag, () => this.finish());

    // --- camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.map.widthInPixels, Math.max(this.map.heightInPixels, GAME_H));
    cam.setBackgroundColor(theme.sky);
    cam.startFollow(this.player, true, T.CAM_LERP, T.CAM_LERP);
    cam.setDeadzone(T.CAM_DEADZONE_W, T.CAM_DEADZONE_H);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.applyZoom, this));

    // --- run state
    const maxHearts = save.settings.assist ? 5 : 3;
    this.registry.set('maxHearts', maxHearts);
    this.registry.set('cards', 0);
    this.registry.set('royals', 0);
    this.registry.set('special', '');
    this.khusra = (this.registry.get('khusra') as number) || 0;
    this.registry.set('khusra', this.khusra);
    if (!this.registry.has('lives')) this.registry.set('lives', 3);
    if (!this.registry.has('hearts') || this.registry.get('hearts') <= 0 || this.registry.get('hearts') > maxHearts) this.registry.set('hearts', maxHearts);
    this.startTime = this.time.now;
    audio.play(TRACKS[theme.track]);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.onHidden, this);
    this.events.once('shutdown', () => this.game.events.off(Phaser.Core.Events.HIDDEN, this.onHidden, this));
    this.events.emit('msg', level.name, 1500);
    this.events.emit('overlay', null);
    this.input.on('pointerdown', this.onTapOverlay, this);
    this.input.keyboard?.on('keydown-SPACE', this.onTapOverlay, this);
    this.input.keyboard?.on('keydown-ENTER', this.onTapOverlay, this);
    this.updateAura();
  }

  private dynGroup() {
    const g = this.physics.add.group();
    (g as unknown as { defaults: object }).defaults = {};
    return g;
  }

  private onHidden() {
    if (this.scene.isActive() && !this.overlay && !this.finished && !this.player.dead) this.pauseGame();
  }

  pauseGame() {
    if (this.scene.isPaused() || this.scene.isActive('pause')) return;
    this.inputSys.release();
    this.scene.launch('pause');
    this.scene.pause();
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

  // ------------------------------------------------------------ blocks & pickups
  private onSolid(s: Phaser.Physics.Arcade.Image) {
    if (s instanceof Block && this.player.body.touching.up && this.player.body.velocity.y <= 0) {
      s.bump();
      this.player.body.setVelocityY(40);
    }
  }

  spawnFromBlock(blk: Block, what: string) {
    if (what === 'card') {
      const c = this.add.image(blk.x, blk.y - 16, 'spr', 'it_karte_0').setDepth(12);
      this.tweens.add({ targets: c, y: blk.y - 70, duration: 260, ease: 'Quad.out', yoyo: true, onComplete: () => c.destroy() });
      this.bankCards(1, blk.x, blk.y - 40, false);
      return;
    }
    const icon = isForm(what) ? FORMS[what].icon : isSpecial(what) ? SPECIALS[what].icon : 'it_kaffee_0';
    const k = this.pickups.create(blk.x, blk.y - 8, 'spr', icon) as Phaser.Physics.Arcade.Sprite;
    k.setDepth(1).setData('kind', what);
    (k.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setSize(20, 20).setOffset((k.width - 20) / 2, (k.height - 20) / 2);
    this.tweens.add({ targets: k, y: blk.y - 40, duration: 380, ease: 'Quad.out', onComplete: () => {
      if (!k.active || !k.body) return;                 // already collected while rising
      k.setDepth(6);
      (k.body as Phaser.Physics.Arcade.Body).setAllowGravity(true).setGravityY(T.GRAVITY * 0.5).setVelocityX(60).setBounce(0.3);
    } });
  }

  collectPickup(k: Phaser.Physics.Arcade.Sprite) {
    const kind = k.getData('kind') as string;
    this.sparks.emitParticleAt(k.x, k.y, 10);
    k.destroy();
    if (isForm(kind)) {
      this.player.setForm(kind);
      audio.powerup();
      this.events.emit('msg', FORMS[kind].msg, 1600);
    } else if (isSpecial(kind)) {
      this.startSpecial(kind);
    }
  }

  // ------------------------------------------------------------ specials
  startSpecial(kind: Special) {
    this.special = kind;
    this.specialUntil = this.time.now + SPECIALS[kind].ms;
    this.registry.set('special', kind);
    audio.special();
    this.events.emit('msg', SPECIALS[kind].msg, 1600);
    this.player.boostSpeed = kind === 'kaffeepower' ? 1.3 : 1;
    this.player.boostJump = kind === 'kaffeepower' ? 1.15 : 1;
    this.player.noCooldown = kind === 'kaffeepower';
    this.worldScale = kind === 'buecher' ? 0.45 : 1;
    if (kind === 'buecher') this.waves.getChildren().forEach((w) => (w as Wave).body.velocity.scale(0.45));
    this.updateAura();
  }

  endSpecial() {
    if (this.special === 'buecher') this.waves.getChildren().forEach((w) => (w as Wave).body.velocity.scale(1 / 0.45));
    this.special = null;
    this.registry.set('special', '');
    this.player.boostSpeed = 1; this.player.boostJump = 1; this.player.noCooldown = false;
    this.worldScale = 1;
    this.updateAura();
  }

  private updateAura() {
    if (this.special === 'kaffeepower') this.player.setAura(0xffe08a);
    else if (this.special === 'cambio') this.player.setAura(0xf4c6d8);
    else if (this.special === 'buecher') this.player.setAura(0xa9d8f0);
    else if (this.khusra >= 100) this.player.setAura(0xff4fa3);
    else this.player.setAura(null);
  }

  addKhusra(v: number) {
    const was = this.khusra;
    this.khusra = Math.min(100, this.khusra + v);
    this.registry.set('khusra', this.khusra);
    if (was < 100 && this.khusra >= 100) { audio.meterFull(); this.events.emit('msg', 'KHUSRA MUND BEREIT!', 1200); this.updateAura(); }
  }

  // ------------------------------------------------------------ attacks
  /** Returns the cooldown in ms when an attack happened, 0 when nothing fired. */
  attack(form: Form, x: number, y: number, dir: number): number {
    if (this.khusra >= 100) { this.khusraMund(); return 600; }
    if (this.special === 'cambio') {
      audio.throw();
      for (let i = -2; i <= 2; i++) {
        const c = new HomingCard(this, x, y - 4, dir, i * 0.5);
        c.target = this.nearestMob(x, y, 320);
        this.homing.add(c);
      }
      return 380;
    }
    const cd = FORMS[form].cooldown;
    switch (FORMS[form].attack) {
      case 'cup': audio.throw(); this.cups.add(new Cup(this, x, y, dir)); return cd;
      case 'punch': this.punch(dir, false); return cd;
      case 'combo': this.punch(dir, true); return cd;
      case 'spray': this.spray(dir); return cd;
      case 'wave': this.djWave(x, y, dir); return cd;
      case 'chord': this.chord(); return cd;
      default: return 0;
    }
  }

  private nearestMob(x: number, y: number, maxDist: number) {
    let best: Mob | undefined, bd = maxDist;
    for (const m of this.mobs) {
      if (!m.alive) continue;
      const d = Phaser.Math.Distance.Between(x, y, m.x, m.y);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  private mobsInFront(dir: number, range: number, dy = 56) {
    const p = this.player.body;
    return this.mobs.filter((m) => m.alive && !m.flung && Math.abs(m.y - p.center.y) < dy &&
      (dir > 0 ? m.body.left >= p.center.x - 6 && m.body.left <= p.right + range : m.body.right <= p.center.x + 6 && m.body.right >= p.left - range));
  }

  /** Damage a mob from a direction; handles the Schal shield and Fan-Block members. Heavy hits ignore both. */
  private hitMob(m: Mob, dir: number, heavy: boolean) {
    if (!m.alive) return false;
    if (m.blocksFrom(dir) && !heavy) { this.sparks.emitParticleAt(m.x + m.dir * 14, m.y - 30, 4); audio.bump(); return false; }
    if (m.variant === 'fanblock' && !heavy) { m.loseMember(); this.sparks.emitParticleAt(m.x, m.y - 30, 6); if (!m.alive) this.addKhusra(T.KHUSRA_KILL); return true; }
    m.kill();
    this.addKhusra(T.KHUSRA_KILL);
    this.sparks.emitParticleAt(m.x, m.y - 30, 8);
    return true;
  }

  private punch(dir: number, combo: boolean) {
    const now = this.time.now;
    audio.punch();
    const pb = this.player.body;
    const px = pb.center.x + dir * (T.PUNCH_RANGE * 0.6), py = pb.center.y;
    this.dust.emitParticleAt(px, py, 3);
    if (!combo) {
      const seen = new Set<Phaser.Tilemaps.Tile>();
      for (const reach of [pb.halfWidth + 6, pb.halfWidth + 24]) {
        for (const dy of [-12, 10]) {
          const tile = this.ground.getTileAtWorldXY(pb.center.x + dir * reach, py + dy);
          if (tile && tile.index === 19 && !seen.has(tile)) { seen.add(tile); this.breakBrick(tile); }
        }
      }
    }
    for (const m of this.mobsInFront(dir, T.PUNCH_RANGE)) {
      if (combo) {
        if (m.blocksFrom(dir)) { this.sparks.emitParticleAt(m.x + m.dir * 14, m.y - 30, 4); audio.bump(); continue; }
        this.punchCombo = now < this.punchComboUntil ? this.punchCombo + 1 : 1;
        this.punchComboUntil = now + T.COMBO_WINDOW_PUNCH;
        if (this.punchCombo >= 3) {
          this.punchCombo = 0;
          if (m.variant === 'fanblock') { m.loseMember(); if (!m.alive) this.addKhusra(T.KHUSRA_KILL); }
          else { m.fling(dir); this.events.emit('msg', 'ABFLUG!', 600); }
        } else m.push(dir, 40, -60);
        this.sparks.emitParticleAt(m.x, m.y - 30, 4);
      } else {
        this.hitMob(m, dir, false);
      }
      this.hitstop();
    }
    for (const b of this.blocks) {
      if (Math.abs(b.y - py) < 40 && (dir > 0 ? b.x - px > -8 && b.x - px < T.PUNCH_RANGE : px - b.x > -8 && px - b.x < T.PUNCH_RANGE)) b.bump();
    }
  }

  breakBrick(tile: Phaser.Tilemaps.Tile) {
    this.ground.removeTileAt(tile.x, tile.y);
    this.ground.setCollisionByExclusion([-1]);
    this.dust.emitParticleAt(tile.getCenterX(), tile.getCenterY(), 10);
    audio.bump();
    this.cameras.main.shake(60, 0.004);
  }

  private spray(dir: number) {
    audio.spray();
    const p = this.player.body;
    const s = this.add.image(p.center.x + dir * 22, p.center.y - 8, 'spr', 'fx_spray_0').setOrigin(dir < 0 ? 1 : 0, 0.5).setDepth(11).setFlipX(dir < 0);
    this.tweens.add({ targets: s, alpha: 0, scaleX: 1.3, duration: 320, onComplete: () => s.destroy() });
    for (const m of this.mobsInFront(dir, T.SPRAY_RANGE, 44)) {
      m.confuse(T.CONFUSE_MS);
      this.paint.emitParticleAt(m.x, m.y - 30, 12);
    }
  }

  private djWave(x: number, y: number, dir: number) {
    const off = audio.beatOffset();
    const perfect = off < T.DJ_BEAT_WINDOW;
    audio.djwave(perfect);
    if (perfect) this.events.emit('msg', 'PERFECT!', 400);
    this.waves.add(new Wave(this, x, y - 4, dir, 'player', perfect ? 1.8 : 1));
  }

  private chord() {
    audio.chord();
    const p = this.player.body;
    const ring = this.add.image(p.center.x, p.center.y, 'spr', 'fx_chord_0').setDepth(11).setScale(0.5);
    this.tweens.add({ targets: ring, scale: T.CHORD_RADIUS / 22, alpha: 0, duration: 380, ease: 'Quad.out', onComplete: () => ring.destroy() });
    this.cameras.main.shake(180, 0.008);
    for (const m of this.mobs) {
      if (m.alive && Phaser.Math.Distance.Between(p.center.x, p.center.y, m.x, m.y) < T.CHORD_RADIUS) this.hitMob(m, Math.sign(m.x - p.center.x) || 1, true);
    }
    for (const b of this.blocks) if (Phaser.Math.Distance.Between(p.center.x, p.center.y, b.x, b.y) < T.CHORD_RADIUS) b.bump();
    const r = T.CHORD_RADIUS;
    this.ground.getTilesWithinWorldXY(p.center.x - r, p.center.y - r, 2 * r, 2 * r).forEach((t) => { if (t.index === 19) this.breakBrick(t); });
    this.hitstop();
  }

  khusraMund() {
    this.khusra = 0;
    this.registry.set('khusra', 0);
    audio.khusra();
    this.updateAura();
    const p = this.player;
    p.posUntil = this.time.now + 450;
    const g = p.gfx;
    g.anims.stop(); g.setTexture('spr', 'atk_mund_0').setOrigin(0.5, 58 / 64);
    const cam = this.cameras.main;
    cam.flash(300, 255, 79, 163);
    cam.shake(400, 0.012);
    for (let i = 0; i < 3; i++) {
      const ring = this.add.image(p.body.center.x, p.body.center.y, 'spr', 'fx_ring_0').setDepth(13).setScale(0.6).setAlpha(0.9);
      this.tweens.add({ targets: ring, scale: 6 + i * 2, alpha: 0, duration: 500 + i * 120, delay: i * 70, ease: 'Quad.out', onComplete: () => ring.destroy() });
    }
    const view = cam.worldView;
    for (const m of this.mobs) {
      if (m.alive && view.contains(m.x, m.y - 20)) { m.kill(); this.sparks.emitParticleAt(m.x, m.y - 30, 10); }
    }
    this.waves.getChildren().slice().forEach((w) => { if ((w as Wave).owner === 'mob') w.destroy(); });
    this.pacifiers.getChildren().slice().forEach((k) => k.destroy());
    this.balls.getChildren().slice().forEach((b) => b.destroy());
    this.events.emit('msg', 'KHUSRA MUND!', 900);
    this.hitstop();
  }

  /** Trommler beat: every mob on screen gets a short speed burst. */
  drumBeat() {
    this.drumUntil = this.time.now + 420;
    audio.bump();
    this.cameras.main.shake(60, 0.002);
  }

  // ------------------------------------------------------------ cards
  bankCards(v: number, x: number, y: number, royal: boolean) {
    const now = this.time.now;
    this.combo = now < this.comboUntil ? this.combo + 1 : 1;
    this.comboUntil = now + T.COMBO_WINDOW;
    this.registry.inc('cards', v);
    this.registry.set('combo', this.combo);
    this.addKhusra(T.KHUSRA_CARD + Math.min(this.combo, 6));
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
    if (royal) { this.registry.inc('royals', 1); this.sparks.emitParticleAt(c.x, c.y, 12); this.events.emit('msg', 'ROYAL!', 700); }
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

  // ------------------------------------------------------------ combat resolution
  playerVsMob(m: Mob) {
    if (!m.alive || m.flung || this.player.dead || this.finished) return;
    const p = this.player.body;
    const stomp = p.velocity.y > 0 && p.bottom < m.body.top + 18;
    if (stomp) {
      if (m.variant === 'fanblock') {
        this.player.bounce();
        m.push(Math.sign(m.x - this.player.x) || 1, 30, -40);
        this.events.emit('msg', 'VON DER SEITE!', 500);
      } else {
        m.kill();
        this.addKhusra(T.KHUSRA_KILL);
        this.player.bounce();
        this.registry.inc('stomps', 1);
      }
      this.hitstop();
      this.dust.emitParticleAt(m.x, m.body.top, 6);
    } else if (m.state !== 'stunned') {
      this.damagePlayer(Math.sign(this.player.x - m.x) || 1);
    }
  }

  playerVsWave(w: Wave) {
    if (w.owner !== 'mob' || this.player.dead || this.finished) return;
    if (this.damagePlayer(w.dir)) w.destroy();
  }

  playerVsPuddle() {
    if (this.player.dead || this.finished || this.player.invulnerable) return;
    if (this.damagePlayer(-this.player.facing || 1)) this.player.body.setVelocityY(-T.KNOCKBACK_Y * 1.1);
  }

  playerVsVent(v: Vent) {
    const b = this.player.body;
    if (b.velocity.y > -T.VENT_LIFT * 0.9) {
      b.setVelocityY(Math.max(-T.VENT_LIFT, b.velocity.y - 90));
      this.player.jumping = false;
    }
    if (this.time.now % 90 < 20) this.steam.emitParticleAt(v.x + Phaser.Math.Between(-10, 10), b.bottom, 2);
  }

  playerVsBall(b: Ball) {
    if (this.player.dead || this.finished) return;
    const p = this.player.body;
    if (p.velocity.y > 0 && p.bottom < b.body.top + 12) {
      b.body.setVelocity(this.player.facing * 260, -220);
      this.player.bounce();
      audio.bump();
      this.sparks.emitParticleAt(b.x, b.y, 4);
    } else {
      this.damagePlayer(Math.sign(this.player.x - b.x) || 1);
    }
  }

  playerVsPacifier(k: Pacifier) {
    if (this.player.dead || this.finished) return;
    if (this.damagePlayer(Math.sign(k.body.velocity.x) || 1)) this.breakSmall(k);
  }

  breakSmall(k: Phaser.Physics.Arcade.Sprite) {
    this.dust.emitParticleAt(k.x, k.y, 4);
    k.destroy();
  }

  waveVsMob(w: Wave, m: Mob) {
    if (w.owner !== 'player' || !m.alive || w.hit.has(m)) return;
    w.hit.add(m);
    if (m.variant === 'fanblock') { m.loseMember(); this.sparks.emitParticleAt(m.x, m.y - 30, 4); return; }
    m.push(w.dir, T.DJ_PUSH * w.strength);
    this.sparks.emitParticleAt(m.x, m.y - 30, 4);
  }

  mobVsMob(a: Mob, b: Mob) {
    if (a.flung && b.alive && !b.flung) { b.kill(); this.addKhusra(T.KHUSRA_KILL); this.sparks.emitParticleAt(b.x, b.y - 30, 8); }
    else if (b.flung && a.alive && !a.flung) { a.kill(); this.addKhusra(T.KHUSRA_KILL); this.sparks.emitParticleAt(a.x, a.y - 30, 8); }
  }

  projectileVsMob(c: Phaser.Physics.Arcade.Sprite, m: Mob) {
    if (!m.alive) return;
    const dir = Math.sign(c.body?.velocity.x ?? 1) || 1;
    this.hitMob(m, dir, false);
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
    if (!save.settings.assist) this.registry.inc('lives', -1);
    const lives = this.registry.get('lives') as number;
    this.cameras.main.shake(160, 0.01);
    this.player.body.setVelocity(0, -300);
    this.player.body.setAllowGravity(true);
    this.tweens.add({ targets: this.player.gfx, angle: 360, duration: 500 });
    if (this.special) this.endSpecial();
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
      this.registry.set('hearts', this.registry.get('maxHearts') ?? 3);
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
    const royals = (this.registry.get('royals') as number) || 0;
    const prev = save.progress(this.levelKey);
    const newBest = prev.bestSecs === null || secs < prev.bestSecs;
    save.recordResult(this.levelKey, secs, cards, this.totalCards, royals);
    const nx = nextLevel(this.levelKey);
    if (nx.world > 0 && LEVELS.indexOf(nx) > LEVELS.findIndex((l) => l.key === this.levelKey)) save.unlock(nx.key);
    this.time.delayedCall(700, () => {
      this.physics.world.pause();
      this.overlay = {
        kind: 'result',
        lines: ['CAMBIO!', '', `KARTEN   ${cards} / ${this.totalCards}`, `ZEIT     ${secs.toFixed(1)}s${newBest ? '  NEU!' : ''}`, noDmg ? 'OHNE SCHADEN  +500' : royals ? `ROYALS   ${royals}` : ''],
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
      this.registry.set('khusra', 0);
      this.scene.restart({ level: this.levelKey });
    } else {
      this.registry.set('form', this.player.form);
      const nx = nextLevel(this.levelKey);
      const idx = LEVELS.findIndex((l) => l.key === this.levelKey);
      if (nx.world > 0 && LEVELS.indexOf(nx) > idx) {
        this.scene.restart({ level: nx.key });
      } else {
        this.scene.stop('hud');
        this.scene.start('title');
      }
    }
  }

  // ------------------------------------------------------------ loop
  update(_time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    this.inputSys.update();
    if (this.overlay) return;
    if (this.finished) { this.player.syncGfx(); return; }
    if (this.inputSys.pausePressed) { this.pauseGame(); return; }
    if (!this.player.dead) this.player.update(this.inputSys, dt);
    else this.player.syncGfx();

    const now = this.time.now;
    if (this.special && now > this.specialUntil) this.endSpecial();

    // mob buffs: Fahnentraeger aura + Trommler beat
    const drum = now < this.drumUntil;
    for (const m of this.mobs) m.buff = drum ? T.DRUM_BUFF : 1;
    for (const f of this.mobs) {
      if (f.variant !== 'fahne' || !f.alive) continue;
      for (const m of this.mobs) if (m !== f && m.alive && Phaser.Math.Distance.Between(f.x, f.y, m.x, m.y) < T.FAHNE_RADIUS) m.buff = Math.max(m.buff, T.FAHNE_BUFF);
    }
    for (const m of this.mobs) {
      m.update(dt, this.player, this.worldScale);
      if (m.alive && m.y > this.map.heightInPixels + 60) { m.kill(); this.addKhusra(T.KHUSRA_KILL); }
    }
    // ball spawners (World 4)
    const view = this.cameras.main.worldView;
    for (const s of this.spawners) {
      if (now > s.next && view.contains(s.x, s.y)) {
        s.next = now + s.every * (this.worldScale < 1 ? 2 : 1);
        this.balls.add(new Ball(this, s.x, s.y, this.player.x < s.x ? -1 : 1));
        audio.bump();
      }
    }
    this.movers.getChildren().forEach((p) => (p as MovingPlatform).tick());
    this.cups.getChildren().slice().forEach((c) => { const cup = c as Cup; if (cup.expired(now) || cup.y > this.map.heightInPixels + 50) cup.destroy(); });
    this.homing.getChildren().slice().forEach((c) => { const hc = c as HomingCard; hc.steer(dt); if (hc.expired(now)) hc.destroy(); });
    this.waves.getChildren().slice().forEach((w) => { const wave = w as Wave; if (wave.expired(now)) wave.destroy(); });
    this.balls.getChildren().slice().forEach((b) => { const ball = b as Ball; if (ball.expired(now) || ball.y > this.map.heightInPixels + 50) ball.destroy(); });
    this.pacifiers.getChildren().slice().forEach((k) => { const pk = k as Pacifier; if (pk.expired(now) || pk.y > this.map.heightInPixels + 50) pk.destroy(); });
    if (now > this.comboUntil && this.combo) { this.combo = 0; this.registry.set('combo', 0); }
    if (now > this.punchComboUntil) this.punchCombo = 0;

    const cam = this.cameras.main;
    this.lookX = Phaser.Math.Linear(this.lookX, -this.player.facing * T.CAM_LOOKAHEAD, 0.08);
    cam.setFollowOffset(this.lookX, 16);
    cam.setLerp(T.CAM_LERP, T.CAM_LERP);

    if (!this.player.dead && this.player.y > this.map.heightInPixels + 96) this.die();
  }
}
