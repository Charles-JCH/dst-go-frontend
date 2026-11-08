<template>
  <el-switch :model-value="isDark" inline-prompt :active-icon="Moon" :inactive-icon="Sunny" @change="toggleDark()" />
</template>

<script setup lang="ts">
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>
