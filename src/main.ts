import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { audio } from './systems/Audio';

// iOS needs a user gesture before any sound can play
const unlock = () => audio.unlock();
window.addEventListener('pointerdown', unlock, { passive: true });
window.addEventListener('keydown', unlock);

/** Canvas runs at device resolution (crisp pixels); CSS zoom scales it back to the viewport. */
const DPR = Math.min(window.devicePixelRatio || 1, 3);
const size = () => ({ w: Math.round(window.innerWidth * DPR), h: Math.round(window.innerHeight * DPR) });

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#FFC2DC',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: { mode: Phaser.Scale.NONE, width: size().w, height: size().h, zoom: 1 / DPR },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false, tileBias: 32 } },
  input: { activePointers: 4 },
  fps: { target: 60 },
  scene: [BootScene, PreloadScene, GameScene, HudScene],
});

let fitTimer = 0;
const fit = () => {
  window.clearTimeout(fitTimer);
  fitTimer = window.setTimeout(() => { const s = size(); game.scale.resize(s.w, s.h); }, 60);
};
window.addEventListener('resize', fit);
window.visualViewport?.addEventListener('resize', fit);
window.addEventListener('orientationchange', () => setTimeout(fit, 250));

(window as unknown as { __game: Phaser.Game }).__game = game;
