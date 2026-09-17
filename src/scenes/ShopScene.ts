import Phaser from 'phaser';
import { U, PX, HAND, board, button, COLORS } from '../ui/ui';
import { save } from '../systems/Save';
import { audio } from '../systems/Audio';
import { UPGRADES } from '../data/upgrades';

/** Barios Shop: spend Cambio cards on the five Level-Ups. */
export class ShopScene extends Phaser.Scene {
  private wallet!: Phaser.GameObjects.Text;
  private rows: { pips: Phaser.GameObjects.Graphics; price: ReturnType<typeof button>; key: string }[] = [];

  constructor() { super('shop'); }

  create() {
    const u = U(), w = this.scale.width, h = this.scale.height;
    board(this);
    this.rows = [];
    this.add.text(w / 2, 16 * u, 'BARIOS SHOP', PX(u, 14, '#FF4FA3')).setOrigin(0.5, 0).setShadow(2 * u, 2 * u, '#14100E', 0, true, true);
    this.add.text(w / 2, 36 * u, 'Level up in real life too ♥', HAND(u, 11, '#A79C90')).setOrigin(0.5, 0);
    this.add.image(w - 24 * u, 18 * u, 'spr', 'it_karte_0').setOrigin(1, 0).setScale(u);
    this.wallet = this.add.text(w - 50 * u, 24 * u, '', PX(u, 9)).setOrigin(1, 0);

    const rw = Math.min(w * 0.86, 420 * u), rowH = 36 * u;
    let y = 60 * u;
    for (const def of UPGRADES) {
      const g = this.add.graphics();
      g.fillStyle(COLORS.board2, 1).fillRoundedRect(w / 2 - rw / 2, y, rw, rowH - 6 * u, 5 * u);
      this.add.text(w / 2 - rw / 2 + 12 * u, y + 8 * u, def.name, PX(u, 8, '#FFF4DC')).setOrigin(0, 0);
      this.add.text(w / 2 - rw / 2 + 12 * u, y + 20 * u, def.desc, HAND(u, 9, '#A79C90')).setOrigin(0, 0);
      const pips = this.add.graphics();
      const price = button(this, w / 2 + rw / 2 - 48 * u, y + (rowH - 6 * u) / 2, 84 * u, 22 * u, '', () => this.buy(def.key), { primary: true, u, size: 7 });
      this.rows.push({ pips, price, key: def.key });
      y += rowH;
    }
    button(this, w / 2, Math.min(h - 22 * u, y + 12 * u), 120 * u, 24 * u, 'ZURUECK', () => this.scene.start('title'), { u });
    this.refresh();
  }

  private refresh() {
    const u = U(), w = this.scale.width, rw = Math.min(w * 0.86, 420 * u), rowH = 36 * u;
    this.wallet.setText(`${save.data.totalCards}`);
    let y = 60 * u;
    for (const def of UPGRADES) {
      const row = this.rows.find((r) => r.key === def.key)!;
      const lvl = save.upgrade(def.key);
      row.pips.clear();
      for (let i = 0; i < def.max; i++) {
        row.pips.fillStyle(i < lvl ? COLORS.pink : 0x4a403a, 1).fillCircle(w / 2 + rw / 2 - 108 * u - i * 12 * u, y + (rowH - 6 * u) / 2, 4 * u);
      }
      if (lvl >= def.max) { row.price.setLabel('MAX'); row.price.zone.disableInteractive(); }
      else {
        const p = def.prices[lvl];
        row.price.setLabel(`${p} KARTEN`);
        if (save.data.totalCards < p) row.price.zone.disableInteractive(); else row.price.zone.setInteractive({ useHandCursor: true });
      }
      y += rowH;
    }
  }

  private buy(key: string) {
    const def = UPGRADES.find((d) => d.key === key)!;
    const lvl = save.upgrade(def.key);
    if (lvl >= def.max || save.data.totalCards < def.prices[lvl]) { audio.bump(); return; }
    save.buy(def.key, def.prices[lvl]);
    audio.powerup();
    this.refresh();
  }
}
