import { C } from '@/lib/constants';
import StatCard from '@/components/StatCard';
import { DEFAULT_STATS, type Player, type PlayerStats } from '@/types/player';

/**
 * 球员统计面板（Sheet C 内容）：12 项统计 + 删除入口
 */
export default function StatsPanel({
  player,
  onBump,
  onDelete,
}: {
  player: Player;
  onBump: (key: keyof PlayerStats, delta: number) => void;
  onDelete: () => void;
}) {
  const s = { ...DEFAULT_STATS, ...player.stats };
  const cell = (key: keyof PlayerStats, label: string) => (
    <StatCard
      key={key}
      label={label}
      value={s[key]}
      variant="grid"
      onAdd={() => onBump(key, 1)}
      onSub={() => onBump(key, -1)}
    />
  );

  return (
    <div className="pb-10">
      {/* 顶部三项：进球 / 助攻 / 黄牌 */}
      <div className="mt-1 grid grid-cols-3 gap-3">
        <StatCard label="进球" value={s.goals} variant="green" big onAdd={() => onBump('goals', 1)} onSub={() => onBump('goals', -1)} />
        <StatCard label="助攻" value={s.assists} variant="gray" big onAdd={() => onBump('assists', 1)} onSub={() => onBump('assists', -1)} />
        <StatCard label="黄牌" value={s.yellowCards} variant="yellow" big onAdd={() => onBump('yellowCards', 1)} onSub={() => onBump('yellowCards', -1)} />
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
                  onClick={() => onBump(key, 1)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onBump(key, -1);
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
        onClick={onDelete}
        className="mt-5 w-full rounded-xl border border-red-400/25 py-3 text-[15px] font-semibold text-red-300/90 transition active:scale-[0.98]"
      >
        删除球员
      </button>
    </div>
  );
}
