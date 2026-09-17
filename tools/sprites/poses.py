"""Poses with props: power-up forms, attacks, specials, Meistersager & Direktor moves."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from figures import *
from font import draw_text, text_width


def layer(c):
    return G(c.w, c.h)


def put(c, L, outline=True):
    if outline:
        L.outline_grow('K')
    c.paste(L, 0, 0)


def front(st, w=CW, h=CH, ox=OX, oy=0, mouth=None, legs=True, eyes=None):
    body = figure_front(st, mouth=mouth, legs=legs, eyes=eyes, draw_arms=False)
    return on_canvas(body, ox, oy, w, h)


def A(ox, oy, side, hx, hy):
    sx = 6.5 if side == 'L' else 33.5
    return ((sx + ox, 34 + oy), (hx + ox, hy + oy))


def arms(c, st, ox=OX, oy=0, L=None, R=None):
    d = hang(ox, oy)
    if L is not None:
        d['L'] = A(ox, oy, 'L', *L)
    if R is not None:
        d['R'] = A(ox, oy, 'R', *R)
    arms_c(c, st, d)


def ring(L, cx, cy, rx, ry, c, thick=1.6, only=None):
    L.ellipse(cx, cy, rx, ry, c, only=only)
    inner = G(L.w, L.h)
    inner.ellipse(cx, cy, rx - thick, ry - thick * ry / rx, 'X', only=only)
    for y in range(L.h):
        for x in range(L.w):
            if inner.d[y][x] == 'X' and L.d[y][x] == c:
                L.d[y][x] = '.'


# ----------------------------------------------------------------- PROPS
def prop_dumbbell(c, x0, x1, y):
    L = layer(c)
    L.rect(x0 + 4, y, x1 - 4, y + 1, '0'); L.hline(x0 + 4, x1 - 4, y, '=')
    for px in (x0, x1 - 3):
        L.rect(px, y - 4, px + 3, y + 5, '@'); L.vline(px, y - 4, y + 5, '$'); L.hline(px, px + 3, y - 4, '$')
    put(c, L)


def prop_glove(c, cx, cy):
    L = layer(c)
    L.ellipse(cx, cy, 4.8, 4.6, '1'); L.ellipse(cx + 1.5, cy + 1.5, 3.5, 3.2, '2', only=lambda x, y: x > cx or y > cy)
    L.ellipse(cx, cy, 4.8, 4.6, '1', only=lambda x, y: x <= cx and y <= cy)
    L.ellipse(cx - 1.6, cy - 1.6, 1.8, 1.6, '3')
    L.rect(int(cx) - 3, int(cy) + 4, int(cx) + 3, int(cy) + 6, 'O'); L.hline(int(cx) - 3, int(cx) + 3, int(cy) + 6, 'o')
    put(c, L)


def prop_skateboard(c, x0, x1, y):
    L = layer(c)
    L.rect(x0 + 1, y, x1 - 1, y + 1, '@'); L.hline(x0 + 2, x1 - 2, y, '$'); L.set(x0, y - 1, '$'); L.set(x1, y - 1, '$')
    L.set(x0, y, '@'); L.set(x1, y, '@')
    for wx in (x0 + 5, x1 - 7):
        L.hline(wx, wx + 2, y + 2, '-'); L.rect(wx - 1, y + 3, wx + 3, y + 4, 'R'); L.set(wx + 1, y + 3, 'V')
    put(c, L)


def prop_spraycan(c, x, y, direction=1):
    L = layer(c)
    L.rect(x, y + 3, x + 5, y + 13, '0'); L.vline(x + 1, y + 4, y + 12, '=')
    L.rect(x, y + 7, x + 5, y + 10, '&'); L.set(x + 1, y + 8, '*')
    L.rect(x + 1, y, x + 4, y + 2, '@'); L.set(x + 2 + (1 if direction > 0 else 0), y, '$')
    put(c, L)
    S = layer(c)
    pts = [(2, 0), (4, -1), (4, 1), (6, -2), (6, 0), (6, 2), (8, -3), (8, -1), (8, 1), (8, 3), (10, -4), (10, 0), (10, 4),
           (12, -3), (12, 2), (13, -5), (13, 5), (14, 0), (15, -2), (15, 3)]
    for i, (dx, dy) in enumerate(pts):
        col = '&' if i < 9 else ('%' if i < 16 else '*')
        S.set(x + 5 + dx * direction, y + 1 + dy, col)
    c.paste(S, 0, 0)


def prop_headphones(c, cx, top, half_w=19, cup_y=17):
    L = layer(c)
    ring(L, cx, top + 14, half_w, 14, '#', thick=3, only=lambda x, y: y <= top + 14)
    L.ellipse(cx - 9, top + 2.5, 3.0, 1.6, '$')
    for x0 in (cx - half_w - 2, cx + half_w - 5):
        L.rect(x0, cup_y, x0 + 6, cup_y + 10, '#'); L.rect(x0 + 2, cup_y + 3, x0 + 4, cup_y + 7, '4'); L.set(x0 + 1, cup_y + 1, '$')
    put(c, L)


def prop_note(c, x, y, col='4'):
    L = layer(c)
    L.vline(x + 3, y, y + 8, col); L.ellipse(x + 1.5, y + 9, 2.2, 1.6, col); L.hline(x + 4, x + 6, y, col); L.hline(x + 5, x + 6, y + 1, col)
    put(c, L, outline=False)


def prop_guitar(c, hx, hy, bx, by):
    """Neck from headstock (hx,hy) to body (bx,by); flying-V body at (bx,by)."""
    L = layer(c)
    # body: two red lobes forming a V
    L.ellipse(bx + 2, by + 3, 6.5, 4.5, 'R'); L.ellipse(bx - 3, by + 6, 5.0, 4.5, 'R')
    L.ellipse(bx + 3, by + 2, 3.0, 2.0, 'V'); L.ellipse(bx - 4, by + 7, 2.2, 1.8, 'r')
    # neck
    capsule(L, hx, hy, bx, by, 1.7, 'w')
    capsule(L, hx, hy, bx, by, 0.6, 'O')
    steps = 5
    for i in range(1, steps):
        t = i / steps
        L.set(int(hx + (bx - hx) * t), int(hy + (by - hy) * t) + 1, '#')
    # headstock
    L.rect(int(hx) - 3, int(hy) - 3, int(hx) + 1, int(hy) + 1, '#')
    for py in (int(hy) - 3, int(hy) - 1, int(hy) + 1):
        L.set(int(hx) - 4, py, 'G')
    L.rect(bx - 1, by + 1, bx + 1, by + 3, '#')     # pickup
    put(c, L)


def prop_bolt(c, x, y, col='G'):
    L = layer(c)
    L.put(x, y, "..##\n.##.\n###.\n..##\n.##.\n.#..\n#...")
    L.replace('#', col)
    put(c, L, outline=False)


def prop_cup(c, x, y, steam=True, small=False):
    L = layer(c)
    if small:
        L.rect(x, y + 2, x + 5, y + 6, 'O'); L.hline(x, x + 5, y + 2, 'J'); L.set(x + 6, y + 3, 'O'); L.set(x + 6, y + 4, 'O')
        L.hline(x + 1, x + 4, y + 6, 'o')
    else:
        L.rect(x, y + 3, x + 7, y + 9, 'O'); L.hline(x, x + 7, y + 3, 'J'); L.hline(x + 1, x + 6, y + 3, 'j')
        L.rect(x + 8, y + 4, x + 9, y + 7, 'O'); L.set(x + 8, y + 5, '.'); L.set(x + 8, y + 6, '.')
        L.hline(x + 1, x + 6, y + 9, 'o'); L.vline(x + 6, y + 4, y + 8, 'o')
    put(c, L)
    if steam:
        S = layer(c)
        for i, sx in enumerate((x + 1, x + 4, x + 6) if not small else (x + 1, x + 4)):
            S.set(sx, y - 1 + (i % 2), '='); S.set(sx + (1 if i % 2 else 0), y - 3 + (i % 2), '=')
        c.paste(S, 0, 0)


def prop_card(c, x, y, col='R'):
    L = layer(c)
    L.rect(x, y, x + 6, y + 9, col); L.set(x, y, '.'); L.set(x + 6, y, '.'); L.set(x, y + 9, '.'); L.set(x + 6, y + 9, '.')
    L.ellipse(x + 3, y + 4.5, 1.6, 2.6, 'O'); L.set(x + 1, y + 1, 'O'); L.set(x + 5, y + 8, 'O')
    put(c, L)


def prop_book(c, x, y, col='j'):
    L = layer(c)
    L.rect(x, y, x + 9, y + 7, col); L.rect(x + 8, y + 1, x + 9, y + 6, 'O'); L.vline(x + 1, y, y + 7, 'w')
    L.rect(x + 3, y + 2, x + 6, y + 5, 'G'); L.hline(x + 4, x + 5, y + 3, col)
    put(c, L)


def prop_ball(c, cx, cy, r=3.2, col='&', hl='*'):
    L = layer(c)
    L.ellipse(cx, cy, r, r, col); L.ellipse(cx - 1, cy - 1, 1.2, 1.0, hl)
    put(c, L)


def prop_trail(c, pts, cols=('&', '%', '*')):
    S = layer(c)
    for i, (x, y) in enumerate(pts):
        S.set(x, y, cols[min(i * len(cols) // max(len(pts), 1), len(cols) - 1)])
    c.paste(S, 0, 0)


def prop_bubble(c, x, y):
    L = layer(c)
    L.rect(x, y, x + 13, y + 7, 'O'); L.set(x, y, '.'); L.set(x + 13, y, '.'); L.set(x, y + 7, '.'); L.set(x + 13, y + 7, '.')
    L.set(x + 2, y + 8, 'O'); L.set(x + 1, y + 9, 'O')
    for dx in (3, 6, 9):
        L.rect(x + dx, y + 3, x + dx + 1, y + 4, 'k')
    put(c, L)


def portrait(st):
    b = figure_front(st, draw_arms=False)
    p = G(36, 32)
    p.paste(b, -2, -1)
    return p


def prop_star(c, x, y, col='G'):
    S = layer(c)
    S.put(x, y, "..#..\n.###.\n#####\n.###.\n..#..")
    S.replace('#', col)
    c.paste(S, 0, 0)


def prop_glasses(c, x, y):
    L = layer(c)
    L.hline(x, x + 11, y, 'G'); L.rect(x + 1, y + 1, x + 4, y + 3, '@'); L.rect(x + 7, y + 1, x + 10, y + 3, '@')
    L.set(x + 1, y + 1, '$'); L.set(x + 7, y + 1, '$'); L.hline(x + 5, x + 6, y + 1, 'G')
    put(c, L)


def prop_burst(c, cx, cy, text, fill='&', textcol='O', rx=None):
    tw = text_width(text)
    rx = rx or tw / 2 + 6
    L = layer(c)
    L.ellipse(cx, cy, rx, 7, fill)
    import math
    for i in range(12):
        a = i * math.pi / 6
        rr = 1.0 if i % 2 else 0.78
        L.ellipse(cx + math.cos(a) * rx * rr, cy + math.sin(a) * 7 * rr, 2.2, 2.2, fill)
    put(c, L)
    draw_text(c, int(cx - tw / 2), cy - 2, text, textcol)


def prop_waves(c, cx, cy, n=3, col='O', start=8, step=5):
    L = layer(c)
    for i in range(n):
        r = start + i * step
        ring(L, cx, cy, r, r * 0.8, col if i % 2 == 0 else '=', thick=1.4, only=lambda x, y, r=r: x > cx + r * 0.55)
    c.paste(L, 0, 0)


def prop_halo(c, cx, y):
    L = layer(c)
    ring(L, cx, y, 9, 2.6, 'G', thick=1.4); L.hline(int(cx) - 3, int(cx) + 3, y - 2, 'L')
    put(c, L, outline=False)


def prop_wings(c, cx, y):
    L = layer(c)
    for s in (-1, 1):
        for i, (dx, dy, rx, ry) in enumerate(((13, 0, 6, 9), (18, 6, 4, 6), (20, 13, 3, 4))):
            L.ellipse(cx + s * dx, y + dy, rx, ry, 'O')
            L.ellipse(cx + s * (dx + 1), y + dy + 2, rx - 1.5, ry - 1.5, 'o', only=lambda x, yy, s=s, cx=cx, dx=dx: (x - cx) * s > dx)
    put(c, L)


def prop_flames(c, xs, base, height=18, cols=('&', '%', '*')):
    L = layer(c)
    for i, x in enumerate(xs):
        h = height - (i % 3) * 4
        L.ellipse(x, base - h * 0.45, 3.2, h * 0.5, cols[0])
        L.ellipse(x, base - h * 0.35, 1.9, h * 0.35, cols[1])
        L.ellipse(x + (0.5 if i % 2 else -0.5), base - h * 0.28, 0.9, h * 0.18, cols[2])
        L.set(int(x), int(base - h * 0.98), cols[0]); L.set(int(x), int(base - h * 0.9), cols[0])
    c.paste(L, 0, 0)


def prop_slash(c, cx, cy, r=9, col='V'):
    L = layer(c)
    ring(L, cx, cy, r, r, col, thick=2.0, only=lambda x, y: x > cx + 1)
    ring(L, cx, cy, r - 4, r - 4, '%', thick=1.4, only=lambda x, y: x > cx + 1)
    c.paste(L, 0, 0)


def prop_scarf(c, x0, x1, y):
    L = layer(c)
    for i, x in enumerate(range(x0, x1 + 1)):
        L.vline(x, y, y + 5, 'R' if (x - x0) // 4 % 2 == 0 else 'O')
    L.hline(x0, x1, y + 5, 'r', ) if False else None
    for fx in (x0 - 1, x1 + 1):
        for fy in range(y, y + 6, 2):
            L.set(fx, fy, 'O')
    put(c, L)
    draw_text(c, (x0 + x1) // 2 - 5, y, 'VFB', 'O', shadow=None)


def confetti(c, seed=3, n=26, cols=('&', 'G', '1', 'R', 'A', 'O')):
    S = layer(c)
    x, y = seed * 7, seed * 3
    for i in range(n):
        x = (x * 17 + 11) % c.w
        y = (y * 13 + 7) % (c.h // 2 + 4)
        S.set(x, y, cols[i % len(cols)])
    c.paste(S, 0, 0)


# ----------------------------------------------------------------- BARIO FORMS
def form_sport():
    st = FORMS['sport']
    c = front(st, mouth='neutral')
    arms(c, st, L=(11, 40), R=(29, 40))
    prop_dumbbell(c, 6, 42, 40)
    for (x, y) in ((2, 20), (44, 24), (40, 12)):
        prop_star(c, x, y, 'L')
    return c


def form_boxer():
    st = FORMS['boxer']
    c = front(st, mouth='neutral')
    arms(c, st, L=(11, 28), R=(31, 38))
    prop_glove(c, 14, 27); prop_glove(c, 36, 40)
    return c


def form_skater():
    st = FORMS['skater']
    c = front(st, mouth='smile')
    arms(c, st, L=(2, 43), R=(38, 43))
    prop_skateboard(c, 7, 44, 58)
    return c


def form_sprayer():
    st = FORMS['sprayer']
    c = front(st, w=64, mouth='neutral')
    arms(c, st, L=None, R=(41, 32))
    prop_spraycan(c, 44, 24, 1)
    return c


def form_dj():
    st = FORMS['dj']
    c = front(st, mouth='smile')
    arms(c, st, L=(13, 44), R=(27, 44))
    prop_headphones(c, 24, 1)
    prop_note(c, 41, 4, '4'); prop_note(c, 1, 8, '6')
    return c


def form_rocker():
    st = FORMS['rocker']
    c = front(st, w=56, mouth='tongue')
    arms(c, st, L=(9, 27), R=(31, 44))
    prop_guitar(c, 12, 27, 38, 46)
    prop_bolt(c, 2, 6); prop_bolt(c, 49, 40)
    return c


# ----------------------------------------------------------------- BARIO SPECIALS
def special_kaffee():
    st = BARIO
    c = front(st, w=56, ox=8, mouth='smile')
    c = aura(c, 'L', 'G', grow=2)
    arms(c, st, ox=8, L=None, R=(37, 22))
    prop_cup(c, 44, 12)
    for (x, y) in ((1, 10), (51, 30), (4, 44), (50, 8)):
        prop_star(c, x, y, 'L')
    return c


def special_buecher():
    st = BARIO
    c = G(56, 64)
    # book stack he sits on
    L = layer(c)
    for i, col in enumerate(('R', '1', 'G')):
        y = 52 + i * 4
        L.rect(6, y, 49, y + 3, col); L.rect(46, y, 49, y + 2, 'O'); L.hline(7, 45, y, {'R': 'V', '1': '3', 'G': 'F'}[col])
    put(c, L)
    body = figure_front(st, mouth='neutral', legs=False, draw_arms=False, eyes='closed')
    c.paste(body, 8, 6)
    # seated legs: thighs forward, shins hanging in front of the stack
    LG = layer(c)
    LG.rect(16, 52, 40, 55, 'N'); LG.hline(16, 40, 52, 'M'); LG.hline(18, 38, 55, 'n')
    LG.rect(18, 56, 23, 60, 'N'); LG.rect(33, 56, 38, 60, 'N'); LG.vline(23, 56, 60, 'n'); LG.vline(38, 56, 60, 'n')
    LG.rect(16, 61, 25, 63, 'O'); LG.rect(31, 61, 40, 63, 'O'); LG.hline(16, 25, 63, 'X'); LG.hline(31, 40, 63, 'X')
    put(c, LG)
    arms(c, st, ox=8, oy=6, L=(13, 46), R=(27, 46))
    # open book in his hands
    B = layer(c)
    B.rect(17, 48, 38, 55, 'j'); B.rect(18, 49, 27, 54, 'O'); B.rect(28, 49, 37, 54, 'O'); B.vline(27, 49, 54, 'o'); B.vline(28, 49, 54, 'o')
    for yy in (50, 52): B.hline(20, 25, yy, 'o'); B.hline(30, 35, yy, 'o')
    put(c, B)
    return c


def special_cambio():
    st = BARIO
    c = front(st, w=64, ox=12, mouth='smile')
    c = aura(c, '%', None, grow=1)
    arms(c, st, ox=12, L=(2, 30), R=(38, 30))
    for (x, y, col) in ((2, 10, 'R'), (12, 2, '1'), (28, 0, 'G'), (44, 2, '?'), (55, 10, 'R')):
        prop_card(c, x, y, col)
    return c


def special_khusra():
    st = BARIO
    c = G(64, 64)
    body = figure_front(st, mouth='neutral', legs=False, draw_arms=False, eyes='closed')
    c.paste(body, 12, 6)
    LG = layer(c)
    LG.ellipse(32, 55, 18, 5.5, 'N'); LG.ellipse(30, 53.5, 14, 3.0, 'M'); LG.ellipse(34, 57, 15, 3.0, 'n')
    LG.rect(12, 52, 18, 56, 'O'); LG.rect(46, 52, 52, 56, 'O'); LG.hline(12, 18, 56, 'X'); LG.hline(46, 52, 56, 'X')
    put(c, LG)
    arms(c, st, ox=12, oy=6, L=(3, 44), R=(37, 44))
    c = aura(c, '&', '*', grow=3)
    import math
    S = layer(c)
    for i in range(10):
        a = i * math.pi / 5 + 0.3
        for r in (27, 29, 31):
            S.set(int(32 + math.cos(a) * r), int(34 + math.sin(a) * r * 0.9), '&' if r < 31 else '%')
    c.paste(S, 0, 0)
    return c


# ----------------------------------------------------------------- BARIO ATTACKS (side, facing right)
def side_canvas(st, frame=STAND, lean=0, mouth=None, w=64, near_arm=True):
    body = figure_side(st, frame, lean, mouth, near_arm)
    return on_canvas(body, OX, 0, w, CH)


def attack_kaffee():
    st = BARIO
    c = side_canvas(st, STAND, 1, 'open', 72, near_arm=False)
    arm_side(c, st, 27, 34, 42, 33)
    prop_cup(c, 50, 22, steam=True)
    prop_trail(c, [(46, 30), (48, 29), (44, 31)], ('=', '=', 'o'))
    return c


def attack_cambio():
    st = BARIO
    c = side_canvas(st, STAND, 1, 'smile', 72, near_arm=False)
    arm_side(c, st, 27, 34, 42, 33)
    for (x, y, col) in ((48, 26, 'R'), (55, 22, '1'), (62, 26, 'G')):
        prop_card(c, x, y, col)
    return c


def attack_buch():
    st = BARIO
    c = side_canvas(st, STAND, 1, 'open', 72, near_arm=False)
    arm_side(c, st, 27, 34, 30, 18)
    prop_book(c, 24, 8, 'j')
    return c


def attack_khusra():
    st = BARIO
    c = side_canvas(st, STAND, 1, 'neutral', 72, near_arm=False)
    arm_side(c, st, 27, 34, 42, 33)
    prop_ball(c, 56, 31)
    prop_trail(c, [(52, 31), (50, 32), (48, 31), (46, 33)])
    return c


def attack_khusra_mund():
    st = BARIO
    c = G(80, 64)
    R = layer(c)
    import math
    for r, col in ((12, '*'), (18, '%'), (24, '&')):
        ring(R, 40, 44, r, r * 0.62, col, thick=1.6)
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5 + 0.15
        R.line(int(40 + math.cos(a) * 26), int(44 + math.sin(a) * 17), int(40 + math.cos(a) * 33), int(44 + math.sin(a) * 22), '&')
    c.paste(R, 0, 0)
    body = figure_front(st, mouth='shout', draw_arms=False)
    c.paste(body, 20, 0)
    arms(c, st, ox=20, L=(-3, 24), R=(43, 24))
    return c


# ----------------------------------------------------------------- MEISTERSAGER
def meister_attack():
    st = MEISTER
    c = front(st, w=96, ox=4, mouth='shout')
    arms(c, st, L=(-2, 26), R=(42, 26))
    prop_waves(c, 24, 42, n=3, start=14, step=6)
    prop_burst(c, 68, 14, 'MEITHHTER!')
    return c


def meister_support():
    st = MEISTER
    c = front(st, w=56, ox=8, mouth='smile')
    arms(c, st, ox=8, L=(2, 14), R=(38, 14))
    prop_scarf(c, 8, 48, 6)
    confetti(c)
    return c


def meister_hit():
    st = MEISTER
    c = front(st, mouth='open', eyes='x')
    arms(c, st, L=(0, 30), R=(40, 30))
    prop_star(c, 2, 4, 'G'); prop_star(c, 38, 2, 'G'); prop_star(c, 22, -1, 'G')
    return c


def meister_defeat():
    st = MEISTER
    c = G(64, 64)
    prop_wings(c, 32, 30)
    body = figure_front(st, mouth='smile', draw_arms=False, eyes='closed')
    c.paste(body, 12, 5)
    arms(c, st, ox=12, oy=5, L=(4, 46), R=(36, 46))
    prop_halo(c, 32, 3)
    return c


def meister_slide():
    st = MEISTER
    fr = (4, (39, 53), (35, 54), (9, 44), (11, 46), 0, 0)
    body = figure_side(st, fr, 6, 'shout')
    c = on_canvas(body, OX, 6, 72, CH)
    S = layer(c)
    for i, yy in enumerate((40, 46, 52, 58)):
        S.hline(1 + i, 9 + i, yy, '=')
    S.hline(4, 12, 62, 'o'); S.hline(15, 21, 63, 'o')
    c.paste(S, 0, 0)
    return c


# ----------------------------------------------------------------- DIREKTOR
def direktor_rage():
    st = DIREKTOR
    c = G(64, 64)
    prop_flames(c, (8, 14, 20, 26, 32, 38, 44, 50, 56), 58, 26)
    body = figure_front(st, mouth='shout', draw_arms=False)
    c.paste(body, 12, 0)
    arms(c, st, ox=12, L=(-1, 26), R=(41, 26))
    return c


def direktor_kick():
    st = DIREKTOR
    fr = (0, (38, 43), (18, 56), (12, 38), (28, 44), 0, 0)
    c = side_canvas(st, fr, 2, 'neutral', 72)
    prop_slash(c, 46, 40, 10)
    return c


def direktor_brille():
    st = dict(DIREKTOR, glasses=False, brow='H')
    c = side_canvas(st, STAND, 2, 'open', 80, near_arm=False)
    arm_side(c, st, 27, 34, 44, 31)
    prop_glasses(c, 56, 28)
    prop_trail(c, [(52, 30), (50, 31), (48, 30), (46, 32), (53, 27), (49, 28)])
    return c


def direktor_regen():
    st = DIREKTOR
    c = front(st, w=72, ox=16, mouth='open')
    arms(c, st, ox=16, L=None, R=(42, 18))
    for (x, y) in ((2, 6), (14, 0), (30, 4), (46, 0), (60, 8), (6, 24), (62, 26)):
        prop_cup(c, x, y, steam=True, small=True)
    return c


def direktor_defeat():
    c = G(56, 28)
    L = layer(c)
    L.ellipse(26, 19, 19, 6.5, 'I'); L.ellipse(22, 18, 12, 4.0, 'Y'); L.ellipse(30, 21, 14, 3.5, 'i')
    L.rect(16, 12, 18, 22, 'j'); L.rect(30, 13, 32, 23, 'j'); L.set(17, 15, 'G'); L.set(31, 16, 'G'); L.set(17, 19, 'G')
    L.rect(19, 13, 29, 22, 'O'); L.hline(20, 28, 22, 'o')
    put(c, L)
    K = layer(c)
    K.put(20, 2, "#...#...#\n##.###.##\n#########\n#########")
    K.replace('#', 'G'); K.hline(21, 27, 5, 'g')
    put(c, K)
    prop_glasses(c, 42, 20)
    return c


# ----------------------------------------------------------------- FRAME SETS
def walk_frames(st):
    return [on_canvas(figure_side(st, f)) for f in WALK]


def run_frames(st):
    return [on_canvas(figure_side(st, f, lean=2)) for f in RUN]


def idle_frames(st, mouth=None, bubble=False):
    a = front(st, mouth=mouth); arms(a, st)
    b = G(CW, CH); b.paste(figure_front(st, mouth=mouth, dy=1, draw_arms=False), OX, 0); arms(b, st)
    if bubble:
        prop_bubble(b, 33, 2)
    return [a, b]


def jump_frame(st):
    return on_canvas(figure_side(st, JUMP, lean=1, mouth='open'))


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), 'out')
    render_sheet([form_sport(), form_boxer(), form_skater(), form_sprayer(), form_dj(), form_rocker()],
                 os.path.join(out, 'p_forms.png'), scale=5, labels=['sport', 'boxer', 'skater', 'sprayer', 'dj', 'rocker'])
    render_sheet([special_kaffee(), special_buecher(), special_cambio(), special_khusra()],
                 os.path.join(out, 'p_specials.png'), scale=5, labels=['kaffee', 'buecher', 'cambio', 'khusra'])
    render_sheet([attack_kaffee(), attack_cambio(), attack_buch(), attack_khusra(), attack_khusra_mund()],
                 os.path.join(out, 'p_attacks.png'), scale=5, labels=['kaffee', 'cambio', 'buch', 'khusra', 'mund'])
    render_sheet([meister_attack(), meister_support(), meister_hit(), meister_defeat(), meister_slide()],
                 os.path.join(out, 'p_meister.png'), scale=5, labels=['attack', 'support', 'hit', 'defeat', 'slide'])
    render_sheet([direktor_rage(), direktor_kick(), direktor_brille(), direktor_regen(), direktor_defeat()],
                 os.path.join(out, 'p_direktor.png'), scale=5, labels=['rage', 'kick', 'brille', 'regen', 'defeat'])
    render_sheet(idle_frames(BARIO) + [jump_frame(BARIO)] + walk_frames(MEISTER)[:2] + walk_frames(DIREKTOR)[:2],
                 os.path.join(out, 'p_misc.png'), scale=5)
