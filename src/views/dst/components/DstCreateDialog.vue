<template>
  <el-dialog v-model="isVisible" title="新建存档" width="760px" :close-on-click-modal="false" @open="handleOpen">
    <el-steps :active="step" finish-status="success" simple class="steps">
      <el-step title="初始化存档" />
      <el-step title="存档信息" />
    </el-steps>

    <template v-if="step === 0">
      <el-form ref="initFormRef" :model="initForm" :rules="initRules" label-width="100px" :disabled="isInitLocked">
        <el-form-item label="服务器" prop="serverID">
          <el-select v-model="initForm.serverID" placeholder="请选择服务器" @change="handleServerChange">
            <el-option v-for="s in servers" :key="s.id" :label="s.name" :value="s.id" :disabled="!hasDst(s)">
              {{ s.name }}{{ hasDst(s) ? '' : '（未部署饥荒）' }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="槽位" prop="slot">
          <el-select v-model="initForm.slot" :disabled="!initForm.serverID" placeholder="请选择槽位">
            <el-option
              v-for="slot in DST_SLOT_COUNT"
              :key="slot"
              :label="`槽位 ${slot}`"
              :value="slot"
              :disabled="usedSlots.includes(slot)"
            >
              槽位 {{ slot }}{{ usedSlots.includes(slot) ? '（已占用）' : '' }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="科雷令牌" prop="clusterToken">
          <el-input
            v-model="initForm.clusterToken"
            type="password"
            show-password
            placeholder="在科雷账号页面生成的服务器令牌"
          />
        </el-form-item>
      </el-form>
      <el-alert
        v-if="initTask?.status === 'failed'"
        type="error"
        :title="`初始化失败：${initTask.errorMessage}`"
        :closable="false"
        class="alert"
      />
      <el-alert
        v-else-if="initTask?.status === 'succeeded'"
        type="success"
        title="初始化完成，请点击下一步填写存档信息"
        :closable="false"
        class="alert"
      />
      <el-alert
        v-else-if="!initTask"
        type="info"
        title="初始化会清空服务器上该槽位的存档目录，再拉取默认存档。"
        :closable="false"
        class="alert"
      />
      <TaskTerminal v-if="initTask" :taskID="initTask.id" height="280px" />
    </template>

    <template v-else>
      <el-form ref="infoFormRef" :model="infoForm" :rules="infoRules" label-width="100px" :disabled="isCreating">
        <DstInfoFields v-model="infoForm" />
        <el-form-item label="房间密码" prop="password">
          <el-input v-model="infoForm.password" type="password" show-password placeholder="不填写表示不设密码" />
        </el-form-item>
      </el-form>
      <el-alert
        v-if="createTask?.status === 'failed'"
        type="error"
        :title="`创建失败：${createTask.errorMessage}`"
        :closable="false"
        class="alert"
      />
      <TaskTerminal v-if="createTask" :taskID="createTask.id" height="140px" />
    </template>

    <template #footer>
      <el-button @click="isVisible = false">{{ isInitActive || isCreating ? '关闭' : '取消' }}</el-button>
      <template v-if="step === 0">
        <el-button v-if="initTask?.status === 'succeeded'" type="primary" @click="step = 1">下一步</el-button>
        <el-button v-else type="primary" :loading="isSubmitting || isInitActive" @click="handleInit">
          {{ initTask ? '重新初始化' : '初始化' }}
        </el-button>
      </template>
      <el-button v-else type="primary" :loading="isSubmitting || isCreating" @click="handleCreate">
        {{ createTask?.status === 'failed' ? '重试' : '确定' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { createDst, getDstList, initDst } from '@/api/dst'
import type { Server } from '@/api/server'
import { isTaskActive, type Task } from '@/api/task'
import TaskTerminal from '@/components/TaskTerminal.vue'
import { useTaskStore } from '@/stores/task'
import {
  clusterTokenRules,
  DST_SLOT_COUNT,
  dstDescriptionRules,
  dstNameRules,
  dstPasswordRules,
  modsRules
} from '@/utils/validate'
import type { FormInstance, FormRules } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import DstInfoFields from './DstInfoFields.vue'

/** 新增存档分两步：先在服务器上初始化默认存档，再填写存档信息写入配置；第二步成功后存档才保存 */
defineProps<{ servers: Server[] }>()
const emit = defineEmits<{ success: [] }>()
const isVisible = defineModel<boolean>({ required: true })

const taskStore = useTaskStore()
const step = ref(0)
const isSubmitting = ref(false)
const initFormRef = ref<FormInstance>()
const infoFormRef = ref<FormInstance>()

const initForm = reactive({
  serverID: undefined as number | undefined,
  slot: undefined as number | undefined,
  clusterToken: ''
})
const infoForm = ref({ name: '', description: '', maxPlayers: 6, mods: [] as string[], password: '' })
const initTask = ref<Task>()
const createTask = ref<Task>()
/** 所选服务器已被占用的槽位 */
const usedSlots = ref<number[]>([])

const isInitActive = computed(() => !!initTask.value && isTaskActive(initTask.value))
const isCreating = computed(() => !!createTask.value && isTaskActive(createTask.value))
/** 初始化开始后锁定服务器、槽位和令牌，失败后才能修改并重新初始化 */
const isInitLocked = computed(() => !!initTask.value && initTask.value.status !== 'failed')

const initRules: FormRules = {
  serverID: [{ required: true, message: '请选择服务器', trigger: 'change' }],
  slot: [{ required: true, message: '请选择槽位', trigger: 'change' }],
  clusterToken: clusterTokenRules(true)
}
const infoRules: FormRules = {
  name: dstNameRules,
  description: dstDescriptionRules,
  maxPlayers: [{ required: true, message: '请输入最大人数', trigger: 'blur' }],
  mods: modsRules,
  password: dstPasswordRules(false)
}

const hasDst = (server: Server) => server.gameEnv.some((e) => e.code === 'dst')

/** 每次打开都从第一步开始；上次初始化好但未完成第二步的存档需要重新初始化 */
function handleOpen() {
  step.value = 0
  Object.assign(initForm, { serverID: undefined, slot: undefined, clusterToken: '' })
  infoForm.value = { name: '', description: '', maxPlayers: 6, mods: [], password: '' }
  initTask.value = undefined
  createTask.value = undefined
  usedSlots.value = []
}

// 换服务器后清空已选槽位，并查询该服务器已占用的槽位
async function handleServerChange(serverID: number) {
  initForm.slot = undefined
  usedSlots.value = []
  try {
    const res = await getDstList({ serverID, page: 1, pageSize: DST_SLOT_COUNT })
    if (initForm.serverID === serverID) usedSlots.value = res.list.map((d) => d.slot)
  } catch {
    // 错误提示已由 request 统一处理；提交时后端仍会校验槽位
  }
}

async function handleInit() {
  const isValid = await initFormRef.value?.validate().catch(() => false)
  if (!isValid) return

  isSubmitting.value = true
  try {
    const task = await initDst({
      serverID: initForm.serverID!,
      slot: initForm.slot!,
      clusterToken: initForm.clusterToken.trim()
    })
    taskStore.upsert(task, initTask.value?.id) // 重新初始化时替换掉失败的任务
    initTask.value = task
  } catch {
    // 错误提示已由 request 统一处理（如 Agent 离线、服务器正在执行其他操作）
  } finally {
    isSubmitting.value = false
  }
}

async function handleCreate() {
  const isValid = await infoFormRef.value?.validate().catch(() => false)
  if (!isValid || !initTask.value) return

  isSubmitting.value = true
  try {
    const task = await createDst({ ...infoForm.value, initTaskID: initTask.value.id })
    taskStore.upsert(task, createTask.value?.id)
    createTask.value = task
  } catch {
    // 错误提示已由 request 统一处理
  } finally {
    isSubmitting.value = false
  }
}

// 跟随任务状态变化；创建成功即完成
watch(
  () => taskStore.latest,
  (latest) => {
    if (!latest) return
    if (latest.id === initTask.value?.id) initTask.value = latest
    if (latest.id !== createTask.value?.id) return
    createTask.value = latest
    if (latest.status === 'succeeded') {
      ElMessage.success('存档创建成功')
      isVisible.value = false
      emit('success')
    }
  }
)
</script>

<style scoped>
.steps {
  margin-bottom: 20px;
}

.alert {
  margin-bottom: 12px;
}
</style>
