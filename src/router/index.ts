import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/views/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据看板', icon: 'Odometer' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/index.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'foods',
        name: 'Foods',
        component: () => import('@/views/foods/index.vue'),
        meta: { title: '食物库', icon: 'Food' },
      },
      {
        path: 'badges',
        name: 'Badges',
        component: () => import('@/views/badges/index.vue'),
        meta: { title: '成就徽章', icon: 'Medal' },
      },
      {
        path: 'ai-monitor',
        name: 'AIMonitor',
        component: () => import('@/views/ai-monitor/index.vue'),
        meta: { title: 'AI监控', icon: 'Cpu' },
      },
      {
        path: 'records',
        name: 'Records',
        component: () => import('@/views/records/index.vue'),
        meta: { title: '饮食记录', icon: 'Document' },
      },
      {
        path: 'feedbacks',
        name: 'Feedbacks',
        component: () => import('@/views/feedbacks/index.vue'),
        meta: { title: '用户反馈', icon: 'ChatDotRound' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  // 公开页面直接放行
  if (to.meta.public) {
    next()
    return
  }
  
  // 需要登录的页面，检查 token
  if (!authStore.token) {
    next('/login')
    return
  }
  
  next()
})

export default router
