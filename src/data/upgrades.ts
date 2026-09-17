/** Barios Shop: the five Level-Ups from the sheet. Paid with collected Cambio cards. */
export type UpgradeKey = 'kaffee' | 'cambio' | 'wissen' | 'khusra' | 'du';

export interface UpgradeDef { key: UpgradeKey; name: string; desc: string; max: number; prices: number[]; }

export const UPGRADES: UpgradeDef[] = [
  { key: 'kaffee', name: 'MEHR KAFFEE', desc: 'Tempo +6 % und Specials halten laenger', max: 3, prices: [30, 60, 110] },
  { key: 'cambio', name: 'MEHR CAMBIO', desc: '+1 Karte pro Faecher, schnellerer Wurf', max: 3, prices: [30, 60, 110] },
  { key: 'wissen', name: 'MEHR WISSEN', desc: 'Royals funkeln von weitem, Zaehler im HUD', max: 3, prices: [25, 50, 90] },
  { key: 'khusra', name: 'MEHR KHUSRA', desc: 'Der Meter laedt +25 % schneller', max: 3, prices: [35, 70, 120] },
  { key: 'du', name: 'MEHR DU', desc: '+1 Herz, dauerhaft', max: 2, prices: [80, 160] },
];

export type Upgrades = Record<UpgradeKey, number>;
export const NO_UPGRADES: Upgrades = { kaffee: 0, cambio: 0, wissen: 0, khusra: 0, du: 0 };
