/** 球员数据统计（设计稿：New Player Bottom Sheet） */
export type PlayerStats = {
  goals: number;
  assists: number;
  yellowCards: number;
  passes: number; // 成功传球
  boxTouches: number; // 禁区触球
  longBalls: number; // 长传（传中）
  shots: number; // 射门
  woodwork: number; // 中门框
  interceptions: number; // 拦截次数
  duels: number; // 一对一防守
  clearances: number; // 解围
  fouls: number; // 犯规次数
};

export const DEFAULT_STATS: PlayerStats = {
  goals: 0,
  assists: 0,
  yellowCards: 0,
  passes: 0,
  boxTouches: 0,
  longBalls: 0,
  shots: 0,
  woodwork: 0,
  interceptions: 0,
  duels: 0,
  clearances: 0,
  fouls: 0,
};

export type Player = {
  id: string;
  name: string;
  number: string;
  position: string;
  stats: PlayerStats;
};
