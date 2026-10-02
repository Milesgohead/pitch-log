import { useRef } from 'react';
import { C, STAT_VARIANTS, type StatVariant } from '@/lib/constants';

/**
 * 统计卡：点按 +1，长按 0.5s −1（不低于 0）
 */
export default function StatCard({
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
