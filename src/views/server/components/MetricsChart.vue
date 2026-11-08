<template>
  <div ref="container" class="chart" />
</template>

<script setup lang="ts">
import { useDark, useResizeObserver } from '@vueuse/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { init, use, type ECharts } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'

use([LineChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent, CanvasRenderer])

export interface ChartSeries {
  name: string
  /** [时间戳(毫秒), 数值] */
  data: [number, number][]
}

/** 资源使用情况折线图；formatter 格式化纵轴和提示框里的数值 */
const props = defineProps<{
  title: string
  series: ChartSeries[]
  formatter: (value: number) => string
  max?: number
}>()

const container = useTemplateRef<HTMLDivElement>('container')
const isDark = useDark()
let chart: ECharts | undefined

function render() {
  chart?.setOption({
    series: props.series.map((s) => ({ name: s.name, data: s.data }))
  })
}

/** 明暗切换时 ECharts 需要重新创建实例才能换主题 */
function create() {
  chart?.dispose()
  if (!container.value) return
  chart = init(container.value, isDark.value ? 'dark' : undefined)
  chart.setOption({
    backgroundColor: 'transparent',
    title: { text: props.title, textStyle: { fontSize: 14 } },
    legend: { top: 0, right: 0 },
    grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', valueFormatter: (v: unknown) => props.formatter(Number(v)) },
    xAxis: { type: 'time' },
    yAxis: { type: 'value', min: 0, max: props.max, axisLabel: { formatter: props.formatter } },
    series: props.series.map((s) => ({
      name: s.name,
      type: 'line',
      showSymbol: false,
      sampling: 'lttb',
      data: s.data
    }))
  })
}

onMounted(create)
watch(isDark, create)
watch(() => props.series, render)
useResizeObserver(container, () => chart?.resize())
onBeforeUnmount(() => {
  chart?.dispose()
  chart = undefined
})
</script>

<style scoped>
.chart {
  height: 240px;
}
</style>
