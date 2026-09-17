import Phaser from 'phaser';
import { U, PX, HAND, button, toggle, COLORS } from '../ui/ui';
import { save } from '../systems/Save';
import { audio } from '../systems/Audio';

/** Options overlay (from title or pause). */
export class SettingsScene extends Phaser.Scene {
  private from = 'title';
  constructor() { super('settings'); }

  init(data: { from?: string }) { this.from = data?.from ?? 'title'; }

  create() {
    const u = U(), w = this.scale.width, h = this.scale.height;
    // block taps from reaching the scene underneath while this overlay is open
    const parent = this.scene.get(this.from);
    if (parent) {
      parent.input.enabled = false;
      this.events.once('shutdown', () => { parent.input.enabled = true; });
    }
    const g = this.add.graphics();
    g.fillStyle(0x0f0d0c, 0.82).fillRect(0, 0, w, h);
    const pw = Math.min(w * 0.82, 340 * u), ph = Math.min(h * 0.94, 292 * u), px = (w - pw) / 2, py = (h - ph) / 2;
    g.fillStyle(COLORS.board, 0.98).fillRoundedRect(px, py, pw, ph, 10 * u);
    g.lineStyle(2 * u, COLORS.pink, 1).strokeRoundedRect(px, py, pw, ph, 10 * u);
    this.add.text(w / 2, py + 18 * u, 'OPTIONEN', PX(u, 12, '#FF4FA3')).setOrigin(0.5);

    const s = save.settings;
    const tw = pw - 30 * u;
    let y = py + 44 * u;
    const step = 28 * u;
    toggle(this, w / 2, y, tw, 'SOUND', s.sound, (v) => { save.setSetting('sound', v); audio.setSound(v); }, u); y += step;
    toggle(this, w / 2, y, tw, 'MUSIK', s.music, (v) => { save.setSetting('music', v); audio.setMusic(v); }, u); y += step;
    toggle(this, w / 2, y, tw, 'LINKSHAENDER', s.leftHand, (v) => { save.setSetting('leftHand', v); this.game.events.emit('controls-changed'); }, u); y += step;
    toggle(this, w / 2, y, tw, 'GROSSE KNOEPFE', s.buttonScale > 1, (v) => { save.setSetting('buttonScale', v ? 1.25 : 1); this.game.events.emit('controls-changed'); }, u); y += step;
    toggle(this, w / 2, y, tw, 'BLITZE REDUZIEREN', s.reduceFx, (v) => save.setSetting('reduceFx', v), u); y += step;
    toggle(this, w / 2, y, tw, 'ASSIST-MODUS', s.assist, (v) => save.setSetting('assist', v), u); y += step;
    this.add.text(w / 2, y - 6 * u, 'Assist: 5 Herzen, langsamere Mobs + Boss, unendlich Leben', HAND(u, 10, '#A79C90')).setOrigin(0.5, 0);

    button(this, w / 2, py + ph - 20 * u, 110 * u, 24 * u, 'ZURUECK', () => this.scene.stop(), { primary: true, u, size: 8 });
    this.input.keyboard?.on('keydown-ESC', () => this.scene.stop());
  }
}
