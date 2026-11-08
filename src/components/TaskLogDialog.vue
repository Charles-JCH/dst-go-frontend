<template>
  <el-dialog v-model="isVisible" :title="`${task?.name ?? ''} - 执行日志`" width="760px" append-to-body>
    <TaskTerminal v-if="isVisible" :taskID="task?.id" />
  </el-dialog>
</template>

<script setup lang="ts">
import type { Task } from '@/api/task'
import TaskTerminal from '@/components/TaskTerminal.vue'

const isVisible = defineModel<boolean>({ required: true })
defineProps<{ task?: Task }>()
</script>
