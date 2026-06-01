import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 根路由導向打卡日曆（打卡日曆為主要首頁）
      path: '/:scheduleId',
      redirect: (to) => ({
        name: 'calendar',
        params: { scheduleId: to.params.scheduleId },
      }),
    },
    {
      path: '/:scheduleId/calendar',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue'),
      meta: { title: '打卡日曆' },
    },
    {
      path: '/:scheduleId/journey',
      name: 'my-journey',
      component: () => import('@/views/MyJourney.vue'),
      meta: { title: '我的旅程' },
    },
    {
      path: '/:scheduleId/leaderboard',
      name: 'leaderboard',
      component: () => import('@/views/LeaderboardView.vue'),
      meta: { title: '排行榜' },
    },
    {
      path: '/:scheduleId/friends',
      name: 'friends',
      component: () => import('@/views/FriendsView.vue'),
      meta: { title: '好友' },
    },
    {
      path: '/:scheduleId/users/:discordUserId',
      name: 'user-detail',
      component: () => import('@/views/UserDetail.vue'),
      meta: { title: '打卡詳情' },
    },
    {
      path: '/:scheduleId/days/:dayLabel',
      name: 'day-detail',
      component: () => import('@/views/DayDetail.vue'),
      meta: { title: '單日詳情' },
    },
    // 舊路由相容
    {
      path: '/:scheduleId/progress',
      redirect: (to) => ({
        name: 'leaderboard',
        params: { scheduleId: to.params.scheduleId },
      }),
    },
    {
      path: '/:scheduleId/users',
      name: 'users-redirect',
      redirect: (to) => ({
        name: 'friends',
        params: { scheduleId: to.params.scheduleId },
      }),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFound.vue'),
      meta: { title: '頁面不存在' },
    },
  ],
})

// 動態更新頁面標題
router.beforeEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} | 每日打卡` : '每日打卡'
})

export default router
