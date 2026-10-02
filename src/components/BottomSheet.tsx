import { useEffect, useRef } from 'react';

export type SheetState = 'closed' | 'peek' | 'expanded';

interface BottomSheetProps {
  state: SheetState;
  onStateChange: (s: SheetState) => void;
  /** 面板标题（拖拽区大字） */
  title?: string;
  /** 标题行右侧附加内容（如号码 + 位置） */
  headerExtra?: React.ReactNode;
  /** 收起态露出的高度（px） */
  peekHeight?: number;
  /** 展开态占屏幕高度的比例 */
  expandedRatio?: number;
  children: React.ReactNode;
}

const STIFFNESS = 340; // 弹簧刚度：越大回弹越快
const DAMPING = 30; // 阻尼：越小越“弹”，越大越稳
const FLING_THRESHOLD = 0.22; // 甩动手速阈值（px/ms）
const TAP_SLOP = 8; // 判定为“点击”的最大位移（px）

/**
 * 弹簧动画 Bottom Sheet
 * - 支持收起 / 展开两个吸附位，可拖拽、带惯性甩动
 * - 拖拽超出边界时橡皮筋阻尼
 * - 点击把手在收起 ⇄ 展开之间切换
 */
export default function BottomSheet({
  state,
  onStateChange,
  title = '新建球员',
  headerExtra,
  peekHeight = 152,
  expandedRatio = 0.94,
  children,
}: BottomSheetProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const heightRef = useRef(0); // 当前高度（px）
  const velocityRef = useRef(0); // 当前速度（px/s）
  const targetRef = useRef(0); // 弹簧目标高度
  const maxRef = useRef(600); // 展开态高度
  const stateRef = useRef<SheetState>(state);
  stateRef.current = state;

  const dragRef = useRef<{
    active: boolean;
    pointerId: number;
    startY: number;
    startHeight: number;
    lastY: number;
    lastT: number;
    v: number; // px/ms，向上为正（高度增加方向）
    moved: boolean;
  }>({ active: false, pointerId: -1, startY: 0, startHeight: 0, lastY: 0, lastT: 0, v: 0, moved: false });

  const heightFor = (s: SheetState) =>
    s === 'expanded' ? maxRef.current : s === 'peek' ? Math.min(peekHeight, maxRef.current) : 0;

  // 状态变化 → 更新弹簧目标
  useEffect(() => {
    targetRef.current = heightFor(state);
  }, [state, peekHeight, expandedRatio]);

  // 测量父容器高度，计算展开态高度
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = () => {
      maxRef.current = Math.round(el.parentElement!.clientHeight * expandedRatio);
      targetRef.current = heightFor(stateRef.current);
      // 初始 closed 时直接把高度归零，避免开场动画从奇怪位置开始
      if (stateRef.current === 'closed') {
        heightRef.current = 0;
        apply();
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el.parentElement!);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedRatio]);

  const apply = () => {
    const h = heightRef.current;
    if (sheetRef.current) sheetRef.current.style.height = `${h}px`;
    if (backdropRef.current) {
      const p = maxRef.current > 0 ? h / maxRef.current : 0;
      backdropRef.current.style.opacity = `${Math.min(1, p) * 0.55}`;
      backdropRef.current.style.pointerEvents = h > 4 ? 'auto' : 'none';
    }
  };

  // 结束拖拽：点击切换 或 吸附到最近/惯性方向的档位
  const endDrag = () => {
    const d = dragRef.current;
    d.active = false;

    // 未发生拖动 → 视为点击把手：收起 ⇄ 展开 切换
    if (!d.moved) {
      const next: SheetState = stateRef.current === 'expanded' ? 'peek' : 'expanded';
      onStateChange(next);
      return;
    }

    const cur = heightRef.current;
    const snaps = [0, heightFor('peek'), maxRef.current].filter(
      (v, i, a) => a.indexOf(v) === i && v <= maxRef.current
    );
    let next: number;
    const v = d.v; // px/ms
    if (Math.abs(v) > FLING_THRESHOLD) {
      // 甩动：优先选择拖动方向上的下一个吸附位
      const candidates =
        v > 0 ? snaps.filter((s) => s > cur + 8) : snaps.filter((s) => s < cur - 8);
      next = candidates.length
        ? v > 0
          ? candidates[0]
          : candidates[candidates.length - 1]
        : snaps.reduce((a, b) => (Math.abs(b - cur) < Math.abs(a - cur) ? b : a));
    } else {
      // 慢速松手：吸附到最近的位置
      next = snaps.reduce((a, b) => (Math.abs(b - cur) < Math.abs(a - cur) ? b : a));
    }
    velocityRef.current = Math.max(-2600, Math.min(2600, v * 1000 * 0.6)); // 把甩动速度交给弹簧，衔接惯性
    const nextState: SheetState = next <= 0 ? 'closed' : next >= maxRef.current - 1 ? 'expanded' : 'peek';
    onStateChange(nextState);
  };

  // 弹簧动画主循环
  // 注意：必须用 setTimeout 而不是 requestAnimationFrame 驱动。
  // rAF 在页面被遮挡/后台时会被冻结（预览面板隐藏、切到 Figma 再回来），
  // 弹簧会永久停住导致 bottom sheet “点了没反应”；定时器只会被节流不会停止。
  useEffect(() => {
    let timer = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30); // 防止切后台后跳变
      last = now;
      if (dragRef.current.active) {
        // 看门狗：拖拽中长时间没有新移动事件（指针丢失/页面切走），按当前位置吸附收尾
        if (now - dragRef.current.lastT > 300) endDragRef.current();
      } else {
        const x = targetRef.current - heightRef.current;
        velocityRef.current += x * STIFFNESS * dt;
        velocityRef.current *= Math.exp(-DAMPING * dt);
        heightRef.current += velocityRef.current * dt;
        // 足够接近目标时停稳，避免永动
        if (Math.abs(x) < 0.4 && Math.abs(velocityRef.current) < 4) {
          heightRef.current = targetRef.current;
          velocityRef.current = 0;
        }
        apply();
      }
      timer = window.setTimeout(() => tick(performance.now()), 16);
    };
    timer = window.setTimeout(() => tick(performance.now()), 16);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // endDrag 的引用（供看门狗调用，避免闭包过期）
  const endDragRef = useRef(() => {});
  endDragRef.current = endDrag;

  const onPointerDown = (e: React.PointerEvent) => {
    if (stateRef.current === 'closed') return;
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      startHeight: heightRef.current,
      lastY: e.clientY,
      lastT: performance.now(),
      v: 0,
      moved: false,
    };
    velocityRef.current = 0;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // 合成事件或非活跃指针：忽略，拖拽逻辑不依赖捕获
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    const now = performance.now();
    const dt = now - d.lastT;
    // 采样间隔太小会导致速度爆炸，限制最小间隔并给速度封顶
    if (dt >= 8) {
      d.v = Math.max(-2.5, Math.min(2.5, (d.lastY - e.clientY) / dt)); // 上滑为正，px/ms
      d.lastY = e.clientY;
      d.lastT = now;
    }
    if (Math.abs(e.clientY - d.startY) > TAP_SLOP) d.moved = true;

    let target = d.startHeight - (e.clientY - d.startY);
    const max = maxRef.current;
    // 橡皮筋：超出边界时衰减位移
    if (target > max) target = max + (target - max) * 0.3;
    if (target < 0) target = target * 0.3;
    heightRef.current = target;
    apply();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    endDrag();
  };

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {/* 背景遮罩：点击关闭 */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black opacity-0 pointer-events-none"
        style={{ pointerEvents: 'none' }}
        onClick={() => onStateChange('closed')}
      />
      {/* 面板本体 */}
      <div
        ref={sheetRef}
        className="pointer-events-auto absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-3xl border-t border-white/10 bg-[#0A3520]/95 shadow-[0_-12px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        style={{ height: 0, touchAction: 'none' }}
      >
        {/* 拖拽区：把手 + 标题 */}
        <div
          className="cursor-grab select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="h-1.5 w-11 rounded-full bg-white/30" />
          </div>
          <div className="flex items-center justify-between px-6 pt-3 pb-4">
            <span className="text-[22px] font-bold text-white">{title}</span>
            {headerExtra}
          </div>
        </div>
        {/* 内容区（随展开高度显露） */}
        <div className="px-6">{children}</div>
      </div>
    </div>
  );
}
