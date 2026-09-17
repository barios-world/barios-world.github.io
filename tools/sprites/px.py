"""Tiny pixel-art studio: char grids, shape primitives, PNG review renders, JSON export."""
import json, os
from PIL import Image, ImageDraw

PAL = {
    '.': None,
    'K': '#1B1410', 'k': '#3A2A22',
    # cap pink
    'P': '#EF7FAF', 'p': '#C9578A', 'Q': '#F7B0CC',
    'W': '#FFFFFF', 'B': '#E23E78',
    # skin
    'S': '#E9B58C', 's': '#C98B62', 'Z': '#F5CBA6',
    # dark hair / mustache
    'H': '#2B1D14', 'h': '#4A3426',
    # eyes
    'E': '#FFFFFF', 'e': '#1A1A1A',
    # striped shirt (light blue)
    'T': '#A9CFEA', 't': '#7FAED4', 'u': '#6F94B8', 'U': '#D3E8F7',
    # jeans
    'N': '#3E5C8F', 'n': '#2C4368', 'M': '#5978A8',
    # white shoes / white cloth
    'O': '#F2F2F2', 'o': '#C4C4C4', 'X': '#3A3A3A',
    # gold
    'G': '#F2C14E', 'g': '#C2912A', 'L': '#FFE08A',
    # red
    'R': '#D62839', 'r': '#A31C2A', 'V': '#F26B7A',
    # brown curly hair
    'C': '#8B5A2B', 'c': '#6B4220', 'D': '#A8713A',
    # green
    'A': '#5DAE4B', 'a': '#3F8236', 'F': '#8ED27C',
    # coffee / wood
    'J': '#5A3418', 'j': '#7A4A24', 'w': '#A66A33',
    # cream suit
    'I': '#F0E6D2', 'i': '#D2C4A8', 'Y': '#FAF3E6',
    # blue
    '1': '#3A7BD5', '2': '#2A5A9F', '3': '#7FB0EE',
    # purple
    '4': '#9B6BD6', '5': '#6F46A8', '6': '#C4A6EE',
    # dirt
    '7': '#8A5B34', '8': '#6C4426', '9': '#A9743F',
    # silver
    '0': '#C9CED6', '-': '#8A929E', '=': '#E9ECF1',
    # blacks / greys
    '#': '#141110', '@': '#2E2A28', '$': '#4A4543',
    # pinks (aura / fx)
    '%': '#F4C6D8', '&': '#FF4FA3', '*': '#FFE7F2',
    # sky / misc
    '~': '#FFC2DC', '^': '#FFE0B8', '!': '#FF9F1C', '?': '#FFD166',
}


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


class G:
    def __init__(self, w, h, fill='.'):
        self.w, self.h = w, h
        self.d = [[fill] * w for _ in range(h)]

    # ---- basic access
    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.d[y][x] = c

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.d[y][x]
        return '.'

    def put(self, x, y, s):
        """Write a multi-line string block at x,y ('.' = skip, ' ' = skip)."""
        for j, row in enumerate(s.strip('\n').split('\n')):
            for i, ch in enumerate(row):
                if ch not in '. ':
                    self.set(x + i, y + j, ch)

    # ---- shapes (inclusive coordinates)
    def rect(self, x0, y0, x1, y1, c):
        for y in range(min(y0, y1), max(y0, y1) + 1):
            for x in range(min(x0, x1), max(x0, x1) + 1):
                self.set(x, y, c)

    def hline(self, x0, x1, y, c):
        self.rect(x0, y, x1, y, c)

    def vline(self, x, y0, y1, c):
        self.rect(x, y0, x, y1, c)

    def ellipse(self, cx, cy, rx, ry, c, n=2.0, only=None):
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                dx = abs(x - cx) / rx
                dy = abs(y - cy) / ry
                if dx ** n + dy ** n <= 1.0:
                    if only is None or only(x, y):
                        self.set(x, y, c)

    def line(self, x0, y0, x1, y1, c):
        dx, dy = abs(x1 - x0), abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy
        while True:
            self.set(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x0 += sx
            if e2 < dx:
                err += dx
                y0 += sy

    def fill_where(self, pred, c):
        for y in range(self.h):
            for x in range(self.w):
                if self.d[y][x] != '.' and pred(x, y, self.d[y][x]):
                    self.d[y][x] = c

    def replace(self, a, b):
        for y in range(self.h):
            for x in range(self.w):
                if self.d[y][x] == a:
                    self.d[y][x] = b

    # ---- composition
    def paste(self, other, ox, oy, flip=False):
        for y in range(other.h):
            for x in range(other.w):
                c = other.d[y][other.w - 1 - x] if flip else other.d[y][x]
                if c != '.':
                    self.set(ox + x, oy + y, c)

    def flipped(self):
        g = G(self.w, self.h)
        g.paste(self, 0, 0, flip=True)
        return g

    def shifted(self, dx, dy):
        g = G(self.w, self.h)
        g.paste(self, dx, dy)
        return g

    def copy(self):
        g = G(self.w, self.h)
        g.d = [row[:] for row in self.d]
        return g

    def outline(self, c='K', diag=False):
        """Recolor filled pixels that touch transparency."""
        nb = [(1, 0), (-1, 0), (0, 1), (0, -1)]
        if diag:
            nb += [(1, 1), (-1, -1), (1, -1), (-1, 1)]
        out = []
        for y in range(self.h):
            for x in range(self.w):
                if self.d[y][x] == '.':
                    continue
                for dx, dy in nb:
                    if self.get(x + dx, y + dy) == '.':
                        out.append((x, y))
                        break
        for x, y in out:
            self.d[y][x] = c

    def outline_grow(self, c='K'):
        """Add an outline OUTSIDE the silhouette (grows by 1px)."""
        add = []
        for y in range(self.h):
            for x in range(self.w):
                if self.d[y][x] != '.':
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    if self.get(x + dx, y + dy) not in ('.',):
                        add.append((x, y))
                        break
        for x, y in add:
            self.d[y][x] = c

    def rows(self):
        return [''.join(r) for r in self.d]

    def bbox(self):
        xs = [x for y in range(self.h) for x in range(self.w) if self.d[y][x] != '.']
        ys = [y for y in range(self.h) for x in range(self.w) if self.d[y][x] != '.']
        if not xs:
            return (0, 0, 0, 0)
        return (min(xs), min(ys), max(xs), max(ys))

    def cropped(self, pad=0):
        x0, y0, x1, y1 = self.bbox()
        g = G(x1 - x0 + 1 + 2 * pad, y1 - y0 + 1 + 2 * pad)
        g.paste(self, -x0 + pad, -y0 + pad)
        return g


def to_image(g, scale=1, bg=None):
    im = Image.new('RGBA', (g.w * scale, g.h * scale), (0, 0, 0, 0) if bg is None else hexrgb(bg) + (255,))
    px = im.load()
    for y in range(g.h):
        for x in range(g.w):
            c = PAL.get(g.d[y][x])
            if c is None:
                continue
            col = hexrgb(c) + (255,)
            for yy in range(scale):
                for xx in range(scale):
                    px[x * scale + xx, y * scale + yy] = col
    return im


def render_sheet(grids, path, scale=6, bg='#1A1615', gap=10, pad=12, labels=None, baseline=True):
    """Lay sprites out horizontally on a board for review."""
    ims = [to_image(g, scale) for g in grids]
    w = pad * 2 + sum(i.width for i in ims) + gap * (len(ims) - 1)
    h = pad * 2 + max(i.height for i in ims) + (18 if labels else 0)
    sheet = Image.new('RGBA', (w, h), hexrgb(bg) + (255,))
    x = pad
    bottom = pad + max(i.height for i in ims)
    dr = ImageDraw.Draw(sheet)
    for idx, im in enumerate(ims):
        sheet.alpha_composite(im, (x, bottom - im.height))
        if labels:
            dr.text((x, bottom + 4), labels[idx], fill=(200, 190, 180, 255))
        x += im.width + gap
    if baseline:
        dr.line((pad, bottom + 1, w - pad, bottom + 1), fill=(70, 60, 55, 255))
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    sheet.save(path)
    return path


def export_json(sprites, path):
    """sprites: {name: G or [G,...]} -> compact json with shared palette."""
    out = {'pal': {k: v for k, v in PAL.items() if v}, 'sprites': {}}
    for name, g in sprites.items():
        if isinstance(g, list):
            out['sprites'][name] = {'w': g[0].w, 'h': g[0].h, 'frames': [x.rows() for x in g]}
        else:
            out['sprites'][name] = {'w': g.w, 'h': g.h, 'frames': [g.rows()]}
    with open(path, 'w') as f:
        json.dump(out, f, separators=(',', ':'))
    return path
