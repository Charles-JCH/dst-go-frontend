<template>
  <div class="header">
    <div class="left">
      <el-icon class="toggle" @click="isCollapsed = !isCollapsed">
        <component :is="isCollapsed ? Expand : Fold" />
      </el-icon>
      <el-breadcrumb>
        <el-breadcrumb-item
          v-for="(item, index) in breadcrumbs"
          :key="item.path"
          :to="index < breadcrumbs.length - 1 ? item.path : undefined"
        >
          {{ item.meta.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="right">
      <TaskIndicator />
      <ThemeSwitch />
      <el-button link @click="handleLogout">退出登录</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { logout } from '@/api/auth'
import ThemeSwitch from '@/components/ThemeSwitch.vue'
import { useUserStore } from '@/stores/user'
import { Expand, Fold } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TaskIndicator from './TaskIndicator.vue'

const isCollapsed = defineModel<boolean>('isCollapsed', { default: false })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const breadcrumbs = computed(() => route.matched.filter((r) => r.meta?.title))

async function handleLogout() {
  await logout().catch(() => {})
  userStore.logout()
  router.replace('/login')
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.left,
.right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toggle {
  font-size: 20px;
  cursor: pointer;
}
</style>
