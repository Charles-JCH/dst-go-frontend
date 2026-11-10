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
  createdAt: string
  updatedAt: string
}

/** serverID 不传时查询所有服务器的存档 */
export interface ListDstParams extends PageParams {
  serverID?: number
}

export const getDstList = (params: ListDstParams) => http.get<PageResult<Dst>>('/dst', params)

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

export const updateDst = (id: number, data: UpdateDstParams) => http.put<void>(`/dst/${id}`, data)
