<template>
  <el-container class="layout">
    <el-aside :width="isCollapsed ? '64px' : '200px'">
      <AppSidebar :is-collapsed="isCollapsed" />
    </el-aside>
    <el-container>
      <el-header>
        <AppHeader v-model:is-collapsed="isCollapsed" />
      </el-header>
      <el-main>
        <AppMain />
      </el-main>
      <el-footer height="40px" class="footer">
        Copyright &copy; {{ new Date().getFullYear() }} 饥荒服务器管理平台
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useTaskStore } from '@/stores/task'
import { onMounted, onUnmounted, ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppMain from './components/AppMain.vue'
import AppSidebar from './components/AppSidebar.vue'

const isCollapsed = ref(false)
const taskStore = useTaskStore()

// 进入主页面后建立实时连接，退出登录离开主页面时断开
onMounted(taskStore.connect)
onUnmounted(taskStore.disconnect)
</script>

<style scoped>
.layout {
  height: 100%;
}

/* 外框不滚动，由侧边栏内的菜单区域自己滚动；展开过渡时内容比外框宽，直接裁掉，不出现滚动条 */
.el-aside {
  overflow: hidden;
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  transition: width 0.3s;
}

.el-header {
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
