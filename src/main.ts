import Phaser from 'phaser';
import './style.css';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { GateScene } from './scenes/GateScene';
import { TitleScene } from './scenes/TitleScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { PauseScene } from './scenes/PauseScene';
import { SettingsScene } from './scenes/SettingsScene';
import { ShopScene } from './scenes/ShopScene';
import { audio } from './systems/Audio';
import { save } from './systems/Save';

save.load();
audio.setSound(save.settings.sound);
audio.setMusic(save.settings.music);

// iOS needs a user gesture before any sound can play
const unlock = () => audio.unlock();
window.addEventListener('pointerdown', unlock, { passive: true });
window.addEventListener('keydown', unlock);

/** Canvas runs at device resolution (crisp pixels); CSS zoom scales it back to the viewport. */
const DPR = Math.min(window.devicePixelRatio || 1, 3);
// A 0x0 viewport (hidden tab/pane at boot) would make WebGL framebuffer creation fail; clamp to a sane minimum.
const size = () => ({ w: Math.round(Math.max(window.innerWidth, 320) * DPR), h: Math.round(Math.max(window.innerHeight, 180) * DPR) });

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#171311',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: { mode: Phaser.Scale.NONE, width: size().w, height: size().h, zoom: 1 / DPR },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false, tileBias: 32 } },
  input: { activePointers: 4 },
  fps: { target: 60 },
  scene: [BootScene, PreloadScene, GateScene, TitleScene, LevelSelectScene, GameScene, HudScene, PauseScene, SettingsScene, ShopScene],
});

let fitTimer = 0;
const fit = () => {
  window.clearTimeout(fitTimer);
  fitTimer = window.setTimeout(() => { const s = size(); game.scale.resize(s.w, s.h); }, 60);
};
window.addEventListener('resize', fit);
window.visualViewport?.addEventListener('resize', fit);
window.addEventListener('orientationchange', () => setTimeout(fit, 250));

// Offline: cache the app after the first visit (production only, dev uses HMR)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

(window as unknown as { __game: Phaser.Game }).__game = game;
