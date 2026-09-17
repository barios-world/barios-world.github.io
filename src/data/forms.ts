/** The six power-up forms + Kaffee. Numbers multiply the base Tuning values. */
export type Form = 'base' | 'kaffee' | 'sport' | 'boxer' | 'skater' | 'sprayer' | 'dj' | 'rocker';
export type Special = 'kaffeepower' | 'buecher' | 'cambio';
export type AttackKind = 'none' | 'cup' | 'punch' | 'combo' | 'spray' | 'wave' | 'chord';

export interface FormDef {
  name: string;
  icon: string;          // atlas frame for HUD + pickup
  attack: AttackKind;
  cooldown: number;      // ms
  speedMul: number;
  jumpMul: number;
  accelMul: number;
  fricMul: number;
  anims: { idle: string; walk: string; run: string; jump: string } | null;   // null = Bario base sprites
  hero: string | null;   // front pose shown while attacking
  msg: string;
}

export const FORMS: Record<Form, FormDef> = {
  base:    { name: 'BARIO', icon: 'port_bario_0', attack: 'none', cooldown: 0, speedMul: 1, jumpMul: 1, accelMul: 1, fricMul: 1, anims: null, hero: null, msg: '' },
  kaffee:  { name: 'KAFFEE', icon: 'it_kaffee_0', attack: 'cup', cooldown: 320, speedMul: 1, jumpMul: 1, accelMul: 1, fricMul: 1, anims: null, hero: 'atk_kaffee_0', msg: 'KAFFEE!  WURF-KNOPF = TASSE' },
  sport:   { name: 'SPORT-SUCHTI', icon: 'it_hantel_0', attack: 'punch', cooldown: 300, speedMul: 0.95, jumpMul: 1.4, accelMul: 0.8, fricMul: 0.7,
             anims: { idle: 'formidle_sport', walk: 'formwalk_sport', run: 'formwalk_sport', jump: 'formjump_sport_0' }, hero: 'form_sport_0', msg: 'SPORT-SUCHTI!  SCHLAG ZERTRUEMMERT STEINE' },
  boxer:   { name: 'BOXER', icon: 'it_glove_0', attack: 'combo', cooldown: 220, speedMul: 1, jumpMul: 1, accelMul: 1.1, fricMul: 1,
             anims: { idle: 'formidle_boxer', walk: 'formwalk_boxer', run: 'formwalk_boxer', jump: 'formjump_boxer_0' }, hero: 'form_boxer_0', msg: 'BOXER!  DREI SCHLAEGE = ABFLUG' },
  skater:  { name: 'SKATER', icon: 'it_skate_0', attack: 'none', cooldown: 0, speedMul: 1.33, jumpMul: 1.1, accelMul: 0.9, fricMul: 0.45,
             anims: { idle: 'formidle_skater', walk: 'formwalk_skater', run: 'formwalk_skater', jump: 'formjump_skater_0' }, hero: 'form_skater_0', msg: 'SKATER!  ROLLEN. TRICKS. FREIHEIT.' },
  sprayer: { name: 'SPRAYER', icon: 'it_spray_0', attack: 'spray', cooldown: 500, speedMul: 1, jumpMul: 1, accelMul: 1, fricMul: 1,
             anims: { idle: 'formidle_sprayer', walk: 'formwalk_sprayer', run: 'formwalk_sprayer', jump: 'formjump_sprayer_0' }, hero: 'form_sprayer_0', msg: 'SPRAYER!  FARBE VERWIRRT DEN MOB' },
  dj:      { name: 'DJ', icon: 'it_phones_0', attack: 'wave', cooldown: 420, speedMul: 1, jumpMul: 1, accelMul: 1, fricMul: 1,
             anims: { idle: 'formidle_dj', walk: 'formwalk_dj', run: 'formwalk_dj', jump: 'formjump_dj_0' }, hero: 'form_dj_0', msg: 'DJ!  AUF DEN TAKT = DOPPELT' },
  rocker:  { name: 'ROCKER', icon: 'it_gitarre_0', attack: 'chord', cooldown: 2500, speedMul: 1, jumpMul: 1, accelMul: 1, fricMul: 1,
             anims: { idle: 'formidle_rocker', walk: 'formwalk_rocker', run: 'formwalk_rocker', jump: 'formjump_rocker_0' }, hero: 'form_rocker_0', msg: 'ROCKER!  POWERCHORD RAEUMT AUF' },
};

export const SPECIALS: Record<Special, { name: string; icon: string; ms: number; msg: string }> = {
  kaffeepower: { name: 'KAFFEE POWER', icon: 'pk_kaffeepower_0', ms: 10000, msg: 'KAFFEE POWER!' },
  buecher:     { name: 'BUECHER LESEN', icon: 'pk_buecher_0', ms: 6000, msg: 'BUECHER LESEN!  ALLES WIRD LANGSAM' },
  cambio:      { name: 'CAMBIO MASTER', icon: 'pk_cambio_0', ms: 8000, msg: 'CAMBIO MASTER!  KARTEN SUCHEN IHR ZIEL' },
};

export const isForm = (s: string): s is Form => s in FORMS;
export const isSpecial = (s: string): s is Special => s in SPECIALS;
