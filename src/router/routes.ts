import { Monitor, Odometer } from '@element-plus/icons-vue'
import { RouterView, type RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    // 认证页面共用 AuthLayout：登录、注册、忘记密码（子路由使用绝对路径）
    path: '/auth',
    redirect: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/auth/Login.vue'),
        meta: { title: '登录', public: true }
      },
      {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/auth/Register.vue'),
        meta: { title: '注册', public: true }
      },
      {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('@/views/auth/ForgotPassword.vue'),
        meta: { title: '找回密码', public: true }
      }
    ]
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '控制台', icon: Odometer }
      },
      {
        path: 'server',
        component: RouterView,
        meta: { title: '云服务器', icon: Monitor },
        children: [
          { path: '', name: 'ServerList', component: () => import('@/views/server/index.vue') },
          {
            path: ':id',
            name: 'ServerDetail',
            component: () => import('@/views/server/ServerDetail.vue'),
            meta: { title: '服务器详情' }
          }
        ]
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFound.vue'),
    meta: { title: '页面不存在', public: true }
  }
]
