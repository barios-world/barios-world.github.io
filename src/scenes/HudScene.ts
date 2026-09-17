import Phaser from 'phaser';
import { T } from '../config/Tuning';
import type { GameScene } from './GameScene';

/** HUD + touch controls, drawn in canvas pixels (DPR-aware), independent of the game camera zoom. */
export class HudScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private gfx!: Phaser.GameObjects.Graphics;
  private u = 1;
  private portrait!: Phaser.GameObjects.Image;
  private nameTxt!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Image[] = [];
  private cardIcon!: Phaser.GameObjects.Image;
  private cardTxt!: Phaser.GameObjects.Text;
  private msg!: Phaser.GameObjects.Text;
  private jumpLbl!: Phaser.GameObjects.Text;
  private atkLbl!: Phaser.GameObjects.Text;
  private inset = { top: 0, left: 0, right: 0, bottom: 0 };
  private touch = false;

  constructor() { super('hud'); }

  create() {
    this.gameScene = this.scene.get('game') as GameScene;
    this.u = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    this.touch = this.sys.game.device.input.touch;
    const u = this.u;
    const font = { fontFamily: '"Press Start 2P", monospace', fontSize: `${9 * u}px`, color: '#FFF4DC' };
    this.gfx = this.add.graphics();
    this.portrait = this.add.image(0, 0, 'spr', 'port_bario_0').setOrigin(0, 0).setScale(1.5 * u);
    this.nameTxt = this.add.text(0, 0, 'BARIO x3', font);
    for (let i = 0; i < 3; i++) this.hearts.push(this.add.image(0, 0, 'spr', 'herz_s_0').setOrigin(0, 0).setScale(2 * u));
    this.cardIcon = this.add.image(0, 0, 'spr', 'it_karte_0').setOrigin(1, 0).setScale(u);
    this.cardTxt = this.add.text(0, 0, 'x 0', font).setOrigin(1, 0);
    this.msg = this.add.text(0, 0, '', { ...font, fontSize: `${13 * u}px`, color: '#FF4FA3', align: 'center' }).setOrigin(0.5).setShadow(2 * u, 2 * u, '#14100E', 0, true, true);
    const small = { ...font, fontSize: `${7 * u}px`, color: '#14100E' };
    this.jumpLbl = this.add.text(0, 0, 'SPRUNG', small).setOrigin(0.5).setVisible(this.touch);
    this.atkLbl = this.add.text(0, 0, 'WURF', small).setOrigin(0.5).setVisible(this.touch);

    this.readInsets();
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.registry.events.on('changedata-cards', (_p: unknown, v: number) => this.cardTxt.setText('x ' + v));
    this.registry.events.on('changedata-hearts', (_p: unknown, v: number) => this.hearts.forEach((h, i) => h.setFrame(i < v ? 'herz_s_0' : 'herz_leer_0')));
    this.registry.events.on('changedata-lives', (_p: unknown, v: number) => this.nameTxt.setText('BARIO x' + v));
    this.gameScene.events.on('msg', (s: string) => { this.msg.setText(s); this.msg.setVisible(!!s); });
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
  }

  /** Safe-area insets (Dynamic Island / home indicator) measured from CSS env(), converted to canvas px. */
  private readInsets() {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const px = (v: string) => (parseFloat(v) || 0) * this.u;
    this.inset = { top: px(cs.paddingTop), right: px(cs.paddingRight), bottom: px(cs.paddingBottom), left: px(cs.paddingLeft) };
    probe.remove();
  }

  layout() {
    const w = this.scale.width, h = this.scale.height, u = this.u, m = 10 * u;
    const L = this.inset.left + m, R = w - this.inset.right - m, top = this.inset.top + m;
    this.portrait.setPosition(L, top);
    this.nameTxt.setPosition(L + 36 * 1.5 * u + 8 * u, top + 3 * u);
    this.hearts.forEach((hh, i) => hh.setPosition(L + 36 * 1.5 * u + 8 * u + i * 26 * u, top + 20 * u));
    this.cardTxt.setPosition(R, top + 6 * u);
    this.cardIcon.setPosition(R - this.cardTxt.width - 8 * u, top);
    this.msg.setPosition(w / 2, h * 0.36);
  }

  update() {
    const g = this.gfx;
    g.clear();
    const inp = this.gameScene.inputSys;
    if (!inp || !this.touch) return;
    const u = this.u;
    if (inp.stickActive) {
      g.lineStyle(3 * u, 0xfff4dc, 0.5).strokeCircle(inp.stickOrigin.x, inp.stickOrigin.y, T.STICK_RADIUS * u);
      g.fillStyle(0xfff4dc, 0.55).fillCircle(inp.stickKnob.x, inp.stickKnob.y, 17 * u);
    }
    const jr = inp.jumpRect, ar = inp.attackRect;
    g.fillStyle(0xfff4dc, inp.jumpHeld ? 0.62 : 0.26).fillRoundedRect(jr.x, jr.y, jr.width, jr.height, 16 * u);
    g.fillStyle(0xff4fa3, 0.34).fillRoundedRect(ar.x, ar.y, ar.width, ar.height, 12 * u);
    this.jumpLbl.setPosition(jr.centerX, jr.centerY);
    this.atkLbl.setPosition(ar.centerX, ar.centerY);
  }
}
