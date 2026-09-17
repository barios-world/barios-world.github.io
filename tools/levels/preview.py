"""Render levels/src/*.txt to PNG previews (tools/levels/out/) for a quick layout review."""
import os, glob
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'levels', 'src')
OUT = os.path.join(os.path.dirname(__file__), 'out')
S = 7  # px per tile

COL = {
    '#': (140, 90, 50), '=': (99, 184, 78), 'B': (170, 110, 60),
    'S': (111, 216, 176), 'F': (255, 79, 163), 'k': (255, 240, 200),
    'c': (255, 215, 80), 'C': (255, 160, 20),
    '?': (240, 160, 60), '!': (120, 70, 30), 'H': (255, 79, 163), 'G': (58, 123, 213), 'K': (255, 194, 75), 'Y': (99, 184, 78), 'D': (155, 107, 214), 'R': (232, 67, 79),
    '1': (255, 224, 138), '2': (169, 216, 240), '3': (244, 198, 216),
    'm': (232, 67, 79), 'n': (207, 230, 255), 'q': (255, 150, 150), 'v': (255, 255, 255), 'z': (255, 220, 120), 'M': (200, 40, 40),
    'x': (90, 52, 24), '^': (200, 200, 220), 'o': (30, 30, 30), '-': (255, 255, 255), '~': (160, 160, 170), '|': (160, 160, 170),
    'P': (255, 127, 184), 'b': (60, 140, 60), 't': (60, 140, 60), 's': (200, 150, 90), 'T': (63, 130, 54), 'N': (255, 79, 163), 'L': (230, 230, 230), 'U': (120, 120, 120),
    'W': (166, 106, 51), 'w': (90, 52, 24), 'l': (90, 90, 90), 'a': (60, 140, 60), 'i': (255, 159, 28), 'j': (200, 40, 40), 'g': (200, 150, 90),
}

os.makedirs(OUT, exist_ok=True)
sheets = []
for path in sorted(glob.glob(os.path.join(SRC, '*.txt'))):
    rows = [l for l in open(path).read().split('\n') if l and not l.startswith('//')]
    h, w = len(rows), max(len(r) for r in rows)
    im = Image.new('RGB', (w * S, h * S + 12), (24, 20, 18))
    d = ImageDraw.Draw(im)
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch == '.':
                continue
            c = COL.get(ch, (255, 0, 255))
            if ch in '#=B':
                d.rectangle([x * S, y * S, x * S + S - 1, y * S + S - 1], fill=c)
            else:
                d.rectangle([x * S + 1, y * S + 1, x * S + S - 2, y * S + S - 2], fill=c)
                if ch in 'SFCkmnqvzM?!HGKYDR123x^o-~|P':
                    d.text((x * S, y * S - 2), ch, fill=(0, 0, 0))
    name = os.path.basename(path)[:-4]
    d.text((2, h * S + 1), name, fill=(200, 190, 180))
    im.save(os.path.join(OUT, name + '.png'))
    sheets.append(im)
# contact sheet
W = max(i.width for i in sheets); Hs = sum(i.height + 4 for i in sheets)
sheet = Image.new('RGB', (W, Hs), (10, 8, 8))
y = 0
for im in sheets:
    sheet.paste(im, (0, y)); y += im.height + 4
sheet.save(os.path.join(OUT, '_all.png'))
print(f'{len(sheets)} previews -> {OUT}')
