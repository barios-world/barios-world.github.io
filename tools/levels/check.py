"""Reachability check: can Bario get from S to F with jumps of <=3 tiles up and <=4 tiles across?
Surfaces: ground/platform/brick tops, card & moving platforms, pipes, blocks. Prints unreachable levels + the first gap."""
import glob, os
from collections import deque

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
UP, ACROSS, DOWN = 3, 4, 99
SOLID = set('#=BP?!HGKYDR123-~|')

def check(path):
    rows = [l for l in open(path).read().split('\n') if l and not l.startswith('//')]
    h, w = len(rows), max(len(r) for r in rows)
    g = [r.ljust(w, '.') for r in rows]
    def solid(x, y): return 0 <= x < w and 0 <= y < h and g[y][x] in SOLID
    # standing spots: cell (x,y) free with solid below
    stand = set()
    for y in range(h - 1):
        for x in range(w):
            if not solid(x, y) and solid(x, y + 1) and not solid(x, y - 1):
                stand.add((x, y))
    # platforms are 2 wide; moving ones sweep +-3 tiles (vertical '|') or -3..+4 (horizontal '~')
    for y in range(h):
        for x in range(w):
            ch = g[y][x]
            if ch in '-~|':
                cells = [(x, y - 1), (x + 1, y - 1)]
                if ch == '|': cells = [(x + i, y - 1 + k) for i in (0, 1) for k in range(-3, 4)]
                if ch == '~': cells = [(x + k, y - 1) for k in range(-3, 5)]
                for (cx, cy) in cells:
                    if 0 <= cx < w and 0 <= cy < h and not solid(cx, cy): stand.add((cx, cy))
    S = F = None
    for y in range(h):
        for x in range(w):
            if g[y][x] == 'S': S = (x, y)
            if g[y][x] == 'F': F = (x, y)
    if not S or not F: return 'no S/F'
    start = min(stand, key=lambda p: abs(p[0] - S[0]) + abs(p[1] - S[1]))
    goal = min(stand, key=lambda p: abs(p[0] - F[0]) + abs(p[1] - F[1]))
    seen = {start}; q = deque([start]); far = start
    while q:
        x, y = q.popleft()
        if x > far[0]: far = (x, y)
        if (x, y) == goal: return None
        for (nx, ny) in stand:
            if (nx, ny) in seen: continue
            dx, dy = nx - x, y - ny            # dy>0 means higher
            if dy > UP or dy < -DOWN: continue
            # body is 26px wide: take-off/landing edges give ~1 extra tile; 107px jump height limits high jumps
            reach = 5.2 if dy <= 0 else max(3.0, 5.2 - 0.75 * dy)
            if abs(dx) > reach + 0.01: continue
            seen.add((nx, ny)); q.append((nx, ny))
    return f'stuck at col {far[0]} row {far[1]} (goal col {goal[0]})'

bad = 0
for p in sorted(glob.glob(os.path.join(ROOT, 'levels', 'src', '*.txt'))):
    r = check(p)
    name = os.path.basename(p)[:-4]
    if r: bad += 1; print(f'{name:6} FAIL  {r}')
    else: print(f'{name:6} ok')
print('unreachable levels:', bad)
