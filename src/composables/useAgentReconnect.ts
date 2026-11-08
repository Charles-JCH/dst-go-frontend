import { installAgent } from '@/api/server'
import { isTaskActive, TASK_TYPE_AGENT_INSTALL } from '@/api/task'
import { useTaskStore } from '@/stores/task'
import { ref } from 'vue'

/**
 * Agent 重新连接：平台不能反向连接 Agent，重新连接即重新安装 Agent（换新令牌、覆盖程序并重启服务）。
 * 有进行中的安装任务时视为"连接中"。
 */
export function useAgentReconnect() {
  const taskStore = useTaskStore()
  /** 正在提交重新连接请求的服务器，请求返回前防止连点 */
  const submittingIDs = ref(new Set<number>())

  function isConnecting(serverID: number) {
    return (
      submittingIDs.value.has(serverID) ||
      taskStore.tasks.some((t) => t.type === TASK_TYPE_AGENT_INSTALL && t.resourceID === serverID && isTaskActive(t))
    )
  }

  async function reconnect(serverID: number) {
    if (isConnecting(serverID)) return
    submittingIDs.value.add(serverID)
    try {
      taskStore.upsert(await installAgent(serverID))
      ElMessage.success('已开始重新连接，可在任务中查看进度')
    } catch {
      // 错误提示已由 request 统一处理（如已有安装任务在进行中）
    } finally {
      submittingIDs.value.delete(serverID)
    }
  }

  return { isConnecting, reconnect }
}
