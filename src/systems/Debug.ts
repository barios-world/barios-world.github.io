import Phaser from 'phaser';
import { T, TUNING_META, DEFAULTS, type TuningKey } from '../config/Tuning';

/** DOM tuning panel. Open with ?debug in the URL or a triple tap in the top-left corner. */
export function setupDebug(game: Phaser.Game) {
  if (document.getElementById('dbg')) return;
  const el = document.createElement('div');
  el.id = 'dbg';
  el.style.cssText = 'position:fixed;top:0;right:0;bottom:0;width:250px;overflow:auto;background:rgba(15,13,12,.94);color:#F2ECE2;' +
    'font:11px/1.5 ui-monospace,monospace;padding:10px 12px;z-index:30;display:none;box-sizing:border-box;border-left:2px solid #FF4FA3';
  el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <b style="color:#FF4FA3;letter-spacing:.08em">TUNING</b><span id="dbg-fps" style="color:#6FD8B0"></span>
      <button id="dbg-x" style="background:#2E2724;color:#fff;border:0;border-radius:4px;padding:2px 8px">×</button></div>
    <div id="dbg-rows"></div>
    <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">
      <label><input type="checkbox" id="dbg-hit"> Hitboxen</label>
      <button id="dbg-restart">Level neu</button><button id="dbg-reset">Werte zurück</button><button id="dbg-copy">Werte kopieren</button>
    </div>`;
  document.body.appendChild(el);
  const rows = el.querySelector('#dbg-rows') as HTMLElement;
  const btn = (id: string) => el.querySelector('#' + id) as HTMLElement;
  const spans: Record<string, HTMLElement> = {};
  const inputs: Record<string, HTMLInputElement> = {};
  (Object.keys(TUNING_META) as TuningKey[]).forEach((key) => {
    const [min, max, step] = TUNING_META[key]!;
    const row = document.createElement('div');
    row.innerHTML = `<div style="display:flex;justify-content:space-between"><span>${key}</span><span id="v-${key}"></span></div>
      <input type="range" min="${min}" max="${max}" step="${step}" value="${T[key]}" style="width:100%;accent-color:#FF4FA3">`;
    rows.appendChild(row);
    const inp = row.querySelector('input') as HTMLInputElement;
    inputs[key] = inp;
    spans[key] = row.querySelector('#v-' + key) as HTMLElement;
    spans[key].textContent = String(T[key]);
    inp.oninput = () => { T[key] = +inp.value; spans[key].textContent = inp.value; };
  });
  const gameScene = () => game.scene.getScene('game') as Phaser.Scene & { restartLevel?: () => void };
  btn('dbg-x').onclick = () => (el.style.display = 'none');
  btn('dbg-restart').onclick = () => gameScene().scene.restart();
  btn('dbg-reset').onclick = () => {
    (Object.keys(TUNING_META) as TuningKey[]).forEach((k) => { T[k] = DEFAULTS[k]; inputs[k].value = String(T[k]); spans[k].textContent = String(T[k]); });
  };
  btn('dbg-copy').onclick = () => {
    const txt = JSON.stringify(Object.fromEntries((Object.keys(TUNING_META) as TuningKey[]).map((k) => [k, T[k]])), null, 2);
    navigator.clipboard?.writeText(txt).catch(() => {});
  };
  (btn('dbg-hit') as HTMLInputElement).onchange = (e) => {
    const on = (e.target as HTMLInputElement).checked;
    const sc = gameScene();
    const world = sc.physics.world;
    if (on && !world.debugGraphic) world.createDebugGraphic();
    world.drawDebug = on;
    if (!on) world.debugGraphic?.clear();
  };
  setInterval(() => { if (el.style.display !== 'none') btn('dbg-fps').textContent = Math.round(game.loop.actualFps) + ' fps'; }, 500);

  const show = () => (el.style.display = 'block');
  if (location.search.includes('debug')) show();
  let taps: number[] = [];
  window.addEventListener('pointerdown', (e) => {
    if (e.clientX > 90 || e.clientY > 90) return;
    const now = performance.now();
    taps = taps.filter((t) => now - t < 900).concat(now);
    if (taps.length >= 3) { taps = []; show(); }
  }, { passive: true });
}
