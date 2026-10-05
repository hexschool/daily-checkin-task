import type { StreakResult, DailyStat, ScheduleStats } from '@/types/checkin'

// 計算打卡截止時間所需的排程設定（直接傳入 ScheduleStats 即可）
export type CheckinWindow = Pick<ScheduleStats, 'checkinMode' | 'extendedHours' | 'endDate'>

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
// 後端以 Asia/Taipei 計算日界線；台灣無日光節約時間，固定 UTC+8
const TAIPEI_OFFSET_MS = 8 * HOUR_MS

// 某時間點所在台北日期的當日結束時刻（23:59:59.999）
function endOfTaipeiDay(time: number): number {
  const dayStart = Math.floor((time + TAIPEI_OFFSET_MS) / DAY_MS) * DAY_MS - TAIPEI_OFFSET_MS
  return dayStart + DAY_MS - 1
}

// 與後端 threadScanService.calculateCheckinDeadline 相同的截止規則
function getCheckinDeadline(checkinWindow: CheckinWindow, threadCreatedAt: string): number | null {
  const createdAt = new Date(threadCreatedAt).getTime()
  if (Number.isNaN(createdAt)) return null

  switch (checkinWindow.checkinMode) {
    case 'extended':
      return endOfTaipeiDay(createdAt) + (checkinWindow.extendedHours ?? 0) * HOUR_MS
    case 'all_period': {
      if (!checkinWindow.endDate) return null
      // endDate 為 YYYY-MM-DD，視為台北當地日期
      const endDate = new Date(`${checkinWindow.endDate}T00:00:00+08:00`).getTime()
      return Number.isNaN(endDate) ? null : endOfTaipeiDay(endDate)
    }
    case 'standard':
    default:
      return createdAt + DAY_MS
  }
}

export function useStreaks(
  checkinStatus: Record<string, boolean>,
  dailyStats: DailyStat[],
  checkinWindow?: CheckinWindow,
  now: number = Date.now(),
): StreakResult {
  if (!dailyStats.length) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  const orderedLabels = dailyStats.map(s => s.dayLabel)

  let longestStreak = 0
  let currentRun = 0

  for (const label of orderedLabels) {
    if (checkinStatus[label]) {
      currentRun++
      if (currentRun > longestStreak) {
        longestStreak = currentRun
      }
    } else {
      currentRun = 0
    }
  }

  // 當前連續天數：從最後一天往回數
  // 結尾尚未打卡、但打卡時限還沒到的天數（例如今天剛發佈的討論串）不算中斷，直接略過
  let end = dailyStats.length - 1
  if (checkinWindow) {
    while (end >= 0) {
      const stat = dailyStats[end]
      if (!stat || checkinStatus[stat.dayLabel]) break
      const deadline = getCheckinDeadline(checkinWindow, stat.date)
      if (deadline === null || now > deadline) break
      end--
    }
  }

  let currentStreak = 0
  for (let i = end; i >= 0; i--) {
    const label = orderedLabels[i]
    if (label && checkinStatus[label]) {
      currentStreak++
    } else {
      break
    }
  }

  return { currentStreak, longestStreak }
}
