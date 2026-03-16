import type { Achievement } from '@/types/checkin'

interface AchievementInput {
  totalCheckinDays: number
  longestStreak: number
  completionRate: number // 0-100
}

const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlocked'>[] = [
  {
    id: 'first-checkin',
    title: '第一步',
    description: '完成第一次打卡',
    icon: 'bi-star',
    tier: 'bronze',
    xpReward: 20,
  },
  {
    id: 'streak-3',
    title: '初試啼聲',
    description: '連續打卡 3 天',
    icon: 'bi-fire',
    tier: 'bronze',
    xpReward: 20,
  },
  {
    id: 'streak-7',
    title: '一週戰士',
    description: '連續打卡 7 天',
    icon: 'bi-fire',
    tier: 'silver',
    xpReward: 30,
  },
  {
    id: 'streak-14',
    title: '兩週鐵人',
    description: '連續打卡 14 天',
    icon: 'bi-fire',
    tier: 'gold',
    xpReward: 50,
  },
  {
    id: 'half-way',
    title: '半程達標',
    description: '完成率達到 50%',
    icon: 'bi-flag',
    tier: 'silver',
    xpReward: 30,
  },
  {
    id: 'almost-there',
    title: '即將完成',
    description: '完成率達到 80%',
    icon: 'bi-flag-fill',
    tier: 'gold',
    xpReward: 50,
  },
  {
    id: 'completionist',
    title: '全勤達人',
    description: '完成率達到 100%',
    icon: 'bi-trophy',
    tier: 'diamond',
    xpReward: 50,
  },
]

function checkUnlocked(def: Omit<Achievement, 'unlocked'>, input: AchievementInput): boolean {
  switch (def.id) {
    case 'first-checkin':
      return input.totalCheckinDays >= 1
    case 'streak-3':
      return input.longestStreak >= 3
    case 'streak-7':
      return input.longestStreak >= 7
    case 'streak-14':
      return input.longestStreak >= 14
    case 'half-way':
      return input.completionRate >= 50
    case 'almost-there':
      return input.completionRate >= 80
    case 'completionist':
      return input.completionRate >= 100
    default:
      return false
  }
}

export function useAchievements(input: AchievementInput): Achievement[] {
  return ACHIEVEMENT_DEFS.map(def => ({
    ...def,
    unlocked: checkUnlocked(def, input),
  }))
}

export function getAchievementXP(achievements: Achievement[]): number {
  return achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.xpReward, 0)
}
