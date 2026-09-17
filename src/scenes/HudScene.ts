import Phaser from 'phaser';
import { T } from '../config/Tuning';
import type { GameScene } from './GameScene';
import { FORMS, SPECIALS, isForm, isSpecial } from '../data/forms';

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
  private specialIcon!: Phaser.GameObjects.Image;
  private specialBar!: Phaser.GameObjects.Graphics;
  private meterLbl!: Phaser.GameObjects.Text;
  private cardIcon!: Phaser.GameObjects.Image;
  private cardTxt!: Phaser.GameObjects.Text;
  private comboTxt!: Phaser.GameObjects.Text;
  private msg!: Phaser.GameObjects.Text;
  private msgTimer?: Phaser.Time.TimerEvent;
  private jumpLbl!: Phaser.GameObjects.Text;
  private atkLbl!: Phaser.GameObjects.Text;
  private pauseLbl!: Phaser.GameObjects.Text;
  private ovPanel!: Phaser.GameObjects.Graphics;
  private ovLines: Phaser.GameObjects.Text[] = [];
  private ovHint!: Phaser.GameObjects.Text;
  private overlay: Overlay = null;
  private inset = { top: 0, left: 0, right: 0, bottom: 0 };
  private touch = false;
  private handlers: [Phaser.Events.EventEmitter, string, (...a: any[]) => void][] = [];

  constructor() { super('hud'); }

  create() {
    this.gameScene = this.scene.get('game') as GameScene;
    this.u = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    this.touch = this.sys.game.device.input.touch;
    this.hearts = [];
    this.ovLines = [];
    this.handlers = [];
    const u = this.u;
    const font = { fontFamily: '"Press Start 2P", monospace', fontSize: `${9 * u}px`, color: '#FFF4DC' };
    this.gfx = this.add.graphics();
    this.portrait = this.add.image(0, 0, 'spr', 'port_bario_0').setOrigin(0, 0).setScale(1.5 * u);
    this.nameTxt = this.add.text(0, 0, 'BARIO x3', font);
    for (let i = 0; i < 7; i++) this.hearts.push(this.add.image(0, 0, 'spr', 'herz_s_0').setOrigin(0, 0).setScale(2 * u));
    this.formIcon = this.add.image(0, 0, 'spr', 'it_kaffee_0').setOrigin(0, 0).setScale(u).setVisible(false);
    this.specialIcon = this.add.image(0, 0, 'spr', 'pk_kaffeepower_0').setOrigin(0, 0).setScale(u).setVisible(false);
    this.specialBar = this.add.graphics();
    this.meterLbl = this.add.text(0, 0, 'KHUSRA', { ...font, fontSize: `${5 * u}px`, color: '#FF4FA3' }).setOrigin(0, 1);
    this.cardIcon = this.add.image(0, 0, 'spr', 'it_karte_0').setOrigin(1, 0).setScale(u);
    this.cardTxt = this.add.text(0, 0, 'x 0', font).setOrigin(1, 0);
    this.comboTxt = this.add.text(0, 0, '', { ...font, fontSize: `${7 * u}px`, color: '#FF4FA3' }).setOrigin(1, 0);
    this.msg = this.add.text(0, 0, '', { ...font, fontSize: `${12 * u}px`, color: '#FF4FA3', align: 'center' }).setOrigin(0.5).setShadow(2 * u, 2 * u, '#14100E', 0, true, true);
    const small = { ...font, fontSize: `${7 * u}px`, color: '#14100E' };
    this.jumpLbl = this.add.text(0, 0, 'SPRUNG', small).setOrigin(0.5).setVisible(this.touch);
    this.atkLbl = this.add.text(0, 0, 'WURF', small).setOrigin(0.5).setVisible(this.touch);
    this.pauseLbl = this.add.text(0, 0, 'II', { ...font, fontSize: `${9 * u}px`, color: '#FFF4DC' }).setOrigin(0.5);

    this.ovPanel = this.add.graphics().setDepth(20).setVisible(false);
    for (let i = 0; i < 6; i++) this.ovLines.push(this.add.text(0, 0, '', { ...font, fontSize: `${(i === 0 ? 16 : 9) * u}px`, color: i === 0 ? '#FF4FA3' : '#FFF4DC', align: 'center' }).setOrigin(0.5).setDepth(21).setVisible(false));
    this.ovHint = this.add.text(0, 0, '', { ...font, fontSize: `${7 * u}px`, color: '#A79C90' }).setOrigin(0.5).setDepth(21).setVisible(false);

    this.readInsets();
    this.layout();
    this.scale.on('resize', this.layout, this);
    const reg = this.registry;
    this.on(reg.events, 'changedata-cards', (_p: unknown, v: number) => this.cardTxt.setText('x ' + v));
    this.on(reg.events, 'changedata-hearts', () => this.drawHearts());
    this.on(reg.events, 'changedata-maxHearts', () => this.drawHearts());
    this.on(reg.events, 'changedata-lives', (_p: unknown, v: number) => this.nameTxt.setText('BARIO x' + Math.max(0, v)));
    this.on(reg.events, 'changedata-form', (_p: unknown, v: string) => this.setFormIcon(v));
    this.on(reg.events, 'changedata-special', (_p: unknown, v: string) => { if (isSpecial(v)) this.specialIcon.setFrame(SPECIALS[v].icon).setVisible(true); else this.specialIcon.setVisible(false); });
    this.on(reg.events, 'changedata-combo', (_p: unknown, v: number) => this.comboTxt.setText(v >= 2 ? `COMBO x${v}` : ''));
    this.on(this.gameScene.events, 'msg', (s: string, ms?: number) => this.showMsg(s, ms));
    this.on(this.gameScene.events, 'overlay', (o: Overlay) => this.showOverlay(o));
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      for (const [em, ev, fn] of this.handlers) em.off(ev, fn);
    });
    this.cardTxt.setText('x ' + (reg.get('cards') ?? 0));
    this.nameTxt.setText('BARIO x' + (reg.get('lives') ?? 3));
    this.setFormIcon(reg.get('form') ?? 'base');
    this.drawHearts();
  }

  private setFormIcon(v: string) {
    if (isForm(v) && v !== 'base') this.formIcon.setFrame(FORMS[v].icon).setVisible(true);
    else this.formIcon.setVisible(false);
  }

  private on(em: Phaser.Events.EventEmitter, ev: string, fn: (...a: any[]) => void) {
    em.on(ev, fn);
    this.handlers.push([em, ev, fn]);
  }

  private drawHearts() {
    const v = (this.registry.get('hearts') as number) ?? 3;
    const max = (this.registry.get('maxHearts') as number) ?? 3;
    this.hearts.forEach((h, i) => h.setVisible(i < max).setFrame(i < v ? 'herz_s_0' : 'herz_leer_0'));
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
    this.hearts.forEach((hh, i) => hh.setPosition(L + 36 * 1.5 * u + 8 * u + i * 24 * u, top + 20 * u));
    this.formIcon.setPosition(L + 36 * 1.5 * u + 8 * u + 7 * 24 * u + 4 * u, top + 16 * u);
    this.specialIcon.setPosition(L + 36 * 1.5 * u + 8 * u + 7 * 24 * u + 32 * u, top + 16 * u);
    this.meterLbl.setPosition(L, top + 36 * 1.5 * u + 14 * u);
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
    const paused = this.scene.isPaused('game') || this.scene.isActive('pause');
    const showControls = !!inp && this.touch && !this.overlay && !paused;
    this.jumpLbl.setVisible(showControls);
    this.atkLbl.setVisible(showControls);
    this.pauseLbl.setVisible(!!inp && !this.overlay && !paused);
    if (!inp || this.overlay || paused) return;
    const u = this.u;
    // khusra meter (under the portrait) + special timer
    const L = this.inset.left + 10 * u, top = this.inset.top + 10 * u + 36 * 1.5 * u + 16 * u;
    const kh = (this.registry.get('khusra') as number) || 0;
    const mw = 120 * u;
    g.fillStyle(0x14100e, 0.55).fillRoundedRect(L, top, mw, 7 * u, 3 * u);
    const full = kh >= 100;
    g.fillStyle(full ? (Math.floor(this.time.now / 160) % 2 ? 0xffe7f2 : 0xff4fa3) : 0xff4fa3, 1).fillRoundedRect(L, top, Math.max(4 * u, mw * kh / 100), 7 * u, 3 * u);
    const gs = this.gameScene;
    if (gs.special) {
      const left = Math.max(0, (gs.specialUntil - this.time.now) / (SPECIALS[gs.special].ms));
      const sx = this.specialIcon.x + 26 * u, sy = this.specialIcon.y + 8 * u;
      g.fillStyle(0x14100e, 0.55).fillRoundedRect(sx, sy, 40 * u, 5 * u, 2 * u);
      g.fillStyle(0xffe08a, 1).fillRoundedRect(sx, sy, 40 * u * left, 5 * u, 2 * u);
    }
    // pause button (top center)
    const pr = inp.pauseRect;
    g.fillStyle(0x14100e, 0.35).fillRoundedRect(pr.x, pr.y + 4 * u, pr.width, pr.height - 8 * u, 6 * u);
    this.pauseLbl.setPosition(pr.centerX, pr.centerY + 2 * u);
    if (!showControls) return;
    if (inp.stickActive) {
      g.lineStyle(3 * u, 0xfff4dc, 0.5).strokeCircle(inp.stickOrigin.x, inp.stickOrigin.y, T.STICK_RADIUS * u);
      g.fillStyle(0xfff4dc, 0.55).fillCircle(inp.stickKnob.x, inp.stickKnob.y, 17 * u);
    }
    const jr = inp.jumpRect, ar = inp.attackRect;
    g.fillStyle(0xfff4dc, inp.jumpHeld ? 0.62 : 0.26).fillRoundedRect(jr.x, jr.y, jr.width, jr.height, 16 * u);
    const form = (this.registry.get('form') ?? 'base') as string;
    const canAttack = (isForm(form) && FORMS[form].attack !== 'none') || gs.special === 'cambio' || full;
    g.fillStyle(full ? 0xff4fa3 : 0xff4fa3, full ? 0.85 : canAttack ? 0.5 : 0.18).fillRoundedRect(ar.x, ar.y, ar.width, ar.height, 12 * u);
    this.jumpLbl.setPosition(jr.centerX, jr.centerY);
    this.atkLbl.setText(full ? 'KHUSRA\nMUND' : 'WURF').setPosition(ar.centerX, ar.centerY).setAlpha(canAttack ? 1 : 0.5);
  }
}
