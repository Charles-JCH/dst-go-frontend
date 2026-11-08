<template>
  <el-card>
    <div v-if="$slots.toolbar" class="toolbar">
      <slot name="toolbar" />
    </div>
    <el-table v-loading="isLoading" :data="data">
      <slot />
    </el-table>
    <el-pagination
      v-if="total > 0"
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      background
      class="pagination"
      @change="emit('change')"
    />
  </el-card>
</template>

<script setup lang="ts">
defineProps<{ data: object[]; total: number; isLoading?: boolean }>()

// 页码或每页数量变化时触发，父组件在此重新加载数据
const emit = defineEmits<{ change: [] }>()

const page = defineModel<number>('page', { required: true })
const pageSize = defineModel<number>('pageSize', { required: true })
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.pagination {
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
