<template>
  <div v-loading="isLoading" class="detail">
    <template v-if="dst && worldOptions">
      <el-card>
        <template #header>存档信息</template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="名称">{{ dst.name }}</el-descriptions-item>
          <el-descriptions-item label="所属服务器">{{ serverName }}</el-descriptions-item>
          <el-descriptions-item label="槽位">{{ dst.slot }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="dst.status === DST_STATUS_RUNNING ? 'success' : 'info'">
              {{ dst.status === DST_STATUS_RUNNING ? '运行中' : '已停止' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最大人数">{{ dst.maxPlayers }}</el-descriptions-item>
          <el-descriptions-item label="房间密码">{{ dst.hasPassword ? '已设置' : '无' }}</el-descriptions-item>
          <el-descriptions-item label="模组">{{ dst.mods.length }} 个</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(dst.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(dst.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="3">{{ dst.description || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card>
        <template #header>
          <div class="card-header">
            <div class="title">
              <span>世界设置</span>
              <el-tag v-if="isApplying" type="primary">应用中</el-tag>
              <el-tag v-else-if="dst.isWorldPending" type="warning">有未应用的修改</el-tag>
              <el-tag v-else type="success">已应用</el-tag>
            </div>
            <div class="actions">
              <el-button v-if="task" @click="isLogVisible = true">查看日志</el-button>
              <el-tooltip
                :disabled="!blockingTask || isApplying"
                :content="`存档正在执行「${blockingTask?.name}」，请稍后再应用`"
              >
                <el-button
                  type="primary"
                  :loading="isSubmitting || isApplying"
                  :disabled="!!blockingTask && !isApplying"
                  @click="handleApply"
                >
                  {{ isApplying ? '应用中' : '应用配置' }}
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </template>
        <el-alert
          v-if="task?.status === 'failed'"
          type="error"
          :title="`应用失败：${task.errorMessage}`"
          :closable="false"
          class="alert"
        />
        <el-alert v-else type="info" :closable="false" class="alert">
          保存只存到平台；点击「应用配置」才会把地面和洞穴的设置一起写入服务器。世界选项重启存档后生效；世界生成类设置只对新生成的世界生效。
        </el-alert>

        <el-tabs v-model="activeTab">
          <!-- lazy：洞穴设置切换过去时才渲染 -->
          <el-tab-pane v-for="shard in SHARDS" :key="shard.name" :name="shard.name" lazy>
            <template #label>
              {{ shard.label }}<span v-if="isDirty(shard.name)" class="dirty-dot" title="有未保存的修改" />
            </template>
            <WorldSettingsForm v-model="values[shard.name]" :options="worldOptions[shard.name]" />
            <div class="pane-actions">
              <el-button :disabled="!isDirty(shard.name)" @click="resetShard(shard.name)">撤销修改</el-button>
              <el-button
                type="primary"
                :disabled="!isDirty(shard.name)"
                :loading="savingShard === shard.name"
                @click="handleSave(shard.name)"
              >
                保存{{ shard.label }}
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>
    <el-empty v-else-if="!isLoading" description="存档不存在" />
  </div>

  <TaskLogDialog v-model="isLogVisible" :task="task" />
</template>

<script setup lang="ts">
import {
  applyDstWorld,
  DST_STATUS_RUNNING,
  getDst,
  getWorldOptions,
  saveDstWorld,
  type Dst,
  type WorldOptions,
  type WorldShard
} from '@/api/dst'
import { getServer } from '@/api/server'
import { isTaskActive, type Task } from '@/api/task'
import TaskLogDialog from '@/components/TaskLogDialog.vue'
import { useTaskStore } from '@/stores/task'
import { formatDateTime } from '@/utils/format'
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import WorldSettingsForm from './components/WorldSettingsForm.vue'

const SHARDS: { name: WorldShard; label: string }[] = [
  { name: 'master', label: '地面设置' },
  { name: 'caves', label: '洞穴设置' }
]

const route = useRoute()
const dstID = Number(route.params.id)
const taskStore = useTaskStore()

const dst = ref<Dst>()
const worldOptions = ref<WorldOptions>()
const serverName = ref('-')
const isLoading = ref(true)
const activeTab = ref<WorldShard>('master')
/** 各分片设置项 → 当前值，包含全部设置项；保存时只提交与默认值不同的项 */
const values = ref<Record<WorldShard, Record<string, string>>>({ master: {}, caves: {} })
/** 正在保存的分片 */
const savingShard = ref<WorldShard>()

/** 应用配置任务 */
const task = ref<Task>()
const isSubmitting = ref(false)
const isLogVisible = ref(false)
const isApplying = computed(() => !!task.value && isTaskActive(task.value))
/** 存档上进行中的命令（启动、停止等），同一台服务器同时只执行一个命令 */
const blockingTask = computed(() =>
  taskStore.tasks.find((t) => t.resourceType === 'dst' && t.resourceID === dstID && isTaskActive(t))
)

onMounted(async () => {
  try {
    const [detail, options] = await Promise.all([getDst(dstID), getWorldOptions()])
    worldOptions.value = options
    dst.value = detail
    SHARDS.forEach((shard) => resetShard(shard.name))
    loadServerName(detail.serverID)
  } catch {
    // 错误提示已由 request 统一处理
  } finally {
    isLoading.value = false
  }
})

/** 所属服务器名称只用于展示，不阻塞页面加载 */
async function loadServerName(serverID: number) {
  try {
    serverName.value = (await getServer(serverID)).name
  } catch {
    // 错误提示已由 request 统一处理
  }
}

/** 已保存的设置（与默认值不同的项） */
function savedOf(shard: WorldShard) {
  return (shard === 'master' ? dst.value?.masterOverrides : dst.value?.cavesOverrides) ?? {}
}

function overridesOf(shard: WorldShard) {
  const current = values.value[shard]
  return Object.fromEntries(
    (worldOptions.value?.[shard] ?? [])
      .filter((o) => current[o.name] !== o.default)
      .map((o) => [o.name, current[o.name]])
  )
}

function isDirty(shard: WorldShard) {
  return !isSameOverrides(overridesOf(shard), savedOf(shard))
}

/** 恢复为已保存的设置 */
function resetShard(shard: WorldShard) {
  const saved = savedOf(shard)
  values.value[shard] = Object.fromEntries(
    (worldOptions.value?.[shard] ?? []).map((o) => [o.name, saved[o.name] ?? o.default])
  )
}

async function handleSave(shard: WorldShard) {
  savingShard.value = shard
  try {
    dst.value = await saveDstWorld(dstID, { shard, overrides: overridesOf(shard) })
    ElMessage.success(`${SHARDS.find((s) => s.name === shard)?.label}已保存，点击「应用配置」写入服务器`)
  } catch {
    // 错误提示已由 request 统一处理
  } finally {
    savingShard.value = undefined
  }
}

// 应用的是已保存的设置；有未保存的修改时先确认，避免误以为修改已经写入服务器
async function handleApply() {
  const dirtyLabels = SHARDS.filter((s) => isDirty(s.name)).map((s) => s.label)
  if (dirtyLabels.length) {
    try {
      await ElMessageBox.confirm(
        `${dirtyLabels.join('、')}有未保存的修改，应用配置只会写入已保存的设置。确定继续吗？`,
        '提示',
        { type: 'warning' }
      )
    } catch {
      return
    }
  }

  isSubmitting.value = true
  try {
    const created = await applyDstWorld(dstID)
    taskStore.upsert(created, task.value?.id) // 重试时替换掉失败的任务
    task.value = created
  } catch {
    // 错误提示已由 request 统一处理（如 Agent 离线、存档正在执行其他操作）
  } finally {
    isSubmitting.value = false
  }
}

// 跟随应用任务的状态变化；成功后重新读取存档，以服务端的应用状态为准（不覆盖未保存的修改）
watch(
  () => taskStore.latest,
  async (latest) => {
    if (!latest || latest.id !== task.value?.id) return
    task.value = latest
    if (latest.status !== 'succeeded') return
    try {
      dst.value = await getDst(dstID)
    } catch {
      // 错误提示已由 request 统一处理
    }
    const tip = dst.value?.status === DST_STATUS_RUNNING ? '，重启存档后生效' : ''
    ElMessage.success(`世界设置已应用到服务器${tip}`)
  }
)

onBeforeRouteLeave(async () => {
  if (!SHARDS.some((s) => isDirty(s.name))) return true
  return ElMessageBox.confirm('世界设置有未保存的修改，确定离开吗？', '提示', { type: 'warning' })
    .then(() => true)
    .catch(() => false)
})

function isSameOverrides(a: Record<string, string>, b: Record<string, string>) {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}
</script>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%; /* 占满内容区，加载时 loading 显示在可视区域中间 */
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title,
.actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.actions .el-button {
  margin-left: 0;
}

.alert {
  margin-bottom: 12px;
}

/* tab 标题上的未保存标记 */
.dirty-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-left: 6px;
  vertical-align: top;
  background-color: var(--el-color-warning);
  border-radius: 50%;
}

.pane-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
