<template>
  <div class="sidebar">
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
    <!-- 折叠后宽度只有 64px，图片缩得太小看不清，直接隐藏；展开时等宽度过渡快结束再淡入，避免被挤压变形 -->
    <Transition name="side-image">
      <img v-if="!isCollapsed" :src="sideImage" alt="" class="side-image" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import logoExpand from '@/assets/images/logo_expand.webp'
import logoFold from '@/assets/images/logo_fold.webp'
import sideImage from '@/assets/images/side.webp'
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
/* 菜单占满剩余高度，菜单多时在自己的区域内滚动，不与底部图片重叠 */
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
}

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

/* 展开过渡时宽度还很窄，文字不换行、横向超出直接裁掉，避免一闪而过的滚动条 */
.menu {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  white-space: nowrap;
  border-right: none;
}

.side-image {
  flex-shrink: 0;
  width: 160px;
  margin: 12px auto 16px;
  pointer-events: none;
  user-select: none;
}

.side-image-enter-active {
  transition: opacity 0.2s ease 0.2s;
}

.side-image-enter-from {
  opacity: 0;
}

/* 窗口太矮时优先保证菜单可用 */
@media (max-height: 600px) {
  .side-image {
    display: none;
  }
}
</style>
