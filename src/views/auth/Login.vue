<template>
  <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleLogin">
    <el-form-item prop="phone">
      <el-input v-model="form.phone" placeholder="手机号" />
    </el-form-item>
    <el-form-item prop="password">
      <el-input v-model="form.password" type="password" show-password placeholder="密码" />
    </el-form-item>
    <el-form-item prop="captchaCode">
      <CaptchaInput ref="captchaRef" v-model="form.captchaCode" v-model:captchaID="form.captchaID" />
    </el-form-item>
    <el-button type="primary" class="submit" :loading="isLoading" @click="handleLogin">登录</el-button>
    <div class="links">
      <router-link to="/register">注册账号</router-link>
      <router-link to="/forgot-password">忘记密码</router-link>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { login } from '@/api/auth'
import CaptchaInput from '@/components/CaptchaInput.vue'
import { useUserStore } from '@/stores/user'
import { captchaRules, phoneRules } from '@/utils/validate'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const captchaRef = ref<InstanceType<typeof CaptchaInput>>()
const form = reactive({ phone: '', password: '', captchaID: '', captchaCode: '' })
const rules: FormRules = {
  phone: phoneRules,
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captchaCode: captchaRules
}

const isLoading = ref(false)

async function handleLogin() {
  const isValid = await formRef.value?.validate().catch(() => false)
  if (!isValid) return

  isLoading.value = true
  try {
    const { accessToken } = await login(form)
    userStore.setAccessToken(accessToken)
    router.replace((route.query.redirect as string) || '/')
  } catch {
    captchaRef.value?.refresh() // 验证码一次性有效，失败后需要刷新
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.submit {
  width: 100%;
}

.links {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 14px;
}
</style>
