<template>
  <el-steps :active="step" finish-status="success" align-center class="steps">
    <el-step title="验证手机" />
    <el-step title="重置密码" />
  </el-steps>

  <el-form v-if="step === 0" ref="verifyRef" :model="verifyForm" :rules="verifyRules" @keyup.enter="handleVerify">
    <el-form-item prop="phone">
      <el-input v-model="verifyForm.phone" placeholder="手机号" />
    </el-form-item>
    <el-form-item prop="smsCode">
      <el-input v-model="verifyForm.smsCode" placeholder="短信验证码" class="code-input" />
      <SmsCodeButton :phone="verifyForm.phone" scene="reset" :validate="validatePhone" class="code-button" />
    </el-form-item>
    <el-button type="primary" class="submit" :loading="isLoading" @click="handleVerify">下一步</el-button>
  </el-form>

  <el-form v-else ref="resetRef" :model="resetForm" :rules="resetRules" @keyup.enter="handleReset">
    <el-form-item prop="password">
      <el-input v-model="resetForm.password" type="password" show-password placeholder="新密码" />
    </el-form-item>
    <el-form-item prop="confirmPassword">
      <el-input v-model="resetForm.confirmPassword" type="password" show-password placeholder="确认新密码" />
    </el-form-item>
    <el-button type="primary" class="submit" :loading="isLoading" @click="handleReset">重置密码</el-button>
    <el-button link class="back" @click="step = 0">上一步</el-button>
  </el-form>

  <div class="links">
    <router-link to="/login">返回登录</router-link>
  </div>
</template>

<script setup lang="ts">
import { resetPassword, verifyResetCode } from '@/api/auth'
import SmsCodeButton from '@/components/SmsCodeButton.vue'
import { confirmRules, passwordRules, phoneRules, smsCodeRules } from '@/utils/validate'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 第一步校验手机号，第二步设置新密码；resetToken 一次性有效，仅保存在当前页面内存中
const step = ref(0)
const resetToken = ref('')
const isLoading = ref(false)

const verifyRef = ref<FormInstance>()
const verifyForm = reactive({ phone: '', smsCode: '' })
const verifyRules: FormRules = {
  phone: phoneRules,
  smsCode: smsCodeRules
}

const resetRef = ref<FormInstance>()
const resetForm = reactive({ password: '', confirmPassword: '' })
const resetRules: FormRules = {
  password: passwordRules,
  confirmPassword: confirmRules(() => resetForm.password)
}

async function validatePhone() {
  await verifyRef.value?.validateField('phone')
}

async function handleVerify() {
  const isValid = await verifyRef.value?.validate().catch(() => false)
  if (!isValid) return

  isLoading.value = true
  try {
    const res = await verifyResetCode(verifyForm.phone, verifyForm.smsCode)
    resetToken.value = res.resetToken
    step.value = 1
  } catch {
    // 错误提示已由 request 统一处理
  } finally {
    isLoading.value = false
  }
}

async function handleReset() {
  const isValid = await resetRef.value?.validate().catch(() => false)
  if (!isValid) return

  isLoading.value = true
  try {
    await resetPassword({ resetToken: resetToken.value, newPassword: resetForm.password })
    ElMessage.success('密码已重置，请登录')
    router.replace('/login')
  } catch {
    // 错误提示已由 request 统一处理
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.steps {
  margin-bottom: 24px;
}

.code-input {
  flex: 1;
}

.code-button {
  margin-left: 8px;
}

.submit {
  width: 100%;
}

.back {
  margin-top: 8px;
}

.links {
  margin-top: 12px;
  font-size: 14px;
  text-align: right;
}
</style>
