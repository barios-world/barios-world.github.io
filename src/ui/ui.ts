import Phaser from 'phaser';
import { audio } from '../systems/Audio';

export const U = () => Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
export const PX = (u: number, size: number, color = '#FFF4DC'): Phaser.Types.GameObjects.Text.TextStyle =>
  ({ fontFamily: '"Press Start 2P", monospace', fontSize: `${size * u}px`, color });
export const HAND = (u: number, size: number, color = '#FF4FA3'): Phaser.Types.GameObjects.Text.TextStyle =>
  ({ fontFamily: 'Caveat, cursive', fontSize: `${size * u}px`, color, fontStyle: 'bold' });

export const COLORS = { board: 0x171311, board2: 0x1e1917, line: 0x2e2724, pink: 0xff4fa3, cream: 0xfff4dc, dim: 0xa79c90 };

/** Chalkboard background covering the whole canvas. */
export function board(scene: Phaser.Scene, alpha = 1) {
  const g = scene.add.graphics().setDepth(-10);
  const w = scene.scale.width, h = scene.scale.height, u = U();
  g.fillStyle(COLORS.board, alpha).fillRect(0, 0, w, h);
  g.lineStyle(1, COLORS.line, alpha);
  for (let y = 40 * u; y < h; y += 44 * u) g.lineBetween(0, y, w, y);
  return g;
}

export interface Button { setLabel(s: string): void; destroy(): void; zone: Phaser.GameObjects.Zone; }

/** Tap button: pink filled (primary) or outlined. Fires on pointerup inside. */
export function button(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, onTap: () => void,
                       opts: { primary?: boolean; u?: number; size?: number; depth?: number } = {}): Button {
  const u = opts.u ?? U();
  const depth = opts.depth ?? 5;
  const g = scene.add.graphics().setDepth(depth);
  const draw = (pressed: boolean) => {
    g.clear();
    if (opts.primary) {
      g.fillStyle(COLORS.pink, pressed ? 0.75 : 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, 6 * u);
    } else {
      g.fillStyle(COLORS.board2, 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, 6 * u);
      g.lineStyle(2 * u, pressed ? COLORS.pink : 0x4a403a, 1).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6 * u);
    }
  };
  draw(false);
  const t = scene.add.text(x, y, label, PX(u, opts.size ?? 9, opts.primary ? '#2B0715' : '#FFF4DC')).setOrigin(0.5).setDepth(depth + 1);
  const zone = scene.add.zone(x, y, w, h).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(depth + 2);
  zone.on('pointerdown', () => draw(true));
  zone.on('pointerout', () => draw(false));
  zone.on('pointerup', () => { draw(false); audio.click(); onTap(); });
  return {
    zone,
    setLabel: (s: string) => t.setText(s),
    destroy: () => { g.destroy(); t.destroy(); zone.destroy(); },
  };
}

/** Toggle row: "LABEL        AN/AUS" */
export function toggle(scene: Phaser.Scene, x: number, y: number, w: number, label: string, value: boolean, onChange: (v: boolean) => void, u = U()) {
  let v = value;
  const h = 26 * u;
  const g = scene.add.graphics().setDepth(5);
  const draw = () => {
    g.clear();
    g.fillStyle(COLORS.board2, 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, 5 * u);
    g.fillStyle(v ? COLORS.pink : 0x4a403a, 1).fillRoundedRect(x + w / 2 - 44 * u, y - 8 * u, 34 * u, 16 * u, 8 * u);
    g.fillStyle(0xfff4dc, 1).fillCircle(x + w / 2 - 44 * u + (v ? 26 * u : 8 * u), y, 6 * u);
  };
  draw();
  scene.add.text(x - w / 2 + 12 * u, y, label, PX(u, 8)).setOrigin(0, 0.5).setDepth(6);
  const zone = scene.add.zone(x, y, w, h).setOrigin(0.5).setInteractive().setDepth(7);
  zone.on('pointerup', () => { v = !v; draw(); audio.click(); onChange(v); });
}

/** Big "BARIOS WORLD" logo in text form (pink bubble letters + colored WORLD). Returns bottom y. */
export function logo(scene: Phaser.Scene, cx: number, top: number, u: number, scale = 1) {
  const s1 = 26 * u * scale, s2 = 17 * u * scale;
  const a = scene.add.text(cx, top, 'BARIOS', PX(u, 26 * scale, '#FF4FA3')).setOrigin(0.5, 0).setShadow(3 * u, 3 * u, '#14100E', 0, true, true).setDepth(2);
  const cols = ['#3A7BD5', '#4CB34A', '#E8434F', '#FFC24B', '#63B84E'];
  const word = 'WORLD';
  const letterW = s2 * 1.05;
  const startX = cx - (word.length - 1) * letterW / 2;
  word.split('').forEach((ch, i) => {
    scene.add.text(startX + i * letterW, top + s1 + 6 * u, ch, PX(u, 17 * scale, cols[i])).setOrigin(0.5, 0).setShadow(2 * u, 2 * u, '#14100E', 0, true, true).setDepth(2);
  });
  return top + s1 + 6 * u + s2 + 4 * u + (a.height - s1);
}
