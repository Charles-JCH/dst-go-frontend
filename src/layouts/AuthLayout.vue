<template>
  <div class="auth">
    <div class="theme"><ThemeSwitch /></div>
    <el-card class="card">
      <template #header>{{ route.meta.title }}</template>
      <router-view />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ThemeSwitch from '@/components/ThemeSwitch.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
/* 背景图随明暗主题切换：useDark 在 html 上加 dark 类，浏览器只下载当前生效的那张 */
.auth {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: url('@/assets/images/background_light.webp') center / cover no-repeat;
}

/* 不能用 :global(html.dark) .auth：Vue 会只保留 :global 里的部分，规则变成作用在 html 上 */
html.dark .auth {
  background-image: url('@/assets/images/background_dark.webp');
}

.theme {
  position: absolute;
  top: 20px;
  right: 24px;
}

.card {
  width: 380px;
}
</style>
