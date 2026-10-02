/** 设计稿取色（来源：base layer 逐像素采样） */
export const C = {
  screenTop: '#1C6042', // 屏幕渐变顶部
  screenBottom: '#00140B', // 屏幕渐变底部
  mint: '#65EFB4', // 主强调色（副标题 / 进行中 / 图标）
  titleWhite: '#FFFFFF',
  bodyWhite: '#E5EBE9',
  dim: '#9FB9AE', // VS / 暂无首发阵容
  dimmer: '#9AB1A7', // 导入阵容
  faint: '#99A49F', // 比赛记录
  cardTop: '#0F402A', // 空状态卡片渐变顶
  cardBottom: '#0E3B28', // 空状态卡片渐变底
  buttonFill: '#0A3323',
  pillFill: '#11573A',
  sheetFill: '#0B3D22',
};

/** 统计卡配色（采样自设计稿） */
export const STAT_VARIANTS = {
  green: { background: '#5ED005', color: '#0B3518' }, // 进球
  gray: { background: '#C8D0CC', color: '#0B3518' }, // 助攻
  yellow: { background: '#E9D41C', color: '#0B3518' }, // 黄牌
  grid: { background: '#13412E', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.10)' },
} as const;

export type StatVariant = keyof typeof STAT_VARIANTS;
