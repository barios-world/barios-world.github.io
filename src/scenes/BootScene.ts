import Phaser from 'phaser';
import { setupDebug } from '../systems/Debug';

export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }
  create() {
    setupDebug(this.game);
    this.scene.start('preload');
  }
}
