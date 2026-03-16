import type { LevelInfo, DailyStat } from '@/types/checkin'
import { useStreaks } from './useStreaks'
import { useAchievements, getAchievementXP } from './useAchievements'

interface LevelInput {
  totalCheckinDays: number
  expectedTasks: number
  checkinStatus: Record<string, boolean>
  dailyStats: DailyStat[]
}

const LEVEL_THRESHOLDS = [
  { level: 1, minRate: 0, title: '初心者' },
  { level: 2, minRate: 15, title: '見習生' },
  { level: 3, minRate: 35, title: '老手' },
  { level: 4, minRate: 55, title: '達人' },
  { level: 5, minRate: 80, title: '大師' },
  { level: 6, minRate: 100, title: '傳說' },
]

function computeXP(
  totalCheckinDays: number,
  checkinStatus: Record<string, boolean>,
  dailyStats: DailyStat[],
  completionRate: number,
  longestStreak: number,
): number {
  // 基礎 XP：每天打卡 +10
  let xp = totalCheckinDays * 10

  // 連續打卡 bonus：streak 中每天 +5
  // 計算所有 streak 段的 bonus
  const orderedLabels = dailyStats.map(s => s.dayLabel)
  let currentRun = 0
  for (const label of orderedLabels) {
    if (checkinStatus[label]) {
      currentRun++
      if (currentRun >= 2) {
        xp += 5 // 連續第 2 天起每天 +5
      }
    } else {
      currentRun = 0
    }
  }

  // 成就 XP
  const achievements = useAchievements({
    totalCheckinDays,
    longestStreak,
    completionRate,
  })
  xp += getAchievementXP(achievements)

  return xp
}

export function useLevel(input: LevelInput): LevelInfo {
  const completionRate = input.expectedTasks > 0
    ? (input.totalCheckinDays / input.expectedTasks) * 100
    : 0

  const { longestStreak } = useStreaks(input.checkinStatus, input.dailyStats)

  // 等級由完成率決定
  let current = { level: 1, minRate: 0, title: '初心者' }
  for (const threshold of LEVEL_THRESHOLDS) {
    if (completionRate >= threshold.minRate) {
      current = threshold
    }
  }

  const totalXP = computeXP(
    input.totalCheckinDays,
    input.checkinStatus,
    input.dailyStats,
    completionRate,
    longestStreak,
  )

  return {
    level: current.level,
    title: current.title,
    completionRate: Math.round(completionRate * 10) / 10,
    currentXP: totalXP,
    totalXP,
  }
}
