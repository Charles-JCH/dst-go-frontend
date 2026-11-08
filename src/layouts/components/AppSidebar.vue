<template>
  <div class="logo">
    <img v-if="isCollapsed" :src="logoFold" alt="DST" class="fold" />
    <img v-else :src="logoExpand" alt="饥荒服务器面板" class="expand" />
  </div>
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
import logoExpand from '@/assets/images/logo_expand.webp'
import logoFold from '@/assets/images/logo_fold.webp'
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
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
}

.expand {
  height: 50px;
}

.fold {
  height: 40px;
}

.menu {
  border-right: none;
}
</style>
