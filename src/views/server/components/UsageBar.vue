<template>
  <div>
    <div>{{ text }}</div>
    <el-progress
      v-if="percent !== null"
      :percentage="Math.round(percent)"
      :status="status"
      :stroke-width="4"
      :show-text="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** 用量文字 + 细进度条：超过 80% 橙色，超过 90% 红色；percent 为 null 时只显示文字 */
const props = defineProps<{ text: string; percent: number | null }>()

const status = computed(() => {
  if (props.percent === null) return undefined
  if (props.percent > 90) return 'exception'
  if (props.percent > 80) return 'warning'
  return undefined
})
</script>
