<template>
  <div ref="screen" v-loading="isLoading" class="terminal" :style="{ height }" @scroll="handleScroll">
    <div v-if="!isLoading && !logs.length" class="empty">暂无日志</div>
    <div v-for="log in logs" :key="log.id" :class="['line', levelClass(log.content)]">
      <span class="time">{{ formatTime(log.createdAt) }}</span>
      <span>{{ log.content }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTaskLogs, type TaskLog } from '@/api/task'
import { useTaskStore } from '@/stores/task'
import { nextTick, ref, useTemplateRef, watch } from 'vue'

/** 与后端 ListTaskLogReq 的默认 limit 一致，返回条数等于它说明还有下一批 */
const BATCH_SIZE = 500
/** 距离底部小于这个距离视为在底部，新日志到达时自动滚动 */
const BOTTOM_THRESHOLD = 24

/** 黑底终端样式的任务日志：先分批加载历史日志，再实时追加 */
const props = withDefaults(defineProps<{ taskID?: number; height?: string }>(), { height: '360px' })

const taskStore = useTaskStore()
const screen = useTemplateRef<HTMLDivElement>('screen')
const logs = ref<TaskLog[]>([])
const isLoading = ref(false)
/** 用户往上翻看时暂停自动滚动，回到底部后恢复 */
let isFollowing = true

async function load(id: number) {
  logs.value = []
  isFollowing = true
  isLoading.value = true
  try {
    let batch: TaskLog[]
    let afterID = 0
    do {
      batch = await getTaskLogs(id, afterID)
      append(batch)
      afterID = batch.at(-1)?.id ?? afterID
    } while (batch.length === BATCH_SIZE && props.taskID === id)
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
  if (!added.length) return
  logs.value = [...logs.value, ...added].sort((a, b) => a.id - b.id)
  if (isFollowing) nextTick(() => screen.value?.scrollTo({ top: screen.value.scrollHeight }))
}

function handleScroll() {
  const el = screen.value
  if (el) isFollowing = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD
}

/** dst 脚本的日志带 [ERROR]、[WARN] 级别，按级别上色 */
function levelClass(content: string) {
  if (content.includes('[ERROR]')) return 'error'
  if (content.includes('[WARN]')) return 'warn'
  return ''
}

const formatTime = (value: string) => new Date(value).toLocaleTimeString('zh-CN', { hour12: false })

watch(
  () => props.taskID,
  (id) => {
    if (id) load(id)
    else logs.value = []
  },
  { immediate: true }
)

// 实时追加当前任务的新日志
watch(
  () => taskStore.latestLog,
  (log) => {
    if (log && log.taskID === props.taskID) append([log])
  }
)
</script>

<style scoped>
.terminal {
  overflow-y: auto;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: var(--el-font-family-mono, Consolas, monospace);
  font-size: 13px;
  line-height: 1.6;
}

.line {
  display: flex;
  gap: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.time {
  flex-shrink: 0;
  color: #6a9955;
}

.warn {
  color: #dcdcaa;
}

.error {
  color: #f48771;
}

.empty {
  color: #808080;
}
</style>
