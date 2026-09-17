import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from px import *

W, H = 40, 58


def capsule(g, x0, y0, x1, y1, r, c):
    steps = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
    for i in range(steps + 1):
        t = i / max(steps, 1)
        cx = x0 + (x1 - x0) * t
        cy = y0 + (y1 - y0) * t
        g.ellipse(cx, cy, r, r, c)


# ---------------------------------------------------------------- FRONT VIEW
def cap_front(g, dy=0):
    cy = 12.5 + dy
    dome = lambda x, y: 2 + dy <= y <= 12 + dy
    g.ellipse(20, cy, 18.0, 11.3, 'p', n=2.6, only=dome)
    g.ellipse(19.3, cy - 0.7, 16.8, 10.5, 'Q', n=2.6, only=dome)
    g.ellipse(20.4, cy + 0.4, 16.8, 10.5, 'P', n=2.6, only=dome)
    b = 13 + dy
    g.hline(3, 36, b, 'p'); g.hline(3, 36, b + 1, 'k')
    # visor: wide ledge, curving down in the middle
    g.hline(6, 33, b + 2, 'P'); g.hline(7, 14, b + 2, 'Q')
    g.hline(9, 30, b + 3, 'p')
    g.hline(10, 29, b + 4, 'K')
    # badge with soft ring
    g.ellipse(20, cy - 5, 6.4, 4.6, 'k')
    g.ellipse(20, cy - 5, 5.6, 3.9, 'W')
    g.put(18, int(cy) - 7, "BBBB.\nB...B\nBBBB.\nB...B\nBBBB.")


def head_front(g, y0=16, mouth='neutral'):
    g.rect(8, y0, 31, y0 + 11, 'S')
    g.hline(9, 30, y0 + 12, 'S'); g.hline(10, 29, y0 + 13, 'S'); g.hline(12, 27, y0 + 14, 'S')
    g.rect(8, y0, 9, y0 + 3, 'H'); g.rect(30, y0, 31, y0 + 3, 'H')
    g.hline(10, 29, y0 + 2, 's')
    g.rect(30, y0 + 2, 31, y0 + 11, 's'); g.hline(28, 29, y0 + 12, 's'); g.hline(26, 28, y0 + 13, 's')
    g.hline(12, 27, y0 + 14, 's')
    g.rect(9, y0 + 3, 10, y0 + 7, 'Z')
    # ears
    g.rect(6, y0 + 5, 7, y0 + 8, 'S'); g.hline(6, 7, y0 + 8, 's')
    g.rect(32, y0 + 5, 33, y0 + 8, 'S'); g.hline(32, 33, y0 + 8, 's')
    # brows
    g.hline(11, 16, y0 + 4, 'H'); g.hline(23, 28, y0 + 4, 'H')
    g.hline(11, 12, y0 + 3, 'H'); g.hline(27, 28, y0 + 3, 'H')
    # eyes
    g.rect(12, y0 + 5, 15, y0 + 7, 'E'); g.rect(24, y0 + 5, 27, y0 + 7, 'E')
    g.rect(13, y0 + 6, 14, y0 + 7, 'e'); g.rect(25, y0 + 6, 26, y0 + 7, 'e')
    g.hline(12, 15, y0 + 5, 'k'); g.hline(24, 27, y0 + 5, 'k')
    g.set(13, y0 + 6, 'E'); g.set(25, y0 + 6, 'E')
    # nose
    g.set(19, y0 + 7, 'Z'); g.hline(19, 20, y0 + 8, 's')
    # mustache
    m = y0 + 9
    g.hline(13, 14, m, 'H'); g.hline(17, 22, m, 'H'); g.hline(25, 26, m, 'H')
    g.hline(12, 27, m + 1, 'H')
    g.hline(13, 17, m + 2, 'H'); g.hline(22, 26, m + 2, 'H')
    g.hline(18, 21, m, 'h'); g.set(12, m, 'H'); g.set(27, m, 'H')
    if mouth == 'neutral':
        g.hline(18, 21, m + 3, 's')
    elif mouth == 'open':
        g.rect(17, m + 3, 22, m + 4, 'K'); g.hline(18, 21, m + 4, 'r')
    elif mouth == 'smile':
        g.hline(17, 22, m + 3, 's'); g.set(16, m + 2, 's'); g.set(23, m + 2, 's')


def torso_front(g, y0=32, shirt='stripes'):
    """y0 = shoulder row. Torso x10..29, arms x4..8 / 31..35 with dark separators."""
    g.rect(15, y0 - 1, 24, y0 - 1, 's')                      # neck
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
    # arms
    for (ax0, ax1, sep, hl, sh) in ((4, 8, 9, 4, 8), (31, 35, 30, 31, 35)):
        g.rect(ax0, y0 + 2, ax1, y0 + 12, 'T')
        g.hline(ax0 + 1, ax1 - 1, y0 + 1, 'T')
        g.vline(ax0 + 2, y0 + 2, y0 + 12, 't')
        g.vline(sh, y0 + 2, y0 + 12, 'u'); g.vline(hl, y0 + 2, y0 + 6, 'U')
        g.vline(sep, y0 + 1, y0 + 12, 'K')
        g.hline(ax0, ax1, y0 + 12, 'u')                       # cuff
        g.rect(ax0, y0 + 13, ax1, y0 + 16, 'S'); g.hline(ax0, ax1, y0 + 16, 's')
        g.set(ax0 if ax0 > 20 else ax1, y0 + 14, 's')
    g.set(9, y0, 'K'); g.set(30, y0, 'K')


def legs_front(g, y0=46, stance='stand'):
    g.hline(10, 29, y0, 'n'); g.hline(19, 20, y0, 'g')
    g.rect(10, y0 + 1, 29, y0 + 2, 'N')
    g.rect(10, y0 + 3, 18, y0 + 7, 'N'); g.rect(21, y0 + 3, 29, y0 + 7, 'N')
    g.hline(19, 20, y0 + 2, 'n')
    g.rect(17, y0 + 1, 18, y0 + 7, 'n'); g.rect(28, y0 + 1, 29, y0 + 7, 'n')
    g.vline(11, y0 + 1, y0 + 7, 'M'); g.vline(22, y0 + 3, y0 + 7, 'M')
    g.hline(10, 29, y0 + 1, 'n')
    s = y0 + 8
    for (a, b) in ((7, 18), (21, 32)):
        g.hline(a + 1, b - 1, s, 'O'); g.rect(a, s + 1, b, s + 2, 'O'); g.hline(a, b, s + 3, 'X')
        g.hline(a + 3, b - 3, s, 'o'); g.hline(a + 1, b - 1, s + 2, 'o')
        g.set(a, s + 1, 'o'); g.set(b, s + 1, 'o')


def bario_front(mouth='neutral'):
    g = G(W, H)
    cap_front(g); head_front(g, 16, mouth); torso_front(g, 32); legs_front(g, 46)
    g.outline('K')
    return g


# ---------------------------------------------------------------- SIDE VIEW (facing right)
def cap_side(g, dx=0, dy=0):
    cy = 12.5 + dy
    dome = lambda x, y: 2 + dy <= y <= 12 + dy
    g.ellipse(19 + dx, cy, 13.0, 11.3, 'p', n=2.6, only=dome)
    g.ellipse(18.4 + dx, cy - 0.7, 12.0, 10.5, 'Q', n=2.6, only=dome)
    g.ellipse(19.5 + dx, cy + 0.4, 12.0, 10.5, 'P', n=2.6, only=dome)
    b = 13 + dy
    g.hline(7 + dx, 31 + dx, b, 'p'); g.hline(8 + dx, 31 + dx, b + 1, 'k')
    # visor wedge to the right
    g.hline(28 + dx, 34 + dx, b, 'P'); g.hline(26 + dx, 36 + dx, b + 1, 'P')
    g.hline(25 + dx, 36 + dx, b + 2, 'p'); g.hline(27 + dx, 35 + dx, b + 3, 'K')
    g.hline(29 + dx, 33 + dx, b, 'Q')
    # badge on the front side
    g.ellipse(25 + dx, cy - 4.5, 4.8, 3.6, 'k'); g.ellipse(25 + dx, cy - 4.5, 4.0, 2.9, 'W')
    g.put(24 + dx, int(cy) - 6, "BB.\nB.B\nBB.\nB.B\nBB.")


def head_side(g, dx=0, y0=16, mouth='neutral'):
    x = dx
    g.rect(12 + x, y0, 30 + x, y0 + 11, 'S')
    g.hline(14 + x, 30 + x, y0 + 12, 'S'); g.hline(16 + x, 29 + x, y0 + 13, 'S'); g.hline(18 + x, 27 + x, y0 + 14, 'S')
    g.rect(12 + x, y0, 14 + x, y0 + 6, 'H'); g.rect(12 + x, y0 + 7, 13 + x, y0 + 9, 'H')   # hair at the back
    g.hline(15 + x, 30 + x, y0 + 2, 's')
    g.rect(14 + x, y0 + 10, 16 + x, y0 + 12, 's'); g.hline(18 + x, 27 + x, y0 + 14, 's')
    # ear (back)
    g.rect(14 + x, y0 + 5, 16 + x, y0 + 8, 'S'); g.rect(15 + x, y0 + 6, 16 + x, y0 + 7, 's')
    # brow + eye
    g.hline(23 + x, 29 + x, y0 + 4, 'H'); g.set(29 + x, y0 + 3, 'H')
    g.rect(24 + x, y0 + 5, 27 + x, y0 + 7, 'E'); g.rect(26 + x, y0 + 6, 27 + x, y0 + 7, 'e')
    g.hline(24 + x, 27 + x, y0 + 5, 'k')
    # nose
    g.set(31 + x, y0 + 6, 'S'); g.hline(31 + x, 32 + x, y0 + 7, 'S'); g.set(31 + x, y0 + 8, 's'); g.set(32 + x, y0 + 8, 's')
    g.set(31 + x, y0 + 6, 'Z')
    # mustache sweeping back from the nose
    m = y0 + 9
    g.hline(26 + x, 32 + x, m, 'H'); g.set(33 + x, m - 1, 'H'); g.set(33 + x, m, 'H')
    g.hline(22 + x, 33 + x, m + 1, 'H')
    g.hline(23 + x, 29 + x, m + 2, 'H')
    g.hline(27 + x, 31 + x, m, 'h')
    if mouth == 'neutral':
        g.hline(26 + x, 29 + x, m + 3, 's')
    elif mouth == 'open':
        g.rect(26 + x, m + 3, 30 + x, m + 4, 'K'); g.hline(27 + x, 29 + x, m + 4, 'r')


def torso_side(g, dx=0, y0=32):
    x = dx
    g.rect(18 + x, y0 - 1, 25 + x, y0 - 1, 's')
    g.hline(16 + x, 26 + x, y0, 'T'); g.rect(14 + x, y0 + 1, 27 + x, y0 + 13, 'T')
    for sx in (16, 19, 22):
        g.vline(sx + x, y0 + 1, y0 + 13, 't')
    g.vline(26 + x, y0 + 1, y0 + 13, 'U'); g.vline(27 + x, y0 + 1, y0 + 13, 'U')
    for yy in (y0 + 4, y0 + 8, y0 + 12):
        g.set(26 + x, yy, 'u')
    g.rect(14 + x, y0 + 1, 15 + x, y0 + 13, 'u'); g.hline(14 + x, 27 + x, y0 + 13, 'u')
    g.put(18 + x, y0, "UU....UU\n.U....U.")


def arm_side(g, sx, sy, hx, hy, far=False):
    """Capsule arm from shoulder (sx,sy) to hand (hx,hy)."""
    a = G(g.w, g.h)
    capsule(a, sx, sy, hx, hy, 2.6, 'u' if far else 'T')
    if not far:
        # sleeve stripe along the arm + cuff
        capsule(a, sx, sy, hx, hy, 1.0, 't')
        a.ellipse(hx, hy, 2.6, 2.6, 'u')
        a.ellipse(hx, hy + 1.5, 2.2, 2.2, 'S')
    else:
        a.ellipse(hx, hy + 1.5, 2.0, 2.0, 's')
    a.outline_grow('K')
    g.paste(a, 0, 0)


def leg_side(g, hx, hy, ax, ay, far=False, lift=0):
    l = G(g.w, g.h)
    capsule(l, hx, hy, ax, ay - 2, 3.0, 'n' if far else 'N')
    if not far:
        capsule(l, hx - 1, hy, ax - 1, ay - 2, 1.0, 'M')
    # shoe: long sneaker pointing right
    sy = ay - lift
    l.rect(int(ax) - 5, sy - 3, int(ax) + 5, sy - 1, 'o' if far else 'O')
    l.hline(int(ax) - 4, int(ax) + 4, sy - 4, 'o' if far else 'O')
    l.hline(int(ax) - 5, int(ax) + 5, sy, 'X')
    l.hline(int(ax) - 2, int(ax) + 2, sy - 3, 'o')
    l.outline_grow('K')
    g.paste(l, 0, 0)


WALK = [  # (body_dy, near_ankle, far_ankle, near_hand, far_hand, near_lift, far_lift)
    (0, (27, 55), (14, 55), (27, 46), (17, 44), 0, 1),
    (1, (22, 56), (18, 56), (24, 47), (19, 45), 0, 0),
    (0, (15, 55), (27, 55), (17, 46), (27, 44), 1, 0),
    (1, (20, 56), (21, 56), (23, 47), (20, 45), 0, 0),
]

RUN = [
    (0, (31, 54), (10, 53), (30, 43), (14, 40), 0, 2),
    (2, (24, 56), (17, 56), (27, 44), (16, 41), 0, 0),
    (0, (11, 53), (31, 54), (15, 43), (29, 40), 2, 0),
    (2, (18, 56), (23, 56), (16, 44), (27, 41), 0, 0),
]


def bario_side(frame=None, lean=0, mouth='neutral'):
    """frame: tuple from WALK/RUN or None for standing."""
    g = G(W, H)
    if frame is None:
        frame = (0, (22, 56), (18, 56), (24, 47), (19, 45), 0, 0)
    dy, na, fa, nh, fh, nl, fl = frame
    dx = lean
    # far arm first (behind body)
    arm_side(g, 17 + dx, 34 + dy, fh[0] + dx, fh[1] + dy, far=True)
    leg_side(g, 19, 48 + dy, fa[0], fa[1], far=True, lift=fl)
    cap_side(g, dx, dy); head_side(g, dx, 16 + dy, mouth); torso_side(g, dx, 32 + dy)
    g.hline(14 + dx, 27 + dx, 46 + dy, 'n')                     # waistband
    leg_side(g, 22, 48 + dy, na[0], na[1], far=False, lift=nl)
    arm_side(g, 23 + dx, 34 + dy, nh[0] + dx, nh[1] + dy, far=False)
    g.outline('K')
    return g


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), 'out')
    f = bario_front()
    render_sheet([f], os.path.join(out, 'bario_front_x8.png'), scale=8)
    walk = [bario_side(fr) for fr in WALK]
    run = [bario_side(fr, lean=2) for fr in RUN]
    render_sheet([bario_side()] + walk, os.path.join(out, 'bario_walk_x6.png'), scale=6, labels=['stand', 'w0', 'w1', 'w2', 'w3'])
    render_sheet(run, os.path.join(out, 'bario_run_x6.png'), scale=6, labels=['r0', 'r1', 'r2', 'r3'])
    render_sheet([f] + walk + run, os.path.join(out, 'bario_all_x2.png'), scale=2)
