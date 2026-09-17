"""24x24 item icons with shading + outline."""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from px import *
from font import draw_text


def new(w=24, h=24):
    return G(w, h)


def kaffee():
    g = new()
    g.ellipse(12, 19.5, 10.5, 2.4, 'O'); g.ellipse(12, 20.6, 10.5, 1.5, 'o')
    g.rect(5, 7, 16, 17, 'O'); g.vline(15, 8, 16, 'o'); g.hline(6, 15, 17, 'o'); g.hline(6, 7, 9, '=')
    g.ellipse(10.5, 7.5, 5.8, 2.3, 'J'); g.ellipse(9.5, 7.2, 3.6, 1.2, 'j')
    g.rect(17, 9, 20, 14, 'O'); g.rect(18, 10, 19, 13, '.'); g.set(20, 14, 'o'); g.set(19, 14, 'o')
    g.outline('K')
    for i, sx in enumerate((8, 11, 14)):
        g.set(sx, 3 - (i % 2), '='); g.set(sx + 1 - (i % 2), 1 + (i % 2), '=')
    return g


def karte(col='R', digit='7'):
    g = new()
    g.rect(5, 1, 18, 22, col); g.set(5, 1, '.'); g.set(18, 1, '.'); g.set(5, 22, '.'); g.set(18, 22, '.')
    sh = {'R': 'r', '1': '2', 'A': 'a', '?': 'g'}.get(col, 'k')
    g.vline(17, 2, 21, sh); g.hline(6, 17, 21, sh)
    g.ellipse(11.5, 11.5, 4.2, 6.8, 'O')
    draw_text(g, 10, 9, digit, col)
    draw_text(g, 6, 2, digit, 'O'); draw_text(g, 14, 16, digit, 'O')
    g.outline('K')
    return g


def buch():
    g = new()
    for i, (col, hl) in enumerate((('R', 'V'), ('1', '3'), ('A', 'F'))):
        y = 4 + i * 6
        x0 = 3 + (i % 2) * 2
        g.rect(x0, y, x0 + 17, y + 5, col); g.rect(x0 + 15, y + 1, x0 + 17, y + 4, 'O'); g.hline(x0 + 1, x0 + 14, y, hl)
        g.vline(x0 + 1, y, y + 5, hl); g.hline(x0 + 4, x0 + 9, y + 2, 'G')
    g.outline('K')
    return g


def block(size=24):
    g = new(size, size)
    g.rect(0, 0, size - 1, size - 1, '!')
    g.rect(2, 2, size - 3, size - 3, '?')
    g.rect(size - 4, 2, size - 3, size - 3, 'g'); g.rect(2, size - 4, size - 3, size - 3, 'g')
    for (x, y) in ((1, 1), (size - 3, 1), (1, size - 3), (size - 3, size - 3)):
        g.rect(x, y, x + 1, y + 1, '@')
    m = size // 2
    q = G(7, 10)
    q.put(0, 0, ".#####.\n##...##\n##...##\n....##.\n...##..\n...##..\n...##..\n.......\n...##..\n...##..")
    q.replace('#', 'O')
    g.paste(q, m - 3, m - 5)
    g.outline('K')
    return g


def pipe(w=24, h=24):
    g = new(w, h)
    g.rect(0, 1, w - 1, 6, 'P'); g.rect(1, 2, 2, 5, 'Q'); g.rect(w - 4, 2, w - 2, 5, 'p')
    g.rect(2, 7, w - 3, h - 1, 'P'); g.rect(3, 8, 4, h - 1, 'Q'); g.rect(w - 6, 8, w - 4, h - 1, 'p')
    g.hline(2, w - 3, 7, 'p')
    g.outline('K')
    return g


def flagge():
    g = new()
    g.rect(3, 1, 4, 22, '$'); g.vline(3, 1, 22, '='); g.rect(1, 22, 6, 23, '@')
    for i in range(10):
        g.hline(5, 5 + 13 - int(i * 1.3) if i <= 5 else 5 + 13 - int((10 - i) * 1.3) - 1, 2 + i, 'P')
    g.rect(5, 2, 8, 11, 'Q')
    g.outline('K')
    draw_text(g, 8, 4, 'B', 'W')
    return g


def hantel():
    g = new()
    g.rect(5, 11, 18, 12, '0'); g.hline(5, 18, 11, '=')
    for px in (2, 18):
        g.rect(px, 6, px + 3, 17, '@'); g.vline(px, 6, 17, '$'); g.hline(px, px + 3, 6, '$')
    g.outline('K')
    return g


def glove():
    g = new()
    g.ellipse(11, 10, 8.5, 8.2, '2'); g.ellipse(10, 9, 7.8, 7.5, '1'); g.ellipse(7.5, 7, 3.0, 2.6, '3')
    g.rect(7, 17, 15, 21, 'O'); g.hline(7, 15, 21, 'o'); g.hline(9, 13, 19, 'o')
    g.outline('K')
    return g


def skate():
    g = new()
    g.rect(2, 12, 21, 14, '@'); g.hline(3, 20, 12, '$'); g.set(1, 11, '$'); g.set(22, 11, '$'); g.set(1, 12, '@'); g.set(22, 12, '@')
    for wx in (5, 15):
        g.hline(wx, wx + 3, 15, '-'); g.rect(wx - 1, 16, wx + 3, 18, 'R'); g.set(wx + 1, 17, 'V')
    g.outline('K')
    return g


def spray():
    g = new()
    g.rect(7, 6, 14, 21, '0'); g.vline(8, 7, 20, '='); g.rect(7, 11, 14, 15, '&'); g.set(8, 12, '*')
    g.rect(8, 3, 13, 5, '@'); g.set(12, 2, '$')
    g.outline('K')
    for (x, y, c) in ((16, 3, '&'), (18, 2, '&'), (18, 4, '%'), (20, 1, '%'), (20, 5, '%'), (22, 3, '*'), (21, 6, '*')):
        g.set(x, y, c)
    return g


def phones():
    g = new()
    g.ellipse(12, 12, 10.5, 10.5, '#', only=lambda x, y: y <= 13)
    inner = G(24, 24); inner.ellipse(12, 12, 7.5, 7.5, 'X', only=lambda x, y: y <= 13)
    for y in range(24):
        for x in range(24):
            if inner.d[y][x] == 'X':
                g.d[y][x] = '.'
    g.ellipse(6, 5, 2.5, 1.4, '$')
    for x0 in (0, 17):
        g.rect(x0, 11, x0 + 6, 20, '#'); g.rect(x0 + 2, 14, x0 + 4, 17, '4'); g.set(x0 + 1, 12, '$')
    g.outline('K')
    return g


def gitarre():
    g = new()
    for y in range(11, 23):
        t = (y - 11) / 12
        x0 = int(4 + t * 6); x1 = int(19 - t * 6)
        g.hline(x0, x1, y, 'R')
    g.rect(5, 11, 18, 12, 'V'); g.rect(9, 14, 13, 15, '#'); g.set(11, 20, 'r')
    g.rect(10, 2, 12, 12, 'w'); g.vline(11, 3, 12, 'O')
    for fy in (4, 6, 8, 10):
        g.set(10, fy, '#'); g.set(12, fy, '#')
    g.rect(9, 0, 13, 2, '#'); g.set(8, 0, 'G'); g.set(14, 1, 'G')
    g.outline('K')
    return g


def ball():
    g = new()
    g.ellipse(12, 12, 9.5, 9.5, 'o'); g.ellipse(11, 11, 8.8, 8.8, 'O')
    g.ellipse(12, 12, 2.4, 2.4, '#')
    for i in range(5):
        a = -math.pi / 2 + i * 2 * math.pi / 5
        g.ellipse(12 + math.cos(a) * 6.5, 12 + math.sin(a) * 6.5, 1.8, 1.8, '#')
    g.outline('K')
    return g


def brille():
    g = new()
    g.hline(2, 21, 8, 'G'); g.ellipse(7, 12, 4.6, 4.2, '@'); g.ellipse(17, 12, 4.6, 4.2, '@')
    g.set(5, 10, '$'); g.set(15, 10, '$'); g.hline(11, 13, 9, 'G'); g.set(2, 9, 'G'); g.set(21, 9, 'G')
    g.outline('K')
    return g


def herz():
    g = new()
    g.ellipse(7.5, 8.5, 5.6, 5.2, '&'); g.ellipse(16.5, 8.5, 5.6, 5.2, '&')
    for y in range(10, 21):
        t = (y - 10) / 10
        g.hline(int(2 + t * 10), int(22 - t * 10), y, '&')
    g.ellipse(14, 12, 6, 5, 'p', only=lambda x, y: x > 13 and y > 8)
    g.ellipse(6.5, 6.5, 1.8, 1.4, '*')
    g.outline('K')
    return g


def krone():
    g = new()
    g.rect(3, 13, 20, 19, 'G'); g.rect(3, 17, 20, 19, 'g'); g.hline(4, 19, 13, 'L')
    for (x0, x1, tip) in ((3, 8, 5), (9, 14, 11), (15, 20, 18)):
        for y in range(4, 13):
            t = (y - 4) / 9
            half = int(t * 3)
            g.hline(tip - half, tip + half, y, 'G')
        g.set(tip, 4, 'L')
    g.set(5, 15, 'R'); g.set(11, 15, '1'); g.set(18, 15, 'R')
    g.outline('K')
    return g


def pokal():
    g = new()
    g.ellipse(12, 7, 7.5, 6.5, 'G', only=lambda x, y: y >= 3); g.ellipse(9.5, 5, 3.0, 2.6, 'L')
    g.rect(11, 13, 13, 17, 'G'); g.rect(6, 18, 18, 21, 'g'); g.hline(7, 17, 18, 'G')
    for s in (-1, 1):
        cx = 12 + s * 9
        g.ellipse(cx, 7, 2.6, 3.2, 'G'); g.ellipse(cx, 7, 1.2, 1.8, '.')
    g.outline('K')
    return g


def nuckel():
    g = new()
    g.ellipse(12, 5, 3.2, 3.0, 'V'); g.set(11, 4, '%')
    g.ellipse(12, 11, 8.5, 4.5, '1'); g.ellipse(10, 10, 4.0, 2.0, '3')
    g.ellipse(12, 17.5, 5.5, 3.8, '1')
    inner = G(24, 24); inner.ellipse(12, 17.5, 3.5, 2.0, 'X')
    for y in range(24):
        for x in range(24):
            if inner.d[y][x] == 'X':
                g.d[y][x] = '.'
    g.outline('K')
    return g


def schal():
    g = new()
    for x in range(2, 22):
        g.vline(x, 8, 15, 'R' if (x - 2) // 4 % 2 == 0 else 'O')
    g.hline(2, 21, 15, 'r')
    for fx in (1, 22):
        for fy in (8, 10, 12, 14):
            g.set(fx, fy, 'O')
    g.outline('K')
    draw_text(g, 7, 9, 'VFB', 'O')
    return g


def fahne():
    g = new()
    g.rect(3, 1, 4, 22, '$'); g.vline(3, 1, 22, '=')
    g.rect(5, 2, 21, 14, 'O')
    for y in range(2, 15):
        g.hline(max(5, 5 + (y - 2) - 2), min(21, 5 + (y - 2) + 2), y, 'R')
    g.ellipse(13, 8, 3.5, 3.5, 'O'); g.ellipse(13, 8, 3.5, 3.5, 'R', only=lambda x, y: abs(x - 13) > 2 or abs(y - 8) > 2)
    g.outline('K')
    return g


def kristall():
    g = new()
    for (bx, tip, ty, w, c1, c2) in ((7, 7, 6, 4, '0', '='), (13, 13, 1, 5, '=', 'O'), (18, 18, 9, 3, '0', '-')):
        for y in range(ty, 23):
            t = (y - ty) / (23 - ty)
            half = max(0, int(t * w))
            g.hline(bx - half, bx + half, y, c1)
            if half > 1:
                g.set(bx - half + 1, y, c2)
    g.outline('K')
    return g


ALL = {
    'kaffee': kaffee, 'karte': lambda: karte('R', '7'), 'karte_blau': lambda: karte('1', '4'), 'karte_gruen': lambda: karte('A', '2'),
    'karte_gelb': lambda: karte('?', '9'), 'buch': buch, 'block': block, 'pipe': pipe, 'flagge': flagge, 'hantel': hantel,
    'glove': glove, 'skate': skate, 'spray': spray, 'phones': phones, 'gitarre': gitarre, 'ball': ball, 'brille': brille,
    'herz': herz, 'krone': krone, 'pokal': pokal, 'nuckel': nuckel, 'schal': schal, 'fahne': fahne, 'kristall': kristall,
}

if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), 'out')
    names = list(ALL)
    render_sheet([ALL[n]() for n in names], os.path.join(out, 'items_x5.png'), scale=5, labels=names, gap=14)
