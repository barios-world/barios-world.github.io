"""Spielbuch: render every sprite to PNG, embed as data URIs into template.html -> design/spielbuch.html"""
import sys, os, io, base64, re
sys.path.insert(0, os.path.dirname(__file__))
from px import *
from assemble import assemble

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

SPR = assemble(include_scenes=True)


def png_uri(im):
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')


META, URI = {}, {}
for name, frames in SPR.items():
    w, h = frames[0].w, frames[0].h
    strip = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.alpha_composite(to_image(f, 1), (i * w, 0))
    URI[name] = png_uri(strip)
    META[name] = {'w': w, 'h': h, 'n': len(frames)}
    strip.save(os.path.join(OUT, f'spr_{name}.png'))

tpl = open(os.path.join(HERE, 'template.html'), encoding='utf-8').read()


def rep_wh(m):
    n, s = m.group(1), int(m.group(2)); w, h = META[n]['w'], META[n]['h']
    return f'width:{w*s}px;height:{h*s}px'


def rep_anim(m):
    n = m.group(1); d = META[n]
    return f'data-src="{URI[n]}" data-w="{d["w"]}" data-h="{d["h"]}" data-n="{d["n"]}"'


def rep_frames(m):
    n, s = m.group(1), int(m.group(2)); d = META[n]
    return ''.join(f'<div class="fr" style="width:{d["w"]*s}px;height:{d["h"]*s}px;background-image:url({URI[n]});'
                   f'background-size:{d["w"]*d["n"]*s}px {d["h"]*s}px;background-position:-{i*d["w"]*s}px 0"></div>' for i in range(d['n']))


html = re.sub(r'%%frames:([a-z_0-9]+):(\d+)%%', rep_frames, tpl)
html = re.sub(r'%%anim:([a-z_0-9]+)%%', rep_anim, html)
html = re.sub(r'%%wh:([a-z_0-9]+):(\d+)%%', rep_wh, html)
html = re.sub(r'%%img:([a-z_0-9]+)%%', lambda m: URI[m.group(1)], html)
missing = re.findall(r'%%[a-z]+:[^%]+%%', html)
if missing:
    print('MISSING:', missing[:10])
dst = os.path.join(ROOT, 'design', 'spielbuch.html')
open(dst, 'w', encoding='utf-8').write(html)
print(f'{len(SPR)} sprites -> {dst} ({len(html)/1024:.0f} KB)')
