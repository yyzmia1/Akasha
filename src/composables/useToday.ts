import { ref, onMounted, onUnmounted } from 'vue'
import { formatDate } from '@/utils/date'

export function useToday() {
  const todayStr = ref(formatDate(new Date()))
  let timer: ReturnType<typeof setTimeout> | undefined
  function refreshToday() {
    todayStr.value = formatDate(new Date())
    if (timer) clearTimeout(timer)
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    timer = setTimeout(refreshToday, midnight.getTime() - now.getTime() + 50)
    return todayStr.value
  }
  onMounted(() => {
    refreshToday()
    window.addEventListener('focus', refreshToday)
    document.addEventListener('visibilitychange', refreshToday)
  })
  onUnmounted(() => {
    if (timer) clearTimeout(timer)
    window.removeEventListener('focus', refreshToday)
    document.removeEventListener('visibilitychange', refreshToday)
  })
  return { todayStr, refreshToday }
}
