---
description: Vue + TypeScript + Tailwind 前端開發規範
paths: ["src/**/*.ts", "src/**/*.vue"]
---

# 前端開發規範

## 通用

- 使用 pnpm 執行所有指令
- 無分號、單引號、100 字元行寬
- `@/` path alias 引用 src/ 下的檔案
- 優先使用 `interface` 而非 `type`（除非需要 union type）
- 業務邏輯註解使用繁體中文
- 完成工作前執行 `pnpm run lint` 確認無錯誤

## Vue 元件

- 一律使用 `<script setup lang="ts">` 語法
- Props: `interface Props` + `withDefaults(defineProps<Props>(), {...})`
- Emits: typed `defineEmits<{ eventName: [payload: Type] }>()`
- 超過約 200 行的邏輯提取至 `composables/` 作為 `useXxx` 函式

## Tailwind CSS 4

- 使用 utility classes，避免 inline styles
- 遵循現有間距/顏色慣例
- 使用 `@import 'tailwindcss'` 語法（Tailwind 4）

## API Service

- 使用**原生 `fetch`**（非 Axios），不額外引入 HTTP client 套件
- API 集中在 `src/api/checkin.ts`，以 `checkinApi` 物件聚合所有端點（每個 method 對應一個端點）
- 內部 `fetchApi<T>()` helper 負責組 URL、檢查回應、並**自動拆出後端 `{ success, data, error }` 信封的 `.data`**——所以 method 回傳的是已解開的資料，不是整個信封
- 錯誤一律 `throw new Error(...)`，訊息取自 `data.error.message`；由呼叫端（store action）以 try/catch 收斂到 `error` 狀態
- Base URL 來自 `import.meta.env.VITE_API_BASE_URL`（預設 `http://localhost:3000`）
- 型別集中於 `src/types/checkin.ts`，與後端回傳結構對應

## Composables（遊戲化）

- 連續天數／等級／XP／成就為**前端純函式計算**，後端不提供
- 置於 `src/composables/`，命名 `useXxx`，**無狀態純函式**（輸入打卡資料、回傳結果）
- 於 view 內以 `computed` 呼叫，**不存進 store**
- 調整規則改對應常數表（如 `LEVEL_THRESHOLDS`、`ACHIEVEMENT_DEFS`）

## Pinia Store

- 使用 `defineStore('name', () => { ... })` Composition API 模式
- State: `ref()`
- Getters: `computed()`
- Actions: plain functions
- return 所有需公開的 state、getters、actions
