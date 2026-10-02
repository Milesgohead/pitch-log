import { useEffect, useRef, useState } from 'react';
import BottomSheet, { type SheetState } from '@/components/BottomSheet';
import shandongCrest from '@/assets/shandong.png';

const PHONE_W = 393;
const PHONE_H = 852;

/** 设计稿取色（来源：base layer 逐像素采样） */
const C = {
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

/* ---------- 球员数据统计（设计稿：New Player Bottom Sheet） ---------- */

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

type Player = { id: string; name: string; number: string; position: string; stats: PlayerStats };

/* ---------- 本地持久化（v0.1） ---------- */

const STORAGE_KEY = 'pitchlog:players:v1';

/** 从 localStorage 读取球员列表，兼容 v0 无 id / 无 stats 的旧数据 */
function loadPlayers(): Player[] {
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

/** 统计卡配色（采样自设计稿） */
const STAT_VARIANTS = {
  green: { background: '#5ED005', color: '#0B3518' }, // 进球
  gray: { background: '#C8D0CC', color: '#0B3518' }, // 助攻
  yellow: { background: '#E9D41C', color: '#0B3518' }, // 黄牌
  grid: { background: '#13412E', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.10)' },
} as const;

type StatVariant = keyof typeof STAT_VARIANTS;

/**
 * 统计卡：点按 +1，长按 0.5s −1（不低于 0）
 */
function StatCard({
  label,
  value,
  variant,
  onAdd,
  onSub,
  big,
}: {
  label: string;
  value: number;
  variant: StatVariant;
  onAdd: () => void;
  onSub: () => void;
  big?: boolean;
}) {
  const longPressed = useRef(false);
  const timer = useRef(0);

  const onPointerDown = () => {
    longPressed.current = false;
    timer.current = window.setTimeout(() => {
      longPressed.current = true;
      onSub();
    }, 500);
  };
  const cancel = () => window.clearTimeout(timer.current);

  const isGrid = variant === 'grid';
  return (
    <button
      onPointerDown={onPointerDown}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onClick={() => {
        if (!longPressed.current) onAdd();
        longPressed.current = false;
      }}
      className={`flex w-full flex-col items-center justify-center rounded-[14px] font-bold transition active:scale-[0.96] ${big ? 'h-[96px]' : 'h-[68px]'}`}
      style={{ ...STAT_VARIANTS[variant], touchAction: 'manipulation' }}
    >
      <span
        className={`font-medium ${big ? 'self-start pl-4 text-[14px]' : 'self-start pl-3 pt-2 text-[11px]'}`}
        style={{ color: isGrid ? C.dim : STAT_VARIANTS[variant].color, opacity: isGrid ? 1 : 0.85 }}
      >
        {label}
      </span>
      <span className={`flex-1 ${big ? 'text-[38px]' : 'text-[26px]'}`}>{value}</span>
    </button>
  );
}

function usePhoneScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const f = () =>
      setScale(
        Math.min(1, (window.innerHeight - 56) / PHONE_H, (window.innerWidth - 24) / PHONE_W)
      );
    f();
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return scale;
}

export default function Home() {
  const scale = usePhoneScale();
  const [sheet, setSheet] = useState<SheetState>('closed');
  const [sheetMode, setSheetMode] = useState<'create' | 'player'>('create');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>(loadPlayers);
  const [draft, setDraft] = useState({ name: '', number: '', position: '' });

  // 球员数据变更时自动写回 localStorage（v0.1 持久化）
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    } catch {
      // 存储不可用（隐私模式 / 已满）时静默失败，不影响内存中的数据
    }
  }, [players]);

  const savePlayer = () => {
    if (!draft.name.trim()) return;
    setPlayers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: draft.name.trim(),
        number: draft.number.trim(),
        position: draft.position.trim(),
        stats: { ...DEFAULT_STATS },
      },
    ]);
    setDraft({ name: '', number: '', position: '' });
    setSheet('closed');
  };

  /** 统计加减（长按减不低于 0），兼容旧数据没有 stats 字段的情况 */
  const bumpStat = (key: keyof PlayerStats, delta: number) => {
    if (activeId === null) return;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== activeId) return p;
        const s = { ...DEFAULT_STATS, ...p.stats };
        return { ...p, stats: { ...s, [key]: Math.max(0, s[key] + delta) } };
      })
    );
  };

  const openCreate = () => {
    setSheetMode('create');
    setActiveId(null);
    setSheet('peek');
  };

  const openPlayer = (id: string) => {
    setSheetMode('player');
    setActiveId(id);
    setSheet('peek');
  };

  // 当前正在查看的球员（player 模式下由 activeId 决定）
  const activePlayer = players.find((p) => p.id === activeId) ?? null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1E1E1E]">
      {/* 手机外框 */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: PHONE_W,
          height: PHONE_H,
          transform: `scale(${scale})`,
          borderRadius: 44,
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
        }}
      >
        {/* 屏幕底色：深绿渐变（设计稿采样） */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${C.screenTop} 0%, #125136 10%, #0B4A2E 18%, #054027 25%, #023B23 32%, #03391F 40%, #022C17 55%, #011D11 75%, ${C.screenBottom} 100%)`,
          }}
        />
        {/* 顶部柔和高光（设计稿顶缘的浅色洗光） */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 22% at 50% -10%, rgba(205,242,222,0.22) 0%, rgba(205,242,222,0) 100%)',
          }}
        />

        {/* 内容层 */}
        <div className="absolute inset-0 flex flex-col px-5 pt-[20px]">
          {/* 赛事标题（参考图：▾ 中超 CSL） */}
          <div className="flex items-center gap-1.5">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" style={{ marginTop: 2 }}>
              <path d="M1 1.5 L5 6.5 L9 1.5" stroke={C.dim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1
              className="text-[20px] font-bold leading-none"
              style={{ color: C.titleWhite, letterSpacing: '0.02em' }}
            >
              中超 CSL
            </h1>
          </div>
          <p
            className="mt-[14px] text-[12px] font-medium"
            style={{ color: C.mint, letterSpacing: '0.06em' }}
          >
            中超第 24 轮 · 进行中
          </p>

          {/* 对阵区（坐标按设计稿导出 393×852 逐像素对齐） */}
          <div className="mt-[22px] flex items-center">
            <div className="flex flex-1 flex-col items-center gap-1">
              <img
                src={shandongCrest}
                alt="山东泰山"
                className="h-16 w-auto object-contain"
              />
              <span
                className="flex h-[22px] w-[72px] items-center justify-center text-[18px] font-bold leading-none"
                style={{ color: C.titleWhite }}
              >
                山东泰山
              </span>
            </div>
            <span
              className="px-2 text-[26px] font-medium"
              style={{ color: C.dim, opacity: 0.75 }}
            >
              VS
            </span>
            <div className="flex flex-1 flex-col items-center gap-1">
              <span
                className="flex h-16 items-center text-[32px] font-medium"
                style={{ color: C.dim, opacity: 0.8 }}
              >
                客
              </span>
              <span
                className="flex h-[22px] w-[72px] items-center justify-center text-[18px] font-bold leading-none"
                style={{ color: C.titleWhite }}
              >
                客队
              </span>
            </div>
          </div>

          {/* 进行中徽标（设计稿 y 206–223） */}
          <div className="mt-[15px]">
            <div
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px]"
              style={{
                borderColor: 'rgba(101,239,180,0.35)',
                background: 'rgba(17,87,58,0.55)',
              }}
            >
              <span
                className="inline-block rounded-full"
                style={{ width: 4, height: 4, background: C.mint }}
              />
              <span
                className="inline-block rounded-full"
                style={{ width: 6, height: 6, background: C.mint }}
              />
              <span
                className="text-[11px] font-semibold leading-none"
                style={{ color: C.mint, letterSpacing: '0.08em' }}
              >
                进行中
              </span>
            </div>
          </div>

          {/* 阵容区标题（设计稿 y 243） */}
          <div className="mt-[18px] flex items-center justify-between px-0.5">
            <h2 className="text-[18px] font-bold leading-none" style={{ color: C.bodyWhite }}>
              首发阵容
            </h2>
            <button
              className="text-[12.5px] font-medium leading-none transition hover:text-white"
              style={{ color: C.dimmer }}
            >
              导入阵容
            </button>
          </div>

          {/* 空状态卡片：iOS 液态玻璃 */}
          <div className="ios-glass mt-[26px] flex h-[196px] items-center justify-center rounded-[28px]">
            <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
              暂无首发阵容
            </span>
          </div>

          {/* 新建球员按钮（设计稿 x77–314 y525–574）：iOS 液态玻璃 */}
          <div className="mt-[41px] flex justify-center">
            <button
              onClick={openCreate}
              className="ios-glass flex h-[49px] w-[237px] items-center justify-center gap-2 rounded-[16px] text-[15.5px] font-semibold text-white transition active:scale-[0.97]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              新建球员
            </button>
          </div>

          {/* 已保存球员列表（显示在新建球员按钮下方） */}
          <div className="mt-[18px] space-y-2.5">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => openPlayer(p.id)}
                className="ios-glass flex h-[52px] w-full items-center justify-between rounded-[16px] px-4 text-left transition active:scale-[0.98]"
              >
                <span className="text-[15px] font-semibold text-white">{p.name}</span>
                <div className="flex items-center gap-3">
                  {p.number && (
                    <span
                      className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px] font-bold"
                      style={{ background: 'rgba(101,239,180,0.18)', color: C.mint }}
                    >
                      {p.number}
                    </span>
                  )}
                  {p.position && (
                    <span className="text-[13px] font-medium" style={{ color: C.dim }}>
                      {p.position}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* 底部品牌行（设计稿基线 y743–761，底边距 91） */}
          <div className="mb-[91px] flex items-end justify-between px-0.5">
            <span
              className="text-[25px] font-bold leading-none"
              style={{ color: C.titleWhite, letterSpacing: '0.12em' }}
            >
              PITCHLOG
            </span>
            <span className="pb-0.5 text-[12px] font-medium leading-none" style={{ color: C.faint }}>
              比赛记录
            </span>
          </div>
        </div>

        {/* Bottom Sheet：新建 / 球员数据统计 两种模式 */}
        <BottomSheet
          state={sheet}
          onStateChange={setSheet}
          title={sheetMode === 'create' ? '新建球员' : activePlayer?.name ?? '球员'}
          headerExtra={
            sheetMode === 'player' && activePlayer ? (
              <span className="text-[16px] font-semibold" style={{ color: C.bodyWhite }}>
                {activePlayer.number && (
                  <span className="font-bold text-white">{activePlayer.number} </span>
                )}
                <span style={{ color: C.dim }}>{activePlayer.position}</span>
              </span>
            ) : undefined
          }
        >
          {sheetMode === 'create' ? (
            <div className="space-y-4 pb-10">
              <p className="text-[13px] leading-relaxed" style={{ color: C.dim }}>
                上拉把手展开，下拉收起；拖动到任意位置松手会自动吸附到最近的状态，快速甩动可惯性滑到下一档。
              </p>
              {(['球员姓名', '球衣号码', '场上位置'] as const).map((label) => {
                const key = label === '球员姓名' ? 'name' : label === '球衣号码' ? 'number' : 'position';
                return (
                  <div key={label}>
                    <label
                      className="mb-1.5 block text-[12px] font-medium"
                      style={{ color: C.dimmer, letterSpacing: '0.04em' }}
                    >
                      {label}
                    </label>
                    <input
                      value={draft[key]}
                      onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                      placeholder={`请输入${label}`}
                      className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-[15px] text-white placeholder:text-white/25 focus:border-[#65EFB4]/60 focus:outline-none"
                    />
                  </div>
                );
              })}
              <button
                onClick={savePlayer}
                className="mt-2 w-full rounded-xl py-3.5 text-[16px] font-bold text-[#04240F] transition active:scale-[0.98]"
                style={{ background: C.mint }}
              >
                保存
              </button>
            </div>
          ) : (
            (() => {
              const p = activePlayer;
              if (!p) return null;
              const s = { ...DEFAULT_STATS, ...p.stats };
              const cell = (key: keyof PlayerStats, label: string) => (
                <StatCard
                  key={key}
                  label={label}
                  value={s[key]}
                  variant="grid"
                  onAdd={() => bumpStat(key, 1)}
                  onSub={() => bumpStat(key, -1)}
                />
              );
              return (
                <div className="pb-10">
                  {/* 顶部三项：进球 / 助攻 / 黄牌 */}
                  <div className="mt-1 grid grid-cols-3 gap-3">
                    <StatCard label="进球" value={s.goals} variant="green" big onAdd={() => bumpStat('goals', 1)} onSub={() => bumpStat('goals', -1)} />
                    <StatCard label="助攻" value={s.assists} variant="gray" big onAdd={() => bumpStat('assists', 1)} onSub={() => bumpStat('assists', -1)} />
                    <StatCard label="黄牌" value={s.yellowCards} variant="yellow" big onAdd={() => bumpStat('yellowCards', 1)} onSub={() => bumpStat('yellowCards', -1)} />
                  </div>

                  {/* 进攻 / 防守 两列统计 */}
                  <div className="mt-7 grid grid-cols-2 gap-3">
                    <div>
                      <div className="mb-3 text-center text-[15px] font-semibold" style={{ color: '#E0E4E2' }}>
                        进攻阶段
                      </div>
                      <div className="space-y-3">
                        {cell('passes', '成功传球')}
                        {cell('boxTouches', '禁区触球')}
                        {cell('longBalls', '长传（传中）')}
                        {/* 射门 + 中门框 合体卡 */}
                        <div
                          className="flex overflow-hidden rounded-[14px]"
                          style={{ background: '#13412E', border: '1px solid rgba(255,255,255,0.10)' }}
                        >
                          {(['shots', 'woodwork'] as const).map((key, i) => (
                            <button
                              key={key}
                              onClick={() => bumpStat(key, 1)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                bumpStat(key, -1);
                              }}
                              className={`flex flex-1 flex-col items-center py-2 text-white transition active:bg-white/5 ${i === 1 ? 'border-l border-white/10' : ''}`}
                              style={{ touchAction: 'manipulation' }}
                            >
                              <span className="self-start pl-3 pt-1 text-[11px] font-medium" style={{ color: C.dim }}>
                                {key === 'shots' ? '射门' : '中门框'}
                              </span>
                              <span className="pb-1 text-[26px] font-bold">{s[key]}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-3 text-center text-[15px] font-semibold" style={{ color: '#E0E4E2' }}>
                        防守阶段
                      </div>
                      <div className="space-y-3">
                        {cell('interceptions', '拦截次数')}
                        {cell('duels', '一对一防守')}
                        {cell('clearances', '解围')}
                        {cell('fouls', '犯规次数')}
                      </div>
                    </div>
                  </div>

                  <p className="mt-6 text-center text-[11px]" style={{ color: C.faint }}>
                    点按 +1 · 长按 −1
                  </p>

                  {/* 删除球员（v0.1）：移除数据并关闭弹层，localStorage 自动同步 */}
                  <button
                    onClick={() => {
                      setPlayers((prev) => prev.filter((x) => x.id !== activeId));
                      setSheet('closed');
                      setActiveId(null);
                    }}
                    className="mt-5 w-full rounded-xl border border-red-400/25 py-3 text-[15px] font-semibold text-red-300/90 transition active:scale-[0.98]"
                  >
                    删除球员
                  </button>
                </div>
              );
            })()
          )}
        </BottomSheet>
      </div>
    </div>
  );
}
