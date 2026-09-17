"""App icons from Bario's portrait -> public/icons/icon-{180,192,512}.png"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from px import *
from figures import BARIO
import poses as P

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'public', 'icons')
os.makedirs(OUT, exist_ok=True)

port = P.portrait(BARIO)          # 36x32
for size in (180, 192, 512):
    scale = max(1, size // 44)
    bg = Image.new('RGBA', (size, size), hexrgb('#FF4FA3') + (255,))
    inner = int(size * 0.86)
    frame = Image.new('RGBA', (inner, inner), hexrgb('#0F0D0C') + (255,))
    bg.alpha_composite(frame, ((size - inner) // 2, (size - inner) // 2))
    im = to_image(port, scale)
    bg.alpha_composite(im, ((size - im.width) // 2, (size - im.height) // 2))
    bg.save(os.path.join(OUT, f'icon-{size}.png'), optimize=True)
print('icons ->', OUT)
