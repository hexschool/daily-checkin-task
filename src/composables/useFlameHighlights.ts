// 旺火動畫的「輪替 + 限量」邏輯。
// 目的：排行榜等長列表可能同時出現 50+ 個火焰，全部跑動畫會卡頓；
// 因此同一時間只讓固定數量（max）的火焰跑動畫，並讓這個名額「輪流」分配給
// 所有達標的使用者，而不是永遠固定那幾個人。
//
// 設計：
//   1. getEligibleFlameIds：算出達標（連續天數達門檻）且依穩定順序排序的 id 清單，
//      只隨資料變動、不隨時間變動（streak 計算較重，避免每次輪替都重算）。
//   2. rotateFlameWindow：以一個會隨時間遞增的 offset，從清單上取一段「環狀視窗」，
//      offset 前進 → 視窗滑動 → 不同人輪流被選中播放動畫。
//   3. useFlameTick：全域共用單一計時器提供 offset（模組層級單例，避免每個元件各開 interval）。

import { ref, onScopeDispose, type Ref } from 'vue'

export interface FlameCandidate {
  id: string
  streak: number
}

// 簡單字串雜湊（djb2 變形），讓排序穩定且與名次無關（火焰分布看起來較隨機）
function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return h >>> 0
}

// 達標且依穩定順序排序的合格 id 清單（只隨資料變動）
export function getEligibleFlameIds(candidates: FlameCandidate[], minStreak = 7): string[] {
  return candidates
    .filter((c) => c.streak >= minStreak)
    .map((c) => ({ id: c.id, h: hashId(c.id) }))
    .sort((a, b) => a.h - b.h)
    .map((c) => c.id)
}

// 從合格清單以環狀視窗取出本回合要播放動畫的 id（最多 max 個）。
// offset 隨時間遞增，視窗便會滑過整份清單，讓所有合格者輪流被選中。
export function rotateFlameWindow(sortedIds: string[], max: number, offset: number): Set<string> {
  const n = sortedIds.length
  if (n === 0) return new Set()
  // 不超過上限就全部開啟，無須輪替
  if (n <= max) return new Set(sortedIds)

  const start = ((offset % n) + n) % n
  const picked = new Set<string>()
  for (let i = 0; i < max; i++) {
    const id = sortedIds[(start + i) % n]
    if (id !== undefined) picked.add(id)
  }
  return picked
}

// ── 全域輪替計時器（單例） ──
const ROTATE_INTERVAL_MS = 2200 // 每隔約 2.2 秒讓視窗前進一格

const flameTick = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
let subscribers = 0

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 回傳一個會隨時間遞增的 tick（作為 rotateFlameWindow 的 offset 來源）。
// 只在「減少動態效果」未開啟時才實際啟動計時器。
export function useFlameTick(): Ref<number> {
  if (prefersReducedMotion) return flameTick

  subscribers++
  if (!timer) {
    timer = setInterval(() => {
      flameTick.value += 1
    }, ROTATE_INTERVAL_MS)
  }

  onScopeDispose(() => {
    subscribers--
    if (subscribers <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  })

  return flameTick
}
