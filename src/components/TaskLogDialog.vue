<template>
  <el-dialog
    v-model="isVisible"
    :title="`${task?.name ?? ''} - 执行日志`"
    width="640px"
    append-to-body
    @open="handleOpen"
  >
    <el-scrollbar v-loading="isLoading" height="360px">
      <el-empty v-if="!isLoading && !logs.length" description="暂无日志" :image-size="60" />
      <div v-for="log in logs" :key="log.id" class="line">
        <el-text type="info" size="small">{{ formatDateTime(log.createdAt) }}</el-text>
        <span>{{ log.content }}</span>
      </div>
    </el-scrollbar>
  </el-dialog>
</template>

<script setup lang="ts">
import { getTaskLogs, type Task, type TaskLog } from '@/api/task'
import { useTaskStore } from '@/stores/task'
import { formatDateTime } from '@/utils/format'
import { ref, watch } from 'vue'

/** 与后端 ListTaskLogReq 的默认 limit 一致，返回条数等于它说明还有下一批 */
const BATCH_SIZE = 500

const isVisible = defineModel<boolean>({ required: true })
const props = defineProps<{ task?: Task }>()

const taskStore = useTaskStore()
const logs = ref<TaskLog[]>([])
const isLoading = ref(false)

async function handleOpen() {
  const id = props.task?.id
  if (!id) return
  logs.value = []
  isLoading.value = true
  try {
    let batch: TaskLog[]
    let afterID = 0
    do {
      batch = await getTaskLogs(id, afterID)
      append(batch)
      afterID = batch.at(-1)?.id ?? afterID
    } while (batch.length === BATCH_SIZE && props.task?.id === id)
  } catch {
    // 错误提示已由 request 统一处理
  } finally {
    isLoading.value = false
  }
}

/** 按 id 去重合并：加载期间推送过来的日志可能与接口返回的重复或先于它到达 */
function append(items: TaskLog[]) {
  const ids = new Set(logs.value.map((l) => l.id))
  const added = items.filter((l) => !ids.has(l.id))
  if (added.length) logs.value = [...logs.value, ...added].sort((a, b) => a.id - b.id)
}

// 弹窗打开时实时追加正在执行的任务的新日志
watch(
  () => taskStore.latestLog,
  (log) => {
    if (isVisible.value && log && log.taskID === props.task?.id) append([log])
  }
)
</script>

<style scoped>
.line {
  display: flex;
  gap: 12px;
  padding: 2px 0;
  font-family: var(--el-font-family-mono, monospace);
  white-space: pre-wrap;
  word-break: break-all;
}

.line .el-text {
  flex-shrink: 0;
}
</style>
