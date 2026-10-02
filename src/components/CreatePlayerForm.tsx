import { C } from '@/lib/constants';

export type Draft = { name: string; number: string; position: string };

/**
 * 新建球员表单（Sheet B 内容）：姓名 / 号码 / 位置 + 保存
 */
export default function CreatePlayerForm({
  draft,
  onChange,
  onSave,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onSave: () => void;
}) {
  return (
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
              onChange={(e) => onChange({ ...draft, [key]: e.target.value })}
              placeholder={`请输入${label}`}
              className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-[15px] text-white placeholder:text-white/25 focus:border-[#65EFB4]/60 focus:outline-none"
            />
          </div>
        );
      })}
      <button
        onClick={onSave}
        className="mt-2 w-full rounded-xl py-3.5 text-[16px] font-bold text-[#04240F] transition active:scale-[0.98]"
        style={{ background: C.mint }}
      >
        保存
      </button>
    </div>
  );
}
