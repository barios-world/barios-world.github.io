export interface LevelDef { key: string; file: string; name: string; world: number; motto?: string; station?: string; }

/** Season 1: three handcrafted stations, then the Thronsaal. Test levels only show up with ?debug. */
export const LEVELS: LevelDef[] = [
  { key: 'lvl_s1_1', file: 'levels/s1-1.tmj', name: '1  DER BOULEVARD', world: 1, motto: 'Good People, Crazy Times', station: 'BOULEVARD' },
  { key: 'lvl_s1_2', file: 'levels/s1-2.tmj', name: '2  BARIOS COFFEE', world: 2, motto: 'Good Coffee, Better People', station: 'COFFEE' },
  { key: 'lvl_s1_3', file: 'levels/s1-3.tmj', name: '3  CAMBIO', world: 3, motto: 'Same Friends, Different Rules', station: 'CAMBIO' },
  { key: 'lvl_boss', file: 'levels/boss.tmj', name: 'FINAL BOSS  DER THRONSAAL', world: 5, motto: 'Ruhe im Spiel, Chaos im Kopf', station: 'THRONSAAL' },
  { key: 'lvl_t1', file: 'levels/t1.tmj', name: 'TEST  SPRUNGPARK', world: 0 },
  { key: 'lvl_t2', file: 'levels/t2.tmj', name: 'TEST  FORMENPARK', world: 0 },
];

export const WORLD_NAMES: Record<number, string> = { 1: 'DER BOULEVARD', 2: 'BARIOS COFFEE', 3: 'CAMBIO', 4: 'VFB AREA', 5: 'DER THRONSAAL' };

export const levelIndex = (key: string) => Math.max(0, LEVELS.findIndex((l) => l.key === key));
export const nextLevel = (key: string) => LEVELS[(levelIndex(key) + 1) % LEVELS.length];
