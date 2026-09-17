"""Tiles, decor props and composed environment scenes."""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from px import *
from font import draw_text, text_width
import items

PAL.update({';': '#3A1520', ',': '#2A0E17', '`': '#5A2430'})
T = 32


# ----------------------------------------------------------------- TILES
def dirt_fill(g, x0, y0, x1, y1):
    g.rect(x0, y0, x1, y1, '7')
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if (x * 7 + y * 13) % 17 == 0:
                g.rect(x, y, x + 1, y, '8')
            elif (x * 5 + y * 3) % 23 == 0:
                g.set(x, y, '9')


def platform(n, blades=True):
    """n tiles wide, 1 tile tall grass-top block with outline."""
    g = G(n * T, T)
    dirt_fill(g, 0, 3, n * T - 1, T - 1)
    g.rect(0, 3, n * T - 1, 9, 'A'); g.hline(0, n * T - 1, 3, 'F'); g.hline(0, n * T - 1, 4, 'F'); g.hline(0, n * T - 1, 9, 'a')
    for x in range(0, n * T, 7):
        g.set(x + 3, 6, 'a'); g.set(x + 5, 8, 'F')
    g.outline('K')
    if blades:
        for x in range(1, n * T - 1, 6):
            g.set(x, 2, 'A'); g.set(x, 1, 'A'); g.set(x + 1, 2, 'F')
            g.set(x + 3, 2, 'a')
    return g


def dirt_block(n, m=1):
    g = G(n * T, m * T)
    dirt_fill(g, 0, 0, n * T - 1, m * T - 1)
    g.outline('K')
    return g


def stone_floor(w, h=24):
    g = G(w, h)
    g.rect(0, 0, w - 1, h - 1, '$')
    for y in range(0, h, 6):
        g.hline(0, w - 1, y, '@')
        off = 8 if (y // 6) % 2 else 0
        for x in range(off, w, 16):
            g.vline(x, y, y + 5, '@')
    for y in range(1, h, 6):
        for x in range(2, w, 16):
            g.set(x + ((y // 6) % 2) * 8, y, '=')
    g.hline(0, w - 1, 0, 'K')
    return g


# ----------------------------------------------------------------- DECOR
def sign(lines, arrow=True):
    tw = max(text_width(l) for l in lines)
    bw = tw + 8
    bh = 6 * len(lines) + 5
    g = G(bw + 2, bh + 16)
    g.rect(bw // 2 - 2, bh, bw // 2 + 1, bh + 15, 'w'); g.vline(bw // 2 - 2, bh, bh + 15, 'j')
    g.rect(1, 0, bw, bh - 1, 'w'); g.rect(2, 1, bw - 1, 1, '9'); g.vline(2, 1, bh - 2, '9'); g.hline(2, bw - 1, bh - 2, 'j'); g.vline(bw - 1, 1, bh - 2, 'j')
    g.outline('K')
    for i, l in enumerate(lines):
        draw_text(g, 5, 3 + i * 6, l, 'K')
    return g


def cloud(w=26):
    g = G(w, 12)
    g.ellipse(w * 0.3, 7, w * 0.26, 4.2, 'O'); g.ellipse(w * 0.55, 5.5, w * 0.24, 5.2, 'O'); g.ellipse(w * 0.75, 7.5, w * 0.2, 3.6, 'O')
    g.rect(int(w * 0.12), 8, int(w * 0.9), 10, 'O'); g.hline(int(w * 0.15), int(w * 0.88), 10, 'o')
    g.outline('k')
    return g


def bush(w=30):
    g = G(w, 18)
    g.ellipse(w / 2, 11, w / 2 - 1, 6.5, 'a'); g.ellipse(w / 2 - 1, 10, w / 2 - 2, 6, 'A')
    for bx in (w * 0.25, w * 0.5, w * 0.75):
        g.ellipse(bx, 6.5, 5, 4.2, 'A'); g.set(int(bx) - 2, 4, 'F'); g.set(int(bx) - 1, 4, 'F')
    for (fx, fy) in ((w * 0.3, 9), (w * 0.6, 12), (w * 0.8, 8)):
        g.set(int(fx), fy, '&'); g.set(int(fx) + 1, fy, '*')
    g.outline('K')
    return g


def palm(h=52):
    g = G(44, h)
    tx = 18
    for y in range(14, h):
        x = tx + int((y - 14) * 0.12)
        g.rect(x, y, x + 3, y, 'w'); g.set(x, y, '9')
        if y % 4 == 0:
            g.hline(x, x + 3, y, 'j')
    for (ex, ey) in ((-14, 4), (-9, -6), (2, -9), (12, -6), (17, 4)):
        L = G(44, h)
        capsule(L, tx + 1, 13, tx + 1 + ex, 13 + ey, 2.4, 'A')
        capsule(L, tx + 1, 13, tx + 1 + ex, 13 + ey, 0.8, 'a')
        L.outline_grow('K')
        g.paste(L, 0, 0)
    g.ellipse(tx, 15, 2, 1.8, 'j'); g.ellipse(tx + 4, 16, 2, 1.8, 'j')
    return g


def capsule(g, x0, y0, x1, y1, r, c):
    steps = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
    for i in range(steps + 1):
        t = i / max(steps, 1)
        g.ellipse(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, r, c)


def tree():
    g = G(30, 40)
    g.rect(13, 22, 16, 39, 'w'); g.vline(13, 22, 39, '9'); g.vline(16, 22, 39, 'j')
    g.ellipse(15, 13, 13.5, 11, 'a'); g.ellipse(14, 12, 12.5, 10, 'A'); g.ellipse(10, 8, 5, 4, 'F')
    g.outline('K')
    return g


def lamp():
    g = G(10, 42)
    g.rect(4, 8, 5, 39, '$'); g.vline(4, 8, 39, '='); g.rect(2, 39, 7, 41, '@')
    g.ellipse(4.5, 4.5, 3.6, 3.8, 'G'); g.ellipse(3.5, 3.5, 1.6, 1.6, 'L'); g.rect(3, 8, 6, 9, '@')
    g.outline('K')
    return g


def banner_vfb():
    g = G(14, 30)
    g.rect(1, 0, 12, 24, 'R'); g.rect(1, 25, 12, 25, 'R'); g.hline(2, 11, 26, 'R'); g.hline(4, 9, 27, 'R'); g.hline(6, 7, 28, 'R')
    g.vline(3, 0, 24, 'O'); g.vline(10, 0, 24, 'O')
    g.ellipse(6.5, 10, 3.6, 3.6, 'O'); g.ellipse(6.5, 10, 2.0, 2.0, 'R')
    g.outline('K')
    return g


def crate():
    g = G(34, 18)
    g.rect(0, 0, 33, 17, 'w'); g.rect(1, 1, 32, 16, '9'); g.rect(3, 3, 30, 14, 'w')
    g.rect(0, 0, 33, 1, 'j'); g.rect(0, 16, 33, 17, 'j'); g.rect(0, 0, 1, 17, 'j'); g.rect(32, 0, 33, 17, 'j')
    g.rect(2, 5, 31, 12, 'O'); g.hline(3, 30, 12, 'o')
    g.outline('K')
    draw_text(g, 3, 6, 'WINAMAX', 'R')
    return g


def cone():
    g = G(12, 16)
    for y in range(1, 13):
        half = 1 + int((y - 1) * 0.35)
        g.hline(5 - half, 6 + half, y, '!')
    g.hline(2, 9, 7, 'O'); g.hline(2, 9, 8, 'O'); g.rect(0, 13, 11, 15, '@'); g.hline(1, 10, 13, '$')
    g.outline('K')
    return g


def bench():
    g = G(30, 14)
    g.rect(0, 0, 29, 8, 'R'); g.hline(1, 28, 1, 'V'); g.hline(1, 28, 7, 'r')
    g.rect(2, 9, 4, 13, '$'); g.rect(25, 9, 27, 13, '$')
    g.outline('K')
    draw_text(g, 9, 2, 'VFB', 'O')
    return g


def bigsign(lines, col='R'):
    tw = max(text_width(l) for l in lines)
    bw, bh = tw + 10, 6 * len(lines) + 7
    g = G(bw + 2, bh + 14)
    for px in (5, bw - 6):
        g.rect(px, bh, px + 2, bh + 13, 'w'); g.vline(px, bh, bh + 13, 'j')
    g.rect(1, 0, bw, bh - 1, 'O'); g.rect(1, 0, bw, 1, 'w'); g.rect(1, bh - 3, bw, bh - 1, 'w'); g.rect(1, 0, 2, bh - 1, 'w'); g.rect(bw - 1, 0, bw, bh - 1, 'w')
    g.outline('K')
    for i, l in enumerate(lines):
        draw_text(g, (bw - text_width(l)) // 2 + 1, 4 + i * 6, l, col)
    return g


def chalkboard(lines):
    tw = max(text_width(l) for l in lines)
    bw, bh = tw + 10, 6 * len(lines) + 7
    g = G(bw + 2, bh + 2)
    g.rect(0, 0, bw + 1, bh + 1, 'w'); g.rect(2, 2, bw - 1, bh - 1, '#')
    g.outline('K')
    for i, l in enumerate(lines):
        draw_text(g, (bw - text_width(l)) // 2 + 1, 4 + i * 6, l, 'O' if i % 2 == 0 else '&')
    return g


def throne():
    g = G(30, 34)
    g.rect(7, 6, 22, 24, 'G'); g.rect(8, 7, 21, 23, 'g'); g.rect(9, 8, 20, 22, 'G'); g.vline(9, 8, 22, 'L')
    g.rect(9, 10, 20, 20, 'R'); g.rect(10, 11, 19, 19, 'r'); g.rect(11, 12, 18, 18, 'R')
    g.rect(4, 22, 25, 27, 'G'); g.hline(5, 24, 22, 'L'); g.rect(4, 25, 25, 27, 'g')
    g.rect(4, 28, 7, 33, 'g'); g.rect(22, 28, 25, 33, 'g'); g.rect(2, 18, 4, 23, 'G'); g.rect(25, 18, 27, 23, 'G')
    for (x0, x1, tip) in ((8, 12, 10), (13, 17, 15), (18, 22, 20)):
        for y in range(1, 6):
            half = int((y - 1) * 0.5)
            g.hline(tip - half, tip + half, y, 'G')
        g.set(tip, 1, 'L')
    g.set(11, 4, 'R'); g.set(19, 4, '1')
    g.outline('K')
    return g


def torch():
    g = G(10, 18)
    g.rect(4, 9, 5, 17, 'w'); g.vline(4, 9, 17, 'j'); g.rect(3, 8, 6, 9, '@')
    g.ellipse(4.5, 5, 3.2, 4.2, 'R'); g.ellipse(4.5, 5.5, 2.2, 3.0, '!'); g.ellipse(4.5, 6, 1.2, 1.8, '?')
    g.set(4, 0, 'R'); g.set(5, 1, '!')
    return g


def pillar(h=96):
    g = G(14, h)
    g.rect(2, 4, 11, h - 1, '$'); g.vline(3, 4, h - 1, '='); g.vline(10, 4, h - 1, '@')
    for x in (5, 8):
        g.vline(x, 6, h - 4, '@')
    g.rect(0, 0, 13, 3, '='); g.hline(0, 13, 3, '$'); g.rect(0, h - 3, 13, h - 1, '=')
    g.outline('K')
    return g


def red_banner(lines):
    tw = max(text_width(l) for l in lines)
    bw = tw + 10
    bh = 6 * len(lines) + 10
    g = G(bw + 2, bh + 8)
    g.rect(1, 0, bw, bh, 'R'); g.rect(1, 0, bw, 1, 'G'); g.vline(1, 0, bh, 'r'); g.vline(bw, 0, bh, 'r')
    for x in range(1, bw + 1):
        d = abs(x - (bw + 1) / 2)
        g.vline(x, bh, bh + int(6 - d * 12 / bw), 'R')
    g.hline(2, bw - 1, bh - 1, 'G')
    g.outline('K')
    for i, l in enumerate(lines):
        draw_text(g, (bw - text_width(l)) // 2 + 1, 5 + i * 6, l, 'O')
    return g


def moon_window():
    g = G(60, 52)
    g.rect(0, 0, 59, 51, '$'); g.rect(3, 3, 56, 48, ',')
    g.ellipse(44, 14, 6.5, 6.5, 'O'); g.ellipse(46, 13, 2, 1.5, 'o'); g.set(42, 17, 'o')
    for (x, w, h) in ((4, 8, 20), (13, 6, 30), (20, 9, 16), (30, 7, 26), (38, 10, 14), (49, 7, 22)):
        g.rect(x, 48 - h, x + w - 1, 47, '@')
        for yy in range(50 - h, 46, 3):
            g.set(x + 1, yy, 'G'); g.set(x + w - 2, yy + 1, 'G')
    g.vline(29, 3, 48, '$'); g.hline(3, 56, 26, '$')
    g.outline('K')
    return g


def pennant(col='P'):
    g = G(16, 34)
    g.rect(2, 0, 3, 33, '$'); g.vline(2, 0, 33, '=')
    for i in range(10):
        w = 11 - abs(i - 4.5) * 2.2
        g.hline(4, 4 + int(w), 2 + i, col)
    g.outline('K')
    draw_text(g, 6, 5, 'B', 'W')
    return g


def table():
    g = G(20, 16)
    g.rect(0, 0, 19, 3, 'w'); g.hline(1, 18, 0, '9'); g.hline(0, 19, 3, 'j')
    g.rect(2, 4, 4, 15, 'w'); g.rect(15, 4, 17, 15, 'w')
    g.outline('K')
    return g


# ----------------------------------------------------------------- SCENES
def scene_barios():
    W, H = 592, 116
    g = G(W, H)
    ground = H - 32
    def plat(x, n):
        g.paste(platform(n), x, ground)
    plat(0, 3); g.paste(sign(['BARIOS WORLD >']), 12, ground - 33)
    plat(112, 1); g.paste(items.kaffee(), 116, ground - 24)
    g.paste(items.block(32), 156, ground - 60)
    plat(200, 2); g.paste(items.buch(), 220, ground - 24)
    for (x, y, col, d) in ((272, 46, 'R', '7'), (292, 38, '1', '4'), (312, 46, 'A', '2')):
        g.paste(items.karte(col, d), x, y)
    plat(344, 2); g.paste(items.pipe(32, 44), 360, ground - 44)
    plat(416, 3); g.paste(bush(30), 420, ground - 17); g.paste(palm(52), 458, ground - 51)
    plat(520, 2); g.paste(items.flagge(), 544, ground - 24)
    g.paste(cloud(26), 60, 6); g.paste(cloud(20), 250, 12); g.paste(cloud(24), 480, 4)
    return g


def scene_vfb():
    W, H = 594, 120
    g = G(W, H)
    ground = H - 32
    def plat(x, n):
        g.paste(platform(n), x, ground)
    plat(0, 3); g.paste(sign(['VFB AREA >']), 10, ground - 33); g.paste(lamp(), 78, ground - 42)
    plat(112, 2); g.paste(banner_vfb(), 118, ground - 60); g.paste(crate(), 140, ground - 18)
    plat(192, 2); g.paste(items.ball(), 200, ground - 24); g.paste(cone(), 232, ground - 16)
    plat(272, 2); g.paste(bench(), 276, ground - 14)
    g.paste(items.block(32), 348, ground - 60)
    plat(392, 3); g.paste(bigsign(['MEISTER', 'TRAUME', 'LEBEN', 'IMMER']), 396, ground - 45); g.paste(tree(), 450, ground - 40)
    plat(504, 2); g.paste(items.fahne(), 512, ground - 24); g.paste(items.schal(), 540, ground - 24)
    g.paste(items.nuckel(), 562, ground - 56)
    g.paste(cloud(22), 40, 8); g.paste(cloud(26), 300, 4); g.paste(cloud(20), 560, 10)
    return g


def scene_arena():
    W, H = 594, 132
    g = G(W, H)
    g.rect(0, 0, W - 1, H - 1, ';')
    for y in range(0, H - 24, 8):
        g.hline(0, W - 1, y, ',')
        for x in range((y // 8 % 2) * 12, W, 24):
            g.vline(x, y, y + 7, ',')
    g.paste(stone_floor(W, 24), 0, H - 24)
    for px in (18, 176, 452, 578):
        g.paste(pillar(H - 24), px, 0)
    g.paste(red_banner(['BARIOS', 'WORLD']), 44, 10)
    g.paste(torch(), 130, 40); g.paste(torch(), 488, 40)
    g.paste(moon_window(), 508, 14)
    # stairs + throne
    for i, (x0, x1) in enumerate(((236, 404), (252, 388), (268, 372))):
        y = H - 24 - (i + 1) * 8
        g.rect(x0, y, x1, y + 7, 'R'); g.hline(x0 + 1, x1 - 1, y, 'V'); g.hline(x0, x1, y + 7, 'r')
        g.rect(x0, y, x1, y + 7, 'R') if False else None
    g.paste(throne(), 305, H - 24 - 24 - 34)
    g.paste(items.pokal(), 244, H - 24 - 24 - 24); g.paste(items.pokal(), 372, H - 24 - 24 - 24)
    g.paste(table(), 150, H - 24 - 16); g.paste(items.kaffee(), 148, H - 24 - 16 - 24)
    g.paste(items.buch(), 200, H - 24 - 24); g.paste(items.buch(), 222, H - 24 - 24)
    g.paste(chalkboard(['LIFE IS', 'CAMBIO']), 466, H - 24 - 27)
    g.paste(chalkboard(['BARIOS WORLD', 'LEVEL ~']), 512, H - 24 - 27)
    g.paste(palm(48), 404, H - 24 - 47)
    g.paste(pennant('P'), 110, 60)
    g.paste(items.krone(), 316, 8)
    for (x, y) in ((90, H - 20), (130, H - 14), (430, H - 18), (470, H - 12)):
        g.rect(x, y, x + 5, y + 2, 'O'); g.hline(x + 1, x + 4, y + 1, 'o')
    draw_text(g, 76, 60, 'KAFFEE CAMBIO', 'O'); draw_text(g, 72, 68, 'KHUSRA MUND', 'O'); draw_text(g, 66, 76, 'ALLES KONTROLLE', '&')
    return g


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), 'out')
    render_sheet([scene_barios()], os.path.join(out, 'scene_barios.png'), scale=2, pad=6)
    render_sheet([scene_vfb()], os.path.join(out, 'scene_vfb.png'), scale=2, pad=6)
    render_sheet([scene_arena()], os.path.join(out, 'scene_arena.png'), scale=2, pad=6)
