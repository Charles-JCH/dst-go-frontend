import type { PageParams, PageResult } from '@/types/api'
import { onMounted, reactive, ref, type Ref } from 'vue'

/** 分页列表的通用状态与加载逻辑，配合 PageTable 组件使用，挂载时自动加载第一页 */
export function usePageList<T>(fetchList: (params: PageParams) => Promise<PageResult<T>>) {
  const list = ref([]) as Ref<T[]>
  const total = ref(0)
  const isLoading = ref(false)
  const query = reactive<PageParams>({ page: 1, pageSize: 20 })

  let seq = 0 // 快速翻页时，丢弃过期请求的返回结果

  async function load() {
    const current = ++seq
    isLoading.value = true
    try {
      const res = await fetchList({ ...query })
      if (current !== seq) return
      list.value = res.list
      total.value = res.total
    } catch {
      // 错误提示已由 request 统一处理
    } finally {
      if (current === seq) isLoading.value = false
    }
  }

  onMounted(load)

  return { list, total, isLoading, query, load }
}
