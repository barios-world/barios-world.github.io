# Barios World

Jump. Kaffee. Cambio. Repeat. — 2D Jump 'n' Run für iPhone (quer), gebaut mit Phaser 3 + TypeScript + Vite.

## Entwickeln

```bash
npm install
npm run assets     # Sprites -> public/atlas.png, Tileset, Icons, Level (ASCII -> Tiled JSON)
npm run dev        # Dev-Server im WLAN: http://<Mac-IP>:5173  -> auf dem iPhone in Safari öffnen
```

- `?debug` an die URL hängen (oder 3× oben links tippen): Tuning-Regler, Hitboxen, FPS.
- Level: `levels/src/*.txt` (ASCII) → `npm run levels` → `public/levels/*.tmj` (in Tiled editierbar).
- Sprites: `tools/sprites/` (Python + Pillow). `npm run spielbuch` baut das Design-Spielbuch neu.

## Steuerung

- iPhone: linke Hälfte = Joystick (erscheint am Daumen), rechts unten = Sprung (halten = höher), darüber = Wurf.
- Mac: Pfeile/WASD, Leertaste = Sprung, X/J/K = Wurf, Shift = gehen.
