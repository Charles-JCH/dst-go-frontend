<template>
  <!-- 新建和编辑共用的存档信息表单项，放在父组件的 el-form 中，校验规则由父组件提供 -->
  <el-form-item label="名称" prop="name">
    <el-input v-model="info.name" maxlength="64" placeholder="大厅中显示的房间名" />
  </el-form-item>
  <el-form-item label="描述" prop="description">
    <el-input v-model="info.description" maxlength="255" show-word-limit />
  </el-form-item>
  <el-form-item label="最大人数" prop="maxPlayers">
    <el-input-number v-model="info.maxPlayers" :min="1" :max="64" controls-position="right" />
  </el-form-item>
  <el-form-item label="模组" prop="mods">
    <el-select
      v-model="info.mods"
      multiple
      filterable
      allow-create
      default-first-option
      :reserve-keyword="false"
      placeholder="输入创意工坊模组 ID 后回车"
    />
  </el-form-item>
</template>

<script setup lang="ts">
import type { DstInfo } from '@/api/dst'

const info = defineModel<DstInfo>({ required: true })
</script>
