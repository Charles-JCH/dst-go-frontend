import { installAgent, type Server } from '@/api/server'
import { isTaskActive, TASK_TYPE_AGENT_INSTALL } from '@/api/task'
import { useTaskStore } from '@/stores/task'
import { ref } from 'vue'

/**
 * 重新安装 Agent（换新令牌、覆盖程序并重启服务）：
 * 离线时即"重新连接"（平台不能反向连接 Agent），在线时即"更新 Agent"到平台当前版本。
 */
export function useAgentInstall() {
  const taskStore = useTaskStore()
  /** 正在提交请求的服务器，请求返回前防止连点 */
  const submittingIDs = ref(new Set<number>())

  /** 有进行中的安装任务，或请求还没返回 */
  function isInstalling(serverID: number) {
    return (
      submittingIDs.value.has(serverID) ||
      taskStore.tasks.some((t) => t.type === TASK_TYPE_AGENT_INSTALL && t.resourceID === serverID && isTaskActive(t))
    )
  }

  async function install(server: Pick<Server, 'id' | 'name' | 'agentOnline'>) {
    if (isInstalling(server.id)) return
    try {
      if (server.agentOnline) {
        await ElMessageBox.confirm(
          `确定更新服务器「${server.name}」的 Agent 吗？更新期间 Agent 会短暂离线，已运行的游戏不受影响。`,
          '更新确认',
          { type: 'warning' }
        )
      }
    } catch {
      return // 取消
    }

    submittingIDs.value.add(server.id)
    try {
      taskStore.upsert(await installAgent(server.id))
      ElMessage.success(`已开始${server.agentOnline ? '更新' : '重新连接'}，可在后台任务中查看进度`)
    } catch {
      // 错误提示已由 request 统一处理（如已有安装任务在进行中、Agent 正在执行命令）
    } finally {
      submittingIDs.value.delete(server.id)
    }
  }

  return { isInstalling, install }
}
