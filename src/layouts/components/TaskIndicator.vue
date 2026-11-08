<template>
  <el-popover placement="bottom-end" :width="360" trigger="click">
    <template #reference>
      <el-badge :value="taskStore.activeCount" :hidden="!taskStore.activeCount">
        <el-button link :icon="List">后台任务</el-button>
      </el-badge>
    </template>

    <el-empty v-if="!taskStore.tasks.length" description="暂无后台任务" :image-size="60" />
    <div v-for="task in taskStore.tasks" :key="task.id" class="task">
      <div class="title">
        <span>{{ task.name }}</span>
        <el-tag :type="TASK_STATUS_MAP[task.status].type" size="small">{{ TASK_STATUS_MAP[task.status].label }}</el-tag>
      </div>
      <el-text v-if="task.status === 'running'" size="small" type="info">{{ TASK_STAGE_MAP[task.stage] }}</el-text>
      <el-text v-if="task.status === 'failed'" size="small" type="danger">{{ task.errorMessage }}</el-text>
      <div>
        <el-button link type="primary" size="small" @click="handleOpenLogs(task)">日志</el-button>
        <el-button
          v-if="task.status === 'failed' && task.type === TASK_TYPE_AGENT_INSTALL"
          link
          type="primary"
          size="small"
          :loading="retrying === task.id"
          @click="handleRetry(task)"
        >
          重试
        </el-button>
      </div>
    </div>
  </el-popover>

  <TaskLogDialog v-model="isLogVisible" :task="logTask" />
</template>

<script setup lang="ts">
import { installAgent } from '@/api/server'
import { TASK_TYPE_AGENT_INSTALL, TASK_STAGE_MAP, TASK_STATUS_MAP, type Task } from '@/api/task'
import TaskLogDialog from '@/components/TaskLogDialog.vue'
import { useTaskStore } from '@/stores/task'
import { List } from '@element-plus/icons-vue'
import { ref } from 'vue'

const taskStore = useTaskStore()
const retrying = ref<number>()
const isLogVisible = ref(false)
const logTask = ref<Task>()

function handleOpenLogs(task: Task) {
  logTask.value = task
  isLogVisible.value = true
}

async function handleRetry(task: Task) {
  retrying.value = task.id
  try {
    taskStore.upsert(await installAgent(task.resourceID), task.id)
  } catch {
    // 错误提示已由 request 统一处理
  } finally {
    retrying.value = undefined
  }
}
</script>

<style scoped>
.task {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.task:last-child {
  border-bottom: none;
}

.title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
