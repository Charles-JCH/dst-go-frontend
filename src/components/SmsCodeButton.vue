<template>
  <span>
    <el-button :disabled="seconds > 0" @click="handleOpen">
      {{ seconds > 0 ? `${seconds}s 后重发` : '获取验证码' }}
    </el-button>
    <el-dialog v-model="isVisible" title="请输入图形验证码" width="360px" append-to-body destroy-on-close>
      <CaptchaInput ref="captchaRef" v-model="captcha.code" v-model:captchaID="captcha.id" @keyup.enter="handleSend" />
      <template #footer>
        <el-button @click="isVisible = false">取消</el-button>
        <el-button type="primary" :loading="isLoading" @click="handleSend">发送短信</el-button>
      </template>
    </el-dialog>
  </span>
</template>

<script setup lang="ts">
import { sendSMSCode, type SMSScene } from '@/api/auth'
import CaptchaInput from '@/components/CaptchaInput.vue'
import { onUnmounted, reactive, ref } from 'vue'

// phone：要发送的手机号；scene：短信场景；validate：发送前校验手机号，校验失败需抛出异常
const props = defineProps<{ phone: string; scene: SMSScene; validate?: () => Promise<unknown> }>()

const COUNTDOWN = 60
const seconds = ref(0)
const isVisible = ref(false)
const isLoading = ref(false)
const captcha = reactive({ id: '', code: '' })
const captchaRef = ref<InstanceType<typeof CaptchaInput>>()
let timer: ReturnType<typeof setInterval> | undefined

async function handleOpen() {
  try {
    await props.validate?.()
  } catch {
    return // 表单已提示手机号错误
  }
  isVisible.value = true
}

async function handleSend() {
  if (!captcha.code) {
    ElMessage.warning('请输入图形验证码')
    return
  }
  isLoading.value = true
  try {
    await sendSMSCode({ phone: props.phone, scene: props.scene, captchaID: captcha.id, captchaCode: captcha.code })
  } catch {
    captchaRef.value?.refresh() // 验证码一次性有效，失败后需要刷新
    return
  } finally {
    isLoading.value = false
  }
  isVisible.value = false
  seconds.value = COUNTDOWN
  timer = setInterval(() => {
    if (--seconds.value <= 0) clearInterval(timer)
  }, 1000)
}

onUnmounted(() => clearInterval(timer))
</script>
