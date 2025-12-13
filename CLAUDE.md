# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案簡介

這是一個每日打卡系統的前端介面，使用 Vue 3 + TypeScript + Vite 建置。

## 常用指令

```bash
# 安裝依賴（使用 pnpm）
pnpm install

# 啟動開發伺服器
pnpm dev

# 型別檢查 + 正式環境建置
pnpm build

# 僅執行型別檢查
pnpm type-check

# ESLint 檢查並自動修復
pnpm lint

# 預覽正式環境建置結果
pnpm preview
```

## 技術架構

- **框架**: Vue 3 (Composition API + `<script setup>`)
- **建置工具**: Vite 7
- **型別**: TypeScript 5.9
- **CSS**: Tailwind CSS 4 (透過 `@tailwindcss/vite` 整合)
- **狀態管理**: Pinia 3
- **路由**: Vue Router 4
- **套件管理**: pnpm 9.9.0

## 專案結構

```
src/
├── main.ts          # 應用程式進入點，初始化 Vue、Pinia、Router
├── App.vue          # 根元件
├── assets/all.css   # 全域樣式，引入 Tailwind CSS
├── router/index.ts  # Vue Router 設定（使用 HTML5 History 模式）
└── stores/          # Pinia stores（使用 Composition API 風格）
```

## 開發注意事項

- 路徑別名：`@` 對應 `src/` 目錄
- Vue 元件使用 `<script setup lang="ts">` 語法
- Pinia stores 使用 Composition API 風格定義（`defineStore` + setup function）
- Node.js 版本需求：^20.19.0 或 >=22.12.0
