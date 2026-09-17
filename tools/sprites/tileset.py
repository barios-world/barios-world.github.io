"""32px tileset -> public/tiles.png. Index layout (0-based, 8 columns):
 0-3  grass top:    left-edge | middle | right-edge | single column
 4-7  dirt middle:  left-edge | middle | right-edge | single column
 8-11 dirt bottom:  left-edge | middle | right-edge | single column
12-15 platform (grass top + exposed bottom): left | middle | right | single block
16 ?-block  17 used block  18 brick  19 stone  20 dark stone  21 red carpet  22 crate  23 empty
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from px import *
import env, items

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
T = 32


def terrain(top, bottom, left, right):
    g = G(T, T)
    env.dirt_fill(g, 0, 0, T - 1, T - 1)
    if top:
        g.rect(0, 0, T - 1, 6, 'A'); g.hline(0, T - 1, 1, 'F'); g.hline(0, T - 1, 2, 'F'); g.hline(0, T - 1, 6, 'a')
        for x in range(2, T, 7):
            g.set(x, 4, 'a'); g.set(min(T - 1, x + 3), 3, 'F')
        g.hline(0, T - 1, 7, '8')
        g.hline(0, T - 1, 0, 'K')
    if bottom:
        g.hline(0, T - 1, T - 1, 'K'); g.hline(0, T - 1, T - 2, '8')
    if left:
        g.vline(0, 0, T - 1, 'K')
    if right:
        g.vline(T - 1, 0, T - 1, 'K')
    return g


tiles = []
for top, bottom in ((True, False), (False, False), (False, True), (True, True)):
    for left, right in ((True, False), (False, False), (False, True), (True, True)):
        tiles.append(terrain(top, bottom, left, right))

tiles.append(items.block(32))                                                   # 16
used = G(T, T); used.rect(0, 0, 31, 31, '8'); used.rect(2, 2, 29, 29, '7')
for (x, y) in ((3, 3), (27, 3), (3, 27), (27, 27)):
    used.rect(x, y, x + 1, y + 1, '@')
used.outline('K'); tiles.append(used)                                           # 17
brick = G(T, T); brick.rect(0, 0, 31, 31, '7')
for row in range(0, 32, 8):
    brick.hline(0, 31, row, '8')
    off = 8 if (row // 8) % 2 else 0
    for x in range(off, 32, 16):
        brick.vline(x, row, row + 7, '8')
    brick.hline(0, 31, row + 1, '9')
brick.outline('K'); tiles.append(brick)                                         # 18
tiles.append(env.stone_floor(T, T))                                             # 19
dark = G(T, T); dark.rect(0, 0, 31, 31, '@')
for row in range(0, 32, 8):
    dark.hline(0, 31, row, '#')
    for x in range((row // 8 % 2) * 8, 32, 16):
        dark.vline(x, row, row + 7, '#')
tiles.append(dark)                                                              # 20
carpet = G(T, T); carpet.rect(0, 0, 31, 31, 'R'); carpet.hline(0, 31, 0, 'V'); carpet.hline(0, 31, 31, 'r'); carpet.vline(0, 0, 31, 'r'); carpet.vline(31, 0, 31, 'r')
tiles.append(carpet)                                                            # 21
cr = G(T, T); cr.rect(0, 0, 31, 31, 'w'); cr.rect(2, 2, 29, 29, '9'); cr.rect(4, 4, 27, 27, 'w')
cr.line(4, 4, 27, 27, '9'); cr.line(4, 27, 27, 4, '9'); cr.outline('K'); tiles.append(cr)   # 22
while len(tiles) < 24:
    tiles.append(G(T, T))

COLS = 8
rows = (len(tiles) + COLS - 1) // COLS

# world palettes: char remaps applied to the 16 terrain tiles (blocks/bricks stay the same)
VARIANTS = {
    'w1': ({}, None),
    'w2': ({'A': 'I', 'F': 'Y', 'a': 'i', '7': 'J', '8': '#', '9': 'j'}, None),                       # latte: foam over coffee
    'w3': ({'A': 'a', 'F': 'A', 'a': '#', '7': '@', '8': '#', '9': '$'}, lambda g: g.hline(0, T - 1, 7, 'G') if g.get(3, 3) in ('a', 'A') else None),  # felt + gold trim over dark wood
    'w4': ({'7': '9', '8': '7', '9': 'w', 'F': 'O'}, None),                                             # pitch: white line, light soil
    'w5': ({'A': 'R', 'F': 'V', 'a': 'r', '7': '@', '8': '#', '9': '$'}, lambda g: g.hline(0, T - 1, 7, 'G') if g.get(3, 3) in ('R', 'V') else None),  # throne room: red carpet, gold trim, dark stone
}
for name, (remap, post) in VARIANTS.items():
    sheet = Image.new('RGBA', (COLS * T, rows * T), (0, 0, 0, 0))
    for i, g in enumerate(tiles):
        h = g.copy()
        if i < 16:
            for y in range(T):
                for x in range(T):
                    c = h.d[y][x]
                    if c in remap:
                        h.d[y][x] = remap[c]
            if post:
                post(h)
        sheet.alpha_composite(to_image(h, 1), ((i % COLS) * T, (i // COLS) * T))
    sheet.save(os.path.join(ROOT, 'src', 'assets', f'tiles_{name}.png'), optimize=True)
    print(f'tileset {name}: {len(tiles)} tiles, {sheet.size[0]}x{sheet.size[1]}')
# keep tiles.png = w1 for tools that expect it
import shutil
shutil.copy(os.path.join(ROOT, 'src', 'assets', 'tiles_w1.png'), os.path.join(ROOT, 'src', 'assets', 'tiles.png'))
