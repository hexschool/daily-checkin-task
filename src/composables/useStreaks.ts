import type { StreakResult, DailyStat } from '@/types/checkin'

export function useStreaks(
  checkinStatus: Record<string, boolean>,
  dailyStats: DailyStat[],
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
  let currentStreak = 0
  for (let i = orderedLabels.length - 1; i >= 0; i--) {
    const label = orderedLabels[i]
    if (label && checkinStatus[label]) {
      currentStreak++
    } else {
      break
    }
  }

  return { currentStreak, longestStreak }
}
