import Phaser from 'phaser';
import { U, PX, HAND, button, COLORS } from '../ui/ui';
import { audio } from '../systems/Audio';

/** Pause overlay on top of the (paused) game scene. */
export class PauseScene extends Phaser.Scene {
  constructor() { super('pause'); }

  create() {
    const u = U(), w = this.scale.width, h = this.scale.height;
    audio.pause();
    const g = this.add.graphics();
    g.fillStyle(0x0f0d0c, 0.78).fillRect(0, 0, w, h);
    const pw = Math.min(w * 0.7, 300 * u), ph = 190 * u, px = (w - pw) / 2, py = (h - ph) / 2;
    g.fillStyle(COLORS.board, 0.98).fillRoundedRect(px, py, pw, ph, 10 * u);
    g.lineStyle(2 * u, COLORS.pink, 1).strokeRoundedRect(px, py, pw, ph, 10 * u);
    this.add.text(w / 2, py + 22 * u, 'PAUSE', PX(u, 14, '#FF4FA3')).setOrigin(0.5);
    this.add.text(w / 2, py + 40 * u, 'Kaffee holen? ♥', HAND(u, 11, '#A79C90')).setOrigin(0.5);

    const bw = 130 * u, bh = 24 * u;
    let y = py + 64 * u;
    button(this, w / 2, y, bw, bh, 'WEITER', () => this.resume(), { primary: true, u, size: 8 });
    y += bh + 8 * u;
    button(this, w / 2, y, bw, bh, 'NEUSTART', () => this.restart(), { u, size: 8 });
    y += bh + 8 * u;
    button(this, w / 2, y, bw, bh, 'OPTIONEN', () => this.scene.launch('settings', { from: 'pause' }), { u, size: 8 });
    y += bh + 8 * u;
    button(this, w / 2, y, bw, bh, 'WEGWEISER', () => this.quit(), { u, size: 8 });

    this.input.keyboard?.on('keydown-ESC', () => this.resume());
    this.input.keyboard?.on('keydown-P', () => this.resume());
  }

  resume() {
    this.scene.stop('settings');
    this.scene.resume('game');
    this.scene.stop();
  }

  restart() {
    const game = this.scene.get('game') as Phaser.Scene & { levelKey: string };
    this.scene.stop('settings');
    this.scene.stop();
    game.scene.restart({ level: game.levelKey });
  }

  quit() {
    this.scene.stop('settings');
    this.scene.stop('hud');
    this.scene.stop('game');
    this.scene.stop();
    this.scene.start('levels');
  }
}
