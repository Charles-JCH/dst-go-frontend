import { http } from '@/utils/request'

/* 接口路径和字段均与后端路由、request / response 结构体对齐 */

export interface CaptchaResult {
  captchaID: string
  /** 图片的 base64 */
  captchaImg: string
}

export interface LoginParams {
  phone: string
  password: string
  captchaID: string
  captchaCode: string
}

export interface LoginResult {
  accessToken: string
  userID: number
  username: string
  role: string
}

/** 与后端 RefreshTokenResp 对应 */
export interface RefreshTokenResult {
  accessToken: string
}

/** 与后端 ResetTokenResp 对应 */
export interface ResetTokenResult {
  resetToken: string
}

/** 与后端 WSTicketResp 对应 */
export interface WSTicketResult {
  ticket: string
}

/** 短信验证码场景，与后端 SendSMSCodeReq.Scene 一致 */
export type SMSScene = 'register' | 'reset' | 'login'

export interface SendSMSCodeParams {
  phone: string
  scene: SMSScene
  captchaID: string
  captchaCode: string
}

export interface RegisterParams {
  username: string
  password: string
  phone: string
  smsCode: string
}

export interface ResetPasswordParams {
  resetToken: string
  newPassword: string
}

export const getCaptcha = () => http.get<CaptchaResult>('/auth/captcha')

export const login = (data: LoginParams) => http.post<LoginResult>('/auth/login', data)

export const sendSMSCode = (data: SendSMSCodeParams) => http.post<void>('/auth/sms-code', data)

/** 注册成功后后端直接签发登录凭证 */
export const register = (data: RegisterParams) => http.post<LoginResult>('/auth/register', data)

/** 忘记密码第一步：校验手机号和短信验证码，成功后返回 resetToken */
export const verifyResetCode = (phone: string, smsCode: string) =>
  http.post<ResetTokenResult>('/auth/password/verify', { phone, smsCode })

/** 忘记密码第二步：携带 resetToken 设置新密码 */
export const resetPassword = (data: ResetPasswordParams) => http.post<void>('/auth/password/reset', data)

/** 获取浏览器 WebSocket 的一次性 ticket，30 秒内有效 */
export const getWSTicket = () => http.post<WSTicketResult>('/ws/ticket')

/** 退出登录：后端会注销 accessToken 和 Cookie 中的刷新凭证 */
export const logout = () => http.post<void>('/auth/logout')
