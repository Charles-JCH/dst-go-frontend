/** 统一响应体，与后端 result.Response 一致 */
export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
  traceID?: string
}

/** 分页请求参数，page 从 1 开始 */
export interface PageParams {
  page: number
  pageSize: number
}

/** 分页响应数据 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
