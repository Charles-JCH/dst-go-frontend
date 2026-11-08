<template>
  <el-dialog
    v-model="isVisible"
    :title="isEdit ? '编辑服务器' : '新增服务器'"
    width="480px"
    destroy-on-close
    @open="handleOpen"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" @keyup.enter="handleSubmit">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="IP" prop="ip">
        <el-input v-model="form.ip" />
      </el-form-item>
      <el-form-item label="SSH 端口" prop="port">
        <el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" />
      </el-form-item>
      <el-form-item label="SSH 用户名" prop="username">
        <el-input v-model="form.username" placeholder="root 或已配置 sudo 免密的用户" />
      </el-form-item>
      <el-form-item label="SSH 密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          :placeholder="isEdit ? '不填写则不修改密码' : ''"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="isVisible = false">取消</el-button>
      <el-button type="primary" :loading="isLoading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { createServer, updateServer, type Server } from '@/api/server'
import { ipRules, linuxUserRules } from '@/utils/validate'
import type { FormInstance, FormRules } from 'element-plus'
import { computed, reactive, ref } from 'vue'

const props = defineProps<{ server?: Server }>() // 传入为编辑，不传为新增
const emit = defineEmits<{ success: [] }>()
const isVisible = defineModel<boolean>({ required: true })

const isEdit = computed(() => !!props.server)
const formRef = ref<FormInstance>()
const isLoading = ref(false)

const DEFAULT_FORM = { name: '', ip: '', port: 22, username: '', password: '' }
const form = reactive({ ...DEFAULT_FORM })

const rules = computed<FormRules>(() => ({
  name: [
    { required: true, whitespace: true, message: '请输入服务器名称', trigger: 'blur' },
    { max: 64, message: '名称最长 64 位', trigger: 'blur' }
  ],
  ip: ipRules,
  port: [{ required: true, message: '请输入 SSH 端口', trigger: 'blur' }],
  // Agent 以该用户运行，并通过免密 sudo 执行 dst 脚本
  username: linuxUserRules,
  // 编辑时密码可不填，表示不修改
  password: [
    ...(isEdit.value ? [] : [{ required: true, message: '请输入 SSH 密码', trigger: 'blur' }]),
    { max: 256, message: '密码最长 256 位', trigger: 'blur' }
  ]
}))

function handleOpen() {
  const { name, ip, port, username } = props.server ?? DEFAULT_FORM
  Object.assign(form, { name, ip, port, username, password: '' })
}

async function handleSubmit() {
  const isValid = await formRef.value?.validate().catch(() => false)
  if (!isValid) return

  isLoading.value = true
  try {
    if (props.server) {
      // 密码不填表示不修改，不传该字段
      const { password, ...rest } = form
      await updateServer(props.server.id, password ? form : rest)
    } else {
      await createServer(form)
    }
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功')
    isVisible.value = false
    emit('success')
  } catch {
    // 错误提示已由 request 统一处理
  } finally {
    isLoading.value = false
  }
}
</script>
