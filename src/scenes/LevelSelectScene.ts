import Phaser from 'phaser';
import { U, PX, HAND, board, button, COLORS } from '../ui/ui';
import { LEVELS } from '../data/levels';
import { save } from '../systems/Save';
import { audio } from '../systems/Audio';

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const COLORS_BY_WORLD: Record<number, number> = { 1: 0xff4fa3, 2: 0xc98a4b, 3: 0x9b5de5, 5: 0xffc24b };

/** Wegweiser: the four stations of Season 1 as cards, plus the closed door to Season 2. */
export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('levels'); }

  create() {
    const u = U(), w = this.scale.width, h = this.scale.height;
    board(this);
    this.add.text(w / 2, 12 * u, 'WEGWEISER', PX(u, 13, '#FF4FA3')).setOrigin(0.5, 0).setShadow(2 * u, 2 * u, '#14100E', 0, true, true);
    this.add.text(w / 2, 32 * u, 'Season 1 · Jump. Kaffee. Cambio. Repeat.', HAND(u, 11, '#A79C90')).setOrigin(0.5, 0);
    const debug = location.search.includes('debug');
    const stations = LEVELS.filter((l) => l.world > 0);
    const n = stations.length + 1;
    const gap = 8 * u, rw = Math.min(w * 0.94, 600 * u), cw = Math.min((rw - (n - 1) * gap) / n, 128 * u);
    const totalW = n * cw + (n - 1) * gap, top = 62 * u, ch = Math.min(h - top - 40 * u, 170 * u);
    stations.forEach((l, i) => {
      const x = w / 2 - totalW / 2 + i * (cw + gap);
      const p = save.progress(l.key);
      const unlocked = debug || save.isUnlocked(l.key, LEVELS[0].key);
      const col = COLORS_BY_WORLD[l.world] ?? COLORS.pink;
      const g = this.add.graphics();
      g.fillStyle(COLORS.board2, 1).fillRoundedRect(x, top, cw, ch, 6 * u);
      g.lineStyle(2 * u, p.cleared ? col : unlocked ? 0x6e635b : 0x2e2724, 1).strokeRoundedRect(x, top, cw, ch, 6 * u);
      if (!unlocked) {
        this.add.text(x + cw / 2, top + ch / 2 - 8 * u, '?', PX(u, 18, '#6E635B')).setOrigin(0.5);
        this.add.text(x + cw / 2, top + ch / 2 + 16 * u, 'noch zu', HAND(u, 10, '#6E635B')).setOrigin(0.5);
        return;
      }
      const [num, ...rest] = l.name.split('  ');
      this.add.text(x + cw / 2, top + 10 * u, num.length > 2 ? 'BOSS' : num, PX(u, 12, `#${col.toString(16).padStart(6, '0')}`)).setOrigin(0.5, 0);
      this.add.text(x + cw / 2, top + 30 * u, rest.join(' '), { ...PX(u, 6, '#FFF4DC'), align: 'center', wordWrap: { width: cw - 10 * u } }).setOrigin(0.5, 0);
      this.add.text(x + cw / 2, top + 52 * u, l.motto ?? '', { ...HAND(u, 9, '#A79C90'), align: 'center', wordWrap: { width: cw - 12 * u } }).setOrigin(0.5, 0);
      const info: [string, string][] = p.cleared
        ? [[fmt(p.bestSecs ?? 0), '#FF4FA3'], [`KARTEN ${p.bestCards}/${p.totalCards}`, '#FF4FA3'], [p.royals ? `ROYALS ${p.royals}/4` : '', '#FFC24B']]
        : [['NEU', '#6FD8B0']];
      info.forEach(([s, c], k) => { if (s) this.add.text(x + cw / 2, top + ch - 14 * u - (info.length - k) * 11 * u, s, PX(u, 5, c)).setOrigin(0.5, 0); });
      const z = this.add.zone(x + cw / 2, top + ch / 2, cw, ch).setOrigin(0.5).setInteractive();
      z.on('pointerup', () => this.startLevel(l.key, false));
      if (l.world === 5 && save.data.bossCleared) {
        button(this, x + cw / 2, top + ch + 16 * u, cw - 6 * u, 20 * u, save.data.bossRushBest === null ? 'BOSS RUSH' : `RUSH ${save.data.bossRushBest.toFixed(1)}s`, () => this.startLevel(l.key, true), { u, size: 5 });
      }
    });
    // Season 2: the closed door
    const x2 = w / 2 - totalW / 2 + stations.length * (cw + gap);
    const g2 = this.add.graphics();
    g2.fillStyle(0x14100e, 1).fillRoundedRect(x2, top, cw, ch, 6 * u);
    g2.lineStyle(2 * u, 0x2e2724, 1).strokeRoundedRect(x2, top, cw, ch, 6 * u);
    this.add.text(x2 + cw / 2, top + 14 * u, 'SEASON 2', PX(u, 7, '#6E635B')).setOrigin(0.5, 0);
    this.add.text(x2 + cw / 2, top + ch / 2, 'VFB Area\nBarios Books\nMount Barios', { ...HAND(u, 10, '#6E635B'), align: 'center' }).setOrigin(0.5);
    this.add.text(x2 + cw / 2, top + ch - 22 * u, 'bald ♥', HAND(u, 11, '#6E635B')).setOrigin(0.5, 0);
    button(this, w / 2, h - 18 * u, 110 * u, 22 * u, 'ZURUECK', () => this.scene.start('title'), { u, size: 8 });
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('title'));
  }

  startLevel(key: string, rush: boolean) {
    audio.click();
    this.registry.set('lives', 3);
    this.registry.set('hearts', save.settings.assist ? 5 : 3);
    this.registry.set('form', 'base');
    this.scene.start('game', { level: key, rush });
    this.scene.launch('hud');
  }
}
