# Stimmen erzeugen (kostenlos, offline)

Die Sprachclips in `src/assets/voice/*.m4a` kommen aus der macOS-Sprachausgabe. Neu erzeugen (Text/Stimme in der Tabelle anpassen):

```bash
say -v "Eddy (Spanisch (Spanien))" -o /tmp/x.aiff "¡Gracias!"
afconvert -f m4af -d aac -b 32000 -q 127 -s 3 /tmp/x.aiff src/assets/voice/bario_gracias.m4a
```

Zuordnung: `bario_*` = Eddy (es_ES), Wiedergabe ×1.08 · `boss_*` = Rocko (de_DE), Wiedergabe ×0.74 (tief, langsam) · `baby_*` = Junior (en_US), Wiedergabe ×1.25.
Dateiname = `<stimme>_<zeile>.m4a`, die Zeile ist der Schlüssel in `audio.say(stimme, zeile)`.
