<template>
  <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleRegister">
    <el-form-item prop="username">
      <el-input v-model="form.username" placeholder="用户名" />
    </el-form-item>
    <el-form-item prop="phone">
      <el-input v-model="form.phone" placeholder="手机号" />
    </el-form-item>
    <el-form-item prop="smsCode">
      <el-input v-model="form.smsCode" placeholder="短信验证码" class="code-input" />
      <SmsCodeButton :phone="form.phone" scene="register" :validate="validatePhone" class="code-button" />
    </el-form-item>
    <el-form-item prop="password">
      <el-input v-model="form.password" type="password" show-password placeholder="密码" />
    </el-form-item>
    <el-form-item prop="confirmPassword">
      <el-input v-model="form.confirmPassword" type="password" show-password placeholder="确认密码" />
    </el-form-item>
    <el-button type="primary" class="submit" :loading="isLoading" @click="handleRegister">注册</el-button>
    <div class="links">
      <router-link to="/login">返回登录</router-link>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { register } from '@/api/auth'
import SmsCodeButton from '@/components/SmsCodeButton.vue'
import { useUserStore } from '@/stores/user'
import { confirmRules, passwordRules, phoneRules, smsCodeRules, usernameRules } from '@/utils/validate'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const form = reactive({ username: '', phone: '', smsCode: '', password: '', confirmPassword: '' })
const rules: FormRules = {
  username: usernameRules,
  phone: phoneRules,
  smsCode: smsCodeRules,
  password: passwordRules,
  confirmPassword: confirmRules(() => form.password)
}

const isLoading = ref(false)

async function validatePhone() {
  await formRef.value?.validateField('phone')
}

async function handleRegister() {
  const isValid = await formRef.value?.validate().catch(() => false)
  if (!isValid) return

  isLoading.value = true
  try {
    const { accessToken } = await register(form)
    userStore.setAccessToken(accessToken)
    ElMessage.success('注册成功')
    router.replace('/')
  } catch {
    // 错误提示已由 request 统一处理
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.code-input {
  flex: 1;
}

.code-button {
  margin-left: 8px;
}

.submit {
  width: 100%;
}

.links {
  margin-top: 12px;
  font-size: 14px;
  text-align: right;
}
</style>
