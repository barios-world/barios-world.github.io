# Barios World

**Jump. Kaffee. Cambio. Repeat.** — 2D Jump 'n' Run für iPhone (quer), gebaut mit Phaser 3 + TypeScript + Vite. 100 % kostenlose Werkzeuge, kein Apple-Account nötig.

## Spielen (iPhone)

Dauer-Link: **https://barios-world.github.io/**

1. Link in Safari öffnen, iPhone quer halten.
2. Teilen-Symbol → **Zum Home-Bildschirm** → das Spiel läuft als Vollbild-App, auch offline.
3. Nach einem Update: App einmal komplett schließen und neu öffnen (Service Worker zieht die neue Version).

Vor dem Titel fragt eine Kreidetafel nach dem **Tafel-Code** (nur für Freunde; wird pro Gerät gemerkt). Im Code liegt nur der SHA-256-Hash (`src/scenes/GateScene.ts`); neuen Code setzen: `python3 -c "import hashlib;print(hashlib.sha256(b'DEINCODE').hexdigest())"` und den Hash eintragen. Die Seite ist per `noindex`/`robots.txt` von Suchmaschinen ausgenommen.

Alles wird lokal gespeichert (Fortschritt, Karten, Shop, Einstellungen). `?debug` an die URL hängen oder 3× oben links tippen: Tuning-Regler, Hitboxen, FPS, alle Level offen.

## Steuerung

- **iPhone:** linke Hälfte = schwebender Joystick (erscheint unter dem Daumen), rechts unten = **SPRUNG** (halten = höher), darüber = **WURF** der aktiven Form / KHUSRA MUND bei vollem Meter. **STAMPF:** in der Luft Stick nach unten + Wurf – Bario knallt runter, die Druckwelle erledigt Gegner, zerbricht Ziegel und öffnet Blöcke. Oben Mitte = Pause.
- **Mac:** Pfeile/WASD, Leertaste = Sprung, X/J/K = Wurf, Runter/S + Wurf in der Luft = Stampf, Shift = gehen, P/ESC = Pause.
- Optionen: Sound, Musik, Linkshänder, große Knöpfe, Blitze reduzieren, Assist-Modus (5 Herzen, langsamere Mobs + Boss, unendlich Leben).

## Season 1 – drei Stationen, ein Boss

| # | Station | Motto | Was passiert |
|---|---|---|---|
| 1 | **Der Boulevard** | Good People, Crazy Times | Ankommen ohne ein Wort Text, erster Meistersager hinter der Litfaßsäule, ?-Blöcke + Kaffee-Form, **die Parade** läuft dir entgegen, Weg zur goldenen Tür. Geheime Röhre an der Bushaltestelle → Bonusraum „Das Herz". |
| 2 | **Barios Coffee** | Good Coffee, Better People | Theke, Dampf-Lifte, Zuckerhaufen (Schaden), Hantel + Ziegel, **Laufbänder** (mit und gegen den Strom), **die große Tasse kippt** und gibt ein Royal frei, Lager-Finale. Röhre hinter dem Regal → „Lagerraum". |
| 3 | **Cambio** | Same Friends, Different Rules | Kartenplattformen, der Dealer (Cambio-Master), **das Roulette-Rad** als drehende Plattformen mit Royal in der Mitte, Joker-Tür → „Jokers Zimmer", Finale: **der Fanblock stürmt das Casino**. |
| ∞ | **Der Thronsaal** | Ruhe im Spiel, Chaos im Kopf | Der Direktor springt vom Thron, drei Phasen, Zuckerstampf, Gürtel → Boss Rush. |

Jedes Level: 4 Royals (eins im Bonusraum), Sektionen mit eigener Musik-Stimmung (ruhig → voll → Finale), Bario kommentiert Schlüsselstellen, Intro-Karte mit Motto, am Ende **CAMBIO!** mit aufgedeckter Kartenhand. Level-Quelle: `tools/levels/season1.py` (Tiles + Objekte + Plan-Bilder in `tools/levels/out/*_plan.png`).

Sechs Formen (Sport-Suchti, Boxer, Skater, Sprayer, DJ, Rocker), vier Specials, KHUSRA MUND, Barios Shop mit fünf Level-Ups, Boss Rush (nach dem ersten Sieg über den Direktor – der Gürtel zählt die Zeit).

**Stimmen:** echte Sprache – 26 kleine AAC-Clips (178 KB), kostenlos erzeugt mit der macOS-Sprachausgabe (`say`: Bario = Eddy/Spanisch, Direktor = Rocko/Deutsch tief abgespielt, Meistersager = Junior schnell abgespielt; Skript in `tools/voice.md`). Fällt ein Clip aus, springt der Silben-Synth ein. Bario bedankt sich fabulös für jede Karte („¡Gracias!", „¡Fabuloso!", „¡Qué rico!") und ruft „Khusra!", die Meistersager brabbeln Baby-Laute („Gaga?", „Wääh!", „Meithhter!"), der Direktor grollt tief wie Bowser („Ruhe im Spiel, Chaos im Kopf", „Mehr Zucker!", „Ha ha ha!"). Alle Sprüche stehen in `src/systems/Audio.ts` (`PHRASES`).

## Entwickeln

```bash
npm install
npm run assets     # Sprites -> Atlas, Tilesets (W1-W5), Icons, Level (ASCII -> Tiled JSON)
npm run dev        # Dev-Server im WLAN: http://<Mac-IP>:5173  -> auf dem iPhone in Safari öffnen
npm run build      # tsc + Vite -> dist/ (GitHub Pages deployt automatisch bei jedem Push auf main)
npm run spielbuch  # design/spielbuch.html neu bauen
```

- **Level:** `tools/levels/season1.py` (Season 1) und `gen.py` (Boss) → `levels/src/*.txt` + `*.objects.json` (Sidecar für Röhren, Parade, Laufband, Roulette, Sturm, Sprüche, Musik-Sektionen) → `npm run levels` → `src/assets/levels/*.tmj`. `tools/levels/check.py` prüft jedes Level gegen Barios echte Körpergröße und den gemessenen Sprung (Hauptweg: max. 2 Kacheln hoch, Lücken ≤ 4/3/2; Karten ≤ 4 Reihen über einem Standplatz; Blöcke 2–4 Reihen über dem Boden; keine 1-Kachel-Schlitze). `preview.py` rendert PNGs nach `tools/levels/out/`.
- **Sprung (gemessen, JUMP_V 700):** 4,0 Kacheln hoch, 5,5 Kacheln weit im Lauf, 3 im Gehen.
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
