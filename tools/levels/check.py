"""Level check v2 – models Bario's real body and jump.

Body 26x52 px = 1 tile wide, needs 2 free tiles of headroom. Jump envelope measured in-game (JUMP_V 700, run speed):
see PROFILE. Comfort limits are stricter than physics on purpose – a casual player on a touch stick must make every jump.
Checks per level: S->F path, every card/royal collectible, every block hittable and passable, no 1-tile slits under
floating solids, checkpoints reachable. Run: python3 tools/levels/check.py [level ...]"""
import glob, os, sys
from collections import deque

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
# comfort limits (tiles). Measured (JUMP_V 700, running): apex 130 px = 4.0 tiles, same-level landing at 176 px,
# feet >= 1/2/3 tiles until dx 164/152/136 px. Main path (S->F) only uses 2-tile climbs and short gaps; optional
# bonuses (cards, royals, blocks) may need a 3-tile running jump.
MAIN = {'up': 2, 'gap': {0: 4, 1: 3, 2: 2}}
BONUS = {'up': 3, 'gap': {0: 4, 1: 4, 2: 3, 3: 2}}
ITEM_UP = 4                            # cards up to 4 rows above a standing spot are collectible
BLOCK_HIT = (2, 4)                     # a block needs 2..4 free rows under it to be walked under and bumped
VENT_UP, VENT_DX = 8, 3
BLOCKS = set('?!HGKYDR123')
SOLID = set('#=B') | BLOCKS


def load(path):
    rows = [l for l in open(path).read().split('\n') if l and not l.startswith('//')]
    h, w = len(rows), max(len(r) for r in rows)
    return [r.ljust(w, '.') for r in rows], w, h


def check(path):
    g, w, h = load(path)
    issues = []
    at = lambda x, y: g[y][x] if 0 <= x < w and 0 <= y < h else ('#' if y >= h else '.')
    solidset = set()
    for y in range(h):
        for x in range(w):
            ch = g[y][x]
            if ch in SOLID: solidset.add((x, y))
            if ch == 'P': solidset.add((x, y)); solidset.add((x, y - 1))
            if ch == '-': solidset.add((x, y)); solidset.add((x + 1, y))
    solid = lambda x, y: (x, y) in solidset
    free = lambda x, y: 0 <= y < h and 0 <= x < w and not solid(x, y)

    # standing spots: free cell with free cell above and a surface below
    stand = set()
    for y in range(h):
        for x in range(w):
            if free(x, y) and free(x, y - 1) and solid(x, y + 1): stand.add((x, y))
    movers = {}
    for y in range(h):
        for x in range(w):
            ch = g[y][x]
            if ch == '~': cells = [(x + k, y - 1) for k in range(-3, 6)]
            elif ch == '|': cells = [(x + i, y - 1 + k) for i in (0, 1) for k in range(-3, 4)]
            else: continue
            for (cx, cy) in cells:
                if free(cx, cy) and free(cx, cy - 1): stand.add((cx, cy)); movers[(cx, cy)] = ch

    # slits: floating solid with exactly one free tile below -> Bario can neither pass nor stand
    for (x, y) in sorted(solidset):
        if not free(x, y + 1): continue
        gap = 0
        yy = y + 1
        while free(x, yy): gap += 1; yy += 1
        if gap == 1: issues.append(f'slit: 1-tile gap under solid at col {x} row {y}')

    S = [(x, y) for y in range(h) for x in range(w) if g[y][x] == 'S']
    F = [(x, y) for y in range(h) for x in range(w) if g[y][x] == 'F']
    if not S or not F: return ['no S/F']
    near = lambda pt: min(stand, key=lambda p: abs(p[0] - pt[0]) * 4 + abs(p[1] - pt[1]))
    start, goal = near(S[0]), near(F[0])

    def headroom(x, y, k):
        return all(free(x, y - 1 - i) for i in range(1, k + 1))

    def can_jump(a, b, rule):
        (x, y), (x2, y2) = a, b
        dy = y - y2            # >0 = climb
        if dy > rule['up']: return False
        dx = abs(x2 - x)
        if dx == 0: return False
        gap = dx - 1
        if gap > rule['gap'][max(0, dy)]: return False
        if dy >= 1 and not headroom(x, y, dy): return False   # the body rises in its own column first (no ceiling above the take-off)
        # the body passes at roughly the higher spot's height between the two columns
        band = min(y, y2)
        step = 1 if x2 > x else -1
        for cx in range(x + step, x2, step):
            if not (free(cx, band) and free(cx, band - 1)): return False
        return True

    vents = [(x, y) for y in range(h) for x in range(w) if g[y][x] == '^']
    def vent_edges(a):
        out = []
        for (vx, vy) in vents:
            if abs(a[0] - vx) <= 1 and a[1] == vy:
                for (x2, y2) in stand:
                    if 1 <= vy - y2 <= VENT_UP and abs(x2 - vx) <= VENT_DX and all(free(vx, r) for r in range(y2, vy)):
                        out.append((x2, y2))
        return out

    def bfs(rule):
        seen = {start}; q = deque([start])
        while q:
            a = q.popleft()
            nxt = [b for b in stand if b not in seen and can_jump(a, b, rule)] + [b for b in vent_edges(a) if b not in seen]
            for b in nxt: seen.add(b); q.append(b)
        return seen
    seen = bfs(MAIN)
    bonus = bfs(BONUS)
    if goal not in seen:
        far = max(seen, key=lambda p: p[0])
        issues.append(f'PATH: flag unreachable, furthest col {far[0]} row {far[1]} (flag col {F[0][0]})')
    for (x, y) in [(x, y) for y in range(h) for x in range(w) if g[y][x] == 'k']:
        if near((x, y)) not in seen: issues.append(f'checkpoint unreachable at col {x}')

    # items
    for y in range(h):
        for x in range(w):
            ch = g[y][x]
            if ch in 'cC':
                if solid(x, y + 1):
                    ok = (x, y) in bonus
                else:
                    ok = any((sx, sy) in bonus and 0 <= sy - y <= ITEM_UP and abs(sx - x) <= 2
                             and all(free(x, r) for r in range(y, min(sy, y + 2) + 1)) for (sx, sy) in stand)
                if not ok: issues.append(f'item {ch} unreachable at col {x} row {y}')
            elif ch in BLOCKS:
                ok = any((sx, sy) in bonus and BLOCK_HIT[0] <= sy - y <= BLOCK_HIT[1] and abs(sx - x) <= 1
                         and all(free(x, r) for r in range(y + 1, sy + 1)) for (sx, sy) in stand)
                if not ok: issues.append(f'block {ch} not hittable at col {x} row {y}')
    return issues


if __name__ == '__main__':
    files = sorted(glob.glob(os.path.join(ROOT, 'levels', 'src', '*.txt')))
    if len(sys.argv) > 1: files = [f for f in files if os.path.basename(f)[:-4] in sys.argv[1:]]
    else: files = [f for f in files if not os.path.basename(f).startswith('t')]   # t1/t2 are debug playgrounds
    bad = 0
    for p in files:
        name = os.path.basename(p)[:-4]
        r = check(p)
        if r:
            bad += 1
            print(f'{name:6} FAIL')
            for i in r: print('        ' + i)
        else:
            print(f'{name:6} ok')
    print(f'{bad} level(s) with issues')
    sys.exit(1 if bad else 0)
