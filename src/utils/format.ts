/** 字节数转为易读的单位，0 或空显示 - */
export function formatBytes(bytes: number): string {
  if (!bytes) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${+(bytes / 1024 ** i).toFixed(1)} ${units[i]}`
}

/** ISO 时间字符串转为本地时间 YYYY-MM-DD HH:mm:ss */
export function formatDateTime(value: string): string {
  if (!value) return '-'
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
