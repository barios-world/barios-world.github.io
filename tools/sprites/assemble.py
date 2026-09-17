"""Assemble every sprite of the game: name -> [frames]. Shared by atlas.py (game) and build.py (Spielbuch)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from px import *
from figures import *
import poses as P
import items as I
import env as E


def assemble(include_scenes=True):
    SPR = {}

    def add(name, g):
        SPR[name] = g if isinstance(g, list) else [g]

    # ---------------- Bario
    add('bario_idle', P.idle_frames(BARIO))
    add('bario_walk', P.walk_frames(BARIO))
    add('bario_run', P.run_frames(BARIO))
    add('bario_jump', P.jump_frame(BARIO))
    hurt = P.front(BARIO, mouth='open', eyes='x')
    P.arms(hurt, BARIO, L=(0, 30), R=(40, 30)); P.prop_star(hurt, 2, 2, 'G'); P.prop_star(hurt, 40, 0, 'G')
    add('bario_hurt', hurt)
    add('atk_kaffee', P.attack_kaffee()); add('atk_cambio', P.attack_cambio()); add('atk_buch', P.attack_buch())
    add('atk_khusra', P.attack_khusra()); add('atk_mund', P.attack_khusra_mund())
    add('sp_kaffee', P.special_kaffee()); add('sp_buecher', P.special_buecher()); add('sp_cambio', P.special_cambio()); add('sp_khusra', P.special_khusra())
    add('form_sport', P.form_sport()); add('form_boxer', P.form_boxer()); add('form_skater', P.form_skater())
    add('form_sprayer', P.form_sprayer()); add('form_dj', P.form_dj()); add('form_rocker', P.form_rocker())
    for k in FORMS:
        add('formwalk_' + k, [on_canvas(figure_side(FORMS[k], f)) for f in WALK])
        add('formidle_' + k, P.idle_frames(FORMS[k]))
        add('formjump_' + k, on_canvas(figure_side(FORMS[k], JUMP, lean=1, mouth='open')))
    # special pickups (recolored props) + form pickup glow ring
    def recolor(g, m):
        h = g.copy()
        for a, b in m.items():
            h.replace(a, b)
        return h
    gold = G(24, 24); P.prop_cup(gold, 6, 8, steam=True); add('pk_kaffeepower', recolor(gold, {'O': 'L', 'o': 'G', 'J': 'g', 'j': 'G'}))
    add('pk_buecher', I.buch())
    fan = G(28, 24)
    for i, (x, col) in enumerate(((2, 'R'), (9, '1'), (16, 'A'), (22, '?'))):
        P.prop_card(fan, x, 6 + (i % 2) * 2, col)
    add('pk_cambio', fan)
    ring = G(30, 30)
    P.ring(ring, 15, 15, 14, 14, '&', thick=2.0); P.ring(ring, 15, 15, 10, 10, '%', thick=1.4)
    add('fx_ring', ring)
    chord = G(48, 48)
    P.ring(chord, 24, 24, 22, 22, 'R', thick=2.2); P.ring(chord, 24, 24, 16, 16, 'V', thick=1.6); P.ring(chord, 24, 24, 9, 9, '?', thick=1.4)
    add('fx_chord', chord)
    spray = G(40, 24)
    for i, (dx, dy) in enumerate(((2, 0), (5, -2), (5, 2), (9, -4), (9, 0), (9, 4), (13, -6), (13, -2), (13, 2), (13, 6), (18, -8), (18, -3), (18, 3), (18, 8), (23, -9), (23, 0), (23, 9), (28, -6), (28, 6), (33, -3), (33, 3), (37, 0))):
        spray.set(2 + dx, 12 + dy, '&' if i < 10 else ('%' if i < 18 else '*'))
    add('fx_spray', spray)

    # ---------------- Meistersager
    add('meister_idle', P.idle_frames(MEISTER, bubble=True))
    add('meister_walk', P.walk_frames(MEISTER))
    add('meister_run', P.run_frames(MEISTER))
    add('meister_attack', P.meister_attack()); add('meister_slide', P.meister_slide()); add('meister_support', P.meister_support())
    add('meister_hit', P.meister_hit()); add('meister_defeat', P.meister_defeat())

    # ---------------- Direktor
    add('direktor_idle', P.idle_frames(DIREKTOR, bubble=True))
    add('direktor_walk', P.walk_frames(DIREKTOR))
    add('direktor_rage', P.direktor_rage()); add('direktor_kick', P.direktor_kick()); add('direktor_brille', P.direktor_brille())
    add('direktor_regen', P.direktor_regen()); add('direktor_defeat', P.direktor_defeat())

    # ---------------- portraits, items, hud bits
    add('port_bario', P.portrait(BARIO)); add('port_meister', P.portrait(MEISTER)); add('port_direktor', P.portrait(DIREKTOR))
    for n, fn in I.ALL.items():
        add('it_' + n, fn())
    hs = G(11, 10)
    hs.put(0, 0, ".&&...&&..\n&&&&.&&&&.\n&&&&&&&&&.\n&&&&&&&&&.\n.&&&&&&&..\n..&&&&&...\n...&&&....\n....&.....")
    hs.outline_grow('K'); add('herz_s', hs)
    he = G(11, 10)
    he.put(0, 0, ".KK...KK..\nK..K.K..K.\nK...K...K.\nK.......K.\n.K.....K..\n..K...K...\n...K.K....\n....K.....")
    add('herz_leer', he)
    # small dust / spark textures
    d = G(4, 4); d.rect(0, 0, 3, 3, 'O'); d.set(0, 0, '.'); d.set(3, 0, '.'); d.set(0, 3, '.'); d.set(3, 3, '.'); add('fx_dust', d)
    s = G(5, 5); s.put(0, 0, "..L..\n.LLL.\nLLLLL\n.LLL.\n..L.."); add('fx_spark', s)
    # flag pole for level end (pole + pink pennant with B)
    add('flagpole', E.pennant('P'))
    # projectiles + fx used by the game
    cup = G(14, 14); P.prop_cup(cup, 2, 3, steam=False); add('proj_cup', cup)
    card = G(9, 12); P.prop_card(card, 1, 1, 'R'); add('proj_card', card)
    ball = G(10, 10); P.prop_ball(ball, 5, 5, 3.2); add('proj_khusra', ball)
    wave = G(20, 36)
    for i, (r, col) in enumerate(((9, 'O'), (15, '='))):
        P.ring(wave, 2, 18, r, r * 1.6, col, thick=2.2, only=lambda x, y, r=r: x > 2 + r * 0.25)
    add('fx_wave', wave)
    add('pipe_big', I.pipe(32, 64))
    hill = G(96, 40); hill.ellipse(48, 46, 50, 34, 'a', n=2.2, only=lambda x, y: y < 40); hill.ellipse(46, 48, 46, 32, 'A', n=2.2, only=lambda x, y: y < 40)
    hill.ellipse(30, 20, 10, 6, 'F'); add('hill', hill)
    far = G(120, 48); far.ellipse(60, 58, 64, 46, 'p', n=2.2, only=lambda x, y: y < 48); far.ellipse(58, 60, 60, 44, 'P', n=2.2, only=lambda x, y: y < 48); add('hill_far', far)
    add('bush', E.bush(30)); add('palm', E.palm(52)); add('cloud', E.cloud(26)); add('sign', E.sign(['BARIOS WORLD >']))
    add('banner', E.banner_vfb()); add('lamp', E.lamp()); add('tree', E.tree()); add('crate', E.crate()); add('cone', E.cone()); add('bench', E.bench())
    add('chalk_cambio', E.chalkboard(['LIFE IS', 'CAMBIO'])); add('sign_vfb', E.sign(['VFB AREA >']))
    # --- world decor
    def scale_up(g, k):
        h = G(g.w * k, g.h * k)
        for y in range(g.h):
            for x in range(g.w):
                c = g.d[y][x]
                if c != '.':
                    h.rect(x * k, y * k, x * k + k - 1, y * k + k - 1, c)
        return h
    add('deco_cup_big', scale_up(I.kaffee(), 3))
    neon = G(76, 22); neon.rect(0, 0, 75, 21, '#'); neon.rect(1, 1, 74, 20, '@'); neon.outline('K')
    from font import draw_text as _dt, text_width as _tw
    _dt(neon, (76 - _tw('CAMBIO') * 2) // 2, 6, 'CAMBIO', '&')
    # double-size letters: redraw scaled copy of the text region
    tmp = G(30, 5); _dt(tmp, 0, 0, 'CAMBIO', '&'); big = scale_up(tmp, 2)
    neon = G(76, 22); neon.rect(0, 0, 75, 21, '#'); neon.rect(1, 1, 74, 20, '@'); neon.paste(big, 8, 6); neon.outline('K')
    for x in range(4, 72, 8):
        neon.set(x, 2, '*'); neon.set(x + 4, 19, '*')
    add('deco_neon', neon)
    table = G(48, 30); table.ellipse(24, 10, 23, 8, 'a'); table.ellipse(23, 9, 21, 6.5, 'A'); table.rect(8, 16, 11, 29, 'w'); table.rect(37, 16, 40, 29, 'w')
    table.rect(14, 18, 34, 20, 'j'); table.outline('K'); P.prop_card(table, 14, 4, 'R'); P.prop_card(table, 26, 3, '1')
    add('deco_table', table)
    fl = G(22, 72); fl.rect(9, 12, 12, 71, '$'); fl.vline(9, 12, 71, '='); fl.rect(2, 0, 19, 11, '#'); fl.rect(3, 1, 18, 10, '$')
    for x in range(4, 18, 4):
        fl.rect(x, 2, x + 2, 4, 'L'); fl.rect(x, 6, x + 2, 8, 'L')
    fl.outline('K'); add('deco_floodlight', fl)
    st = G(96, 48)
    for i in range(6):
        y0 = i * 8
        st.rect(0, y0, 95, y0 + 7, '$' if i % 2 == 0 else '@')
        for x in range(2 + (i % 2) * 4, 96, 8):
            st.rect(x, y0 + 2, x + 3, y0 + 5, ['R', 'O', 'R', 'O', 'R', '#'][(x // 8 + i) % 6])
    st.outline('K'); add('deco_stand', st)
    steam = G(14, 26)
    for i, sx in enumerate((2, 6, 10)):
        for y in range(2 + i * 3, 24, 2):
            steam.set(sx + (y // 4) % 2, y, '=')
    add('deco_steam', steam)
    # --- hazards & platforms
    pud = G(32, 8); pud.ellipse(16, 5, 15, 3.2, 'J'); pud.ellipse(14, 4.5, 11, 2, 'j'); pud.set(6, 4, '!'); pud.set(20, 3, '!'); pud.set(26, 5, '!'); pud.outline('K'); add('haz_puddle', pud)
    vent = G(32, 10); vent.rect(0, 2, 31, 9, '$'); vent.rect(1, 3, 30, 8, '-')
    for x in range(3, 30, 4):
        vent.rect(x, 4, x + 1, 7, '#')
    vent.outline('K'); add('haz_vent', vent)
    pc = G(64, 16); pc.rect(0, 0, 63, 15, 'O'); pc.rect(2, 2, 61, 13, 'R'); pc.ellipse(32, 8, 8, 5, 'O'); pc.outline('K'); add('plat_card', pc)
    pcb = G(64, 16); pcb.rect(0, 0, 63, 15, 'O'); pcb.rect(2, 2, 61, 13, '1'); pcb.ellipse(32, 8, 8, 5, 'O'); pcb.outline('K'); add('plat_card_back', pcb)
    pm = G(64, 16); pm.rect(0, 0, 63, 15, '$'); pm.hline(1, 62, 1, '='); pm.rect(0, 12, 63, 15, '@')
    for x in range(6, 60, 12):
        pm.set(x, 6, '#'); pm.set(x + 1, 6, '#')
    pm.outline('K'); add('plat_move', pm)
    ball = scale_up(I.ball(), 1); add('haz_ball', ball)
    add('deco_pillar', E.pillar(96)); add('deco_torch', scale_up(E.torch(), 2)); add('deco_throne', scale_up(E.throne(), 2))
    add('deco_banner_red', E.red_banner(['BARIOS', 'WORLD'])); add('deco_window', E.moon_window()); add('deco_chalk_inf', E.chalkboard(['BARIOS WORLD', 'LEVEL ~']))
    machine = G(28, 40); machine.rect(2, 4, 25, 37, '0'); machine.rect(4, 6, 23, 14, '#'); machine.rect(6, 8, 21, 12, '=')
    machine.rect(8, 20, 19, 26, 'J'); machine.rect(10, 22, 17, 24, 'j'); machine.rect(4, 30, 23, 35, '-'); machine.set(24, 18, 'R'); machine.rect(11, 15, 16, 18, '$')
    machine.outline('K'); P.prop_cup(machine, 9, 29, steam=False, small=True); add('deco_machine', machine)
    belt = G(30, 14); belt.rect(0, 3, 29, 10, '#'); belt.rect(9, 1, 20, 12, 'G'); belt.rect(11, 3, 18, 10, 'L'); belt.set(14, 6, 'R'); belt.set(15, 6, 'R'); belt.outline('K'); add('it_guertel', belt)
    drum = G(20, 16); drum.rect(2, 4, 17, 15, 'R'); drum.rect(2, 4, 17, 6, 'O'); drum.rect(2, 13, 17, 15, 'r'); drum.vline(6, 6, 13, 'O'); drum.vline(13, 6, 13, 'O'); drum.outline('K'); add('prop_drum', drum)

    # --- Season 1 decor & props
    import math as _m
    door = G(48, 64)
    door.rect(0, 6, 47, 63, 'g'); door.rect(3, 9, 44, 63, 'G'); door.rect(6, 12, 22, 63, 'L'); door.rect(25, 12, 41, 63, 'L')
    door.rect(8, 14, 20, 34, 'G'); door.rect(27, 14, 39, 34, 'G'); door.rect(8, 38, 20, 58, 'G'); door.rect(27, 38, 39, 58, 'G')
    door.rect(21, 40, 22, 43, 'K'); door.rect(25, 40, 26, 43, 'K')
    door.rect(17, 2, 30, 6, 'G'); door.set(18, 0, 'G'); door.set(23, 0, 'G'); door.set(29, 0, 'G'); door.set(19, 1, 'G'); door.set(24, 1, 'G'); door.set(28, 1, 'G'); door.set(23, 3, 'R')
    door.outline('K'); add('deco_door_gold', door)
    col = G(32, 80)
    col.rect(4, 6, 27, 79, 'X'); col.rect(6, 8, 25, 77, 'o'); col.rect(2, 0, 29, 7, 'X'); col.rect(4, 1, 27, 5, 'o')
    col.rect(8, 12, 23, 30, 'P'); col.rect(9, 13, 22, 29, 'Q'); _dt(col, 10, 16, 'BAR', 'K'); _dt(col, 10, 22, 'IOS', 'K')
    col.rect(8, 36, 23, 52, 'I'); col.rect(9, 37, 22, 51, 'Y'); _dt(col, 10, 40, 'CAF', 'J'); _dt(col, 13, 46, 'E', 'J')
    col.rect(8, 58, 23, 74, 'A'); col.rect(9, 59, 22, 73, 'F'); _dt(col, 10, 62, 'CAM', 'K'); _dt(col, 10, 68, 'BIO', 'K')
    col.outline('K'); add('deco_column', col)
    bus = G(48, 64)
    bus.rect(0, 0, 47, 6, 'R'); bus.hline(1, 46, 1, 'V'); bus.rect(2, 7, 4, 63, 'X'); bus.rect(43, 7, 45, 63, 'X')
    bus.rect(5, 8, 42, 50, 'U'); bus.rect(6, 9, 41, 49, 'T'); bus.rect(8, 44, 40, 48, 'w'); bus.rect(8, 49, 10, 56, 'j'); bus.rect(38, 49, 40, 56, 'j')
    bus.rect(17, 12, 31, 22, 'G'); _dt(bus, 18, 15, 'BUS', 'K'); bus.outline('K'); add('deco_busstop', bus)
    counter = G(96, 50)
    counter.rect(0, 14, 95, 49, 'w'); counter.rect(0, 12, 95, 15, 'j'); counter.hline(0, 95, 12, 'D')
    for x in range(4, 92, 22):
        counter.rect(x, 20, x + 16, 44, 'J'); counter.rect(x + 2, 22, x + 14, 42, 'j')
    for cx in (12, 44, 76):
        P.prop_cup(counter, cx, 1, steam=(cx == 44), small=True)
    counter.outline('K'); add('deco_counter', counter)
    shelf = G(48, 48)
    for yb in (14, 30, 46):
        shelf.rect(0, yb, 47, yb + 1, 'w'); shelf.hline(0, 47, yb, 'D')
    for yb in (14, 30):
        for cx in (4, 20, 36):
            P.prop_cup(shelf, cx, yb - 12, steam=False, small=True)
    shelf.outline('K'); add('deco_shelf', shelf)
    falls = []
    for fr in range(2):
        wf = G(32, 96)
        for x in range(1, 31, 3):
            wf.vline(x, 0, 89, 'J' if (x // 3 + fr) % 2 == 0 else 'j')
            for y in range((x * 7 + fr * 6) % 12, 88, 12):
                wf.set(x, y, 'w')
        wf.ellipse(16, 92, 15, 3.5, 'I'); wf.ellipse(16, 91, 12, 2, 'Y'); wf.outline('K')
        falls.append(wf)
    add('deco_waterfall', falls)
    belt = G(32, 12)
    belt.rect(0, 0, 31, 11, 'X')
    for x in range(0, 32, 8):
        for k in range(4):
            belt.set((x + k) % 32, 2 + k, 'o'); belt.set((x + k) % 32, 9 - k, 'o')
    belt.hline(0, 31, 0, 'K'); belt.hline(0, 31, 11, 'K'); add('belt', belt)
    cup = G(64, 20)
    cup.rect(6, 0, 57, 3, 'J'); cup.rect(6, 4, 57, 19, 'O'); cup.rect(8, 6, 55, 17, 'W'); cup.rect(8, 11, 55, 13, 'P')
    cup.rect(57, 6, 63, 15, 'O'); cup.rect(59, 8, 61, 13, '.'); cup.hline(6, 57, 3, 'j'); cup.outline('K'); add('plat_cup', cup)
    wheel = G(96, 96)
    wheel.ellipse(48, 48, 47, 47, 'g'); wheel.ellipse(48, 48, 44, 44, 'K'); wheel.ellipse(48, 48, 42, 42, 'R')
    wheel.fill_where(lambda x, y, c: c == 'R' and int((_m.atan2(y - 48, x - 48) + _m.pi) / (2 * _m.pi) * 12) % 2 == 1, 'X')
    wheel.ellipse(48, 48, 14, 14, 'K'); wheel.ellipse(48, 48, 13, 13, 'G'); wheel.ellipse(48, 48, 10, 10, 'L'); _dt(wheel, 46, 45, 'C', 'K'); add('deco_roulette', wheel)
    jd = G(48, 64)
    jd.rect(0, 0, 47, 63, 'n'); jd.rect(4, 4, 43, 63, 'B'); jd.rect(6, 6, 41, 61, 'p')
    jd.ellipse(24, 26, 10, 12, 'W'); jd.set(20, 23, 'K'); jd.set(28, 23, 'K'); jd.hline(20, 28, 31, 'K'); jd.set(19, 30, 'K'); jd.set(29, 30, 'K')
    jd.rect(14, 10, 33, 13, 'P'); jd.set(14, 8, 'P'); jd.set(33, 8, 'P'); jd.set(12, 6, 'A'); jd.set(35, 6, 'A'); jd.rect(18, 6, 29, 9, 'A')
    _dt(jd, 13, 50, 'JOKER', 'L'); jd.outline('K'); add('deco_joker_door', jd)
    sugar = G(32, 10)
    sugar.ellipse(16, 7, 15, 3.5, 'W'); sugar.rect(6, 3, 9, 6, 'O'); sugar.rect(14, 1, 18, 5, 'W'); sugar.rect(22, 3, 25, 6, 'O')
    sugar.set(11, 2, 'Q'); sugar.set(20, 0, 'Q'); sugar.set(27, 4, 'Q'); sugar.ellipse(16, 9, 15, 1.5, 'o'); sugar.outline('K'); add('haz_sugar', sugar)
    for key, lines in (('good_people', ['GOOD PEOPLE']), ('crazy_times', ['CRAZY TIMES']), ('good_coffee', ['GOOD COFFEE']),
                       ('better_people', ['BETTER PEOPLE']), ('same_friends', ['SAME FRIENDS']), ('different_rules', ['DIFFERENT RULES'])):
        add('chalk_' + key, E.chalkboard(lines))
    arrow = G(16, 22)
    arrow.rect(7, 0, 8, 13, 'P'); arrow.line(1, 8, 7, 15, 'P'); arrow.line(14, 8, 8, 15, 'P'); arrow.rect(6, 14, 9, 16, 'P'); arrow.outline('K'); add('deco_arrow', arrow)
    carpet = G(128, 6)
    carpet.rect(0, 0, 127, 5, 'R'); carpet.hline(0, 127, 0, 'G'); carpet.hline(0, 127, 5, 'G'); _dt(carpet, 62, 1, 'B', 'G'); add('deco_carpet', carpet)
    add('sign_coffee', E.sign(['BARIOS COFFEE >'])); add('sign_cambio', E.sign(['CAMBIO >'])); add('sign_thron', E.sign(['DER THRONSAAL >']))

    if include_scenes:
        add('scene_barios', E.scene_barios()); add('scene_vfb', E.scene_vfb()); add('scene_arena', E.scene_arena())
        add('tile', E.platform(2))
    return SPR
