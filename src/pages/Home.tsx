import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import BottomSheet, { type SheetState } from '@/components/BottomSheet';
import CreatePlayerForm, { type Draft } from '@/components/CreatePlayerForm';
import PlayerCard from '@/components/PlayerCard';
import StatsPanel from '@/components/StatsPanel';
import usePhoneScale, { PHONE_H, PHONE_W } from '@/hooks/usePhoneScale';
import { C } from '@/lib/constants';
import { STORAGE_KEY, loadPlayers } from '@/lib/storage';
import { DEFAULT_STATS, type Player, type PlayerStats } from '@/types/player';
import shandongCrest from '@/assets/shandong.png';

/**
 * Base Layer + 两个 Bottom Sheet 的编排层
 * （v0.2 拆分：UI 分块见 components/，数据模型见 types/，取色与持久化见 lib/）
 */
export default function Home() {
  const isNativeApp = Capacitor.isNativePlatform();
  const scale = usePhoneScale();
  const [sheet, setSheet] = useState<SheetState>('closed');
  const [sheetMode, setSheetMode] = useState<'create' | 'player'>('create');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>(loadPlayers);
  const [draft, setDraft] = useState<Draft>({ name: '', number: '', position: '' });

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

  /** 删除球员：移除数据并关闭弹层，localStorage 自动同步 */
  const deletePlayer = () => {
    setPlayers((prev) => prev.filter((x) => x.id !== activeId));
    setSheet('closed');
    setActiveId(null);
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
    <div
      className={
        isNativeApp
          ? 'h-[100dvh] w-full overflow-hidden bg-[#1E1E1E]'
          : 'flex min-h-screen items-center justify-center bg-[#1E1E1E]'
      }
    >
      {/* 手机外框 */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: isNativeApp ? '100%' : PHONE_W,
          height: isNativeApp ? '100dvh' : PHONE_H,
          transform: isNativeApp ? undefined : `scale(${scale})`,
          borderRadius: isNativeApp ? 0 : 44,
          border: isNativeApp ? 'none' : '1px solid rgba(255,255,255,0.06)',
          boxShadow: isNativeApp ? 'none' : '0 24px 80px rgba(0,0,0,0.55)',
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
        <div
          className="absolute inset-0 flex flex-col px-5"
          style={{
            paddingTop: isNativeApp ? 'max(20px, env(safe-area-inset-top))' : 20,
            paddingBottom: isNativeApp ? 'env(safe-area-inset-bottom)' : 0,
          }}
        >
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
              <PlayerCard key={p.id} player={p} onClick={() => openPlayer(p.id)} />
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
            <CreatePlayerForm draft={draft} onChange={setDraft} onSave={savePlayer} />
          ) : activePlayer ? (
            <StatsPanel player={activePlayer} onBump={bumpStat} onDelete={deletePlayer} />
          ) : null}
        </BottomSheet>
      </div>
    </div>
  );
}
