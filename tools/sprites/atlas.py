"""Pack all game sprites into public/atlas.png + public/atlas.json (Phaser JSON-hash format)."""
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))
from px import *
from assemble import assemble

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PUB = os.path.join(ROOT, 'public')
W, PAD = 1024, 2

SPR = assemble(include_scenes=False)
frames = []
for name, frs in SPR.items():
    for i, g in enumerate(frs):
        frames.append((f'{name}_{i}', g))
frames.sort(key=lambda t: (-t[1].h, -t[1].w, t[0]))

x = y = rowh = 0
placed = []
for name, g in frames:
    if x + g.w + PAD > W:
        x = 0; y += rowh + PAD; rowh = 0
    placed.append((name, g, x, y))
    x += g.w + PAD
    rowh = max(rowh, g.h)
H = y + rowh + PAD

im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
data = {}
for name, g, px_, py_ in placed:
    im.alpha_composite(to_image(g, 1), (px_, py_))
    data[name] = {'frame': {'x': px_, 'y': py_, 'w': g.w, 'h': g.h}, 'rotated': False, 'trimmed': False,
                  'spriteSourceSize': {'x': 0, 'y': 0, 'w': g.w, 'h': g.h}, 'sourceSize': {'w': g.w, 'h': g.h}}
im.save(os.path.join(PUB, 'atlas.png'), optimize=True)
json.dump({'frames': data, 'meta': {'app': 'barios-studio', 'version': '1.0', 'image': 'atlas.png', 'format': 'RGBA8888',
                                    'size': {'w': W, 'h': H}, 'scale': '1'}},
          open(os.path.join(PUB, 'atlas.json'), 'w'), separators=(',', ':'))
print(f'atlas: {len(placed)} frames, {W}x{H}px -> public/atlas.png')
