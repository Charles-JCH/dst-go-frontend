<template>
  <div v-loading="isLoading" class="detail">
    <template v-if="server">
      <el-card>
        <template #header>基本信息</template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="名称">{{ server.name }}</el-descriptions-item>
          <el-descriptions-item label="IP">{{ server.ip }}</el-descriptions-item>
          <el-descriptions-item label="SSH 端口">{{ server.port }}</el-descriptions-item>
          <el-descriptions-item label="SSH 用户名">{{ server.username }}</el-descriptions-item>
          <el-descriptions-item label="Agent">
            <el-tag v-if="isInstalling(serverID)" type="primary">{{ server.agentOnline ? '更新中' : '连接中' }}</el-tag>
            <template v-else>
              <el-tag :type="server.agentOnline ? 'success' : 'info'">{{
                server.agentOnline ? '在线' : '离线'
              }}</el-tag>
              <el-button link type="primary" class="install" @click="install(server)">
                {{ server.agentOnline ? '更新 Agent' : '重新连接' }}
              </el-button>
            </template>
          </el-descriptions-item>
          <el-descriptions-item label="系统">{{ server.osName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="架构">{{ server.arch || '-' }}</el-descriptions-item>
          <el-descriptions-item label="CPU 核数">{{ server.cpu || '-' }}</el-descriptions-item>
          <el-descriptions-item label="内存">{{ formatBytes(server.ram) }}</el-descriptions-item>
          <el-descriptions-item label="磁盘（游戏分区）">{{ formatBytes(server.disk) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(server.createdAt) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <ServerMetricsCard :server="server" />

      <el-card>
        <template #header>
          <div class="card-header">
            <span>游戏环境</span>
            <el-tooltip :disabled="server.agentOnline" content="Agent 离线，请先重新连接">
              <el-button type="primary" :icon="Plus" :disabled="!server.agentOnline" @click="isDeployVisible = true">
                部署游戏
              </el-button>
            </el-tooltip>
          </div>
        </template>
        <el-table v-if="server.gameEnv.length" :data="server.gameEnv">
          <el-table-column prop="name" label="游戏" min-width="160" />
          <el-table-column label="状态" width="120">
            <template #default>
              <el-tag v-if="activeUpdateTask" type="primary">更新中</el-tag>
              <el-tag v-else type="success">已部署</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }: { row: GameEnv }">
              <el-button v-if="activeUpdateTask" link type="primary" @click="handleOpenLogs(activeUpdateTask)">
                查看日志
              </el-button>
              <el-tooltip v-else :disabled="server.agentOnline" content="Agent 离线，请先重新连接">
                <el-button link type="primary" :disabled="!server.agentOnline" @click="handleUpdateGame(row)">
                  检查更新
                </el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="尚未部署游戏环境" :image-size="80" />
      </el-card>

      <el-card>
        <template #header> 最近任务 </template>
        <el-table :data="tasks">
          <el-table-column prop="name" label="任务" min-width="160" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="TASK_STATUS_MAP[row.status as Task['status']].type">
                {{ TASK_STATUS_MAP[row.status as Task['status']].label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="stage" label="当前步骤" min-width="120" :formatter="stage" />
          <el-table-column prop="errorMessage" label="失败原因" min-width="200" :formatter="dash" />
          <el-table-column prop="createdAt" label="创建时间" width="170" :formatter="dateTime" />
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleOpenLogs(row)">日志</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </div>

  <TaskLogDialog v-model="isLogVisible" :task="logTask" />
  <DeployDialog v-if="server" v-model="isDeployVisible" :server="server" />
</template>

<script setup lang="ts">
import { getServer, updateGame, type GameEnv, type Server } from '@/api/server'
import {
  getTaskList,
  isTaskActive,
  TASK_STAGE_MAP,
  TASK_STATUS_MAP,
  TASK_TYPE_GAME_UPDATE,
  type Task,
  type TaskStage
} from '@/api/task'
import TaskLogDialog from '@/components/TaskLogDialog.vue'
import { useAgentInstall } from '@/composables/useAgentInstall'
import { useTaskStore } from '@/stores/task'
import { formatBytes, formatDateTime } from '@/utils/format'
import { Plus } from '@element-plus/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DeployDialog from './components/DeployDialog.vue'
import ServerMetricsCard from './components/ServerMetricsCard.vue'

const route = useRoute()
const router = useRouter()
const serverID = Number(route.params.id)

const server = ref<Server>()
const tasks = ref<Task[]>([])
const isLoading = ref(true)
const taskStore = useTaskStore()
const { isInstalling, install } = useAgentInstall()
const isLogVisible = ref(false)
const logTask = ref<Task>()
const isDeployVisible = ref(false)

async function loadTasks() {
  const res = await getTaskList({ page: 1, pageSize: 5, resourceType: 'server', resourceID: serverID })
  tasks.value = res.list
}

function handleOpenLogs(task: Task) {
  logTask.value = task
  isLogVisible.value = true
}

/** 进行中的游戏更新任务；同一台服务器同时只执行一个命令，按类型即可找到 */
const activeUpdateTask = computed(() =>
  taskStore.tasks.find((t) => t.type === TASK_TYPE_GAME_UPDATE && t.resourceID === serverID && isTaskActive(t))
)

// 检查更新：下载新版本可能需要几分钟，打开日志窗口查看进度
async function handleUpdateGame(env: GameEnv) {
  try {
    await ElMessageBox.confirm(
      `将检查${env.name}是否有新版本，有新版本时自动下载更新。更新前需要先停止该服务器上所有运行中的存档，已是最新版本时不受影响。`,
      '检查更新',
      { type: 'info' }
    )
    const task = await updateGame(serverID, env.code)
    taskStore.upsert(task)
    handleOpenLogs(task)
  } catch {
    // 取消，或下发失败（错误提示已由 request 统一处理，如服务器正在执行其他操作）
  }
}

onMounted(async () => {
  try {
    const [serverInfo] = await Promise.all([getServer(serverID), loadTasks()])
    server.value = serverInfo
  } catch {
    router.replace('/server') // 服务器不存在或无权访问，错误提示已由 request 统一处理
  } finally {
    isLoading.value = false
  }
})

// 本服务器的任务有变化时刷新任务列表，任务结束时刷新 Agent 在线状态
watch(
  () => taskStore.latest,
  async (task) => {
    if (task?.resourceType !== 'server' || task.resourceID !== serverID) return
    await loadTasks().catch(() => {})
    if (!isTaskActive(task)) server.value = await getServer(serverID).catch(() => server.value)
  }
)

// Agent 上线或下线时更新在线状态
watch(
  () => taskStore.agentStatus,
  (status) => {
    if (!server.value || status?.serverID !== serverID) return
    server.value.agentOnline = status.online
    if (!status.online) server.value.metrics = null // 离线后不再显示过期的当前值
  }
)

// Agent 随心跳上报资源使用情况时更新当前值（历史曲线由 ServerMetricsCard 自己追加）
watch(
  () => taskStore.metrics,
  (event) => {
    if (!event) return
    const { serverID: eventServerID, ...metrics } = event
    if (server.value && eventServerID === serverID) server.value.metrics = metrics
  }
)

// Agent 上报系统配置时更新基本信息
watch(
  () => taskStore.sysInfo,
  (info) => {
    if (!info) return
    const { serverID: infoServerID, ...fields } = info
    if (server.value && infoServerID === serverID) Object.assign(server.value, fields)
  }
)

const dash = (_row: unknown, _col: unknown, value: string) => value || '-'
const stage = (_row: unknown, _col: unknown, value: TaskStage) => TASK_STAGE_MAP[value] ?? '-'
const dateTime = (_row: unknown, _col: unknown, value: string) => formatDateTime(value)
</script>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%; /* 占满内容区，加载时 loading 显示在可视区域中间 */
}

.install {
  margin-left: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
