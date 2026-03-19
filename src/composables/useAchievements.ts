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
    category: 'streak',
    xpReward: 20,
  },
  {
    id: 'streak-3',
    title: '初試啼聲',
    description: '連續打卡 3 天',
    icon: 'bi-fire',
    tier: 'bronze',
    category: 'streak',
    xpReward: 20,
  },
  {
    id: 'streak-5',
    title: '穩定輸出',
    description: '連續打卡 5 天',
    icon: 'bi-fire',
    tier: 'silver',
    category: 'streak',
    xpReward: 30,
  },
  {
    id: 'streak-10',
    title: '打卡鐵人',
    description: '連續打卡 10 天',
    icon: 'bi-fire',
    tier: 'gold',
    category: 'streak',
    xpReward: 50,
  },
  {
    id: 'half-way',
    title: '半程達標',
    description: '完成率達到 50%',
    icon: 'bi-flag',
    tier: 'silver',
    category: 'completion',
    xpReward: 30,
  },
  {
    id: 'almost-there',
    title: '即將完成',
    description: '完成率達到 80%',
    icon: 'bi-flag-fill',
    tier: 'gold',
    category: 'completion',
    xpReward: 50,
  },
  {
    id: 'completionist',
    title: '全勤達人',
    description: '完成率達到 100%',
    icon: 'bi-trophy',
    tier: 'diamond',
    category: 'completion',
    xpReward: 50,
  },
]

function checkUnlocked(def: Omit<Achievement, 'unlocked'>, input: AchievementInput): boolean {
  switch (def.id) {
    case 'first-checkin':
      return input.totalCheckinDays >= 1
    case 'streak-3':
      return input.longestStreak >= 3
    case 'streak-5':
      return input.longestStreak >= 5
    case 'streak-10':
      return input.longestStreak >= 10
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
