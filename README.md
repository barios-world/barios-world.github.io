# Barios World

**Jump. Kaffee. Cambio. Repeat.** — 2D Jump 'n' Run für iPhone (quer), gebaut mit Phaser 3 + TypeScript + Vite. 100 % kostenlose Werkzeuge, kein Apple-Account nötig.

## Spielen (iPhone)

Dauer-Link: **https://zischanahmad.github.io/barios-world/**

1. Link in Safari öffnen, iPhone quer halten.
2. Teilen-Symbol → **Zum Home-Bildschirm** → das Spiel läuft als Vollbild-App, auch offline.
3. Nach einem Update: App einmal komplett schließen und neu öffnen (Service Worker zieht die neue Version).

Alles wird lokal gespeichert (Fortschritt, Karten, Shop, Einstellungen). `?debug` an die URL hängen oder 3× oben links tippen: Tuning-Regler, Hitboxen, FPS, alle Level offen.

## Steuerung

- **iPhone:** linke Hälfte = schwebender Joystick (erscheint unter dem Daumen), rechts unten = **SPRUNG** (halten = höher), darüber = **WURF** der aktiven Form / KHUSRA MUND bei vollem Meter. Oben Mitte = Pause.
- **Mac:** Pfeile/WASD, Leertaste = Sprung, X/J/K = Wurf, Shift = gehen, P/ESC = Pause.
- Optionen: Sound, Musik, Linkshänder, große Knöpfe, Blitze reduzieren, Assist-Modus (5 Herzen, langsamere Mobs + Boss, unendlich Leben).

## Season 1

| Welt | Level | Neu |
|---|---|---|
| 1 Der Boulevard | 1-1 … 1-5 | Meistersager, ?-Blöcke, Kaffee-Form, Cambio-Karten + Royals |
| 2 Barios Coffee | 2-1 … 2-5 | Njuckel-Werfer, Trommler, Zucker-Pfützen, Dampf-Lifte |
| 3 Cambio | 3-1 … 3-5 | Schal-Schild, Fan-Block, Kartenplattformen, Joker |
| 4 VFB Area | 4-1 … 4-5 | Fahnenträger-Aura, Ballwerfer, bewegte Plattformen |
| Der Thronsaal | Final Boss | **Der Direktor** – 3 Phasen (Brille, Kaffee Regen, Kristalle, Teleport) |

Sechs Formen (Sport-Suchti, Boxer, Skater, Sprayer, DJ, Rocker), vier Specials, KHUSRA MUND, Barios Shop mit fünf Level-Ups, Boss Rush (nach dem ersten Sieg über den Direktor – der Gürtel zählt die Zeit).

## Entwickeln

```bash
npm install
npm run assets     # Sprites -> Atlas, Tilesets (W1-W5), Icons, Level (ASCII -> Tiled JSON)
npm run dev        # Dev-Server im WLAN: http://<Mac-IP>:5173  -> auf dem iPhone in Safari öffnen
npm run build      # tsc + Vite -> dist/ (GitHub Pages deployt automatisch bei jedem Push auf main)
npm run spielbuch  # design/spielbuch.html neu bauen
```

- **Level:** `tools/levels/gen.py` (DSL) → `levels/src/*.txt` (ASCII) → `npm run levels` → `src/assets/levels/*.tmj` (Tiled-JSON). `tools/levels/check.py` prüft die Erreichbarkeit aller Level, `preview.py` rendert PNGs.
- **Sprites:** `tools/sprites/` (Python + Pillow): `px.py` Primitive, `figures.py` Figuren, `poses.py` Requisiten, `items.py` Icons, `env.py` Kacheln/Deko, `assemble.py` Sprite-Liste, `atlas.py` → `src/assets/atlas.png/json`.
- **Tuning:** alle Zahlen in `src/config/Tuning.ts` (mit Debug-Reglern), Formen in `src/data/forms.ts`, Welten in `src/data/worlds.ts`, Level-Liste in `src/data/levels.ts`.
- **Tests im Browser:** Phaser deterministisch steppen: `window.__step(n)` ruft `game.loop.step()` (Tweens laufen auf `Date.now()` – im Harness `scene.tweens.getDelta = () => 16.67` setzen).

## Struktur

```
src/scenes     Boot, Preload, Title, LevelSelect (Wegweiser), Game, Hud, Pause, Settings, Shop
src/entities   Player, Mob (6 Varianten), Block, Projectiles, Hazards, Direktor
src/systems    Input (Touch/Keyboard), Audio (WebAudio-Synth + Chiptune), Save, Debug
public/        manifest, Service Worker, Icons
design/        spielbuch.html + Sprite-Vorschauen
```

## Lizenzen

Phaser (MIT), Press Start 2P und Caveat (SIL Open Font License). Eigene Grafik, Musik und Sounds.
