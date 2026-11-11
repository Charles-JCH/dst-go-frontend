<template>
  <div class="toolbar">
    <span class="changed-count">已修改 {{ changedCount }} 项（相对默认值）</span>
    <el-button link type="primary" @click="handleExpandAll">全部展开</el-button>
    <el-button link type="primary" :disabled="!activeNames.length" @click="activeNames = []">全部收起</el-button>
    <el-button link type="primary" :disabled="!changedCount || disabled" @click="handleReset">全部恢复默认</el-button>
  </div>
  <el-form :disabled="disabled">
    <section v-for="category in categories" :key="category.name">
      <h3 class="category">
        {{ category.label }}<span class="category-tip">{{ category.tip }}</span>
      </h3>
      <el-collapse v-model="activeNames">
        <el-collapse-item v-for="group in category.groups" :key="group.key" :name="group.key">
          <template #title>
            <span class="group">{{ group.label }}</span>
            <span class="group-count">{{ group.options.length }} 项</span>
            <el-tag v-if="changedOf(group.options)" type="warning" size="small" class="group-changed">
              已修改 {{ changedOf(group.options) }}
            </el-tag>
          </template>
          <!-- el-collapse-item 用 v-show，内容会全部渲染；分组第一次展开时才渲染，之后收起只是隐藏 -->
          <div v-if="renderedNames.has(group.key)" class="grid">
            <el-form-item
              v-for="option in group.options"
              :key="option.name"
              :class="{ changed: values[option.name] !== option.default }"
            >
              <!-- 图标由 scripts/gen_world_options.js 从游戏图集切出，文件名为设置项名称 -->
              <img :src="`${ICON_BASE}${option.name}.webp`" alt="" loading="lazy" class="icon" />
              <span class="label" :title="option.label">{{ option.label }}</span>
              <el-select v-model="values[option.name]" class="select">
                <el-option
                  v-for="item in option.options"
                  :key="item.value"
                  :label="item.value === option.default ? `${item.label}（默认）` : item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
        </el-collapse-item>
      </el-collapse>
    </section>
  </el-form>
</template>

<script setup lang="ts">
import type { WorldOption } from '@/api/dst'
import { computed, ref, shallowReactive, watch } from 'vue'

const props = defineProps<{ options: WorldOption[]; disabled?: boolean }>()
/** 设置项 → 当前值，包含全部设置项 */
const values = defineModel<Record<string, string>>({ required: true })

const ICON_BASE = `${import.meta.env.BASE_URL}world-icons/`

const CATEGORIES = [
  { name: 'worldgen', label: '世界生成', tip: '仅生成新世界时生效，已有世界需重新生成' },
  { name: 'settings', label: '世界选项', tip: '重启存档后生效' }
] as const

/** 按类别、分组整理，保持游戏中的顺序；目录固定，只在加载时计算一次。不同类别下可能有同名分组，key 带上类别 */
const categories = computed(() =>
  CATEGORIES.map((category) => {
    const groups: { key: string; label: string; options: WorldOption[] }[] = []
    for (const option of props.options) {
      if (option.category !== category.name) continue
      const key = `${category.name}.${option.group}`
      let group = groups.find((g) => g.key === key)
      if (!group) {
        group = { key, label: option.groupLabel, options: [] }
        groups.push(group)
      }
      group.options.push(option)
    }
    return { ...category, groups }
  }).filter((category) => category.groups.length)
)

/** 展开中的分组；默认全部收起 */
const activeNames = ref<string[]>([])
/** 展开过的分组，只增不减 */
const renderedNames = shallowReactive(new Set<string>())

watch(activeNames, (names) => names.forEach((name) => renderedNames.add(name)))

function handleExpandAll() {
  activeNames.value = categories.value.flatMap((c) => c.groups.map((g) => g.key))
}

const changedOf = (options: WorldOption[]) => options.filter((o) => values.value[o.name] !== o.default).length
const changedCount = computed(() => changedOf(props.options))

function handleReset() {
  values.value = Object.fromEntries(props.options.map((o) => [o.name, o.default]))
}
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.toolbar .el-button {
  margin-left: 0;
}

.changed-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.category {
  margin: 16px 0 8px;
  font-size: 16px;
}

.category-tip {
  margin-left: 12px;
  font-size: 13px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}

.group {
  font-weight: 600;
}

.group-count {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.group-changed {
  margin-left: 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  column-gap: 16px;
  padding-top: 8px;
}

.icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.label {
  width: 128px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/*
 * 固定宽度，不随内容区伸缩：el-select 内部用 ResizeObserver 监听自身尺寸，
 * 宽度一变就重算样式并重新定位弹层，内容区宽度变化时（如调整窗口大小）
 * 上百个下拉框跟着伸缩会很卡；固定宽度后只剩网格重排
 */
.select {
  flex-shrink: 0;
  width: 180px;
}

.el-form-item :deep(.el-form-item__content) {
  flex-wrap: nowrap;
}

/* 与默认值不同的项高亮名称 */
.changed .label {
  font-weight: 600;
  color: var(--el-color-warning);
}
</style>
