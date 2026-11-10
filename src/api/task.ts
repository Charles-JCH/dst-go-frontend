import type { PageParams, PageResult } from '@/types/api'
import { http } from '@/utils/request'

export type TaskStatus = 'pending' | 'running' | 'succeeded' | 'failed'

export type TaskStage = 'queued' | 'connecting' | 'uploading' | 'installing' | 'waiting_online' | 'executing'

/** 任务类型，与后端 entity.TaskType 一致 */
export const TASK_TYPE_AGENT_INSTALL = 'agent_install'
export const TASK_TYPE_GAME_DEPLOY = 'game_deploy'
export const TASK_TYPE_DST_INIT = 'dst_init'
export const TASK_TYPE_DST_CREATE = 'dst_create'
export const TASK_TYPE_DST_START = 'dst_start'
export const TASK_TYPE_DST_STOP = 'dst_stop'
export const TASK_TYPE_DST_STATUS = 'dst_status'
export const TASK_TYPE_DST_DELETE = 'dst_delete'

/** 与后端 TaskResp 对应 */
export interface Task {
  id: number
  name: string
  type: string
  status: TaskStatus
  stage: TaskStage
  resourceType: string
  resourceID: number
  errorMessage: string
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type TaskListParams = PageParams & {
  type?: string
  status?: TaskStatus
  resourceType?: string
  resourceID?: number
}

/** 任务状态的显示文字和标签颜色 */
export const TASK_STATUS_MAP: Record<TaskStatus, { label: string; type: 'info' | 'primary' | 'success' | 'danger' }> = {
  pending: { label: '待执行', type: 'info' },
  running: { label: '执行中', type: 'primary' },
  succeeded: { label: '成功', type: 'success' },
  failed: { label: '失败', type: 'danger' }
}

/** 任务执行步骤的显示文字 */
export const TASK_STAGE_MAP: Record<TaskStage, string> = {
  queued: '排队中',
  connecting: '连接服务器',
  uploading: '上传文件',
  installing: '安装服务',
  waiting_online: '等待上线',
  executing: '执行中'
}

/** 与后端 TaskLogResp 对应 */
export interface TaskLog {
  id: number
  taskID: number
  content: string
  createdAt: string
}

/** 进行中的任务：待执行或执行中 */
export const isTaskActive = (task: Task) => task.status === 'pending' || task.status === 'running'

export const getTaskList = (params: TaskListParams) => http.get<PageResult<Task>>('/tasks', params)

/** 查询待执行和执行中的任务 */
export const getActiveTasks = () => http.get<Task[]>('/tasks/active')

/** 分批查询任务日志，afterID 为上一批最后一条日志的 id */
export const getTaskLogs = (id: number, afterID = 0) => http.get<TaskLog[]>(`/tasks/${id}/logs`, { afterID })
