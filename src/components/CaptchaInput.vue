<template>
  <div class="captcha">
    <el-input v-model="code" placeholder="图形验证码" />
    <div class="image" title="点击刷新" @click="refresh">
      <img v-if="src" :src="src" alt="图形验证码" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCaptcha } from '@/api/auth'
import { computed, onMounted, ref } from 'vue'

const code = defineModel<string>({ default: '' })
const captchaID = defineModel<string>('captchaID', { default: '' })
const image = ref('')

// 兼容后端返回的 base64 带或不带 data:image 前缀
const src = computed(() =>
  !image.value || image.value.startsWith('data:') ? image.value : `data:image/png;base64,${image.value}`
)

/** 获取新的验证码，验证码一次性有效，提交失败或发送短信后需调用 */
async function refresh() {
  const res = await getCaptcha().catch(() => null)
  if (!res) return
  captchaID.value = res.captchaID
  image.value = res.captchaImg
  code.value = ''
}

onMounted(refresh)
defineExpose({ refresh })
</script>

<style scoped>
.captcha {
  display: flex;
  gap: 8px;
  width: 100%;
}

.image {
  flex-shrink: 0;
  width: 110px;
  height: 32px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}

img {
  width: 100%;
  height: 100%;
}
</style>
