import Phaser from 'phaser';
import { U, PX, HAND, board, COLORS } from '../ui/ui';
import { audio } from '../systems/Audio';

const GATE_KEY = 'barios-gate-v1';
/** SHA-256 of the Tafel-Code – the code itself never ships in the bundle. */
const GATE_HASH = 'b171875a25de1c92084c310cc8c323c59668112c2c680f5b161a93041cb7fed0';
const LEN = 4;

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Friends-only door: a chalkboard keypad before the title, remembered per device. */
export class GateScene extends Phaser.Scene {
  private next: { level?: string } = {};
  private entered = '';
  private dots!: Phaser.GameObjects.Text;
  private note!: Phaser.GameObjects.Text;
  private busy = false;

  constructor() { super('gate'); }

  init(data: { level?: string }) { this.next = data ?? {}; }

  create() {
    let ok = false;
    try { ok = localStorage.getItem(GATE_KEY) === GATE_HASH; } catch { /* private mode: ask every time */ }
    if (ok) { this.go(); return; }
    const u = U(), w = this.scale.width, h = this.scale.height;
    board(this);
    this.add.text(w / 2, h * 0.07, 'BARIOS WORLD', PX(u, 14, '#FF4FA3')).setOrigin(0.5, 0).setShadow(2 * u, 2 * u, '#14100E', 0, true, true);
    this.add.text(w / 2, h * 0.07 + 22 * u, 'Tafel-Code? Nur für Freunde von Bario ♥', HAND(u, 12, '#A79C90')).setOrigin(0.5, 0);
    this.dots = this.add.text(w / 2, h * 0.30, this.mask(), PX(u, 16, '#FFF4DC')).setOrigin(0.5);
    this.note = this.add.text(w / 2, h * 0.30 + 26 * u, '', HAND(u, 11, '#FF4FA3')).setOrigin(0.5);
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '<', '0', 'OK'];
    const kw = 46 * u, kh = 26 * u, gap = 6 * u;
    const x0 = w / 2 - (3 * kw + 2 * gap) / 2 + kw / 2, y0 = h * 0.44 + kh / 2;
    keys.forEach((k, i) => {
      const x = x0 + (i % 3) * (kw + gap), y = y0 + Math.floor(i / 3) * (kh + gap);
      const g = this.add.graphics();
      g.fillStyle(k === 'OK' ? COLORS.pink : COLORS.board2, 1).fillRoundedRect(x - kw / 2, y - kh / 2, kw, kh, 5 * u);
      if (k !== 'OK') g.lineStyle(2 * u, 0x4a403a, 1).strokeRoundedRect(x - kw / 2, y - kh / 2, kw, kh, 5 * u);
      this.add.text(x, y, k, PX(u, 9, k === 'OK' ? '#2B0715' : '#FFF4DC')).setOrigin(0.5);
      const z = this.add.zone(x, y, kw, kh).setOrigin(0.5).setInteractive();
      z.on('pointerup', () => this.press(k));
    });
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) this.press(e.key);
      else if (e.key === 'Backspace') this.press('<');
      else if (e.key === 'Enter') this.press('OK');
    });
  }

  private mask() { return Array.from({ length: LEN }, (_, i) => (i < this.entered.length ? '*' : '_')).join(' '); }

  private press(k: string) {
    if (this.busy) return;
    audio.unlock(); audio.click();
    if (k === '<') this.entered = this.entered.slice(0, -1);
    else if (k === 'OK') { void this.check(); return; }
    else if (this.entered.length < LEN) this.entered += k;
    this.dots.setText(this.mask());
    if (this.entered.length === LEN) void this.check();
  }

  private async check() {
    if (this.entered.length < LEN) return;
    this.busy = true;
    const hex = await sha256(this.entered);
    if (hex === GATE_HASH) {
      try { localStorage.setItem(GATE_KEY, GATE_HASH); } catch { /* ignore */ }
      audio.say('bario', 'hola');
      this.note.setText('¡Hola! Willkommen ♥');
      this.time.delayedCall(600, () => this.go());
    } else {
      this.note.setText('Same shit, different code ♥');
      this.cameras.main.shake(150, 0.01);
      this.entered = ''; this.dots.setText(this.mask());
      this.busy = false;
    }
  }

  private go() {
    if (this.next.level) {
      this.registry.set('lives', 3); this.registry.set('hearts', 3); this.registry.set('form', 'base');
      this.scene.start('game', { level: this.next.level });
      this.scene.launch('hud');
    } else this.scene.start('title');
  }
}
