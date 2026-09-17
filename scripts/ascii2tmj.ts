/**
 * ASCII level sketches (levels/src/*.txt) -> Tiled JSON maps (public/levels/*.tmj).
 * Legend:  # ground   = platform (1 tile thick)   ? block   S spawn   F flag   k checkpoint
 *          c card     C royal card   m meistersager   P pipe (bottom cell)   ! coffee block
 *          b bush     t palm         s sign                        // comment lines are ignored
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'levels/src';
const OUT = 'src/assets/levels';
const TS = 32;

// tile ids (0-based) in tiles.png, see tools/sprites/tileset.py
const GID = (top: boolean, bottom: boolean, left: boolean, right: boolean): number => {
  const row = top && bottom ? 3 : top ? 0 : bottom ? 2 : 1;
  const col = left && right ? 3 : left ? 0 : right ? 2 : 1;
  return row * 4 + col + 1; // +1: Tiled gids are 1-based
};

fs.mkdirSync(OUT, { recursive: true });
const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.txt'));
for (const f of files) {
  const raw = fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r/g, '').split('\n');
  const rows = raw.filter((l) => l.length > 0 && !l.startsWith('//'));
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const grid = rows.map((r) => r.padEnd(w, '.'));
  const at = (x: number, y: number) => (x < 0 || x >= w || y < 0 || y >= h ? '.' : grid[y][x]);
  const solid = (x: number, y: number) => at(x, y) === '#' || at(x, y) === '=' || at(x, y) === 'B';
  // block contents by symbol: ? card, ! kaffee, forms H/G/K/Y/D/R, specials 1/2/3
  const BLOCKS: Record<string, string> = { '?': 'card', '!': 'kaffee', H: 'sport', G: 'boxer', K: 'skater', Y: 'sprayer', D: 'dj', R: 'rocker', '1': 'kaffeepower', '2': 'buecher', '3': 'cambio' };

  const ground: number[] = new Array(w * h).fill(0);
  const back: number[] = new Array(w * h).fill(0);
  const objects: any[] = [];
  let oid = 1;
  const obj = (type: string, x: number, y: number, extra: any = {}) => {
    objects.push({ id: oid++, name: type, type, class: type, x, y, width: 0, height: 0, point: true, rotation: 0, visible: true, ...extra });
  };
  const center = (cx: number, cy: number) => [cx * TS + TS / 2, cy * TS + TS / 2] as const;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = at(x, y);
      if (ch === 'B') { ground[y * w + x] = 19; continue; }   // brick (gid 19): breakable by Sport/Rocker
      if (solid(x, y)) {
        const top = !solid(x, y - 1), bottom = !solid(x, y + 1), left = !solid(x - 1, y), right = !solid(x + 1, y);
        ground[y * w + x] = GID(top, bottom, left, right);
        continue;
      }
      if (BLOCKS[ch]) { obj('block', x * TS, y * TS, { width: TS, height: TS, point: false, properties: [{ name: 'contents', type: 'string', value: BLOCKS[ch] }] }); continue; }
      const [cx, cy] = center(x, y);
      switch (ch) {
        case 'S': obj('spawn', cx, cy); break;
        case 'F': obj('flag', cx, (y + 1) * TS); break;
        case 'k': obj('checkpoint', cx, (y + 1) * TS); break;
        case 'c': obj('card', cx, cy); break;
        case 'C': obj('royal', cx, cy); break;
        case 'm': obj('mob', cx, (y + 1) * TS); break;
        case 'P': obj('pipe', x * TS, (y + 1) * TS, { width: TS, height: TS * 2, point: false }); break;
        case 's': obj('sign', cx, (y + 1) * TS); break;
        case 'b': obj('bush', cx, (y + 1) * TS); break;
        case 't': obj('palm', cx, (y + 1) * TS); break;
      }
    }
  }

  const map = {
    type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down',
    width: w, height: h, tilewidth: TS, tileheight: TS, infinite: false, nextlayerid: 4, nextobjectid: oid,
    tilesets: [{ firstgid: 1, name: 'tiles', image: '../tiles.png', imagewidth: 8 * TS, imageheight: 3 * TS,
                 tilewidth: TS, tileheight: TS, tilecount: 24, columns: 8, margin: 0, spacing: 0 }],
    layers: [
      { id: 1, name: 'back', type: 'tilelayer', width: w, height: h, data: back, opacity: 1, visible: true, x: 0, y: 0 },
      { id: 2, name: 'ground', type: 'tilelayer', width: w, height: h, data: ground, opacity: 1, visible: true, x: 0, y: 0 },
      { id: 3, name: 'objects', type: 'objectgroup', objects, opacity: 1, visible: true, x: 0, y: 0, draworder: 'topdown' },
    ],
  };
  const out = path.join(OUT, f.replace(/\.txt$/, '.tmj'));
  fs.writeFileSync(out, JSON.stringify(map));
  console.log(`${f} -> ${out}  (${w}x${h} tiles, ${objects.length} objects)`);
}
