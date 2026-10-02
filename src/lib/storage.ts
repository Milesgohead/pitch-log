import { DEFAULT_STATS, type Player } from '@/types/player';

export const STORAGE_KEY = 'pitchlog:players:v1';

/** 从 localStorage 读取球员列表，兼容 v0 无 id / 无 stats 的旧数据 */
export function loadPlayers(): Player[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p.name === 'string')
      .map((p) => ({
        ...p,
        id: typeof p.id === 'string' ? p.id : crypto.randomUUID(),
        stats: { ...DEFAULT_STATS, ...p.stats },
      }));
  } catch {
    return [];
  }
}
