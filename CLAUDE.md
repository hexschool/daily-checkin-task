# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案簡介

Discord 每日打卡系統的**前端介面**（純讀取展示）。後端每日掃描 Discord 頻道討論串並彙整打卡資料，本前端將資料以遊戲化、個人化的方式呈現。所有 API 為公開唯讀端點，**無登入認證**；使用者透過「在名單中找到自己」來建立本機身份。

- 後端原始碼位於 `../hex-toolman-backend`（已設為 additional working directory）。
- 完整 API 規格在 `openapi.json`（已被 gitignore，不進版控，但可在本機查閱）。

## 常用指令

```bash
pnpm install        # 安裝依賴（一律使用 pnpm，勿用 npm/yarn）
pnpm dev            # 開發伺服器（固定 port 5174，見 vite.config.ts）
pnpm build          # type-check + 正式建置（vue-tsc + vite build 並行）
pnpm type-check     # 僅 vue-tsc 型別檢查
pnpm lint           # ESLint --fix --cache
pnpm preview        # 預覽 dist 建置結果
pnpm deploy         # build 後以 gh-pages 部署到 GitHub Pages
```

本專案**沒有測試**設定（無 test script、無 Vitest）。「驗證」靠 `pnpm type-check` + `pnpm lint`，必要時用瀏覽器手動確認。完成工作前請務必跑過 `pnpm lint` 與 `pnpm type-check`。

## 技術架構

Vue 3（`<script setup lang="ts">`）、TypeScript 5.9、Vite 7、Pinia 3、Vue Router 4、Tailwind CSS 4（`@tailwindcss/vite`）、chart.js + vue-chartjs、Bootstrap Icons。套件管理 pnpm 9.9。Node `^20.19.0 || >=22.12.0`。`@` 別名對應 `src/`。

## 核心架構概念

理解這個專案需要掌握以下幾個跨檔案的設計，否則容易誤改：

### 1. Hash 路由 + 單一排程作用域

- Router 使用 **`createWebHashHistory`**（`src/router/index.ts`），因為部署在 GitHub Pages（`public/CNAME` → `daily-checkin-task.hexschool.io`）。**不要改成 HTML5 history**。
- 每條路由都以 `/:scheduleId` 開頭，`scheduleId` 由外部系統帶入。整個 app 永遠只在「單一排程」情境下運作，沒有排程列表或切換。
- 路由：`my-journey`（首頁 `/:scheduleId`）、`calendar`、`leaderboard`、`friends`、`user-detail`（`/users/:discordUserId`）、`day-detail`（`/days/:dayLabel`）。`/progress`→leaderboard、`/users`→friends 為舊路由相容轉址。
- `meta.title` 由 `router.beforeEach` 自動寫入 `document.title`。

### 2. API 層：原生 fetch + envelope 拆封

- `src/api/checkin.ts` 用**原生 `fetch`**（非 Axios），`checkinApi` 物件聚合所有端點。
- 後端統一回傳 `{ success, data, error }` 信封；內部 `fetchApi<T>()` 會**自動拆出 `.data`**，所以 store/component 拿到的是已解開的資料（不是整個信封）。錯誤訊息來自 `data.error.message`。
- Base URL 來自 `VITE_API_BASE_URL`。`.env.local` 開發指向 `http://localhost:3001`、`.env.example` 為 `3000`、正式為 `https://message-tool-server.hexschool.io`。
- 型別集中在 `src/types/checkin.ts`，與後端回傳結構對應。

### 3. 遊戲化系統完全在前端計算

連續天數、等級、XP、成就**後端不提供**，全部由 `src/composables/` 的**純函式**從打卡資料即時推導：

- `useStreaks(checkinStatus, dailyStats)` → 當前/最長連續天數（依 `dailyStats` 的 dayLabel 順序掃描）。
- `useAchievements(input)` → 依 `ACHIEVEMENT_DEFS` 規則表判斷各成就 `unlocked`。
- `useLevel(input)` → 由完成率決定等級門檻、彙總打卡/連續/成就 XP。

這些是無狀態純函式，**在 view 內透過 `computed` 呼叫**（例見 `MyJourney.vue`），不存進 store。要調整規則就改對應 composable 的常數表（`LEVEL_THRESHOLDS`、`ACHIEVEMENT_DEFS`）。

### 4. 身份驅動的個人化（本機，非伺服器）

- `stores/identity.ts`：localStorage `my-identity`，以 `{ [scheduleId]: discordUserId }` 記錄「我是誰」。使用者在 `MyJourney` 名單點「這是我」即綁定。
- 有身份 → 顯示個人 header、等級、成就、最近活動、追蹤好友；無身份 → 顯示引導搜尋與全局統計。同一份頁面依 `myUser` 是否存在切換兩種樣貌。
- `stores/pinned.ts`：localStorage `pinned-users`，每個排程最多釘選 5 位好友（`MAX_PINNED`）；釘選資料以並行請求補齊 `UserDetail` 再轉成 `UserCheckinItem`。
- 所有本機狀態都**以 scheduleId 分桶**，切換排程互不干擾。

### 5. 主題系統

- `stores/theme.ts`：localStorage `theme`，`watch` 切換 `<html>` 的 `.dark` class。`App.vue` 在掛載時呼叫 `useThemeStore()` 以套用初始主題。
- Tailwind 4 dark 變體在 `src/assets/all.css` 以 `@custom-variant dark (&:where(.dark, .dark *))` 定義。撰寫樣式時用 `dark:` 前綴。

### Store 與資料流

`stores/checkin.ts` 是伺服器資料的單一來源（stats、users、currentUser、myUserDetail、dayDetail、pagination、searchResults，以及共用的 `isLoading`/`error`）。每個 action 都遵循 `isLoading=true → try/catch 設 error → finally 收尾` 模式，並提供 `$reset()`。`fetchMoreUsers` 做分頁累加載入。

## 開發規範

詳見 `.claude/rules/frontend.md`。重點：

- **格式**：無分號、單引號、100 字元行寬（ESLint 強制）。
- **型別**：優先 `interface`（需 union 才用 `type`）。
- **元件**：`<script setup lang="ts">`；Props 用 `interface Props` + `withDefaults(defineProps<Props>(), {...})`；Emits 用 typed `defineEmits<{ event: [payload] }>()`；邏輯超過約 200 行抽到 `composables/` 的 `useXxx`。
- **樣式**：用 Tailwind utility class，避免 inline style，沿用既有間距/顏色（主色 `violet`）。
- **註解**：業務邏輯用繁體中文。
- **API**：原生 fetch、集中於 `src/api/checkin.ts`、自動拆封（見上方核心架構第 2 點）。

## 目錄結構（重點）

```
src/
├── api/checkin.ts          # 所有 API 端點（原生 fetch）
├── types/checkin.ts        # 全部 TypeScript 型別
├── composables/            # useStreaks / useAchievements / useLevel（純函式遊戲化）
├── stores/                 # checkin（伺服器資料）/ identity / pinned / theme
├── router/index.ts         # hash 路由
├── views/                  # MyJourney / CalendarView / LeaderboardView / FriendsView / UserDetail / DayDetail / NotFound
├── components/
│   ├── layout/             # AppShell（外框 + 捲動置頂）、TopNavBar
│   ├── common/             # LoadingSpinner / ErrorMessage / PaginationNav / SearchBar
│   ├── stats/ user/ day/   # 各頁面區塊元件
│   ├── gamification/       # AchievementBadge/List、LevelProgress、StreakBadge、ContributionHeatmap
│   └── charts/             # DailyCheckinChart（chart.js）
└── assets/all.css          # Tailwind + Bootstrap Icons + dark 變體
```

頁面慣例：view 用 `<AppShell>` 包裹，依 `isLoading` / `error` / 有資料 三態渲染（`LoadingSpinner` / `ErrorMessage` + retry / 內容）。

## 子代理（.claude/agents/）

可委派的專責代理：`code-review`（唯讀審查）、`design`（Tailwind 一致性修正）、`docs`（更新專案文件）、`git`（Conventional Commits / branch / PR）。

## 部署

`pnpm deploy` = build + `gh-pages -d dist`。GitHub Pages 自訂網域 `daily-checkin-task.hexschool.io`，`public/.nojekyll` 避免 Jekyll 處理、`public/CNAME` 綁定網域。因此路由必須維持 hash 模式。
