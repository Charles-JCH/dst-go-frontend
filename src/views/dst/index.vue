<template>
  <PageTable
    v-model:page="query.page"
    v-model:page-size="query.pageSize"
    :data="list"
    :total="total"
    :is-loading="isLoading"
    @change="load"
  >
    <template #toolbar>
      <el-button type="primary" :icon="Plus" @click="isCreateVisible = true">新建</el-button>
      <el-select v-model="serverID" placeholder="全部服务器" clearable class="server-select" @change="handleFilter">
        <el-option v-for="s in servers" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
    </template>

    <el-table-column prop="name" label="名称" min-width="140" />
    <el-table-column label="所属服务器" min-width="140">
      <template #default="{ row }: { row: Dst }">{{ serverNames.get(row.serverID) ?? '-' }}</template>
    </el-table-column>
    <el-table-column prop="slot" label="槽位" width="80" />
    <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip :formatter="dash" />
    <el-table-column prop="maxPlayers" label="最大人数" width="100" />
    <el-table-column label="模组" width="90">
      <template #default="{ row }: { row: Dst }">{{ row.mods.length }} 个</template>
    </el-table-column>
    <el-table-column prop="createdAt" label="创建时间" width="170" :formatter="dateTime" />
    <el-table-column label="状态" width="100" fixed="right">
      <template #default="{ row }: { row: Dst }">
        <el-tag v-if="activeTask(row.id)?.type === TASK_TYPE_DST_START" type="primary">启动中</el-tag>
        <el-tag v-else-if="activeTask(row.id)?.type === TASK_TYPE_DST_STOP" type="warning">停止中</el-tag>
        <el-tag v-else-if="row.status === DST_STATUS_RUNNING" type="success">运行中</el-tag>
        <el-tag v-else type="info">已停止</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="200" fixed="right">
      <template #default="{ row }: { row: Dst }">
        <!-- 有进行中的命令时只能看日志。状态与实际不符时（如进程意外退出）点一次即可纠正：脚本对已停止再停止、已运行再启动都直接成功 -->
        <el-button v-if="activeTask(row.id)" link type="primary" @click="showLog(activeTask(row.id))">
          查看日志
        </el-button>
        <el-button
          v-else-if="row.status === DST_STATUS_RUNNING"
          link
          type="warning"
          @click="handleControl(row, stopDst)"
        >
          停止
        </el-button>
        <el-button v-else link type="success" @click="handleControl(row, startDst)">启动</el-button>
        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
      </template>
    </el-table-column>
  </PageTable>

  <DstCreateDialog v-model="isCreateVisible" :servers="servers" @success="load" />
  <DstFormDialog v-if="editing" v-model="isEditVisible" :dst="editing" :servers="servers" @success="load" />
  <TaskLogDialog v-model="isLogVisible" :task="logTask" />
</template>

<script setup lang="ts">
import { DST_STATUS_RUNNING, getDstList, startDst, stopDst, type Dst } from '@/api/dst'
import { getServerList, type Server } from '@/api/server'
import { isTaskActive, TASK_TYPE_DST_START, TASK_TYPE_DST_STOP, type Task } from '@/api/task'
import PageTable from '@/components/PageTable.vue'
import TaskLogDialog from '@/components/TaskLogDialog.vue'
import { usePageList } from '@/composables/usePageList'
import { formatDateTime } from '@/utils/format'
import { Plus } from '@element-plus/icons-vue'
import { useTaskStore } from '@/stores/task'
import { computed, onMounted, ref, watch } from 'vue'
import DstCreateDialog from './components/DstCreateDialog.vue'
import DstFormDialog from './components/DstFormDialog.vue'

// 筛选的服务器，为空表示全部
const serverID = ref<number>()
const { list, total, isLoading, query, load } = usePageList((params) =>
  getDstList({ ...params, serverID: serverID.value })
)

// 筛选下拉框和“所属服务器”列共用；后端每页最多 100 条
const servers = ref<Server[]>([])
const serverNames = computed(() => new Map(servers.value.map((s) => [s.id, s.name])))

onMounted(async () => {
  try {
    servers.value = (await getServerList({ page: 1, pageSize: 100 })).list
  } catch {
    // 错误提示已由 request 统一处理
  }
})

const isCreateVisible = ref(false)
const isEditVisible = ref(false)
const editing = ref<Dst>()

function handleEdit(dst: Dst) {
  editing.value = dst
  isEditVisible.value = true
}

// 启动、停止：任务在后台执行，打开日志窗口查看进度，结束后刷新列表
const taskStore = useTaskStore()
const isLogVisible = ref(false)
const logTask = ref<Task>()

/** 存档进行中的命令任务（启动、停止、更新配置等） */
const activeTask = (dstID: number) =>
  taskStore.tasks.find((t) => t.resourceType === 'dst' && t.resourceID === dstID && isTaskActive(t))

function showLog(task?: Task) {
  logTask.value = task
  isLogVisible.value = true
}

async function handleControl(row: Dst, action: (id: number) => Promise<Task>) {
  try {
    const task = await action(row.id)
    taskStore.upsert(task)
    showLog(task)
  } catch {
    // 错误提示已由 request 统一处理（如 Agent 离线、服务器正在执行其他操作）
  }
}

const CONTROL_TYPES = [TASK_TYPE_DST_START, TASK_TYPE_DST_STOP]

watch(
  () => taskStore.latest,
  (task) => {
    if (!task || !CONTROL_TYPES.includes(task.type) || isTaskActive(task)) return
    if (!list.value.some((d) => d.id === task.resourceID)) return
    if (task.status === 'succeeded') ElMessage.success(`${task.name}成功`)
    else ElMessage.error(`${task.name}失败：${task.errorMessage}`)
    load()
  }
)

function handleFilter() {
  query.page = 1
  load()
}

const dash = (_row: unknown, _col: unknown, value: string) => value || '-'
const dateTime = (_row: unknown, _col: unknown, value: string) => formatDateTime(value)
</script>

<style scoped>
.server-select {
  width: 220px;
  margin-left: 12px;
}
</style>
