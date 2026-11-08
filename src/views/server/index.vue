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
      <el-button type="primary" :icon="Plus" @click="handleOpenDialog()">新增</el-button>
    </template>

    <el-table-column prop="name" label="名称" min-width="140" />
    <el-table-column prop="ip" label="IP" min-width="140" />
    <el-table-column prop="port" label="SSH 端口" width="100" />
    <el-table-column prop="osName" label="系统" min-width="120" :formatter="dash" />
    <el-table-column prop="arch" label="架构" width="90" :formatter="dash" />
    <el-table-column prop="cpu" label="CPU 核数" width="100" :formatter="dash" />
    <el-table-column prop="ram" label="内存" width="100" :formatter="bytes" />
    <el-table-column prop="disk" label="磁盘" width="100" :formatter="bytes" />
    <el-table-column prop="createdAt" label="创建时间" width="170" :formatter="dateTime" />
    <el-table-column label="Agent 状态" width="100" fixed="right">
      <template #default="{ row }">
        <el-tag v-if="row.agentOnline" type="success">在线</el-tag>
        <el-tag v-else-if="isConnecting(row.id)" type="primary">连接中</el-tag>
        <el-tag v-else type="info">离线</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="230" fixed="right">
      <template #default="{ row }">
        <el-button v-if="!row.agentOnline && !isConnecting(row.id)" link type="primary" @click="reconnect(row.id)">
          重新连接
        </el-button>
        <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
        <el-button link type="primary" @click="handleOpenDialog(row)">编辑</el-button>
        <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
      </template>
    </el-table-column>
  </PageTable>

  <ServerFormDialog v-model="isDialogVisible" :server="editing" @success="load" />
</template>

<script setup lang="ts">
import { deleteServer, getServerList, type Server } from '@/api/server'
import { isTaskActive, TASK_TYPE_AGENT_INSTALL } from '@/api/task'
import PageTable from '@/components/PageTable.vue'
import { useAgentReconnect } from '@/composables/useAgentReconnect'
import { usePageList } from '@/composables/usePageList'
import { useTaskStore } from '@/stores/task'
import { formatBytes, formatDateTime } from '@/utils/format'
import { Plus } from '@element-plus/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ServerFormDialog from './components/ServerFormDialog.vue'

const router = useRouter()
const { list, total, isLoading, query, load } = usePageList(getServerList)
const taskStore = useTaskStore()
const { isConnecting, reconnect } = useAgentReconnect()

// Agent 安装结束后刷新列表，更新在线状态
watch(
  () => taskStore.latest,
  (task) => {
    if (task?.type === TASK_TYPE_AGENT_INSTALL && !isTaskActive(task)) load()
  }
)

// Agent 上线或下线时只更新对应行，不重新请求列表
watch(
  () => taskStore.agentStatus,
  (status) => {
    const row = list.value.find((s) => s.id === status?.serverID)
    if (row && status) row.agentOnline = status.online
  }
)

// Agent 上报系统配置时只更新对应行
watch(
  () => taskStore.sysInfo,
  (info) => {
    if (!info) return
    const { serverID, ...fields } = info
    const row = list.value.find((s) => s.id === serverID)
    if (row) Object.assign(row, fields)
  }
)

// 新增和编辑共用一个弹窗：editing 有值为编辑，为空为新增
const isDialogVisible = ref(false)
const editing = ref<Server>()

function handleDetail(row: Server) {
  router.push(`/server/${row.id}`)
}

function handleOpenDialog(server?: Server) {
  editing.value = server
  isDialogVisible.value = true
}

async function handleDelete(row: Server) {
  try {
    // Agent 在线时平台会通知它卸载；离线时无法通知，需要用户自己清理
    const tip = row.agentOnline
      ? '删除后会自动卸载服务器上的 Agent，已部署的游戏不受影响。'
      : 'Agent 当前离线，无法自动卸载，删除后请登录服务器手动删除 /opt/dst-agent 和 dst-agent 服务。'
    await ElMessageBox.confirm(`确定删除服务器「${row.name}」吗？${tip}`, '删除确认', { type: 'warning' })
    await deleteServer(row.id)
  } catch {
    return // 取消，或删除失败（错误提示已由 request 统一处理）
  }
  ElMessage.success('删除成功')
  load()
}

// 表格列格式化：Agent 上报前 CPU、内存、磁盘等为空，显示 -
const dash = (_row: unknown, _col: unknown, value: string | number) => String(value || '-')
const bytes = (_row: unknown, _col: unknown, value: number) => formatBytes(value)
const dateTime = (_row: unknown, _col: unknown, value: string) => formatDateTime(value)
</script>
