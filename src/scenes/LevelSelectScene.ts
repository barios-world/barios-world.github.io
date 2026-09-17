import Phaser from 'phaser';
import { U, PX, HAND, board, button, COLORS } from '../ui/ui';
import { LEVELS } from '../data/levels';
import { save } from '../systems/Save';

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;

export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('levels'); }

  create() {
    const u = U(), w = this.scale.width, h = this.scale.height;
    board(this);
    this.add.text(w / 2, 18 * u, 'WEGWEISER', PX(u, 14, '#FF4FA3')).setOrigin(0.5, 0).setShadow(2 * u, 2 * u, '#14100E', 0, true, true);
    this.add.text(w / 2, 40 * u, 'Rides · Coffee · Cambio · Books · Good Vibes', HAND(u, 11, '#A79C90')).setOrigin(0.5, 0);

    const debug = location.search.includes('debug');
    const rows = LEVELS.filter((l) => l.world > 0 || debug);
    const rowH = 34 * u, rw = Math.min(w * 0.8, 380 * u);
    let y = 74 * u;
    for (const l of rows) {
      const p = save.progress(l.key);
      const unlocked = debug || save.isUnlocked(l.key, LEVELS[0].key);
      const g = this.add.graphics();
      g.fillStyle(COLORS.board2, 1).fillRoundedRect(w / 2 - rw / 2, y, rw, rowH - 6 * u, 5 * u);
      g.lineStyle(2 * u, p.cleared ? COLORS.pink : 0x4a403a, 1).strokeRoundedRect(w / 2 - rw / 2, y, rw, rowH - 6 * u, 5 * u);
      const name = unlocked ? l.name : '? ? ?';
      this.add.text(w / 2 - rw / 2 + 12 * u, y + (rowH - 6 * u) / 2, name, PX(u, 8, unlocked ? '#FFF4DC' : '#6E635B')).setOrigin(0, 0.5);
      if (p.cleared) {
        const stats = `${fmt(p.bestSecs ?? 0)}   ${p.bestCards}/${p.totalCards}`;
        this.add.text(w / 2 + rw / 2 - 12 * u, y + (rowH - 6 * u) / 2, stats, PX(u, 7, '#FF4FA3')).setOrigin(1, 0.5);
      } else if (unlocked) {
        this.add.text(w / 2 + rw / 2 - 12 * u, y + (rowH - 6 * u) / 2, 'NEU', PX(u, 7, '#6FD8B0')).setOrigin(1, 0.5);
      }
      if (unlocked) {
        const z = this.add.zone(w / 2, y + (rowH - 6 * u) / 2, rw, rowH - 6 * u).setOrigin(0.5).setInteractive();
        z.on('pointerup', () => this.startLevel(l.key));
      }
      y += rowH;
    }
    button(this, w / 2, Math.min(h - 26 * u, y + 16 * u), 120 * u, 26 * u, 'ZURUECK', () => this.scene.start('title'), { u });
  }

  startLevel(key: string) {
    this.registry.set('lives', 3);
    this.registry.set('hearts', save.settings.assist ? 5 : 3);
    this.registry.set('form', 'base');
    this.scene.start('game', { level: key });
    this.scene.launch('hud');
  }
}
