<template>
  <div class="logo">{{ isCollapsed ? 'DST' : '饥荒服务器管理' }}</div>
  <el-menu
    router
    :default-active="route.matched[1]?.path"
    :collapse="isCollapsed"
    :collapse-transition="false"
    class="menu"
  >
    <el-menu-item v-for="item in menus" :key="item.path" :index="`/${item.path}`">
      <el-icon v-if="item.meta?.icon">
        <component :is="item.meta.icon" />
      </el-icon>
      <template #title>{{ item.meta?.title }}</template>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineProps<{ isCollapsed: boolean }>()

const route = useRoute()
const router = useRouter()

const menus = computed(
  () => router.options.routes.find((r) => r.path === '/')?.children?.filter((r) => !r.meta?.hidden) ?? []
)
</script>

<style scoped>
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.menu {
  border-right: none;
}
</style>
