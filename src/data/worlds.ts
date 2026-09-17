/** Visual + audio theme per world. Tile indices are shared; only the tileset palette differs. */
export interface WorldTheme {
  id: number;
  name: string;
  sky: string;
  horizon: string;
  hillFarTint: number;
  hillFarAlpha: number;
  hillNearTint: number;
  cloudAlpha: number;
  tiles: string;
  track: 'boulevard' | 'coffee' | 'casino' | 'vfb' | 'boss';
  /** decor frames placed on the ground every ~n px behind everything */
  ambient: { frame: string; every: number; scroll: number; yOff: number; alpha: number; scale?: number }[];
}

export const WORLDS: Record<number, WorldTheme> = {
  0: { id: 0, name: 'TESTPARK', sky: '#FFC2DC', horizon: '#FFE0B8', hillFarTint: 0xffffff, hillFarAlpha: 0.55, hillNearTint: 0xffffff, cloudAlpha: 0.9, tiles: 'tiles_w1', track: 'boulevard', ambient: [] },
  1: { id: 1, name: 'DER BOULEVARD', sky: '#FFC2DC', horizon: '#FFE0B8', hillFarTint: 0xffffff, hillFarAlpha: 0.55, hillNearTint: 0xffffff, cloudAlpha: 0.9, tiles: 'tiles_w1', track: 'boulevard', ambient: [] },
  2: { id: 2, name: 'BARIOS COFFEE', sky: '#F3E3C9', horizon: '#E8C9A0', hillFarTint: 0xd9b48a, hillFarAlpha: 0.6, hillNearTint: 0x9c6a3c, cloudAlpha: 0.55, tiles: 'tiles_w2', track: 'coffee',
       ambient: [{ frame: 'deco_cup_big_0', every: 520, scroll: 0.45, yOff: 0, alpha: 0.8 }, { frame: 'deco_steam_0', every: 260, scroll: 0.5, yOff: -60, alpha: 0.5 }] },
  3: { id: 3, name: 'CAMBIO', sky: '#1B1330', horizon: '#3A1F52', hillFarTint: 0x6a3a8a, hillFarAlpha: 0.7, hillNearTint: 0x2a5a3a, cloudAlpha: 0.15, tiles: 'tiles_w3', track: 'casino',
       ambient: [{ frame: 'deco_neon_0', every: 480, scroll: 0.5, yOff: -70, alpha: 1 }, { frame: 'deco_table_0', every: 330, scroll: 0.6, yOff: 0, alpha: 0.9 }] },
  4: { id: 4, name: 'VFB AREA', sky: '#9FD8F0', horizon: '#CFEFFA', hillFarTint: 0xdedede, hillFarAlpha: 0.9, hillNearTint: 0x63b84e, cloudAlpha: 1, tiles: 'tiles_w4', track: 'vfb',
       ambient: [{ frame: 'deco_stand_0', every: 200, scroll: 0.35, yOff: -30, alpha: 0.85 }, { frame: 'deco_floodlight_0', every: 640, scroll: 0.5, yOff: 0, alpha: 1 }, { frame: 'banner_0', every: 420, scroll: 0.55, yOff: -40, alpha: 1 }] },
  5: { id: 5, name: 'DER THRONSAAL', sky: '#2A1218', horizon: '#4A1F2C', hillFarTint: 0x3a1520, hillFarAlpha: 0.9, hillNearTint: 0x2a0e17, cloudAlpha: 0, tiles: 'tiles_w5', track: 'boss',
       ambient: [{ frame: 'deco_pillar_0', every: 230, scroll: 0.7, yOff: 0, alpha: 1 }, { frame: 'deco_banner_red_0', every: 460, scroll: 0.75, yOff: -110, alpha: 1 }, { frame: 'deco_window_0', every: 700, scroll: 0.8, yOff: -90, alpha: 1 }] },
};

export const worldOf = (id: number) => WORLDS[id] ?? WORLDS[1];
