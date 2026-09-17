import Phaser from 'phaser';
import { T } from '../config/Tuning';
import type { GameScene } from './GameScene';

type Overlay = { kind: 'result' | 'gameover'; lines: string[]; hint: string } | null;

/** HUD + touch controls + overlays, drawn in canvas pixels (DPR-aware), independent of the game camera zoom. */
export class HudScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private gfx!: Phaser.GameObjects.Graphics;
  private u = 1;
  private portrait!: Phaser.GameObjects.Image;
  private nameTxt!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Image[] = [];
  private formIcon!: Phaser.GameObjects.Image;
  private cardIcon!: Phaser.GameObjects.Image;
  private cardTxt!: Phaser.GameObjects.Text;
  private comboTxt!: Phaser.GameObjects.Text;
  private msg!: Phaser.GameObjects.Text;
  private msgTimer?: Phaser.Time.TimerEvent;
  private jumpLbl!: Phaser.GameObjects.Text;
  private atkLbl!: Phaser.GameObjects.Text;
  private ovPanel!: Phaser.GameObjects.Graphics;
  private ovLines: Phaser.GameObjects.Text[] = [];
  private ovHint!: Phaser.GameObjects.Text;
  private overlay: Overlay = null;
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
    this.formIcon = this.add.image(0, 0, 'spr', 'it_kaffee_0').setOrigin(0, 0).setScale(u).setVisible(false);
    this.cardIcon = this.add.image(0, 0, 'spr', 'it_karte_0').setOrigin(1, 0).setScale(u);
    this.cardTxt = this.add.text(0, 0, 'x 0', font).setOrigin(1, 0);
    this.comboTxt = this.add.text(0, 0, '', { ...font, fontSize: `${7 * u}px`, color: '#FF4FA3' }).setOrigin(1, 0);
    this.msg = this.add.text(0, 0, '', { ...font, fontSize: `${12 * u}px`, color: '#FF4FA3', align: 'center' }).setOrigin(0.5).setShadow(2 * u, 2 * u, '#14100E', 0, true, true);
    const small = { ...font, fontSize: `${7 * u}px`, color: '#14100E' };
    this.jumpLbl = this.add.text(0, 0, 'SPRUNG', small).setOrigin(0.5).setVisible(this.touch);
    this.atkLbl = this.add.text(0, 0, 'WURF', small).setOrigin(0.5).setVisible(this.touch);

    this.ovPanel = this.add.graphics().setDepth(20).setVisible(false);
    for (let i = 0; i < 6; i++) this.ovLines.push(this.add.text(0, 0, '', { ...font, fontSize: `${(i === 0 ? 16 : 9) * u}px`, color: i === 0 ? '#FF4FA3' : '#FFF4DC', align: 'center' }).setOrigin(0.5).setDepth(21).setVisible(false));
    this.ovHint = this.add.text(0, 0, '', { ...font, fontSize: `${7 * u}px`, color: '#A79C90' }).setOrigin(0.5).setDepth(21).setVisible(false);

    this.readInsets();
    this.layout();
    this.scale.on('resize', this.layout, this);
    const reg = this.registry;
    reg.events.on('changedata-cards', (_p: unknown, v: number) => this.cardTxt.setText('x ' + v));
    reg.events.on('changedata-hearts', (_p: unknown, v: number) => this.hearts.forEach((h, i) => h.setFrame(i < v ? 'herz_s_0' : 'herz_leer_0')));
    reg.events.on('changedata-lives', (_p: unknown, v: number) => this.nameTxt.setText('BARIO x' + Math.max(0, v)));
    reg.events.on('changedata-form', (_p: unknown, v: string) => this.formIcon.setVisible(v !== 'base'));
    reg.events.on('changedata-combo', (_p: unknown, v: number) => this.comboTxt.setText(v >= 2 ? `COMBO x${v}` : ''));
    this.gameScene.events.on('msg', (s: string, ms?: number) => this.showMsg(s, ms));
    this.gameScene.events.on('overlay', (o: Overlay) => this.showOverlay(o));
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    this.cardTxt.setText('x ' + (reg.get('cards') ?? 0));
    this.nameTxt.setText('BARIO x' + (reg.get('lives') ?? 3));
  }

  private showMsg(s: string, ms?: number) {
    this.msgTimer?.remove(false);
    this.msg.setText(s).setVisible(!!s);
    if (s && ms) this.msgTimer = this.time.delayedCall(ms, () => this.msg.setVisible(false));
  }

  private showOverlay(o: Overlay) {
    this.overlay = o;
    const on = !!o;
    this.ovPanel.setVisible(on);
    this.ovHint.setVisible(on);
    this.ovLines.forEach((l, i) => l.setVisible(on && !!o!.lines[i]).setText(on ? (o!.lines[i] ?? '') : ''));
    if (on) {
      this.ovHint.setText(o!.hint);
      this.layoutOverlay();
    }
  }

  private layoutOverlay() {
    const w = this.scale.width, h = this.scale.height, u = this.u;
    const pw = Math.min(w * 0.8, 360 * u), ph = 170 * u;
    const x = (w - pw) / 2, y = (h - ph) / 2;
    this.ovPanel.clear();
    this.ovPanel.fillStyle(0x0f0d0c, 0.92).fillRoundedRect(x, y, pw, ph, 10 * u);
    this.ovPanel.lineStyle(2 * u, 0xff4fa3, 1).strokeRoundedRect(x, y, pw, ph, 10 * u);
    let cy = y + 30 * u;
    this.ovLines.forEach((l, i) => { l.setPosition(w / 2, cy); cy += (i === 0 ? 30 : 17) * u; });
    this.ovHint.setPosition(w / 2, y + ph - 18 * u);
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
    const w = this.scale.width, u = this.u, m = 10 * u;
    const L = this.inset.left + m, R = w - this.inset.right - m, top = this.inset.top + m;
    this.portrait.setPosition(L, top);
    this.nameTxt.setPosition(L + 36 * 1.5 * u + 8 * u, top + 3 * u);
    this.hearts.forEach((hh, i) => hh.setPosition(L + 36 * 1.5 * u + 8 * u + i * 26 * u, top + 20 * u));
    this.formIcon.setPosition(L + 36 * 1.5 * u + 8 * u + 3 * 26 * u + 4 * u, top + 16 * u);
    this.cardTxt.setPosition(R, top + 6 * u);
    this.cardIcon.setPosition(R - this.cardTxt.width - 8 * u, top);
    this.comboTxt.setPosition(R, top + 26 * u);
    this.msg.setPosition(w / 2, this.scale.height * 0.3);
    if (this.overlay) this.layoutOverlay();
  }

  update() {
    const g = this.gfx;
    g.clear();
    const inp = this.gameScene.inputSys;
    if (!inp || !this.touch || this.overlay) return;
    const u = this.u;
    if (inp.stickActive) {
      g.lineStyle(3 * u, 0xfff4dc, 0.5).strokeCircle(inp.stickOrigin.x, inp.stickOrigin.y, T.STICK_RADIUS * u);
      g.fillStyle(0xfff4dc, 0.55).fillCircle(inp.stickKnob.x, inp.stickKnob.y, 17 * u);
    }
    const jr = inp.jumpRect, ar = inp.attackRect;
    g.fillStyle(0xfff4dc, inp.jumpHeld ? 0.62 : 0.26).fillRoundedRect(jr.x, jr.y, jr.width, jr.height, 16 * u);
    const hasForm = (this.registry.get('form') ?? 'base') !== 'base';
    g.fillStyle(0xff4fa3, hasForm ? 0.5 : 0.18).fillRoundedRect(ar.x, ar.y, ar.width, ar.height, 12 * u);
    this.jumpLbl.setPosition(jr.centerX, jr.centerY);
    this.atkLbl.setPosition(ar.centerX, ar.centerY).setAlpha(hasForm ? 1 : 0.5);
  }
}
