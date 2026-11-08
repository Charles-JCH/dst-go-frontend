import 'vue-router'
import type { Component } from 'vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题：用于侧边栏、面包屑、浏览器标签页 */
    title?: string
    /** 侧边栏菜单图标（Element Plus 图标组件） */
    icon?: Component
    /** 为 true 时不在侧边栏显示 */
    hidden?: boolean
    /** 为 true 时缓存该页面（keep-alive） */
    keepAlive?: boolean
    /** 为 true 时无需登录即可访问 */
    public?: boolean
  }
}
