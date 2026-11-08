import type { Task } from '@/api/task'
import type { PageParams, PageResult } from '@/types/api'
import { http } from '@/utils/request'

/** 与后端 GameEnvResp 对应 */
export interface GameEnv {
  code: string
  name: string
}

/** 与后端 ServerResp 对应；ram、disk 单位为字节，createdAt、updatedAt 为 ISO 时间字符串 */
export interface Server {
  id: number
  name: string
  ip: string
  port: number
  username: string
  cpu: number
  ram: number
  disk: number
  osName: string
  gameEnv: GameEnv[]
  mods: string[]
  /** Agent 是否已连接平台 */
  agentOnline: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateServerParams {
  name: string
  ip: string
  port: number
  username: string
  password: string
}

/** 更新时 password 不填表示不修改密码 */
export type UpdateServerParams = Omit<CreateServerParams, 'password'> & { password?: string }

export const getServerList = (params: PageParams) => http.get<PageResult<Server>>('/server', params)

export const getServer = (id: number) => http.get<Server>(`/server/${id}`)

/** 创建成功后后端会自动创建 Agent 安装任务 */
export const createServer = (data: CreateServerParams) => http.post<Server>('/server', data)

export const updateServer = (id: number, data: UpdateServerParams) => http.put<void>(`/server/${id}`, data)

export const deleteServer = (id: number) => http.delete<void>(`/server/${id}`)

/** 重新安装 Agent（安装失败后重试），返回新建的安装任务 */
export const installAgent = (id: number) => http.post<Task>(`/server/${id}/agent/install`)
