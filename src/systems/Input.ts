import Phaser from 'phaser';
import { T } from '../config/Tuning';

/** Unified input: keyboard (Mac test) + touch (floating stick left, jump/attack right). All coords in canvas px. */
export class InputSystem {
  axis = 0;
  jumpHeld = false;
  jumpPressed = false;
  attackPressed = false;

  stickActive = false;
  stickOrigin = new Phaser.Math.Vector2();
  stickKnob = new Phaser.Math.Vector2();
  jumpRect = new Phaser.Geom.Rectangle();
  attackRect = new Phaser.Geom.Rectangle();
  ui = 1;

  private scene: Phaser.Scene;
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private stickPointerId = -1;
  private jumpPointerId = -1;
  private touchAxis = 0;
  private jumpWasHeld = false;
  private jumpQueued = false;
  private attackQueued = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const kb = scene.input.keyboard!;
    this.keys = kb.addKeys({ left: 'LEFT', right: 'RIGHT', up: 'UP', a: 'A', d: 'D', w: 'W', space: 'SPACE', x: 'X', j: 'J', k: 'K', shift: 'SHIFT' }) as Record<string, Phaser.Input.Keyboard.Key>;
    scene.input.addPointer(3);
    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
    this.layout();
    scene.scale.on('resize', this.layout, this);
    scene.events.once('shutdown', () => scene.scale.off('resize', this.layout, this));
  }

  layout() {
    const w = this.scene.scale.width, h = this.scene.scale.height;
    const u = (this.ui = Math.max(1, Math.min(window.devicePixelRatio || 1, 3)));
    const r = 44 * u;
    this.jumpRect.setTo(w - 2 * r - 18 * u, h - 2 * r - 18 * u, 2 * r, 2 * r);
    this.attackRect.setTo(w - 2 * r - 18 * u, h - 2 * r - 18 * u - 1.5 * r - 14 * u, 2 * r, 1.5 * r);
  }

  private onDown(p: Phaser.Input.Pointer) {
    const w = this.scene.scale.width;
    if (Phaser.Geom.Rectangle.Contains(this.attackRect, p.x, p.y)) { this.attackQueued = true; return; }
    if (p.x >= w * 0.5) {
      if (this.jumpPointerId < 0) { this.jumpPointerId = p.id; this.jumpQueued = true; }
      return;
    }
    if (this.stickPointerId < 0) {
      this.stickPointerId = p.id; this.stickActive = true;
      this.stickOrigin.set(p.x, p.y); this.stickKnob.set(p.x, p.y);
      this.axisFromPointer(p);
    }
  }

  private onMove(p: Phaser.Input.Pointer) {
    if (p.id === this.stickPointerId) this.axisFromPointer(p);
  }

  private onUp(p: Phaser.Input.Pointer) {
    if (p.id === this.stickPointerId) { this.stickPointerId = -1; this.stickActive = false; this.touchAxis = 0; }
    if (p.id === this.jumpPointerId) this.jumpPointerId = -1;
  }

  private axisFromPointer(p: Phaser.Input.Pointer) {
    const R = T.STICK_RADIUS * this.ui;
    const d = p.x - this.stickOrigin.x;
    if (Math.abs(d) > R) this.stickOrigin.x = p.x - Math.sign(d) * R;      // stick follows a drifting thumb
    const dx = Phaser.Math.Clamp((p.x - this.stickOrigin.x) / R, -1, 1);
    this.stickKnob.set(this.stickOrigin.x + dx * R, this.stickOrigin.y);
    this.touchAxis = Math.abs(dx) < T.STICK_DEADZONE ? 0 : dx;
  }

  /** Call once per frame before reading state. */
  update() {
    const k = this.keys;
    let kx = 0;
    if (k.left.isDown || k.a.isDown) kx -= 1;
    if (k.right.isDown || k.d.isDown) kx += 1;
    if (kx !== 0 && k.shift.isDown) kx *= 0.5;                                 // shift = walk on keyboard
    this.axis = kx !== 0 ? kx : this.touchAxis;

    const held = k.space.isDown || k.up.isDown || k.w.isDown || this.jumpPointerId >= 0;
    this.jumpPressed = (held && !this.jumpWasHeld) || this.jumpQueued;
    this.jumpQueued = false;
    this.jumpWasHeld = held;
    this.jumpHeld = held;

    const kAtk = Phaser.Input.Keyboard.JustDown(k.x) || Phaser.Input.Keyboard.JustDown(k.j) || Phaser.Input.Keyboard.JustDown(k.k);
    this.attackPressed = kAtk || this.attackQueued;
    this.attackQueued = false;
  }
}
