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

/*
 * 登录框用羊皮纸木框做背景，九宫格切分（border-image）：
 * 原图 570×360，四角和顶部骷髅不变形，只有左右两边和中间纸面随表单高度伸缩。
 * 切分 上80 右64 下70 左64（原图像素），宽 460px 时按 0.807 缩放得到边框宽度。
 * 纸面在明暗模式下都是浅色，框内统一用深棕色文字，不跟随暗色主题。
 * 选择器写成 .auth .card：Element Plus 暗色样式 html.dark .el-card 会重设卡片背景和输入框底色，优先级要比它高
 */
.auth .card {
  --el-card-bg-color: transparent;
  --el-card-border-color: rgb(90 67 48 / 30%);
  --el-card-padding: 12px;
  --el-text-color-primary: #3d2b1f;
  --el-text-color-regular: #5a4330;
  --el-text-color-placeholder: #9a8063;
  --el-fill-color-blank: rgb(255 250 240 / 70%);
  --el-border-color: #b89b74;
  --el-border-color-hover: #8a6d4a;
  --el-box-shadow-light: none;

  width: 460px;
  max-width: calc(100vw - 32px);
  border-color: transparent;
  border-style: solid;
  border-width: 65px 52px 56px;
  border-image: url('@/assets/images/form.webp') 80 64 70 fill / 65px 52px 56px stretch;
  border-radius: 0;
  box-shadow: none;
}

.card :deep(.el-card__header) {
  padding-top: 0;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.card :deep(a) {
  color: #7a4a1e;
}

/*
 * 登录、注册、找回密码的主按钮（各页面的 .submit）用木板做背景。
 * 原图裁掉透明边后 197×66，横向三段切分：两端 28px（弧形切角和钉子）不变形，中间木纹横向拉伸；
 * 高度 44px 时按 2/3 缩放，两端各 19px
 */
.card :deep(.submit) {
  --el-button-text-color: #fff3dc;
  --el-button-hover-text-color: #fff3dc;
  --el-button-active-text-color: #fff3dc;
  --el-button-bg-color: transparent;
  --el-button-hover-bg-color: transparent;
  --el-button-active-bg-color: transparent;
  --el-button-border-color: transparent;
  --el-button-hover-border-color: transparent;
  --el-button-active-border-color: transparent;

  height: 44px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  text-shadow: 0 1px 2px rgb(0 0 0 / 70%);
  border-style: solid;
  border-width: 0 19px;
  border-image: url('@/assets/images/button.webp') 0 28 fill / 0 19px stretch;
  border-radius: 0;
  transition: filter 0.2s;
}

.card :deep(.submit:hover) {
  filter: brightness(1.12);
}

.card :deep(.submit:active),
.card :deep(.submit.is-loading) {
  filter: brightness(0.9);
}

/* 去掉加载中的半透明白色遮罩，它只盖住中间一段，会在木板上显出一块发白的矩形 */
.card :deep(.submit.is-loading::before) {
  display: none;
}
</style>
