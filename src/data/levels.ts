export interface LevelDef { key: string; file: string; name: string; world: number; }

export const LEVELS: LevelDef[] = [
  { key: 'lvl_w1_1', file: 'levels/w1-1.tmj', name: '1-1  DER BOULEVARD', world: 1 },
  { key: 'lvl_t1', file: 'levels/t1.tmj', name: 'TEST  SPRUNGPARK', world: 0 },
];

export const levelIndex = (key: string) => Math.max(0, LEVELS.findIndex((l) => l.key === key));
export const nextLevel = (key: string) => LEVELS[(levelIndex(key) + 1) % LEVELS.length];
