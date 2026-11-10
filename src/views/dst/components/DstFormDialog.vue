<template>
  <el-dialog v-model="isVisible" title="编辑存档" width="560px" destroy-on-close @open="handleOpen">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" :disabled="isSaving">
      <!-- 服务器和槽位决定存档在服务器上的目录和端口，创建后不可修改 -->
      <el-form-item label="服务器">
        <el-input :model-value="serverName" disabled />
      </el-form-item>
      <el-form-item label="槽位">
        <el-input :model-value="`槽位 ${dst.slot}`" disabled />
      </el-form-item>
      <DstInfoFields v-model="form" />
      <el-form-item label="房间密码" prop="password">
        <div class="password">
          <el-switch v-model="isPasswordEnabled" />
          <el-input
            v-if="isPasswordEnabled"
            v-model="form.password"
            type="password"
            show-password
            :placeholder="isKeepPassword ? '已设置，不填写则不修改' : '玩家加入时需要输入'"
          />
        </div>
      </el-form-item>
      <el-form-item label="科雷令牌" prop="clusterToken">
        <el-input v-model="form.clusterToken" type="password" show-password placeholder="已设置，不填写则不修改" />
      </el-form-item>
    </el-form>
    <el-alert
      v-if="task?.status === 'failed'"
      type="error"
      :title="`保存失败：${task.errorMessage}`"
      :closable="false"
      class="alert"
    />
    <el-alert
      v-else
      type="info"
      title="保存时会把配置写入服务器，存档运行中时需重启后生效。"
      :closable="false"
      class="alert"
    />
    <TaskTerminal v-if="task" :taskID="task.id" height="140px" />
    <template #footer>
      <el-button @click="isVisible = false">{{ isSaving ? '关闭' : '取消' }}</el-button>
      <el-button type="primary" :loading="isLoading || isSaving" @click="handleSubmit">
        {{ task?.status === 'failed' ? '重试' : '确定' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { updateDst, type Dst, type UpdateDstParams } from '@/api/dst'
import type { Server } from '@/api/server'
import { isTaskActive, type Task } from '@/api/task'
import TaskTerminal from '@/components/TaskTerminal.vue'
import { useTaskStore } from '@/stores/task'
import { clusterTokenRules, dstDescriptionRules, dstNameRules, dstPasswordRules, modsRules } from '@/utils/validate'
import type { FormInstance, FormRules } from 'element-plus'
import { computed, ref, watch } from 'vue'
import DstInfoFields from './DstInfoFields.vue'

const props = defineProps<{ dst: Dst; servers: Server[] }>()
const emit = defineEmits<{ success: [] }>()
const isVisible = defineModel<boolean>({ required: true })

const taskStore = useTaskStore()
const formRef = ref<FormInstance>()
const isLoading = ref(false)
/** 配置写入任务：成功后存档才更新 */
const task = ref<Task>()
const isSaving = computed(() => !!task.value && isTaskActive(task.value))
const form = ref({ name: '', description: '', maxPlayers: 6, mods: [] as string[], password: '', clusterToken: '' })

const serverName = computed(() => props.servers.find((s) => s.id === props.dst.serverID)?.name ?? '-')

// 关闭开关表示不设密码；已有密码时开关打开且不填写表示保留原密码
const isPasswordEnabled = ref(false)
const isKeepPassword = computed(() => props.dst.hasPassword && isPasswordEnabled.value)

const rules = computed<FormRules>(() => ({
  name: dstNameRules,
  description: dstDescriptionRules,
  maxPlayers: [{ required: true, message: '请输入最大人数', trigger: 'blur' }],
  mods: modsRules,
  password: isPasswordEnabled.value ? dstPasswordRules(!isKeepPassword.value) : [],
  clusterToken: clusterTokenRules(false)
}))

function handleOpen() {
  const { name, description, maxPlayers, mods, hasPassword } = props.dst
  form.value = { name, description, maxPlayers, mods: [...mods], password: '', clusterToken: '' }
  isPasswordEnabled.value = hasPassword
  task.value = undefined
}

async function handleSubmit() {
  const isValid = await formRef.value?.validate().catch(() => false)
  if (!isValid) return

  const { name, description, maxPlayers, mods } = form.value
  const password = isPasswordEnabled.value ? form.value.password : ''
  const clusterToken = form.value.clusterToken.trim()
  const data: UpdateDstParams = { name, description, maxPlayers, mods }
  // 保留原密码时不传；关闭开关时传空串，表示取消密码
  if (!(isKeepPassword.value && !password)) data.password = password
  if (clusterToken) data.clusterToken = clusterToken

  isLoading.value = true
  try {
    const created = await updateDst(props.dst.id, data)
    taskStore.upsert(created, task.value?.id) // 重试时替换掉失败的任务
    task.value = created
  } catch {
    // 错误提示已由 request 统一处理
  } finally {
    isLoading.value = false
  }
}

// 跟随任务状态变化；写入成功即保存成功
watch(
  () => taskStore.latest,
  (latest) => {
    if (!latest || latest.id !== task.value?.id) return
    task.value = latest
    if (latest.status === 'succeeded') {
      ElMessage.success('保存成功')
      isVisible.value = false
      emit('success')
    }
  }
)
</script>

<style scoped>
.alert {
  margin-bottom: 12px;
}

.password {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}
</style>
