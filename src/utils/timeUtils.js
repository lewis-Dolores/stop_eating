/**
 * 檢查當前時間是否在深夜時段 (21:00 - 04:00)
 */
export function isLateNight() {
  const now = new Date()
  const hour = now.getHours()
  return hour >= 21 || hour < 4
}

/**
 * 取得當前時間的中文描述
 */
export function getCurrentTimeText() {
  const now = new Date()
  const hour = now.getHours().toString().padStart(2, '0')
  const minute = now.getMinutes().toString().padStart(2, '0')
  return `${hour}:${minute}`
}
