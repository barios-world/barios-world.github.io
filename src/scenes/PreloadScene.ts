import Phaser from 'phaser';

const ANIMS: [string, number][] = [
  ['bario_idle', 2], ['bario_walk', 10], ['bario_run', 14],
  ['meister_idle', 2], ['meister_walk', 10], ['meister_run', 14],
  ['direktor_idle', 2], ['direktor_walk', 8],
  ['formwalk_sport', 10], ['formwalk_boxer', 10], ['formwalk_skater', 10], ['formwalk_sprayer', 10], ['formwalk_dj', 10], ['formwalk_rocker', 10],
  ['formidle_sport', 2], ['formidle_boxer', 2], ['formidle_skater', 2], ['formidle_sprayer', 2], ['formidle_dj', 2], ['formidle_rocker', 2],
];

export class PreloadScene extends Phaser.Scene {
  constructor() { super('preload'); }

  preload() {
    const u = Math.min(window.devicePixelRatio || 1, 3);
    const w = this.scale.width, h = this.scale.height;
    const bar = this.add.graphics();
    const txt = this.add.text(w / 2, h / 2 - 30 * u, 'BARIOS WORLD', { fontFamily: '"Press Start 2P", monospace', fontSize: `${14 * u}px`, color: '#FF4FA3' }).setOrigin(0.5);
    const sub = this.add.text(w / 2, h / 2 + 30 * u, 'Kleine Schritte, grosse Plaene', { fontFamily: 'Caveat, cursive', fontSize: `${20 * u}px`, color: '#A79C90' }).setOrigin(0.5);
    this.load.on('progress', (p: number) => {
      bar.clear().fillStyle(0x2e2724).fillRect(w / 2 - 100 * u, h / 2 - 4 * u, 200 * u, 8 * u)
        .fillStyle(0xff4fa3).fillRect(w / 2 - 100 * u, h / 2 - 4 * u, 200 * u * p, 8 * u);
    });
    this.load.once('complete', () => { bar.destroy(); txt.destroy(); sub.destroy(); });

    this.load.atlas('spr', 'atlas.png', 'atlas.json');
    this.load.image('tiles', 'tiles.png');
    this.load.tilemapTiledJSON('lvl_t1', 'levels/t1.tmj');
  }

  async create() {
    try {
      await Promise.race([
        Promise.all([document.fonts.load('10px "Press Start 2P"'), document.fonts.load('20px Caveat')]),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch { /* fonts are optional */ }
    this.makeAnims();
    this.scene.start('game', { level: 'lvl_t1' });
    this.scene.launch('hud');
  }

  private makeAnims() {
    const tex = this.textures.get('spr');
    for (const [name, fps] of ANIMS) {
      if (this.anims.exists(name)) continue;
      const frames: string[] = [];
      for (let i = 0; tex.has(`${name}_${i}`); i++) frames.push(`${name}_${i}`);
      if (!frames.length) continue;
      this.anims.create({ key: name, frames: frames.map((f) => ({ key: 'spr', frame: f })), frameRate: fps, repeat: -1 });
    }
    if (!this.anims.exists('bario_jump')) this.anims.create({ key: 'bario_jump', frames: [{ key: 'spr', frame: 'bario_jump_0' }], frameRate: 1, repeat: 0 });
  }
}
