import { useUserStore } from '@/stores/user'
import NProgress from 'nprogress'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'

NProgress.configure({ showSpinner: false })

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  NProgress.start()
  const { accessToken } = useUserStore()

  if (!to.meta.public && !accessToken) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login' && accessToken) {
    return '/'
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - 饥荒服务器管理平台` : '饥荒服务器管理平台'
  NProgress.done()
})

export default router
