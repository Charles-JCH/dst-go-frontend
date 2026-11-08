import type { GameEnv } from '@/api/server'
import { http } from '@/utils/request'

/** 可部署的游戏环境 */
export const getGameEnvList = () => http.get<GameEnv[]>('/game-env')
