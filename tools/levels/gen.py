"""Level DSL (+ the boss arena) -> ASCII sketches in levels/src/. Season 1 lives in season1.py. Run: python3 tools/levels/gen.py && npm run levels
Rows 0..13 (14 rows), ground top row 10 (GT). Cursor x advances with g()/gap().

Design rules (enforced by tools/levels/check.py, numbers measured in-game):
- main path climbs at most 2 tiles per jump; gaps <= 4 tiles flat, <= 3 with 1 up, <= 2 with 2 up
- walls higher than 2 tiles become stairs(); platforms meant to be climbed get a pillar() as a step
- nothing floats with a 1-tile slit underneath (Bario is 1.6 tiles tall) - platforms over ground sit at row <= 7
- ?-blocks hover 3 rows above the ground: walk under, bump from below; nothing is placed on top of them
- cards sit <= 4 rows above a standing spot; royals 1 row above their bonus platform
- vents (^) stand BESIDE the platform they lift you onto, never under it"""
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'levels', 'src')
H = 14
GT = 10


class Lvl:
    def __init__(self, name, title, world):
        self.name, self.title, self.world = name, title, world
        self.rows = [['.'] * 400 for _ in range(H)]
        self.x = 0
        self.spawned = False

    # ---- terrain
    def g(self, n, top=GT, ch='#'):
        for y in range(top, H):
            for x in range(self.x, self.x + n):
                self.rows[y][x] = ch
        if not self.spawned:
            self.rows[top - 1][self.x + 2] = 'S'; self.spawned = True
        self.x += n
        return self

    def gap(self, n):
        self.x += n
        return self

    def p(self, dx, y, n):
        for x in range(self.x + dx, self.x + dx + n):
            self.rows[y][x] = '='
        return self

    def brick(self, dx, y, n, h=1):
        for yy in range(y, y + h):
            for x in range(self.x + dx, self.x + dx + n):
                self.rows[yy][x] = 'B'
        return self

    def raise_(self, dx, n, top):
        """raise ground segment (columns already ground) up to `top` (max 2 tiles above GT on the main path)"""
        for y in range(top, GT):
            for x in range(self.x + dx, self.x + dx + n):
                self.rows[y][x] = '#'
        return self

    def stairs(self, dx, n, top):
        """raise ground to `top` as a staircase from the left, 2 tiles per step at most"""
        cur = GT
        while cur > top and n > 0:
            cur = max(top, cur - 2)
            self.raise_(dx, n, cur)
            dx += 2; n -= 2
        return self

    def pillar(self, dx, top=GT - 2):
        """1-wide, 2-high ground step: the way up onto a row-7 platform"""
        return self.raise_(dx, 1, top)

    # ---- objects
    def o(self, dx, y, ch):
        self.rows[y][self.x + dx] = ch
        return self

    def c(self, dx, y, n=1, step=2):
        for i in range(n):
            self.rows[y][self.x + dx + i * step] = 'c'
        return self

    def arc(self, dx, y, n=5):
        for i in range(n):
            lift = min(i, n - 1 - i)
            self.rows[y - min(lift, 2)][self.x + dx + i * 2] = 'c'
        return self

    def finish(self, flag_dx=-4):
        self.rows[GT - 1][self.x + flag_dx] = 'F'
        w = self.x + 1
        lines = [f'// {self.name} {self.title} (Welt {self.world})',
                 '//' + ''.join(str(i // 10 % 10) if i % 10 == 0 else ' ' for i in range(w)),
                 '//' + ''.join(str(i % 10) for i in range(w))]
        lines += [''.join(r[:w]) for r in self.rows]
        os.makedirs(OUT, exist_ok=True)
        with open(os.path.join(OUT, self.name + '.txt'), 'w') as f:
            f.write('\n'.join(lines) + '\n')
        print(f'{self.name:6} {self.title:22} {w} tiles')
        return self


# ================================================================ BOSS – DER THRONSAAL
def boss():
    L = Lvl('boss', 'DER THRONSAAL', 5)
    L.g(46)
    # throne podium in the middle: two steps up to the throne
    L.raise_(-27, 8, 8).raise_(-25, 4, 7)
    L.o(-23, 6, 'h')                        # throne on top
    L.o(-41, 9, 'y').o(-33, 9, 'y').o(-13, 9, 'y').o(-5, 9, 'y')
    L.o(-40, 4, 'r').o(-6, 4, 'r')
    L.o(-37, 5, 'f').o(-9, 5, 'f').o(-31, 5, 'f').o(-15, 5, 'f')
    L.o(-45, 9, 'e')                        # coffee machine, left wall
    L.o(-19, 9, 'Q').o(-3, 9, 'u')
    L.o(-23, 5, 'X')                        # the Direktor sits on his throne
    L.c(-36, 7, 3).c(-12, 7, 3)
    L.rows[9][2] = '.'; L.rows[9][4] = 'S'   # spawn a bit right of the machine
    L.finish(flag_dx=-4)                    # the flag is hidden until the Direktor is beaten


if __name__ == '__main__':
    boss()
