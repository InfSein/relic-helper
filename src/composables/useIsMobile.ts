import { ref } from 'vue'

/**
 * 移动端断点（与 Naive UI 默认 m 断点一致）
 * - ≤ 767px 视为移动端
 * - ≥ 768px 视为桌面端
 */
export const MOBILE_BREAKPOINT = 768

/**
 * 全局共享的移动端状态（模块单例，仅一个 matchMedia 监听器）。
 *
 * 用法：
 *   const { isMobile } = useIsMobile()
 *   <n-layout-sider v-if="!isMobile" />
 *
 * 设计原则：桌面端 UI 零改动，仅 isMobile 为 true 时启用移动端布局。
 */
const isMobile = ref(false)
let initialized = false

const init = () => {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  isMobile.value = mql.matches
  mql.addEventListener('change', (e) => {
    isMobile.value = e.matches
  })
}

export const useIsMobile = () => {
  init()
  return { isMobile }
}
