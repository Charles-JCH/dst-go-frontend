import type { RefreshTokenResult } from '@/api/auth'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import type { ApiResponse } from '@/types/api'
import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'

/** 业务成功的 code，与后端统一响应一致 */
const SUCCESS_CODE = 200
const TOKEN_HEADER = 'Authorization'
const TOKEN_PREFIX = 'Bearer '

const BASE_URL = import.meta.env.VITE_API_BASE_URL

const service = axios.create({ baseURL: BASE_URL, timeout: 15000 })

// 刷新凭证由后端写入 HttpOnly Cookie 且一次性有效，多个请求同时过期时必须共用同一次刷新
let refreshing: Promise<string> | null = null

function refreshAccessToken() {
  refreshing ??= axios
    .post<ApiResponse<RefreshTokenResult>>('/auth/refresh', null, { baseURL: BASE_URL, timeout: 15000 })
    .then((res) => res.data.data.accessToken)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

service.interceptors.request.use((config) => {
  const { accessToken } = useUserStore()
  if (accessToken) config.headers.set(TOKEN_HEADER, TOKEN_PREFIX + accessToken)
  return config
})

type RetryConfig = InternalAxiosRequestConfig & { isRetried?: boolean }

service.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse
    if (body.code !== SUCCESS_CODE) {
      ElMessage.error(body.msg || '请求失败')
      return Promise.reject(body)
    }
    return response
  },
  async (error: AxiosError<ApiResponse>) => {
    const userStore = useUserStore()
    const config = error.config as RetryConfig | undefined

    // 已登录状态下的 401：用刷新凭证换新的 accessToken，成功后重发原请求（只重试一次）
    if (error.response?.status === 401 && userStore.accessToken && config && !config.isRetried) {
      try {
        userStore.setAccessToken(await refreshAccessToken())
      } catch {
        userStore.logout()
        router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
        ElMessage.error({ message: '登录已过期，请重新登录', grouping: true })
        return Promise.reject(error)
      }
      config.isRetried = true
      return service(config)
    }

    ElMessage.error(error.response?.data?.msg || error.message || '网络异常')
    return Promise.reject(error)
  }
)

function request<T>(config: AxiosRequestConfig): Promise<T> {
  return service.request<ApiResponse<T>>(config).then((res) => res.data.data)
}

/** 业务接口统一通过 http.xxx 调用，返回值已剥离统一响应体，直接得到 data */
export const http = {
  get: <T>(url: string, params?: object, config?: AxiosRequestConfig) =>
    request<T>({ ...config, url, method: 'get', params }),
  post: <T>(url: string, data?: object, config?: AxiosRequestConfig) =>
    request<T>({ ...config, url, method: 'post', data }),
  put: <T>(url: string, data?: object, config?: AxiosRequestConfig) =>
    request<T>({ ...config, url, method: 'put', data }),
  delete: <T>(url: string, params?: object, config?: AxiosRequestConfig) =>
    request<T>({ ...config, url, method: 'delete', params })
}
