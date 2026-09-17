"""Style-driven character builder: Bario (+6 power-up forms), Meistersager, Direktor."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from px import *

BW, BH = 40, 58          # body grid
CW, CH = 48, 64          # canvas with room for props; body pasted at (4, 0); feet bottom at y=57
OX = 4


def capsule(g, x0, y0, x1, y1, r, c):
    steps = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
    for i in range(steps + 1):
        t = i / max(steps, 1)
        g.ellipse(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, r, c)


# ------------------------------------------------------------------ STYLES
BARIO = dict(name='bario', cap=True, brow='H', mustache=True, top='shirt', sleeves='long',
             pants='jeans', shoe=('O', 'o', 'X'))
MEISTER = dict(name='meister', cap=False, hair=('C', 'c', 'D'), curl=2.8, brow='c', mustache=False, smile=True,
               top='jersey', sleeves='short', pants='shorts_white', shoe=('O', 'o', 'X'))
DIREKTOR = dict(name='direktor', cap=False, hair=('H', '#', 'h'), curl=2.0, brow='H', mustache=False, glasses=True,
                goatee=True, top='suit', sleeves='long', pants='cream', shoe=('O', 'o', 'X'))

FORMS = {
    'sport': dict(BARIO, top='tank', sleeves='none', pants='shorts_black', arms='buff'),
    'boxer': dict(BARIO, top='tank', sleeves='none', pants='shorts_blue', arms='buff'),
    'skater': dict(BARIO, top='tee_blue', sleeves='short'),
    'sprayer': dict(BARIO, top='hoodie', sleeves='long'),
    'dj': dict(BARIO, top='tee_black', sleeves='short'),
    'rocker': dict(BARIO, top='vest', sleeves='none', arms='buff'),
}


# ------------------------------------------------------------------ HEAD PARTS (front)
def cap_front(g, dy=0):
    cy = 12.5 + dy
    dome = lambda x, y: 2 + dy <= y <= 12 + dy
    g.ellipse(20, cy, 18.0, 11.3, 'p', n=2.6, only=dome)
    g.ellipse(19.3, cy - 0.7, 16.8, 10.5, 'Q', n=2.6, only=dome)
    g.ellipse(20.4, cy + 0.4, 16.8, 10.5, 'P', n=2.6, only=dome)
    b = 13 + dy
    g.hline(3, 36, b, 'p'); g.hline(3, 36, b + 1, 'k')
    g.hline(6, 33, b + 2, 'P'); g.hline(7, 14, b + 2, 'Q')
    g.hline(9, 30, b + 3, 'p'); g.hline(10, 29, b + 4, 'K')
    g.ellipse(20, cy - 5, 6.4, 4.6, 'k'); g.ellipse(20, cy - 5, 5.6, 3.9, 'W')
    g.put(18, int(cy) - 7, "BBBB.\nB...B\nBBBB.\nB...B\nBBBB.")


def hair_front(g, st, dy=0):
    main, shade, hl = st['hair']
    r = st.get('curl', 2.5)
    g.ellipse(20, 12 + dy, 13.5, 8.5, shade, n=2.2, only=lambda x, y: y <= 16 + dy)
    g.ellipse(19.4, 11.4 + dy, 12.6, 8.0, main, n=2.2, only=lambda x, y: y <= 16 + dy)
    # bumps along the crown
    for (bx, by) in ((8, 10), (11, 6), (15, 3.5), (20, 2.5), (25, 3.5), (29, 6), (32, 10)):
        g.ellipse(bx, by + dy, r, r, main)
        g.set(int(bx) - 1, int(by + dy) - 1, hl)
    for (bx, by) in ((30, 12), (33, 13)):
        g.ellipse(bx, by + dy, r, r, shade)
    g.rect(8, 16 + dy, 9, 20 + dy, main); g.rect(30, 16 + dy, 31, 20 + dy, shade)     # sideburns
    g.hline(10, 29, 16 + dy, main)                                                      # hairline


def head_front(g, st, y0=16, mouth=None):
    g.rect(8, y0, 31, y0 + 11, 'S')
    g.hline(9, 30, y0 + 12, 'S'); g.hline(10, 29, y0 + 13, 'S'); g.hline(12, 27, y0 + 14, 'S')
    if st.get('cap'):
        g.rect(8, y0, 9, y0 + 3, 'H'); g.rect(30, y0, 31, y0 + 3, 'H')
        g.hline(10, 29, y0 + 2, 's')
    g.rect(30, y0 + 2, 31, y0 + 11, 's'); g.hline(28, 29, y0 + 12, 's'); g.hline(26, 28, y0 + 13, 's')
    g.hline(12, 27, y0 + 14, 's')
    g.rect(9, y0 + 3, 10, y0 + 7, 'Z')
    g.rect(6, y0 + 5, 7, y0 + 8, 'S'); g.hline(6, 7, y0 + 8, 's')
    g.rect(32, y0 + 5, 33, y0 + 8, 'S'); g.hline(32, 33, y0 + 8, 's')
    b = st.get('brow', 'H')
    g.hline(11, 16, y0 + 4, b); g.hline(23, 28, y0 + 4, b)
    if st.get('glasses'):
        g.hline(11, 28, y0 + 5, 'G')
        g.rect(12, y0 + 5, 15, y0 + 7, '@'); g.rect(24, y0 + 5, 27, y0 + 7, '@')
        g.set(12, y0 + 5, '$'); g.set(24, y0 + 5, '$')
        g.hline(16, 23, y0 + 5, 'G'); g.set(11, y0 + 6, 'G'); g.set(28, y0 + 6, 'G')
        g.hline(12, 15, y0 + 8, 'g'); g.hline(24, 27, y0 + 8, 'g')
    else:
        g.hline(11, 12, y0 + 3, b); g.hline(27, 28, y0 + 3, b)
        g.rect(12, y0 + 5, 15, y0 + 7, 'E'); g.rect(24, y0 + 5, 27, y0 + 7, 'E')
        g.rect(13, y0 + 6, 14, y0 + 7, 'e'); g.rect(25, y0 + 6, 26, y0 + 7, 'e')
        g.hline(12, 15, y0 + 5, 'k'); g.hline(24, 27, y0 + 5, 'k')
        g.set(13, y0 + 6, 'E'); g.set(25, y0 + 6, 'E')
    g.set(19, y0 + 7, 'Z'); g.hline(19, 20, y0 + 8, 's')
    m = y0 + 9
    if st.get('mustache'):
        g.hline(13, 14, m, 'H'); g.hline(17, 22, m, 'H'); g.hline(25, 26, m, 'H')
        g.hline(12, 27, m + 1, 'H'); g.hline(13, 17, m + 2, 'H'); g.hline(22, 26, m + 2, 'H')
        g.hline(18, 21, m, 'h'); g.set(12, m, 'H'); g.set(27, m, 'H')
        base_mouth = 'neutral'
    else:
        base_mouth = 'smile' if st.get('smile') else 'neutral'
    mouth = mouth or base_mouth
    if mouth == 'neutral':
        g.hline(17, 22, m + 3, 's')
    elif mouth == 'smile':
        g.hline(16, 23, m + 2, 'k'); g.hline(17, 22, m + 3, 'E'); g.set(15, m + 1, 'k'); g.set(24, m + 1, 'k')
        g.hline(16, 23, m + 4, 'k')
    elif mouth == 'open':
        g.rect(16, m + 1, 23, m + 4, 'K'); g.rect(17, m + 3, 22, m + 4, 'r'); g.hline(17, 22, m + 1, 'E')
    elif mouth == 'shout':
        g.rect(15, m, 24, m + 4, 'K'); g.rect(16, m + 2, 23, m + 4, 'r'); g.hline(16, 23, m, 'E')
    elif mouth == 'tongue':
        g.rect(16, m + 1, 23, m + 3, 'K'); g.rect(18, m + 3, 21, m + 5, 'V'); g.set(19, m + 4, 'R')
    if st.get('goatee'):
        g.rect(17, m + 4, 22, m + 5, 'H'); g.hline(18, 21, m + 3, 'k')
        for x in (12, 14, 26, 28):
            g.set(x, m + 3, 'k')
        g.hline(13, 15, m + 4, 'k'); g.hline(24, 26, m + 4, 'k')


# ------------------------------------------------------------------ TORSO (front)
def torso_front(g, st, y0=32):
    top = st['top']
    g.rect(15, y0 - 1, 24, y0 - 1, 's')
    if top == 'shirt':
        g.hline(12, 27, y0, 'T'); g.rect(10, y0 + 1, 29, y0 + 13, 'T')
        for x in (12, 15, 24, 27):
            g.vline(x, y0 + 1, y0 + 13, 't')
        g.vline(18, y0 + 2, y0 + 13, 't'); g.vline(21, y0 + 2, y0 + 13, 't')
        g.rect(19, y0 + 1, 20, y0 + 13, 'U')
        for yy in (y0 + 4, y0 + 8, y0 + 12):
            g.set(19, yy, 'u')
        g.put(14, y0, "UU....UU\n.U....U.\n..U..U..")
        g.rect(17, y0 + 1, 22, y0 + 1, 's'); g.set(17, y0 + 2, 'U'); g.set(22, y0 + 2, 'U')
        g.rect(28, y0 + 1, 29, y0 + 13, 'u'); g.hline(10, 29, y0 + 13, 'u'); g.hline(10, 11, y0 + 1, 'U')
    elif top == 'jersey':
        g.hline(12, 27, y0, 'O'); g.rect(10, y0 + 1, 29, y0 + 13, 'O')
        g.rect(10, y0 + 4, 29, y0 + 6, 'R'); g.hline(10, 29, y0 + 7, 'r')
        g.put(14, y0, "RR....RR\n.R....R.\n..RRRR..")
        g.rect(17, y0 + 1, 22, y0 + 1, 's')
        g.rect(28, y0 + 1, 29, y0 + 13, 'o'); g.hline(10, 29, y0 + 13, 'o')
        g.rect(28, y0 + 4, 29, y0 + 6, 'r')
        g.put(12, y0 + 9, "R.R\nR.R\n.R.")                       # little V crest
    elif top == 'suit':
        g.hline(12, 27, y0, 'I'); g.rect(10, y0 + 1, 29, y0 + 13, 'I')
        g.rect(17, y0, 22, y0 + 13, 'O')                        # shirt
        g.rect(14, y0 + 1, 16, y0 + 13, 'j'); g.rect(23, y0 + 1, 25, y0 + 13, 'j')   # patterned lapels
        for yy in range(y0 + 2, y0 + 13, 3):
            g.set(15, yy, 'G'); g.set(24, yy, 'G')
        g.set(14, y0, 'j'); g.set(25, y0, 'j'); g.set(13, y0, 'i'); g.set(26, y0, 'i')
        g.hline(18, 21, y0 + 1, 'G'); g.set(19, y0 + 2, 'G'); g.set(20, y0 + 2, 'G')   # chain
        g.rect(28, y0 + 1, 29, y0 + 13, 'i'); g.hline(10, 29, y0 + 13, 'i'); g.hline(10, 11, y0 + 1, 'Y')
    elif top == 'tank':
        g.rect(12, y0 + 1, 27, y0 + 13, 'O')
        g.rect(13, y0 - 1, 14, y0 + 1, 'O'); g.rect(25, y0 - 1, 26, y0 + 1, 'O')
        g.rect(10, y0, 12, y0 + 2, 'S'); g.rect(27, y0, 29, y0 + 2, 'S'); g.rect(15, y0, 24, y0, 'S')
        g.rect(10, y0 + 3, 11, y0 + 13, 'S'); g.rect(28, y0 + 3, 29, y0 + 13, 's')
        g.rect(26, y0 + 1, 27, y0 + 13, 'o'); g.hline(12, 27, y0 + 13, 'o')
        g.put(17, y0 + 6, "BBBB.\nB...B\nBBBB.\nB...B\nBBBB.") if st['name'] == 'bario' else None
        g.replace('B', 'p') if False else None
    elif top in ('tee_blue', 'tee_black'):
        c, sh, hl = ('1', '2', '3') if top == 'tee_blue' else ('#', '@', '$')
        g.hline(12, 27, y0, c); g.rect(10, y0 + 1, 29, y0 + 13, c)
        g.rect(28, y0 + 1, 29, y0 + 13, sh); g.hline(10, 29, y0 + 13, sh); g.hline(10, 11, y0 + 1, hl)
        g.rect(17, y0, 22, y0, sh)
        if top == 'tee_black':
            g.put(17, y0 + 4, "&&&&.\n&...&\n&&&&.\n&...&\n&&&&.")
        else:
            g.put(16, y0 + 5, ".OO.OO.\nOOOOOOO\n.OOOOO.\n..OOO..\n...O...")   # little heart print
    elif top == 'hoodie':
        g.hline(11, 28, y0, '#'); g.rect(9, y0 + 1, 30, y0 + 13, '#')
        g.rect(9, y0 - 2, 30, y0 + 1, '#'); g.rect(12, y0 - 2, 27, y0 - 1, '@')          # hood collar
        g.rect(15, y0 - 1, 24, y0 - 1, 's')
        g.vline(18, y0 + 1, y0 + 6, 'O'); g.vline(21, y0 + 1, y0 + 6, 'O')               # drawstrings
        g.hline(12, 27, y0 + 9, '@'); g.rect(12, y0 + 10, 27, y0 + 12, '$'); g.hline(12, 27, y0 + 10, '@')   # pocket
        g.rect(29, y0 + 1, 30, y0 + 13, '@'); g.hline(9, 30, y0 + 13, '@'); g.vline(9, y0 + 1, y0 + 8, '$')
    elif top == 'vest':
        g.rect(11, y0, 28, y0 + 13, '#')
        g.rect(17, y0, 22, y0 + 13, '@')                                                  # dark shirt under
        g.vline(16, y0, y0 + 13, '$'); g.vline(23, y0, y0 + 13, '$')                      # vest edges
        for yy in range(y0 + 2, y0 + 13, 3):
            g.set(16, yy, 'G'); g.set(23, yy, 'G')                                        # studs
        g.rect(10, y0, 10, y0 + 13, 'S'); g.rect(29, y0, 29, y0 + 13, 's')
        g.hline(11, 28, y0 + 13, '@')


# ------------------------------------------------------------------ ARMS (front, capsule)
def arm_front(g, st, sx, sy, hx, hy, side, sleeve_len=None, hand=True):
    a = G(g.w, g.h)
    top = st['top']
    sl = st.get('sleeves', 'long')
    buff = st.get('arms') == 'buff'
    r = 3.0 if buff else 2.6
    skin_sh = 's'
    capsule(a, sx, sy, hx, hy, r, 'S')
    if buff:
        capsule(a, sx - 0.6, sy, hx - 0.6, hy, 1.2, 'Z' if side == 'L' else 'S')
    sleeve = {'shirt': ('T', 't', 'u'), 'jersey': ('O', 'R', 'o'), 'suit': ('I', 'i', 'i'),
              'tee_blue': ('1', '2', '2'), 'tee_black': ('#', '@', '@'), 'hoodie': ('#', '@', '@')}.get(top)
    if sl != 'none' and sleeve:
        frac = 1.0 if sl == 'long' else 0.42
        ex, ey = sx + (hx - sx) * frac, sy + (hy - sy) * frac
        capsule(a, sx, sy, ex, ey, r, sleeve[0])
        if top == 'shirt':
            capsule(a, sx, sy, ex, ey, 0.9, sleeve[1])
        if sl == 'long':
            a.ellipse(hx, hy, r, r, sleeve[2])              # cuff
        else:
            a.ellipse(ex, ey, r, r, sleeve[1] if top == 'jersey' else sleeve[2])
    if hand:
        a.ellipse(hx, hy + 1.6, 2.2, 2.2, 'S'); a.ellipse(hx + 0.6, hy + 2.2, 1.2, 1.2, skin_sh)
        if top == 'suit':
            a.set(int(hx) + (1 if side == 'R' else -1), int(hy) + 1, 'G')
    a.outline_grow('K')
    g.paste(a, 0, 0)


ARMS_DOWN = {'L': ((6.5, 34), (6.0, 45)), 'R': ((33.5, 34), (34.0, 45))}


# ------------------------------------------------------------------ LEGS (front)
def legs_front(g, st, y0=46):
    p = st['pants']
    sh = st['shoe']
    if p == 'jeans':
        g.hline(10, 29, y0, 'n'); g.hline(19, 20, y0, 'g')
        g.rect(10, y0 + 1, 29, y0 + 2, 'N'); g.rect(10, y0 + 3, 18, y0 + 7, 'N'); g.rect(21, y0 + 3, 29, y0 + 7, 'N')
        g.hline(19, 20, y0 + 2, 'n'); g.rect(17, y0 + 1, 18, y0 + 7, 'n'); g.rect(28, y0 + 1, 29, y0 + 7, 'n')
        g.vline(11, y0 + 1, y0 + 7, 'M'); g.vline(22, y0 + 3, y0 + 7, 'M'); g.hline(10, 29, y0 + 1, 'n')
        shoe_y = y0 + 8
    elif p == 'cream':
        g.hline(10, 29, y0, 'i'); g.hline(19, 20, y0, 'G')
        g.rect(10, y0 + 1, 29, y0 + 2, 'I'); g.rect(10, y0 + 3, 18, y0 + 7, 'I'); g.rect(21, y0 + 3, 29, y0 + 7, 'I')
        g.hline(19, 20, y0 + 2, 'i'); g.rect(17, y0 + 1, 18, y0 + 7, 'i'); g.rect(28, y0 + 1, 29, y0 + 7, 'i')
        g.vline(11, y0 + 1, y0 + 7, 'Y'); g.vline(22, y0 + 3, y0 + 7, 'Y')
        shoe_y = y0 + 8
    else:
        col = {'shorts_white': ('O', 'o', '='), 'shorts_black': ('#', '@', '$'), 'shorts_blue': ('1', '2', '3')}[p]
        c, s_, h_ = col
        g.hline(10, 29, y0, s_)
        g.rect(10, y0 + 1, 29, y0 + 1, c); g.rect(10, y0 + 2, 18, y0 + 4, c); g.rect(21, y0 + 2, 29, y0 + 4, c)
        g.rect(17, y0 + 1, 18, y0 + 4, s_); g.rect(28, y0 + 1, 29, y0 + 4, s_); g.vline(11, y0 + 1, y0 + 4, h_)
        g.hline(19, 20, y0 + 1, s_)
        if p == 'shorts_white':
            g.hline(10, 18, y0 + 4, 'R'); g.hline(21, 29, y0 + 4, 'R')
        # legs
        g.rect(11, y0 + 5, 18, y0 + 6, 'S'); g.rect(21, y0 + 5, 28, y0 + 6, 'S')
        g.vline(18, y0 + 5, y0 + 6, 's'); g.vline(28, y0 + 5, y0 + 6, 's')
        if p == 'shorts_white':
            g.rect(11, y0 + 7, 18, y0 + 7, 'R'); g.rect(21, y0 + 7, 28, y0 + 7, 'R')     # sock trim
        else:
            g.rect(11, y0 + 7, 18, y0 + 7, 'S'); g.rect(21, y0 + 7, 28, y0 + 7, 'S')
        shoe_y = y0 + 8
    O, o, X = sh
    for (a, b) in ((7, 18), (21, 32)):
        g.hline(a + 1, b - 1, shoe_y, O); g.rect(a, shoe_y + 1, b, shoe_y + 2, O); g.hline(a, b, shoe_y + 3, X)
        g.hline(a + 3, b - 3, shoe_y, o); g.hline(a + 1, b - 1, shoe_y + 2, o)
        g.set(a, shoe_y + 1, o); g.set(b, shoe_y + 1, o)


# ------------------------------------------------------------------ FRONT FIGURE
def figure_front(st, mouth=None, arms=None, dy=0, legs=True, eyes=None, draw_arms=True):
    """arms: dict side -> ((sx,sy),(hx,hy)) or None for hanging. eyes='closed' for sleepy/meditating."""
    g = G(BW, BH)
    if st.get('cap'):
        cap_front(g, dy)
    else:
        hair_front(g, st, dy)
    head_front(g, st, 16 + dy, mouth)
    if eyes == 'closed' and not st.get('glasses'):
        y0 = 16 + dy
        g.rect(12, y0 + 5, 15, y0 + 7, 'S'); g.rect(24, y0 + 5, 27, y0 + 7, 'S')
        g.hline(12, 15, y0 + 6, 'k'); g.hline(24, 27, y0 + 6, 'k')
    elif eyes == 'x' and not st.get('glasses'):
        y0 = 16 + dy
        g.rect(12, y0 + 5, 15, y0 + 7, 'S'); g.rect(24, y0 + 5, 27, y0 + 7, 'S')
        for (ex) in (12, 24):
            g.set(ex, y0 + 5, 'k'); g.set(ex + 3, y0 + 5, 'k'); g.set(ex + 1, y0 + 6, 'k'); g.set(ex + 2, y0 + 6, 'k')
            g.set(ex, y0 + 7, 'k'); g.set(ex + 3, y0 + 7, 'k')
    torso_front(g, st, 32)
    if legs:
        legs_front(g, st, 46)
    g.outline('K')
    if draw_arms:
        arms = arms or ARMS_DOWN
        for side in ('L', 'R'):
            if arms.get(side) is None:
                continue
            (sx, sy), (hx, hy) = arms[side]
            arm_front(g, st, sx, sy, hx, hy, side)
    return g


def on_canvas(body, ox=OX, oy=0, w=CW, h=CH):
    c = G(w, h)
    c.paste(body, ox, oy)
    return c


def hang(ox=OX, oy=0):
    return {'L': ((6.5 + ox, 34 + oy), (6.0 + ox, 45 + oy)), 'R': ((33.5 + ox, 34 + oy), (34.0 + ox, 45 + oy))}


def arms_c(c, st, arms):
    for side in ('L', 'R'):
        a = arms.get(side)
        if a is None:
            continue
        (sx, sy), (hx, hy) = a
        arm_front(c, st, sx, sy, hx, hy, side)


def aura(canvas, color_out, color_in=None, grow=2):
    """Glow behind the figure: silhouette grown by N px."""
    sil = canvas.copy()
    for i in range(grow):
        sil.outline_grow(color_in if (color_in and i == 0) else color_out)
    out = G(canvas.w, canvas.h)
    out.paste(sil, 0, 0)
    out.paste(canvas, 0, 0)
    return out


# ------------------------------------------------------------------ SIDE VIEW (facing right)
def cap_side(g, dx=0, dy=0):
    cy = 12.5 + dy
    dome = lambda x, y: 2 + dy <= y <= 12 + dy
    g.ellipse(19 + dx, cy, 13.0, 11.3, 'p', n=2.6, only=dome)
    g.ellipse(18.4 + dx, cy - 0.7, 12.0, 10.5, 'Q', n=2.6, only=dome)
    g.ellipse(19.5 + dx, cy + 0.4, 12.0, 10.5, 'P', n=2.6, only=dome)
    b = 13 + dy
    g.hline(7 + dx, 31 + dx, b, 'p'); g.hline(8 + dx, 31 + dx, b + 1, 'k')
    g.hline(28 + dx, 34 + dx, b, 'P'); g.hline(26 + dx, 36 + dx, b + 1, 'P')
    g.hline(25 + dx, 36 + dx, b + 2, 'p'); g.hline(27 + dx, 35 + dx, b + 3, 'K'); g.hline(29 + dx, 33 + dx, b, 'Q')
    g.ellipse(25 + dx, cy - 4.5, 4.8, 3.6, 'k'); g.ellipse(25 + dx, cy - 4.5, 4.0, 2.9, 'W')
    g.put(24 + dx, int(cy) - 6, "BB.\nB.B\nBB.\nB.B\nBB.")


def hair_side(g, st, dx=0, dy=0):
    main, shade, hl = st['hair']
    r = st.get('curl', 2.5)
    g.ellipse(20 + dx, 12 + dy, 11.5, 8.5, shade, n=2.2, only=lambda x, y: y <= 16 + dy)
    g.ellipse(19.4 + dx, 11.4 + dy, 10.8, 8.0, main, n=2.2, only=lambda x, y: y <= 16 + dy)
    for (bx, by) in ((10, 9), (13, 5), (18, 3), (23, 3), (28, 5), (30, 9)):
        g.ellipse(bx + dx, by + dy, r, r, main); g.set(int(bx + dx) - 1, int(by + dy) - 1, hl)
    g.rect(11 + dx, 16 + dy, 14 + dx, 22 + dy, main)       # back of head hair
    g.rect(11 + dx, 16 + dy, 12 + dx, 22 + dy, shade)
    g.hline(15 + dx, 29 + dx, 16 + dy, main)


def head_side(g, st, dx=0, y0=16, mouth=None):
    x = dx
    g.rect(12 + x, y0, 30 + x, y0 + 11, 'S')
    g.hline(14 + x, 30 + x, y0 + 12, 'S'); g.hline(16 + x, 29 + x, y0 + 13, 'S'); g.hline(18 + x, 27 + x, y0 + 14, 'S')
    if st.get('cap'):
        g.rect(12 + x, y0, 14 + x, y0 + 6, 'H'); g.rect(12 + x, y0 + 7, 13 + x, y0 + 9, 'H')
        g.hline(15 + x, 30 + x, y0 + 2, 's')
    g.rect(14 + x, y0 + 10, 16 + x, y0 + 12, 's'); g.hline(18 + x, 27 + x, y0 + 14, 's')
    g.rect(14 + x, y0 + 5, 16 + x, y0 + 8, 'S'); g.rect(15 + x, y0 + 6, 16 + x, y0 + 7, 's')      # ear
    b = st.get('brow', 'H')
    g.hline(23 + x, 29 + x, y0 + 4, b)
    if st.get('glasses'):
        g.rect(23 + x, y0 + 5, 30 + x, y0 + 7, '@'); g.hline(23 + x, 30 + x, y0 + 5, 'G'); g.set(23 + x, y0 + 6, '$')
        g.hline(15 + x, 22 + x, y0 + 5, 'G')                                                       # temple arm
    else:
        g.set(29 + x, y0 + 3, b)
        g.rect(24 + x, y0 + 5, 27 + x, y0 + 7, 'E'); g.rect(26 + x, y0 + 6, 27 + x, y0 + 7, 'e')
        g.hline(24 + x, 27 + x, y0 + 5, 'k')
    g.set(31 + x, y0 + 6, 'Z'); g.set(31 + x, y0 + 7, 'S'); g.set(31 + x, y0 + 8, 's')             # nose
    m = y0 + 9
    if st.get('mustache'):
        g.hline(27 + x, 31 + x, m, 'H'); g.set(32 + x, m - 1, 'H'); g.set(32 + x, m, 'H')
        g.hline(24 + x, 32 + x, m + 1, 'H'); g.hline(25 + x, 30 + x, m + 2, 'H'); g.hline(28 + x, 30 + x, m, 'h')
        base = 'neutral'
    else:
        base = 'smile' if st.get('smile') else 'neutral'
    mouth = mouth or base
    if mouth == 'neutral':
        g.hline(26 + x, 29 + x, m + 3, 's')
    elif mouth == 'smile':
        g.hline(24 + x, 30 + x, m + 2, 'k'); g.hline(25 + x, 29 + x, m + 3, 'E'); g.hline(25 + x, 29 + x, m + 4, 'k')
    elif mouth in ('open', 'shout'):
        g.rect(25 + x, m + 1, 31 + x, m + 4, 'K'); g.rect(26 + x, m + 3, 30 + x, m + 4, 'r'); g.hline(26 + x, 30 + x, m + 1, 'E')
    if st.get('goatee'):
        g.rect(25 + x, m + 4, 29 + x, m + 5, 'H'); g.hline(18 + x, 24 + x, m + 4, 'k')


def torso_side(g, st, dx=0, y0=32):
    x = dx
    top = st['top']
    g.rect(18 + x, y0 - 1, 25 + x, y0 - 1, 's')
    if top == 'shirt':
        g.hline(16 + x, 26 + x, y0, 'T'); g.rect(14 + x, y0 + 1, 27 + x, y0 + 13, 'T')
        for sx in (16, 19, 22):
            g.vline(sx + x, y0 + 1, y0 + 13, 't')
        g.vline(26 + x, y0 + 1, y0 + 13, 'U'); g.vline(27 + x, y0 + 1, y0 + 13, 'U')
        for yy in (y0 + 4, y0 + 8, y0 + 12):
            g.set(26 + x, yy, 'u')
        g.rect(14 + x, y0 + 1, 15 + x, y0 + 13, 'u'); g.hline(14 + x, 27 + x, y0 + 13, 'u')
        g.put(18 + x, y0, "UU....UU\n.U....U.")
    elif top == 'jersey':
        g.hline(16 + x, 26 + x, y0, 'O'); g.rect(14 + x, y0 + 1, 27 + x, y0 + 13, 'O')
        g.rect(14 + x, y0 + 4, 27 + x, y0 + 6, 'R'); g.hline(14 + x, 27 + x, y0 + 7, 'r')
        g.rect(14 + x, y0 + 1, 15 + x, y0 + 13, 'o'); g.hline(14 + x, 27 + x, y0 + 13, 'o')
        g.put(18 + x, y0, "RR....RR\n.RRRRRR.")
    elif top == 'suit':
        g.hline(16 + x, 26 + x, y0, 'I'); g.rect(14 + x, y0 + 1, 27 + x, y0 + 13, 'I')
        g.rect(24 + x, y0, 27 + x, y0 + 13, 'O'); g.rect(22 + x, y0 + 1, 23 + x, y0 + 13, 'j')
        for yy in range(y0 + 2, y0 + 13, 3):
            g.set(22 + x, yy, 'G')
        g.rect(14 + x, y0 + 1, 15 + x, y0 + 13, 'i'); g.hline(14 + x, 27 + x, y0 + 13, 'i')


def arm_side(g, st, sx, sy, hx, hy, far=False):
    a = G(g.w, g.h)
    top = st['top']
    sl = st.get('sleeves', 'long')
    sleeve = {'shirt': 'T', 'jersey': 'O', 'suit': 'I'}.get(top, 'T')
    if far:
        capsule(a, sx, sy, hx, hy, 2.5, 'u' if top == 'shirt' else ('o' if top == 'jersey' else 'i'))
        a.ellipse(hx, hy + 1.2, 1.9, 1.9, 's')
    else:
        capsule(a, sx, sy, hx, hy, 2.5, 'S')
        if sl != 'none':
            frac = 1.0 if sl == 'long' else 0.45
            ex, ey = sx + (hx - sx) * frac, sy + (hy - sy) * frac
            capsule(a, sx, sy, ex, ey, 2.5, sleeve)
            if top == 'shirt':
                capsule(a, sx, sy, ex, ey, 0.9, 't')
            a.ellipse(ex, ey, 2.5, 2.5, 'u' if top == 'shirt' else ('R' if top == 'jersey' else 'i'))
        a.ellipse(hx, hy + 1.2, 1.9, 1.9, 'S'); a.set(int(hx) + 1, int(hy) + 2, 's')
    a.outline_grow('K')
    g.paste(a, 0, 0)


def leg_side(g, st, hx, hy, ax, ay, far=False, lift=0):
    l = G(g.w, g.h)
    p = st['pants']
    if p == 'jeans':
        main, hl = ('n', 'n') if far else ('N', 'M')
        capsule(l, hx, hy, ax, ay - 2, 3.0, main)
        if not far:
            capsule(l, hx - 1, hy, ax - 1, ay - 2, 1.0, hl)
    elif p == 'cream':
        capsule(l, hx, hy, ax, ay - 2, 3.0, 'i' if far else 'I')
    else:
        col = {'shorts_white': 'O', 'shorts_black': '#', 'shorts_blue': '1'}[p]
        mx, my = hx + (ax - hx) * 0.45, hy + (ay - 2 - hy) * 0.45
        capsule(l, mx, my, ax, ay - 2, 2.6, 's' if far else 'S')             # bare leg
        capsule(l, hx, hy, mx, my, 3.0, ('o' if far else col))
        if p == 'shorts_white':
            l.ellipse(mx, my, 3.0, 3.0, 'R'); l.ellipse(ax, ay - 4, 2.6, 1.6, 'R')   # trim + sock top
    O, o, X = st['shoe']
    sy = ay - lift
    l.rect(int(ax) - 5, sy - 3, int(ax) + 5, sy - 1, o if far else O)
    l.hline(int(ax) - 4, int(ax) + 4, sy - 4, o if far else O)
    l.hline(int(ax) - 5, int(ax) + 5, sy, X)
    l.hline(int(ax) - 2, int(ax) + 2, sy - 3, o)
    l.outline_grow('K')
    g.paste(l, 0, 0)


WALK = [
    (0, (27, 55), (14, 55), (27, 44), (17, 43), 0, 1),
    (1, (22, 56), (18, 56), (24, 45), (19, 44), 0, 0),
    (0, (15, 55), (27, 55), (17, 44), (27, 43), 1, 0),
    (1, (20, 56), (21, 56), (23, 45), (20, 44), 0, 0),
]
RUN = [
    (0, (31, 54), (10, 53), (30, 42), (14, 39), 0, 2),
    (2, (24, 56), (17, 56), (27, 43), (16, 40), 0, 0),
    (0, (11, 53), (31, 54), (15, 42), (29, 39), 2, 0),
    (2, (18, 56), (23, 56), (16, 43), (27, 40), 0, 0),
]
STAND = (0, (22, 56), (18, 56), (24, 45), (19, 44), 0, 0)
JUMP = (-3, (25, 51), (15, 50), (29, 30), (13, 31), 0, 0)


def figure_side(st, frame=STAND, lean=0, mouth=None, near_arm=True):
    g = G(BW, BH)
    dy, na, fa, nh, fh, nl, fl = frame
    dx = lean
    arm_side(g, st, 17 + dx, 34 + dy, fh[0] + dx, fh[1] + dy, far=True)
    leg_side(g, st, 19, 48 + dy, fa[0], fa[1], far=True, lift=fl)
    if st.get('cap'):
        cap_side(g, dx, dy)
    else:
        hair_side(g, st, dx, dy)
    head_side(g, st, dx, 16 + dy, mouth)
    torso_side(g, st, dx, 32 + dy)
    g.hline(14 + dx, 27 + dx, 46 + dy, 'n' if st['pants'] == 'jeans' else ('i' if st['pants'] == 'cream' else 'o'))
    leg_side(g, st, 22, 48 + dy, na[0], na[1], far=False, lift=nl)
    if near_arm:
        arm_side(g, st, 23 + dx, 34 + dy, nh[0] + dx, nh[1] + dy, far=False)
    g.outline('K')
    return g


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), 'out')
    render_sheet([figure_front(BARIO), figure_front(MEISTER), figure_front(DIREKTOR)],
                 os.path.join(out, 'fig_front_x6.png'), scale=6, labels=['bario', 'meister', 'direktor'])
    render_sheet([figure_side(BARIO), figure_side(MEISTER), figure_side(DIREKTOR)] + [figure_side(BARIO, f) for f in WALK],
                 os.path.join(out, 'fig_side_x6.png'), scale=6)
    render_sheet([figure_front(FORMS[k]) for k in FORMS], os.path.join(out, 'forms_x6.png'), scale=6, labels=list(FORMS))
