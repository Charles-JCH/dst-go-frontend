import type { Task } from '@/api/task'
import type { PageParams, PageResult } from '@/types/api'
import { http } from '@/utils/request'

/** 存档运行状态，与后端 Dst.Status 对应 */
export const DST_STATUS_STOPPED = 0
export const DST_STATUS_RUNNING = 1

/** 与后端 DstResp 对应；createdAt、updatedAt 为 ISO 时间字符串 */
export interface Dst {
  id: number
  serverID: number
  slot: number
  name: string
  description: string
  maxPlayers: number
  /** 是否设置了房间密码，密码本身不返回 */
  hasPassword: boolean
  status: number
  mods: string[]
  /** 与默认值不同的地面世界设置，未出现的项取 WorldOption.default */
  masterOverrides: Record<string, string>
  /** 与默认值不同的洞穴世界设置 */
  cavesOverrides: Record<string, string>
  /** 世界设置已保存但还未应用到服务器 */
  isWorldPending: boolean
  createdAt: string
  updatedAt: string
}

/** serverID 不传时查询所有服务器的存档 */
export interface ListDstParams extends PageParams {
  serverID?: number
}

export const getDstList = (params: ListDstParams) => http.get<PageResult<Dst>>('/dst', params)

export const getDst = (id: number) => http.get<Dst>(`/dst/${id}`)

/** 与后端 WorldOptionResp 对应；category 为 worldgen（仅生成新世界时生效）或 settings（重启存档后生效） */
export interface WorldOption {
  name: string
  label: string
  category: 'worldgen' | 'settings'
  group: string
  groupLabel: string
  default: string
  options: { value: string; label: string }[]
}

/** 与后端 WorldOptionsResp 对应：地面和洞穴可修改的世界设置，按游戏中的分组和顺序排列 */
export interface WorldOptions {
  master: WorldOption[]
  caves: WorldOption[]
}

export const getWorldOptions = () => http.get<WorldOptions>('/dst/world-options')

/** 世界设置分片：地面、洞穴 */
export type WorldShard = 'master' | 'caves'

/** overrides 只传与默认值不同的项 */
export interface SaveDstWorldParams {
  shard: WorldShard
  overrides: Record<string, string>
}

/** 保存地面或洞穴的世界设置，只存平台不写服务器，返回存档（isWorldPending 变为 true） */
export const saveDstWorld = (id: number, data: SaveDstWorldParams) => http.put<Dst>(`/dst/${id}/world`, data)

/** 应用配置：把已保存的地面和洞穴设置写入服务器，返回写入任务；成功后 isWorldPending 变为 false */
export const applyDstWorld = (id: number) => http.post<Task>(`/dst/${id}/world/apply`)

/** 新增存档第一步：初始化会清空该槽位在服务器上的目录，再拉取默认存档 */
export interface InitDstParams {
  serverID: number
  slot: number
  clusterToken: string
}

/** 存档信息，写入服务器上的 cluster.ini 和模组配置 */
export interface DstInfo {
  name: string
  description: string
  maxPlayers: number
  /** 创意工坊模组 ID */
  mods: string[]
}

/** 新增存档第二步：服务器、槽位和令牌取自初始化任务；password 为空表示不设密码 */
export type CreateDstParams = DstInfo & { initTaskID: number; password: string }

/** 服务器和槽位创建后不可修改；password、clusterToken 不传表示不修改，password 传空串表示取消密码 */
export type UpdateDstParams = DstInfo & { password?: string; clusterToken?: string }

/** 返回初始化任务，进度和日志通过任务查看 */
export const initDst = (data: InitDstParams) => http.post<Task>('/dst/init', data)

/** 返回创建任务：配置写入服务器成功后存档才保存 */
export const createDst = (data: CreateDstParams) => http.post<Task>('/dst', data)

/** 返回配置写入任务：写入服务器成功后存档才更新 */
export const updateDst = (id: number, data: UpdateDstParams) => http.put<Task>(`/dst/${id}`, data)

/** 返回启动任务，成功后存档变为运行中；启动需要等待世界生成，通常 1～3 分钟 */
export const startDst = (id: number) => http.post<Task>(`/dst/${id}/start`)

/** 返回停止任务，成功后存档变为已停止 */
export const stopDst = (id: number) => http.post<Task>(`/dst/${id}/stop`)

/** 返回查看状态任务，成功后存档状态按服务器上的实际情况更新 */
export const checkDstStatus = (id: number) => http.post<Task>(`/dst/${id}/status`)

/**
 * 删除存档：返回删除任务，服务器上的存档清理成功后记录才删除；
 * isRecordOnly 为 true 时只删除平台记录（Agent 离线时使用），返回 null
 */
export const deleteDst = (id: number, isRecordOnly = false) =>
  http.delete<Task | null>(`/dst/${id}`, { recordOnly: isRecordOnly })
