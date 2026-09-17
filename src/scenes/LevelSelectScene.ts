import Phaser from 'phaser';
import { U, PX, HAND, board, button, COLORS } from '../ui/ui';
import { LEVELS, WORLD_NAMES } from '../data/levels';
import { save } from '../systems/Save';
import { audio } from '../systems/Audio';

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const TABS: { world: number; label: string; color: number }[] = [
  { world: 1, label: 'BOULEVARD', color: 0xff4fa3 },
  { world: 2, label: 'COFFEE', color: 0xc98a4b },
  { world: 3, label: 'CAMBIO', color: 0x9b5de5 },
  { world: 4, label: 'VFB', color: 0xe8434f },
  { world: 5, label: 'THRON', color: 0xffc24b },
];
type Card = { key: string; title: string; unlocked: boolean; rush?: boolean };

/** Wegweiser: one tab per world, the world's level cards below. Fits a phone in landscape without scrolling. */
export class LevelSelectScene extends Phaser.Scene {
  private world = 1;
  private objs: Phaser.GameObjects.GameObject[] = [];
  private tabObjs: Phaser.GameObjects.GameObject[] = [];
  constructor() { super('levels'); }

  create() {
    const u = U(), w = this.scale.width, h = this.scale.height;
    this.objs = []; this.tabObjs = [];
    board(this);
    this.add.text(w / 2, 12 * u, 'WEGWEISER', PX(u, 13, '#FF4FA3')).setOrigin(0.5, 0).setShadow(2 * u, 2 * u, '#14100E', 0, true, true);
    this.add.text(w / 2, 32 * u, 'Rides · Coffee · Cambio · Books · Good Vibes', HAND(u, 10, '#A79C90')).setOrigin(0.5, 0);
    const remembered = this.registry.get('wegWorld') as number | undefined;
    const firstOpen = LEVELS.find((l) => l.world > 0 && !save.progress(l.key).cleared && this.unlocked(l.key));
    this.world = remembered ?? firstOpen?.world ?? 1;
    this.drawTabs();
    this.drawCards();
    button(this, w / 2, h - 18 * u, 110 * u, 22 * u, 'ZURUECK', () => this.scene.start('title'), { u, size: 8 });
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('title'));
  }

  private unlocked(key: string) { return location.search.includes('debug') || save.isUnlocked(key, LEVELS[0].key); }
  private levelsOf(world: number) { return LEVELS.filter((l) => l.world === world); }

  private drawTabs() {
    this.tabObjs.forEach((o) => o.destroy()); this.tabObjs = [];
    const u = U(), w = this.scale.width;
    const rw = Math.min(w * 0.92, 560 * u), tabW = rw / TABS.length, y = 56 * u, th = 26 * u;
    TABS.forEach((t, i) => {
      const x = w / 2 - rw / 2 + tabW * i + tabW / 2;
      const lv = this.levelsOf(t.world);
      const open = lv.some((l) => this.unlocked(l.key));
      const done = lv.filter((l) => save.progress(l.key).cleared).length;
      const sel = t.world === this.world;
      const g = this.add.graphics();
      const bx = x - tabW / 2 + 2 * u, bw = tabW - 4 * u;
      if (sel) g.fillStyle(t.color, 1).fillRoundedRect(bx, y, bw, th, 5 * u);
      else {
        g.fillStyle(COLORS.board2, 1).fillRoundedRect(bx, y, bw, th, 5 * u);
        g.lineStyle(2 * u, open ? t.color : 0x4a403a, 1).strokeRoundedRect(bx, y, bw, th, 5 * u);
      }
      const lbl = this.add.text(x, y + 7 * u, open ? t.label : '? ? ?', PX(u, 6, sel ? '#2B0715' : open ? '#FFF4DC' : '#6E635B')).setOrigin(0.5, 0);
      const sub = this.add.text(x, y + 17 * u, open ? `${done}/${lv.length}` : '', PX(u, 4, sel ? '#2B0715' : '#A79C90')).setOrigin(0.5, 0);
      const z = this.add.zone(x, y + th / 2, tabW, th).setOrigin(0.5).setInteractive();
      if (open) z.on('pointerup', () => {
        if (this.world === t.world) return;
        audio.click();
        this.world = t.world;
        this.registry.set('wegWorld', t.world);
        this.drawTabs();
        this.drawCards();
      });
      this.tabObjs.push(g, lbl, sub, z);
    });
  }

  private drawCards() {
    this.objs.forEach((o) => o.destroy()); this.objs = [];
    const u = U(), w = this.scale.width, h = this.scale.height;
    const lv = this.levelsOf(this.world);
    const rw = Math.min(w * 0.92, 560 * u);
    const top = 104 * u, bottom = h - 34 * u, ch = Math.max(90 * u, Math.min(bottom - top, 140 * u));
    const cards: Card[] = lv.map((l) => ({ key: l.key, title: l.name, unlocked: this.unlocked(l.key) }));
    if (this.world === 5 && save.data.bossCleared) cards.push({ key: 'lvl_boss', title: 'BOSS RUSH  DER GUERTEL', unlocked: true, rush: true });
    const n = cards.length, gap = 8 * u, cw = Math.min((rw - (n - 1) * gap) / n, 170 * u);
    const totalW = n * cw + (n - 1) * gap;
    this.objs.push(this.add.text(w / 2, top - 6 * u, WORLD_NAMES[this.world] ?? '', HAND(u, 11, '#A79C90')).setOrigin(0.5, 1));
    cards.forEach((c, i) => {
      const x = w / 2 - totalW / 2 + i * (cw + gap), y = top;
      const p = save.progress(c.key);
      const g = this.add.graphics();
      g.fillStyle(COLORS.board2, 1).fillRoundedRect(x, y, cw, ch, 6 * u);
      g.lineStyle(2 * u, c.rush ? 0xffc24b : p.cleared ? COLORS.pink : c.unlocked ? 0x4a403a : 0x2e2724, 1).strokeRoundedRect(x, y, cw, ch, 6 * u);
      this.objs.push(g);
      if (!c.unlocked) { this.objs.push(this.add.text(x + cw / 2, y + ch / 2, '?', PX(u, 18, '#6E635B')).setOrigin(0.5)); return; }
      const [num, ...rest] = c.title.split('  ');
      const big = num.length > 4 ? 8 : 12;
      this.objs.push(this.add.text(x + cw / 2, y + 10 * u, num, PX(u, big, c.rush ? '#FFC24B' : '#FF4FA3')).setOrigin(0.5, 0));
      this.objs.push(this.add.text(x + cw / 2, y + 30 * u, rest.join(' '), { ...PX(u, 5, '#FFF4DC'), align: 'center', wordWrap: { width: cw - 10 * u } }).setOrigin(0.5, 0));
      let info: [string, string][];
      if (c.rush) info = [[save.data.bossRushBest === null ? 'BEST  --' : `BEST  ${save.data.bossRushBest.toFixed(1)}s`, '#FFC24B'], ['DIE ZEIT LAEUFT', '#A79C90']];
      else if (p.cleared) info = [[fmt(p.bestSecs ?? 0), '#FF4FA3'], [`KARTEN ${p.bestCards}/${p.totalCards}`, '#FF4FA3'], [p.royals ? `ROYALS ${p.royals}/4` : '', '#FFC24B']];
      else info = [['NEU', '#6FD8B0']];
      info.forEach(([s, col], k) => { if (s) this.objs.push(this.add.text(x + cw / 2, y + ch - 12 * u - (info.length - k) * 11 * u, s, PX(u, 5, col)).setOrigin(0.5, 0)); });
      const z = this.add.zone(x + cw / 2, y + ch / 2, cw, ch).setOrigin(0.5).setInteractive();
      z.on('pointerup', () => this.startLevel(c.key, !!c.rush));
      this.objs.push(z);
    });
  }

  startLevel(key: string, rush = false) {
    audio.click();
    this.registry.set('lives', 3);
    this.registry.set('hearts', save.settings.assist ? 5 : 3);
    this.registry.set('form', 'base');
    this.scene.start('game', { level: key, rush });
    this.scene.launch('hud');
  }
}
