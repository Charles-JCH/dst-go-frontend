<template>
  <el-dialog v-model="isVisible" title="部署游戏" width="800px" :close-on-click-modal="false" @open="handleOpen">
    <el-steps :active="step" finish-status="success" simple class="steps">
      <el-step title="选择游戏" />
      <el-step title="部署" />
    </el-steps>

    <el-form v-if="step === 0" label-width="80px">
      <el-form-item label="游戏">
        <el-select v-model="gameCode" v-loading="isLoadingEnvs" placeholder="请选择要部署的游戏">
          <el-option
            v-for="env in gameEnvs"
            :key="env.code"
            :label="isDeployed(env.code) ? `${env.name}（已部署）` : env.name"
            :value="env.code"
            :disabled="isDeployed(env.code)"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template v-else>
      <div class="summary">
        <span>服务器：{{ server.name }}（{{ server.ip }}）</span>
        <span>游戏：{{ gameName }}</span>
        <el-tag v-if="task" :type="TASK_STATUS_MAP[task.status].type">{{ TASK_STATUS_MAP[task.status].label }}</el-tag>
      </div>
      <el-alert
        v-if="task?.status === 'failed'"
        type="error"
        :title="`部署失败：${task.errorMessage}`"
        :closable="false"
        class="alert"
      />
      <el-alert
        v-else-if="task?.status === 'succeeded'"
        type="success"
        title="部署完成"
        :closable="false"
        class="alert"
      />
      <el-alert
        v-else-if="!task"
        type="info"
        title="部署需要下载游戏服务端，通常需要 10～30 分钟。开始后可以关闭本窗口，部署会在后台继续，可在后台任务中查看进度。"
        :closable="false"
        class="alert"
      />
      <TaskTerminal v-if="task" :taskID="task.id" height="400px" />
    </template>

    <template #footer>
      <template v-if="step === 0">
        <el-button @click="isVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!gameCode" @click="step = 1">下一步</el-button>
      </template>
      <template v-else-if="!task">
        <el-button @click="step = 0">上一步</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleDeploy">开始部署</el-button>
      </template>
      <template v-else-if="task.status === 'failed'">
        <el-button @click="isVisible = false">关闭</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleDeploy">重新部署</el-button>
      </template>
      <el-button v-else-if="task.status === 'succeeded'" type="primary" @click="isVisible = false">完成</el-button>
      <el-button v-else @click="isVisible = false">关闭（部署在后台继续）</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { getGameEnvList } from '@/api/gameEnv'
import { deployGame, type GameEnv, type Server } from '@/api/server'
import { isTaskActive, TASK_STATUS_MAP, TASK_TYPE_GAME_DEPLOY, type Task } from '@/api/task'
import TaskTerminal from '@/components/TaskTerminal.vue'
import { useTaskStore } from '@/stores/task'
import { computed, ref, watch } from 'vue'

const isVisible = defineModel<boolean>({ required: true })
const props = defineProps<{ server: Server }>()

const taskStore = useTaskStore()
const step = ref(0)
const gameEnvs = ref<GameEnv[]>([])
const gameCode = ref('')
const task = ref<Task>()
const isLoadingEnvs = ref(false)
const isSubmitting = ref(false)

const gameName = computed(() => gameEnvs.value.find((e) => e.code === gameCode.value)?.name ?? '-')

const isDeployed = (code: string) => props.server.gameEnv.some((e) => e.code === code)

/** 打开时如果已有进行中的部署，直接显示它的日志 */
async function handleOpen() {
  const active = taskStore.tasks.find(
    (t) => t.type === TASK_TYPE_GAME_DEPLOY && t.resourceID === props.server.id && isTaskActive(t)
  )
  task.value = active
  step.value = active ? 1 : 0
  if (!active) gameCode.value = ''

  isLoadingEnvs.value = true
  gameEnvs.value = await getGameEnvList().catch(() => [])
  isLoadingEnvs.value = false
  // 恢复进行中部署的游戏，部署失败后"重新部署"要用到
  if (active) gameCode.value = gameEnvs.value.find((e) => `部署${e.name}` === active.name)?.code ?? ''
}

async function handleDeploy() {
  isSubmitting.value = true
  try {
    const created = await deployGame(props.server.id, gameCode.value)
    taskStore.upsert(created, task.value?.id) // 重新部署时替换掉失败的任务
    task.value = created
  } catch {
    // 错误提示已由 request 统一处理（如 Agent 离线、服务器正在执行其他操作）
  } finally {
    isSubmitting.value = false
  }
}

// 跟随任务状态变化
watch(
  () => taskStore.latest,
  (latest) => {
    if (latest && latest.id === task.value?.id) task.value = latest
  }
)
</script>

<style scoped>
.steps {
  margin-bottom: 20px;
}

.summary {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 12px;
}

.alert {
  margin-bottom: 12px;
}
</style>
