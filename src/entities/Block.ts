import Phaser from 'phaser';
import { audio } from '../systems/Audio';

/** ?-Block: bump it from below -> contents pop out, block becomes 'used'. Frame 16/17 of the tileset. */
export class Block extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.StaticBody;
  contents: string;
  used = false;
  onSpawn?: (block: Block, contents: string) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, contents: string) {
    super(scene, x + 16, y + 16, 'tilesS', 16);
    this.contents = contents;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(2);
  }

  bump() {
    if (this.used) {
      audio.bump();
      return;
    }
    this.used = true;
    audio.bump();
    this.setFrame(17);
    this.scene.tweens.add({ targets: this, y: this.y - 8, duration: 80, yoyo: true, ease: 'Quad.out' });
    this.onSpawn?.(this, this.contents);
  }
}
