import { getWSTicket } from '@/api/auth'
import { getActiveTasks, isTaskActive, type Task, type TaskLog } from '@/api/task'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

/** 与后端 AgentStatusResp 对应 */
export interface AgentStatus {
  serverID: number
  online: boolean
}

/** 与后端 realtime.Event 对应 */
type RealtimeEvent =
  | { type: 'task'; data: Task }
  | { type: 'task_log'; data: TaskLog }
  | { type: 'agent_status'; data: AgentStatus }

const RECONNECT_DELAY = 3000
/** 后台任务列表最多保留的条数（进行中 + 本次打开页面后结束的） */
const MAX_TASKS = 20

/** 浏览器 WebSocket 地址，与接口同源，由 Vite / Nginx 转发到后端 */
function wsURL() {
  const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/ws`, location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

/** 后台任务：进入主页面时连接，实时接收任务状态变化 */
export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  /** 最近一次变化的任务，页面可以 watch 它来刷新自己的数据 */
  const latest = shallowRef<Task>()
  /** 最近一条任务日志，日志弹窗 watch 它追加新日志 */
  const latestLog = shallowRef<TaskLog>()
  /** 最近一次 Agent 上线或下线，服务器页面 watch 它更新在线状态 */
  const agentStatus = shallowRef<AgentStatus>()
  const activeCount = computed(() => tasks.value.filter(isTaskActive).length)

  let socket: WebSocket | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let isStopped = true

  /** 新增或更新任务；replaceID 为重试前的失败任务，重试后从列表移除 */
  function upsert(task: Task, replaceID?: number) {
    if (replaceID) tasks.value = tasks.value.filter((t) => t.id !== replaceID)
    const index = tasks.value.findIndex((t) => t.id === task.id)
    if (index >= 0) tasks.value[index] = task
    else tasks.value = [task, ...tasks.value].slice(0, MAX_TASKS)
    latest.value = task
  }

  /** 重新拉取进行中的任务，断线期间的变化以接口为准 */
  async function refresh() {
    const active = await getActiveTasks().catch(() => null)
    if (!active) return
    const finished = tasks.value.filter((t) => !isTaskActive(t) && !active.some((a) => a.id === t.id))
    tasks.value = [...active, ...finished].slice(0, MAX_TASKS)
  }

  async function open() {
    const res = await getWSTicket().catch(() => null)
    if (isStopped) return
    if (!res) return scheduleReconnect()

    const ws = new WebSocket(wsURL())
    socket = ws
    // ticket 不放在 URL 里，连接后作为第一条消息发送
    ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', ticket: res.ticket }))
    ws.onmessage = (e: MessageEvent<string>) => {
      const event = JSON.parse(e.data) as RealtimeEvent
      if (event.type === 'task') upsert(event.data)
      else if (event.type === 'task_log') latestLog.value = event.data
      else if (event.type === 'agent_status') agentStatus.value = event.data
    }
    ws.onclose = () => {
      if (socket === ws) socket = undefined
      scheduleReconnect()
    }
  }

  function scheduleReconnect() {
    if (isStopped) return
    clearTimeout(timer)
    timer = setTimeout(() => {
      refresh()
      open()
    }, RECONNECT_DELAY)
  }

  function connect() {
    if (!isStopped) return
    isStopped = false
    refresh()
    open()
  }

  function disconnect() {
    isStopped = true
    clearTimeout(timer)
    socket?.close()
    socket = undefined
    tasks.value = []
  }

  return { tasks, latest, latestLog, agentStatus, activeCount, upsert, connect, disconnect }
})
