export interface LevelDef { key: string; file: string; name: string; world: number; }

const L = (world: number, n: number, title: string): LevelDef =>
  ({ key: `lvl_w${world}_${n}`, file: `levels/w${world}-${n}.tmj`, name: `${world}-${n}  ${title}`, world });

export const LEVELS: LevelDef[] = [
  L(1, 1, 'DER BOULEVARD'), L(1, 2, 'KLEINE SCHRITTE'), L(1, 3, 'GUTE LAUNE'), L(1, 4, 'SAME SHIT'), L(1, 5, 'DIFFERENT LEVEL'),
  L(2, 1, 'GOOD COFFEE'), L(2, 2, 'BETTER PEOPLE'), L(2, 3, 'TROMMLER'), L(2, 4, 'AUFWIND'), L(2, 5, 'ESPRESSO'),
  L(3, 1, 'SAME FRIENDS'), L(3, 2, 'FAN-BLOCK'), L(3, 3, 'DIFFERENT RULES'), L(3, 4, 'JOKER'), L(3, 5, 'ALL IN'),
  L(4, 1, 'VFB AREA'), L(4, 2, 'MEITHHTER'), L(4, 3, 'TROMMELWIRBEL'), L(4, 4, 'FAN-BLOCK II'), L(4, 5, 'FINALE'),
  { key: 'lvl_t1', file: 'levels/t1.tmj', name: 'TEST  SPRUNGPARK', world: 0 },
  { key: 'lvl_t2', file: 'levels/t2.tmj', name: 'TEST  FORMENPARK', world: 0 },
];

export const WORLD_NAMES: Record<number, string> = { 1: 'DER BOULEVARD', 2: 'BARIOS COFFEE', 3: 'CAMBIO', 4: 'VFB AREA' };

export const levelIndex = (key: string) => Math.max(0, LEVELS.findIndex((l) => l.key === key));
export const nextLevel = (key: string) => LEVELS[(levelIndex(key) + 1) % LEVELS.length];
