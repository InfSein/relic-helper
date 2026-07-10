import { ref, onMounted, onUnmounted, type Ref } from 'vue'

interface UseNowOptions {
  /** 更新间隔
   * @default 1000 (ms)
   */
  interval?: number

  /**
   * 是否立即启动
   * @default true
   */
  immediate?: boolean
}

const useNow = (options: UseNowOptions = {}) => {
  const {
    interval = 1000,
    immediate = true,
  } = options

  const now = ref(Date.now())

  let timer: number | null = null

  const start = () => {
    if (timer !== null) return

    timer = window.setInterval(() => {
      now.value = Date.now()
    }, interval)
  }

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  onMounted(() => {
    if (immediate) {
      start()
    }
  })

  onUnmounted(() => {
    stop()
  })

  return {
    now,
  }
}

export default useNow