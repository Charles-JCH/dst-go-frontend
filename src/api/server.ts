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
  /** 系统架构，如 amd64、arm64 */
  arch: string
  gameEnv: GameEnv[]
  mods: string[]
  /** Agent 是否已连接平台 */
  agentOnline: boolean
  /** 最近一次资源使用情况，Agent 离线或没有数据时为 null */
  metrics: ServerMetrics | null
  createdAt: string
  updatedAt: string
}

/** 与后端 MetricsResp 对应：Agent 随心跳上报的资源使用情况；ramUsed、diskUsed 单位为字节，netRx、netTx 单位为字节/秒 */
export interface ServerMetrics {
  time: string
  cpuPercent: number
  ramUsed: number
  diskUsed: number
  load1: number
  netRx: number
  netTx: number
}

export interface CreateServerParams {
  name: string
  ip: string
  port: number
  username: string
  password: string
}

/** 添加后只能修改名称和 SSH 密码；password 不传表示不修改 */
export type UpdateServerParams = Pick<CreateServerParams, 'name'> & { password?: string }

export const getServerList = (params: PageParams) => http.get<PageResult<Server>>('/server', params)

export const getServer = (id: number) => http.get<Server>(`/server/${id}`)

/** 创建成功后后端会自动创建 Agent 安装任务 */
export const createServer = (data: CreateServerParams) => http.post<Server>('/server', data)

export const updateServer = (id: number, data: UpdateServerParams) => http.put<void>(`/server/${id}`, data)

export const deleteServer = (id: number) => http.delete<void>(`/server/${id}`)

/** 重新安装 Agent（安装失败后重试），返回新建的安装任务 */
export const installAgent = (id: number) => http.post<Task>(`/server/${id}/agent/install`)

/** 最近 24 小时的资源使用情况，按时间升序 */
export const getServerMetrics = (id: number) => http.get<{ list: ServerMetrics[] }>(`/server/${id}/metrics`)

/** 部署游戏环境，返回部署任务；进度和日志通过任务查看 */
export const deployGame = (id: number, gameCode: string) => http.post<Task>(`/server/${id}/deploy`, { gameCode })
