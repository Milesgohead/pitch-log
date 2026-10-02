# Pitch Log v0

足球比赛记录 App 的高保真交互原型。按 Figma 设计稿 1:1 还原（393×852，iPhone 14/15 Pro 逻辑分辨率），技术栈：React 18 + Vite + Tailwind CSS + TypeScript。

## 运行

```bash
npm install
npm run dev      # 开发预览（默认 http://localhost:7100）
npm run build    # 产物输出到 dist/
```

## 架构总览：三个 UI Layer

整个界面由**一个 Base Layer + 两个 Bottom Sheet Layer** 组成。两个 Sheet 复用同一个弹簧动画组件（`BottomSheet`），通过 `z-20` 覆盖在 Base 之上，任意时刻只有一个 Sheet 处于打开状态。

```
┌─────────────────────────────┐
│  Base Layer（常驻）           │
│  赛事信息 / 对阵区 / 阵容区     │
│  新建球员按钮 / 球员卡片列表    │
│                             │
│  ┌───────────────────────┐  │   点击「新建球员」
│  │ Sheet Layer A（新建）  │  │ ─────────────────▶
│  │ 姓名 / 号码 / 位置表单 │  │
│  └───────────────────────┘  │   点击某张球员卡片
│  ┌───────────────────────┐  │ ─────────────────▶
│  │ Sheet Layer B（统计）  │  │
│  │ 12 项比赛数据 +1 / −1  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Layer 1 · Base Layer（主界面，`src/pages/Home.tsx`）

常驻层，自上而下：

| 区块 | 内容 | 数据来源 |
|---|---|---|
| 赛事标题 | ▾ 中超 CSL + 「中超第 24 轮 · 进行中」 | 静态文案 |
| 对阵区 | 山东泰山队徽 + 队名 ／ VS ／ 客 + 客队 | `src/assets/shandong.png` |
| 状态胶囊 | 进行中（薄荷绿描边 pill） | 静态 |
| 阵容区 | 「首发阵容」标题 + 「导入阵容」入口（v0 未接通） | — |
| 空状态卡片 | 「暂无首发阵容」灰玻璃占位（有球员后仍保留，阵容视图后续版本设计） | — |
| 新建球员按钮 | 灰玻璃圆角按钮，点击进入 Sheet A | 本地状态 `sheet` |
| 球员卡片列表 | 每行：姓名 ＋ 号码圆标 ＋ 位置，点击进入 Sheet B | `players` 数组 |
| 品牌行 | PITCHLOG ＋ 比赛记录 | 静态 |

### Layer 2 · Sheet A — 新建球员

- **入口**：Base 点「新建球员」；以半展开（peek，152px）弹出，上拉把手可到全展开（800px）
- **内容**：球员姓名（必填）、球衣号码、场上位置三个输入框 + 保存按钮
- **出口**：保存 → 新球员追加到 `players` 列表、表单清空、Sheet 收起回到 Base，新卡片出现在按钮下方；姓名为空时保存不生效

### Layer 3 · Sheet B — 球员统计

- **入口**：Base 点任意球员卡片；弹层标题 = 球员姓名，右上显示「号码 位置」
- **内容**：12 项比赛数据统计
  - 大奖项：进球（绿）／ 助攻（灰）／ 黄牌（黄）
  - 进攻阶段：成功传球、禁区触球、长传（传中）、射门、中门框（射门/中门框为合体卡，左右独立计数）
  - 防守阶段：拦截次数、一对一防守、解围、犯规次数
- **交互**：点按 +1，长按 0.5s −1（不低于 0）
- **数据**：直接读写 `players[i].stats`，关闭重开不累加、不丢失（会话内存态，刷新归零）

## Layer 之间的关系

```
        点击新建球员                 保存
Base ──────────────▶ Sheet A ──────────────▶ Base（players +1）
  │                                              │
  │点击球员卡片 i                                │players[i] 供渲染卡片
  ▼                                              ▼
Sheet B（读写 players[i].stats）──────────▶ Base 卡片显示姓名/号码/位置
```

- **状态机**：`sheet: 'closed' | 'peek' | 'expanded'`（高度由弹簧驱动）；`sheetMode: 'create' | 'player'` 决定 Sheet 内容；`activeIdx` 指向当前球员
- **共享数据**：三个 Layer 读写同一份 `players` 状态（`Home.tsx` 内的 `useState`），这是层间唯一的耦合点
- **互斥呈现**：Sheet 打开时通过遮罩 + 面板覆盖 Base，拖拽下拉 / 点遮罩 / 保存即回到 Base

## BottomSheet 组件（`src/components/BottomSheet.tsx`）

- 三档吸附：closed 0 ／ peek 152 ／ expanded ≈800（屏高 94%）
- 物理：弹簧积分（刚度 340 / 阻尼 30），拖拽实时跟手、越界橡皮筋、松手按距离或甩动速度吸附
- 点按把手在 peek ⇄ expanded 间切换；点遮罩关闭
- **主循环用 `setTimeout`（16ms）而非 `requestAnimationFrame` 驱动**：rAF 在页面被遮挡/切后台时完全冻结会导致弹层「点了没反应」，定时器只会被节流不会停止（v0 修复的关键 bug）

## 数据模型

```ts
type Player = {
  name: string;      // 姓名（必填）
  number: string;    // 球衣号码
  position: string;  // 场上位置
  stats: PlayerStats; // 12 项统计，全零初始化（DEFAULT_STATS）
};
```

## 设计还原说明

- 取色：设计稿导出图逐像素采样（背景 9 段渐变、灰玻璃 `.ios-glass`、统计卡配色见 `Home.tsx` 顶部 `C` 与 `STAT_VARIANTS`）
- 间距：以 393×852 导出图为基准逐像素对齐，元素位置误差 ≤ ±3px（差异主要来自字体渲染）
- 灰玻璃：哑光低对比风格，参数集中在 `src/index.css` 的 `.ios-glass`

## 文件结构

```
src/
├── pages/Home.tsx              # 编排层：Base Layer 布局 + 状态管理 + Sheet 装配（v0.2 拆分后）
├── components/BottomSheet.tsx  # 弹簧动画底部弹层（Layer 2/3 的容器）
├── components/CreatePlayerForm.tsx  # Sheet B 内容：新建球员表单
├── components/StatsPanel.tsx   # Sheet C 内容：12 项统计面板 + 删除入口
├── components/PlayerCard.tsx   # 已保存球员列表行（姓名 / 号码 / 位置）
├── components/StatCard.tsx     # 统计卡：点按 +1 / 长按 −1
├── types/player.ts             # Player / PlayerStats / DEFAULT_STATS
├── lib/constants.ts            # 设计稿取色 C + 统计卡配色 STAT_VARIANTS
├── lib/storage.ts              # localStorage 读写（key: pitchlog:players:v1）
├── hooks/usePhoneScale.ts      # 手机框等比缩放
├── index.css                   # .ios-glass 灰玻璃体系
└── assets/shandong.png         # 山东泰山队徽
```

## v0.2 更新

- **架构拆分（P0 技术债）**：`Home.tsx` 由 555 行单文件拆为编排层（278 行）+ 5 个 UI 组件 + `types/` + `lib/` + `hooks/`，UI 与数据模型、取色、持久化解耦；视觉与交互逐字保留，构建产物等价

## v0 已知边界（后续版本）

- 数据为内存态，刷新页面丢失（未接持久化）
- 「导入阵容」入口未接通
- 有球员后空状态卡片未切换为阵容视图
- 客队队徽、Sheet B 的更多内容（事件时间线等）待设计

## v0.1 更新

- **本地持久化**：球员列表读写 `localStorage`（key `pitchlog:players:v1`），任何增删改自动同步，刷新不丢
- **稳定 ID**：Player 增加 `id` 字段（`crypto.randomUUID()`），列表 key 与选中态（`activeId`）从数组下标改为 ID，删除后不再错位
- **删除球员**：球员统计 Sheet 底部新增「删除球员」按钮，删除后数据与弹层同步关闭
- **旧数据迁移**：v0 存入的无 `id` / 无 `stats` 的数据在读取时自动补齐
- **Git 仓库**：项目已纳入版本管理
