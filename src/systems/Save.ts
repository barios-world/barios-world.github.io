/** Progress + settings in localStorage. One object, versioned, written on every change. */
export interface LevelProgress { cleared: boolean; bestSecs: number | null; bestCards: number; totalCards: number; royals: number; }
export interface Settings { sound: boolean; music: boolean; leftHand: boolean; buttonScale: number; assist: boolean; reduceFx: boolean; }
import { NO_UPGRADES, type UpgradeKey, type Upgrades } from '../data/upgrades';

export interface SaveData {
  version: 1;
  progress: Record<string, LevelProgress>;
  unlocked: string[];
  settings: Settings;
  totalCards: number;
  upgrades: Upgrades;
  bossCleared: boolean;
  bossRushBest: number | null;
}

const KEY = 'barios-world-save-v1';

const fresh = (): SaveData => ({
  version: 1,
  progress: {},
  unlocked: [],
  settings: { sound: true, music: true, leftHand: false, buttonScale: 1, assist: false, reduceFx: false },
  totalCards: 0,
  upgrades: { ...NO_UPGRADES },
  bossCleared: false,
  bossRushBest: null,
});

class SaveStore {
  data: SaveData = fresh();

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SaveData>;
        this.data = { ...fresh(), ...parsed, settings: { ...fresh().settings, ...(parsed.settings ?? {}) }, upgrades: { ...NO_UPGRADES, ...(parsed.upgrades ?? {}) } };
      }
    } catch { this.data = fresh(); }
    return this.data;
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* private mode etc. */ }
  }

  get settings() { return this.data.settings; }

  setSetting<K extends keyof Settings>(k: K, v: Settings[K]) {
    this.data.settings[k] = v;
    this.save();
  }

  isUnlocked(key: string, firstKey: string) {
    return key === firstKey || this.data.unlocked.includes(key);
  }

  unlock(key: string) {
    if (!this.data.unlocked.includes(key)) { this.data.unlocked.push(key); this.save(); }
  }

  progress(key: string): LevelProgress {
    return this.data.progress[key] ?? { cleared: false, bestSecs: null, bestCards: 0, totalCards: 0, royals: 0 };
  }

  recordResult(key: string, secs: number, cards: number, totalCards: number, royals: number) {
    const p = this.progress(key);
    const np: LevelProgress = {
      cleared: true,
      bestSecs: p.bestSecs === null ? secs : Math.min(p.bestSecs, secs),
      bestCards: Math.max(p.bestCards, cards),
      totalCards,
      royals: Math.max(p.royals, royals),
    };
    this.data.progress[key] = np;
    this.data.totalCards += cards;
    this.save();
    return np;
  }

  upgrade(k: UpgradeKey) { return this.data.upgrades[k] ?? 0; }

  buy(k: UpgradeKey, price: number) {
    if (this.data.totalCards < price) return false;
    this.data.totalCards -= price;
    this.data.upgrades[k] = (this.data.upgrades[k] ?? 0) + 1;
    this.save();
    return true;
  }

  /** Boss Rush time. Returns the best time and whether this run set it. */
  recordRush(secs: number) {
    const prev = this.data.bossRushBest;
    const isNew = prev === null || secs < prev;
    if (isNew) this.data.bossRushBest = secs;
    this.save();
    return { best: this.data.bossRushBest as number, isNew };
  }

  reset() {
    this.data = fresh();
    this.save();
  }
}

export const save = new SaveStore();
