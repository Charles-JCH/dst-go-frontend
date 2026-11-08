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
.auth {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
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
