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
        <el-tag v-if="row.status === DST_STATUS_RUNNING" type="success">运行中</el-tag>
        <el-tag v-else type="info">已停止</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="100" fixed="right">
      <template #default="{ row }: { row: Dst }">
        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
      </template>
    </el-table-column>
  </PageTable>

  <DstCreateDialog v-model="isCreateVisible" :servers="servers" @success="load" />
  <DstFormDialog v-if="editing" v-model="isEditVisible" :dst="editing" :servers="servers" @success="load" />
</template>

<script setup lang="ts">
import { DST_STATUS_RUNNING, getDstList, type Dst } from '@/api/dst'
import { getServerList, type Server } from '@/api/server'
import PageTable from '@/components/PageTable.vue'
import { usePageList } from '@/composables/usePageList'
import { formatDateTime } from '@/utils/format'
import { Plus } from '@element-plus/icons-vue'
import { computed, onMounted, ref } from 'vue'
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
