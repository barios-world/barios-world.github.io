import Phaser from 'phaser';
import { U, PX, HAND, board, button, logo } from '../ui/ui';
import { LEVELS } from '../data/levels';
import { save } from '../systems/Save';
import { audio, TRACK_TITLE } from '../systems/Audio';

export class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }

  create() {
    const u = U(), w = this.scale.width, h = this.scale.height;
    board(this);
    audio.play(TRACK_TITLE);

    // taped note (top-left)
    const nx = 26 * u, ny = 22 * u;
    const note = this.add.graphics().setDepth(1);
    note.fillStyle(0xd8cdb4, 1).fillRect(0, 0, 96 * u, 40 * u);
    note.fillStyle(0xefe6d2, 0.85).fillRect(30 * u, -5 * u, 34 * u, 9 * u);
    note.setPosition(nx, ny).setAngle(-4);
    this.add.text(nx + 48 * u, ny + 20 * u, 'Kleine Schritte\ngrosse Pläne ♥', HAND(u, 12, '#3A322A')).setOrigin(0.5).setAngle(-4).setDepth(2).setAlign('center');

    // crown + logo
    this.add.image(w / 2, h * 0.07, 'spr', 'it_krone_0').setScale(1.4 * u).setOrigin(0.5, 1).setDepth(2);
    const bottom = logo(this, w / 2, h * 0.08, u, 1.15);
    this.add.text(w / 2, bottom + 8 * u, 'JUMP. KAFFEE. CAMBIO. REPEAT.', PX(u, 7, '#FFF4DC')).setOrigin(0.5, 0).setDepth(2);

    // Bario waving (front idle) + walking meistersager for life
    const bario = this.add.sprite(w * 0.2, h * 0.94, 'spr', 'bario_idle_0').setOrigin(0.5, 58 / 64).setScale(2 * u).setDepth(3);
    bario.play('bario_idle');
    const mob = this.add.sprite(w * 0.82, h * 0.94, 'spr', 'meister_walk_0').setOrigin(0.5, 58 / 64).setScale(2 * u).setDepth(3).setFlipX(true);
    mob.play('meister_walk');
    this.tweens.add({ targets: mob, x: w * 0.7, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.inOut', onYoyo: () => mob.setFlipX(false), onRepeat: () => mob.setFlipX(true) });
    const floor = this.add.graphics().setDepth(1);
    floor.lineStyle(2 * u, 0x4a403a, 1).lineBetween(0, h * 0.94 + 2 * u, w, h * 0.94 + 2 * u);

    // buttons
    const bw = 150 * u, bh = 28 * u, cx = w / 2;
    const firstOpen = LEVELS.find((l) => l.world > 0 && !save.progress(l.key).cleared && save.isUnlocked(l.key, LEVELS[0].key)) ?? LEVELS[0];
    const anyCleared = LEVELS.some((l) => save.progress(l.key).cleared);
    let y = h * 0.47;
    button(this, cx, y, bw, bh, anyCleared ? 'WEITERSPIELEN' : 'SPIELEN', () => this.startLevel(firstOpen.key), { primary: true, u });
    y += bh + 8 * u;
    button(this, cx, y, bw, bh, 'WEGWEISER', () => this.scene.start('levels'), { u });
    y += bh + 8 * u;
    button(this, cx - bw / 4 - 4 * u, y, bw / 2 - 4 * u, bh, 'SHOP', () => this.scene.start('shop'), { u, size: 8 });
    button(this, cx + bw / 4 + 4 * u, y, bw / 2 - 4 * u, bh, 'OPTIONEN', () => this.scene.launch('settings', { from: 'title' }), { u, size: 7 });

    // chalk scribbles
    this.add.text(w * 0.12, h * 0.55, 'Life is\nCambio ♥', HAND(u, 14)).setOrigin(0.5).setAngle(-6).setDepth(2).setAlign('center');
    this.add.text(w * 0.86, h * 0.5, 'Same shit\ndifferent level ♥', HAND(u, 13, '#A79C90')).setOrigin(0.5).setAngle(4).setDepth(2).setAlign('center');
    this.add.text(w - 8 * u, h - 6 * u, `Karten gesamt: ${save.data.totalCards}`, PX(u, 5, '#6E635B')).setOrigin(1, 1).setDepth(2);
    this.add.text(8 * u, h - 6 * u, 'v0.6  M6', PX(u, 5, '#6E635B')).setOrigin(0, 1).setDepth(2);
    if (save.data.bossCleared) this.add.text(w / 2, h * 0.395, 'LEGENDE ♥  Season 1 geschafft', HAND(u, 12, '#FFC24B')).setOrigin(0.5).setDepth(2);
  }

  startLevel(key: string) {
    this.registry.set('lives', 3);
    this.registry.set('hearts', save.settings.assist ? 5 : 3);
    this.registry.set('form', 'base');
    this.scene.start('game', { level: key });
    this.scene.launch('hud');
  }
}
