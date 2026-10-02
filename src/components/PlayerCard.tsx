import { C } from '@/lib/constants';
import type { Player } from '@/types/player';

/**
 * 已保存球员条目（Base Layer 列表行）：姓名 + 号码 + 位置
 */
export default function PlayerCard({
  player,
  onClick,
}: {
  player: Player;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="ios-glass flex h-[52px] w-full items-center justify-between rounded-[16px] px-4 text-left transition active:scale-[0.98]"
    >
      <span className="text-[15px] font-semibold text-white">{player.name}</span>
      <div className="flex items-center gap-3">
        {player.number && (
          <span
            className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px] font-bold"
            style={{ background: 'rgba(101,239,180,0.18)', color: C.mint }}
          >
            {player.number}
          </span>
        )}
        {player.position && (
          <span className="text-[13px] font-medium" style={{ color: C.dim }}>
            {player.position}
          </span>
        )}
      </div>
    </button>
  );
}
