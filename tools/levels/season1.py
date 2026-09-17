"""Season 1 – three handcrafted stations. Tiles via the Lvl DSL (absolute columns), rich objects as a JSON sidecar,
annotated plan images for review. Run: python3 tools/levels/season1.py && npm run levels"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from gen import Lvl, GT, H, OUT
from PIL import Image, ImageDraw

PLAN = os.path.join(os.path.dirname(__file__), 'out')


class Level(Lvl):
    def __init__(self, name, title, world, motto):
        super().__init__(name, title, world)
        self.motto = motto
        self.objs, self.marks = [], []

    # absolute helpers -------------------------------------------------
    def at(self, x, y, ch): self.rows[y][x] = ch; return self
    def ground(self, x0, x1, top=GT):
        for y in range(top, H):
            for x in range(x0, x1 + 1): self.rows[y][x] = '#'
        return self
    def pit(self, x0, x1):
        for y in range(GT, H):
            for x in range(x0, x1 + 1): self.rows[y][x] = '.'
        return self
    def wall(self, x0, x1):
        for y in range(0, H):
            for x in range(x0, x1 + 1): self.rows[y][x] = '#'
        return self
    def plat(self, x, y, n):
        for xx in range(x, x + n): self.rows[y][xx] = '='
        return self
    def raise_to(self, x, n, top):
        for y in range(top, GT):
            for xx in range(x, x + n): self.rows[y][xx] = '#'
        return self
    def pillar(self, x): return self.raise_to(x, 1, GT - 2)
    def bricks(self, x, y, n, h=1):
        for yy in range(y, y + h):
            for xx in range(x, x + n): self.rows[yy][xx] = 'B'
        return self
    def cards(self, x, y, n=1, step=2):
        for i in range(n): self.rows[y][x + i * step] = 'c'
        return self
    def arc(self, x, y, n=5):
        for i in range(n): self.rows[y - min(min(i, n - 1 - i), 2)][x + i * 2] = 'c'
        return self
    def O(self, typ, x, y, **props): self.objs.append({'type': typ, 'x': x, 'y': y, 'props': props}); return self
    def Z(self, typ, x, y, w, h=1, **props): self.objs.append({'type': typ, 'x': x, 'y': y, 'w': w, 'h': h, 'props': props}); return self
    def deco(self, frame, x, y=GT - 1, **props): return self.O('deco', x, y, frame=frame, **props)
    def talk(self, x, text, voice='gracias', ms=1400): return self.Z('talk', x, 4, 2, 6, text=text, voice=voice, ms=ms)
    def section(self, x, track): return self.Z('section', x, 0, 2, H, track=track)
    def mark(self, x, label): self.marks.append((x, label)); return self

    def save(self, width):
        lines = [f'// {self.name} {self.title} (Welt {self.world}) – {self.motto}',
                 '//' + ''.join(str(i // 10 % 10) if i % 10 == 0 else ' ' for i in range(width)),
                 '//' + ''.join(str(i % 10) for i in range(width))]
        lines += [''.join(r[:width]) for r in self.rows]
        os.makedirs(OUT, exist_ok=True)
        with open(os.path.join(OUT, self.name + '.txt'), 'w') as f: f.write('\n'.join(lines) + '\n')
        with open(os.path.join(OUT, self.name + '.objects.json'), 'w') as f: json.dump(self.objs, f, indent=0)
        print(f'{self.name:6} {self.title:16} {width} tiles, {len(self.objs)} rich objects')
        self.plan(width)

    # annotated plan image -----------------------------------------------
    def plan(self, width):
        S = 6
        im = Image.new('RGB', (width * S, H * S + 46), (24, 20, 18)); d = ImageDraw.Draw(im)
        COL = {'#': (140, 90, 50), '=': (99, 184, 78), 'B': (170, 110, 60), 'S': (111, 216, 176), 'F': (255, 79, 163), 'k': (255, 240, 200),
               'c': (255, 215, 80), 'C': (255, 160, 20), '?': (240, 160, 60), '!': (120, 70, 30), 'H': (255, 79, 163), '3': (244, 198, 216),
               'm': (232, 67, 79), 'n': (207, 230, 255), 'q': (255, 150, 150), 'v': (255, 255, 255), 'z': (255, 220, 120), 'M': (200, 40, 40),
               'x': (250, 250, 250), '^': (200, 200, 220), '-': (255, 255, 255), 'l': (255, 224, 138), 'j': (200, 40, 40), 'a': (60, 140, 60),
               's': (200, 150, 90), 'T': (63, 130, 54), 'N': (255, 79, 163), 'W': (166, 106, 51), 'g': (200, 40, 40), 'b': (60, 140, 60), 't': (60, 140, 60)}
        for y in range(H):
            for x in range(width):
                ch = self.rows[y][x]
                if ch == '.': continue
                c = COL.get(ch, (255, 0, 255))
                if ch in '#=B': d.rectangle([x * S, y * S + 40, x * S + S - 1, y * S + S + 39], fill=c)
                else: d.rectangle([x * S + 1, y * S + 41, x * S + S - 2, y * S + S + 38], fill=c)
        OC = {'warp': (255, 127, 184), 'parade': (232, 67, 79), 'conveyor': (120, 120, 140), 'orbit': (255, 194, 75), 'storm': (200, 40, 40),
              'talk': (255, 79, 163), 'section': (111, 216, 176), 'tipcup': (166, 106, 51), 'deco': (90, 90, 110), 'moveplat': (160, 160, 170)}
        for o in self.objs:
            c = OC.get(o['type'], (255, 0, 255)); w = o.get('w', 1); h = o.get('h', 1)
            if o['type'] in ('deco',): d.rectangle([o['x'] * S + 2, o['y'] * S + 42, o['x'] * S + S - 3, o['y'] * S + S + 37], outline=c)
            elif o['type'] in ('talk', 'section', 'storm', 'tipcup'): d.rectangle([o['x'] * S, o['y'] * S + 40, (o['x'] + w) * S - 1, (o['y'] + h) * S + 39], outline=c)
            else: d.rectangle([o['x'] * S, o['y'] * S + 40, (o['x'] + w) * S - 1, (o['y'] + h) * S + 39], fill=c)
        d.text((4, 2), f'{self.title}  –  {self.motto}', fill=(255, 244, 220))
        for x, label in self.marks:
            d.line([x * S, 40, x * S, H * S + 40], fill=(255, 79, 163))
            d.text((x * S + 3, 26), label, fill=(255, 79, 163))
        d.text((4, 14), 'rosa Linie = Sektion  |  gelb = Karten, orange = Royal  |  rot = Meistersager  |  weiss = Zucker/Kartenplattform  |  pink Block = Roehre/Tuer', fill=(167, 156, 144))
        os.makedirs(PLAN, exist_ok=True)
        im.save(os.path.join(PLAN, f'{self.name}_plan.png'))


# ======================================================================= 1 · DER BOULEVARD
def s1_1():
    L = Level('s1-1', 'DER BOULEVARD', 1, 'Good People, Crazy Times')
    W = 190
    # --- A  Ankommen (0-36)
    L.ground(0, 36); L.at(3, 9, 'S'); L.mark(0, 'A Ankommen')
    L.deco('deco_carpet_0', 4); L.at(6, 9, 's'); L.at(9, 9, 'l'); L.at(12, 9, 'j'); L.at(15, 9, 'a'); L.deco('chalk_good_people_0', 19)
    L.talk(5, '¡HOLA, BOULEVARD!', 'hola')
    L.arc(17, 7, 5); L.raise_to(28, 2, 9); L.cards(28, 7, 2, 1)
    L.deco('deco_column_0', 31, fg=True); L.at(31, 8, 'C')          # Royal 1 hides behind the Litfasssaeule
    L.at(33, 9, 'm'); L.deco('chalk_crazy_times_0', 35)
    # --- B  Bloecke & Kaffee (40-72)
    L.ground(40, 72); L.mark(40, 'B Bloecke & Kaffee'); L.section(40, 'boulevard')
    L.at(44, 6, '?'); L.at(48, 6, '!'); L.at(53, 9, 'm'); L.pillar(55); L.plat(56, 7, 4); L.cards(57, 6, 2); L.at(60, 9, 'q')
    L.bricks(62, 8, 2, 2); L.talk(59, 'STAMPF: STICK RUNTER + WURF!', 'si', 1600)
    L.deco('deco_busstop_0', 65); L.O('warp', 67, 9, id='p1', target='p2', kind='pipe'); L.deco('deco_arrow_0', 67, 6); L.at(70, 9, 'k')
    # --- C  Die Parade (76-118)
    L.ground(76, 118); L.mark(76, 'C Die Parade')
    L.talk(77, '¡AY, EINE PARADE!', 'ay'); L.O('parade', 116, 9, dir=-1, every=2600, until=77, variant='basic')
    L.at(80, 9, 'l'); L.at(86, 9, 'j'); L.at(100, 9, 'l'); L.at(108, 9, 'j'); L.deco('deco_column_0', 104, fg=True)
    L.pillar(90); L.plat(91, 7, 4); L.cards(92, 6, 2); L.plat(97, 5, 3); L.at(98, 3, 'C'); L.at(110, 9, 'k'); L.at(112, 9, 'v')
    L.cards(120, 7, 2, 1)
    # --- D  Zur goldenen Tuer (123-162)
    L.ground(123, 162); L.mark(123, 'D Zur goldenen Tuer'); L.section(123, 'boulevard_finale')
    L.at(128, 9, 'm'); L.at(136, 9, 'n'); L.at(146, 9, 'm')
    L.pillar(131); L.plat(132, 7, 3); L.plat(137, 5, 3); L.plat(142, 3, 3); L.at(143, 2, 'C'); L.cards(133, 6, 1); L.cards(138, 4, 1)
    L.at(150, 9, 'a'); L.at(154, 9, 'F'); L.deco('deco_door_gold_0', 158); L.deco('chalk_crazy_times_0', 149); L.O('deco', 161, 9, frame='sign_coffee_0')
    L.talk(152, '¡GRACIAS, BOULEVARD!', 'gracias')
    # --- Bonusraum: das Herz (165-189)
    L.wall(163, 164); L.ground(165, 189); L.plat(165, 3, 25); L.raise_to(189, 1, 3); L.mark(165, 'Bonus: Herz')
    L.O('warp', 168, 9, id='p2', target='p1', kind='pipe'); L.O('warp', 186, 9, id='p3', target='p1', kind='pipe')
    L.plat(177, 7, 3); L.at(178, 6, 'C')
    for (x, y) in [(175, 4), (176, 4), (180, 4), (181, 4), (174, 5), (177, 5), (179, 5), (182, 5), (174, 6), (182, 6), (175, 7), (181, 7), (176, 8), (180, 8), (177, 9), (179, 9), (178, 9)]:
        L.at(x, y, 'c')
    L.at(171, 9, 'l'); L.at(184, 9, 'l'); L.deco('chalk_cambio_0', 172, 8)
    L.save(W)


# ======================================================================= 2 · BARIOS COFFEE
def s1_2():
    L = Level('s1-2', 'BARIOS COFFEE', 2, 'Good Coffee, Better People')
    W = 200
    # --- A  Die Theke (0-38)
    L.ground(0, 38); L.at(3, 9, 'S'); L.mark(0, 'A Die Theke')
    L.deco('deco_counter_0', 7); L.deco('deco_shelf_0', 11, 6); L.deco('deco_shelf_0', 14, 6); L.deco('deco_waterfall_0', 21, 9); L.deco('chalk_good_coffee_0', 25)
    L.talk(4, '¡BUENOS DÍAS, CAFÉ!', 'hola'); L.cards(8, 7, 3)
    L.at(16, 9, '^'); L.plat(18, 4, 4); L.cards(19, 3, 2)
    L.at(27, 9, 'x'); L.at(28, 9, 'x'); L.talk(24, '¡ZUCKER! NICHT ANFASSEN.', 'ay')
    L.O('warp', 31, 9, id='p1', target='p2', kind='pipe'); L.deco('deco_arrow_0', 31, 6); L.deco('deco_shelf_0', 31, 9, fg=True, scale=1.3)
    L.at(34, 9, 'n'); L.at(37, 9, 'k')
    # --- B  Roester & Ziegel (42-84)
    L.ground(42, 84); L.mark(42, 'B Roester & Ziegel'); L.section(42, 'coffee')
    L.at(46, 6, 'H'); L.talk(44, 'HANTEL = ZIEGEL DURCHBRECHEN!', 'si', 1600); L.bricks(52, 8, 3, 2); L.cards(56, 8, 2, 1)
    L.Z('conveyor', 60, 10, 12, 1, speed=90); L.at(63, 9, 'm'); L.at(68, 9, 'm'); L.at(66, 9, 'l')
    L.at(75, 9, 'z'); L.pillar(77); L.plat(78, 6, 3); L.at(79, 4, 'C')
    L.Z('conveyor', 78, 10, 6, 1, speed=-110); L.at(81, 9, 'x'); L.at(83, 9, 'k')
    # --- gap with a floating cup
    L.O('moveplat', 86, 6, frame='plat_cup_0', vertical=True, range=64, speed=50)
    # --- C  Die grosse Tasse (89-130)
    L.ground(89, 130); L.mark(89, 'C Die grosse Tasse')
    L.deco('deco_cup_big_0', 96, 9, scale=2, id='bigcup'); L.Z('tipcup', 92, 6, 2, 4, deco='bigcup', rx=100, ry=7, angle=70)
    L.at(104, 9, 'q'); L.pillar(105); L.plat(106, 7, 3); L.cards(107, 6, 2, 1); L.at(110, 9, 'm')
    L.at(114, 9, 'x'); L.at(115, 9, 'x'); L.at(118, 9, '^'); L.plat(120, 4, 4); L.cards(121, 3, 2); L.deco('deco_shelf_0', 124, 6); L.at(126, 9, 'k'); L.deco('chalk_better_people_0', 128)
    # --- D  Das Lager (134-172)
    L.ground(134, 172); L.mark(134, 'D Das Lager'); L.section(134, 'coffee_finale')
    L.at(137, 9, 'W'); L.at(139, 9, 'W'); L.Z('conveyor', 140, 10, 21, 1, speed=-120)
    L.at(147, 9, 'x'); L.at(150, 9, 'm'); L.at(153, 9, 'x'); L.at(156, 9, 'm'); L.at(158, 9, 'z'); L.talk(140, '¡DAS BAND! GEGEN DEN STROM.', 'ay')
    L.at(162, 9, '^'); L.plat(164, 4, 3); L.at(165, 3, 'C')
    L.at(169, 9, 'F'); L.deco('deco_machine_0', 171); L.deco('deco_waterfall_0', 167, 9); L.talk(166, '¡GRACIAS, CAFÉ!', 'gracias')
    # --- Bonusraum: Lagerraum (175-199)
    L.wall(173, 174); L.ground(175, 199); L.plat(175, 3, 25); L.raise_to(199, 1, 3); L.mark(175, 'Bonus: Lager')
    L.O('warp', 178, 9, id='p2', target='p1', kind='pipe'); L.O('warp', 196, 9, id='p3', target='p1', kind='pipe')
    L.at(181, 9, 'W'); L.at(191, 9, 'W'); L.cards(182, 7, 2); L.cards(189, 7, 2); L.pillar(184); L.plat(185, 6, 3); L.at(186, 5, 'C'); L.deco('deco_shelf_0', 193, 5)
    L.save(W)


# ======================================================================= 3 · CAMBIO
def s1_3():
    L = Level('s1-3', 'CAMBIO', 3, 'Same Friends, Different Rules')
    W = 205
    # --- A  Der Eingang (0-32)
    L.ground(0, 32); L.at(3, 9, 'S'); L.mark(0, 'A Der Eingang')
    L.deco('deco_carpet_0', 4); L.deco('deco_neon_0', 8, 4); L.at(12, 9, 'T'); L.at(20, 9, 'T'); L.deco('chalk_same_friends_0', 16)
    L.talk(3, '¡SAME FRIENDS,\nDIFFERENT RULES!', 'querico', 1700); L.arc(10, 7, 5); L.at(24, 9, 'q')
    L.talk(29, 'KARTE BLINKT = GLEICH WEG!', 'si', 1500); L.at(34, 8, '-')
    # --- B  Der Dealer (37-78)
    L.ground(37, 78); L.mark(37, 'B Der Dealer'); L.section(37, 'casino')
    L.at(41, 9, 'T'); L.at(44, 6, '3'); L.at(50, 9, 'm'); L.at(53, 9, 'm'); L.at(58, 9, 'n'); L.cards(47, 7, 3)
    L.pit(61, 68); L.at(62, 8, '-'); L.at(65, 6, '-'); L.at(66, 4, 'C'); L.deco('chalk_different_rules_0', 70); L.at(72, 9, 'q'); L.at(75, 9, 'k'); L.deco('deco_neon_0', 74, 4)
    # --- Roulette (79-90)
    L.mark(79, 'Roulette'); L.O('orbit', 84, 7, n=4, radius=96, speed=45, hub=True); L.at(84, 6, 'C')
    # --- C  Der Joker (91-128)
    L.ground(90, 128); L.mark(90, 'C Der Joker')
    L.talk(92, 'DER JOKER ÖFFNET TÜREN…', 'si'); L.O('warp', 96, 9, id='j1', target='j2', kind='door', frame='deco_joker_door_0'); L.deco('deco_neon_0', 100, 4)
    L.pit(104, 109); L.at(105, 8, '-'); L.at(108, 8, '-')
    L.at(114, 9, 'M'); L.at(118, 9, 'q'); L.at(122, 9, 'v'); L.pillar(120); L.plat(121, 6, 3); L.at(122, 4, 'C'); L.at(126, 9, 'k'); L.at(124, 9, 'T')
    # --- D  Der Fanblock kommt (132-184)
    L.ground(132, 184); L.mark(132, 'D Der Fanblock kommt'); L.section(132, 'casino_finale')
    L.Z('storm', 133, 6, 2, 4, count=9, every=1300, variants='basic,basic,fanblock,basic,trommler,basic,fanblock,basic,basic', text='DER FANBLOCK KOMMT!')
    L.pillar(139); L.plat(140, 7, 4); L.cards(141, 6, 2); L.pit(147, 149); L.at(148, 8, '-')
    L.pillar(156); L.at(156, 7, 'z'); L.O('deco', 160, 9, frame='banner_0'); L.at(165, 9, 'g'); L.O('deco', 170, 9, frame='banner_0'); L.at(168, 9, 'l')
    L.at(178, 9, 'F'); L.deco('deco_banner_red_0', 182, 9); L.deco('deco_chalk_inf_0', 180); L.O('deco', 184, 9, frame='sign_thron_0'); L.talk(176, '¡GRACIAS, CAMBIO!', 'gracias')
    # --- Bonusraum: Jokers Zimmer (187-204)
    L.wall(185, 186); L.ground(187, 204); L.plat(187, 3, 18); L.raise_to(204, 1, 3); L.mark(187, 'Bonus: Joker')
    L.O('warp', 189, 9, id='j2', target='j1', kind='door', frame='deco_joker_door_0')
    L.plat(194, 7, 3); L.at(195, 6, 'C')
    for (x, y) in [(195, 4), (194, 5), (196, 5), (193, 6), (197, 6), (194, 8), (196, 8), (195, 9), (192, 9), (198, 9)]:
        L.at(x, y, 'c')
    L.deco('deco_neon_0', 199, 4); L.at(191, 9, 'T'); L.at(201, 9, 'T')
    L.save(W)


if __name__ == '__main__':
    # ground gaps in the ASCII: gap = death pit. ground() leaves rows 10-13 empty where no ground is drawn.
    s1_1(); s1_2(); s1_3()
