<template>
  <el-card>
    <template #header>资源使用率（最近 1 小时）</template>
    <el-empty
      v-if="!points.length && !server.metrics"
      :description="server.agentOnline ? '等待 Agent 上报，约 30 秒一次' : 'Agent 离线，暂无数据'"
      :image-size="80"
    />
    <template v-else>
      <div class="stats">
        <div v-for="stat in stats" :key="stat.label" class="stat">
          <el-text type="info" size="small">{{ stat.label }}</el-text>
          <span class="value">{{ stat.value }}</span>
        </div>
      </div>
      <el-row :gutter="16">
        <el-col :xs="24" :lg="8">
          <MetricsChart title="使用率" :series="usageSeries" :formatter="formatPercent" :max="100" />
        </el-col>
        <el-col :xs="24" :lg="8">
          <MetricsChart title="负载（1 分钟）" :series="loadSeries" :formatter="formatLoad" />
        </el-col>
        <el-col :xs="24" :lg="8">
          <MetricsChart title="网络" :series="netSeries" :formatter="formatRate" />
        </el-col>
      </el-row>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { getServerMetrics, type Server, type ServerMetrics } from '@/api/server'
import { useTaskStore } from '@/stores/task'
import { formatRate, formatUsage, toPercent } from '@/utils/format'
import { computed, onMounted, shallowRef, watch } from 'vue'
import MetricsChart, { type ChartSeries } from './MetricsChart.vue'

/** 与后端 cache.MetricsRetention 一致 */
const RETENTION_MS = 60 * 60 * 1000

const props = defineProps<{ server: Server }>()

const taskStore = useTaskStore()
/** 历史采样点，按时间升序；只整体替换，不做深层响应式 */
const points = shallowRef<ServerMetrics[]>([])

onMounted(async () => {
  const res = await getServerMetrics(props.server.id).catch(() => null)
  if (res) points.value = res.list
})

// 收到本服务器的新采样点时追加，并去掉超过 1 小时的点
watch(
  () => taskStore.metrics,
  (event) => {
    if (event?.serverID !== props.server.id) return
    const { serverID: _, ...metrics } = event
    const since = Date.now() - RETENTION_MS
    points.value = [...points.value.filter((p) => Date.parse(p.time) >= since), metrics]
  }
)

const formatPercent = (v: number) => `${v.toFixed(0)}%`
const formatLoad = (v: number) => v.toFixed(2)

const stats = computed(() => {
  const m = props.server.metrics
  const dash = '-'
  return [
    { label: 'CPU', value: m ? formatPercent(m.cpuPercent) : dash },
    { label: '内存', value: m ? formatUsage(m.ramUsed, props.server.ram) : dash },
    { label: '磁盘（游戏分区）', value: m ? formatUsage(m.diskUsed, props.server.disk) : dash },
    { label: '负载', value: m ? formatLoad(m.load1) : dash },
    { label: '网络', value: m ? `↓ ${formatRate(m.netRx)}  ↑ ${formatRate(m.netTx)}` : dash }
  ]
})

/** 把采样点转为图表数据，value 返回 null 的点跳过 */
function toSeries(name: string, value: (p: ServerMetrics) => number | null): ChartSeries {
  const data: [number, number][] = []
  for (const p of points.value) {
    const v = value(p)
    if (v !== null) data.push([Date.parse(p.time), v])
  }
  return { name, data }
}

const usageSeries = computed(() => [
  toSeries('CPU', (p) => p.cpuPercent),
  toSeries('内存', (p) => toPercent(p.ramUsed, props.server.ram)),
  toSeries('磁盘', (p) => toPercent(p.diskUsed, props.server.disk))
])
const loadSeries = computed(() => [toSeries('负载', (p) => p.load1)])
const netSeries = computed(() => [toSeries('下行', (p) => p.netRx), toSeries('上行', (p) => p.netTx)])
</script>

<style scoped>
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 40px;
  margin-bottom: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.value {
  font-size: 18px;
  white-space: pre;
}
</style>
