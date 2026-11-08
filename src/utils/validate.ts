import type { FormItemRule } from 'element-plus'

// 规则与后端 request 结构体的 binding 校验保持一致

export const phoneRules: FormItemRule[] = [
  { required: true, message: '请输入手机号', trigger: 'blur' },
  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
]

export const usernameRules: FormItemRule[] = [
  { required: true, message: '请输入用户名', trigger: 'blur' },
  { min: 2, max: 64, message: '用户名长度为 2-64 位', trigger: 'blur' },
  { pattern: /^[\p{L}\p{N}]+$/u, message: '用户名只能包含字母和数字', trigger: 'blur' }
]

export const passwordRules: FormItemRule[] = [
  { required: true, message: '请输入密码', trigger: 'blur' },
  { min: 8, max: 72, message: '密码长度为 8-72 位', trigger: 'blur' },
  { pattern: /^[\x20-\x7E]+$/, message: '密码只能包含英文、数字和符号', trigger: 'blur' }
]

export const confirmRules = (getPassword: () => string): FormItemRule[] => [
  { required: true, message: '请再次输入密码', trigger: 'blur' },
  {
    validator: (_rule, value, callback) =>
      callback(value === getPassword() ? undefined : new Error('两次输入的密码不一致')),
    trigger: 'blur'
  }
]

export const captchaRules: FormItemRule[] = [{ required: true, message: '请输入图形验证码', trigger: 'blur' }]

export const smsCodeRules: FormItemRule[] = [
  { required: true, message: '请输入短信验证码', trigger: 'blur' },
  { pattern: /^\d{6}$/, message: '短信验证码为 6 位数字', trigger: 'blur' }
]

/** 与后端 linuxuser 校验一致：小写字母或下划线开头，最长 32 位 */
export const linuxUserRules: FormItemRule[] = [
  { required: true, message: '请输入 SSH 用户名', trigger: 'blur' },
  { pattern: /^[a-z_][a-z0-9_-]{0,31}$/, message: '用户名只能包含小写字母、数字、- 和 _', trigger: 'blur' }
]

const IPV4 = /^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$/

function isIPv6(value: string) {
  try {
    return value.includes(':') && !!new URL(`http://[${value}]`)
  } catch {
    return false
  }
}

/** 后端 ip 校验同时支持 IPv4 和 IPv6 */
export const ipRules: FormItemRule[] = [
  { required: true, message: '请输入服务器 IP', trigger: 'blur' },
  {
    validator: (_rule, value, callback) =>
      callback(IPV4.test(value ?? '') || isIPv6(value ?? '') ? undefined : new Error('IP 地址格式不正确')),
    trigger: 'blur'
  }
]
