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

    if include_scenes:
        add('scene_barios', E.scene_barios()); add('scene_vfb', E.scene_vfb()); add('scene_arena', E.scene_arena())
        add('tile', E.platform(2))
    return SPR
