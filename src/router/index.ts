import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:scheduleId',
      name: 'dashboard',
      component: () => import('@/views/ScheduleDashboard.vue'),
      meta: { title: 'Dashboard' },
    },
    {
      path: '/:scheduleId/progress',
      name: 'progress',
      component: () => import('@/views/ProgressTracker.vue'),
      meta: { title: '打卡進度追蹤' },
    },
    {
      path: '/:scheduleId/users',
      name: 'users',
      component: () => import('@/views/UserList.vue'),
      meta: { title: '參與者列表' },
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
