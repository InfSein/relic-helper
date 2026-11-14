<script setup lang="ts">
import type { ContentLoader } from '@/assets/contents'
import XivMarkdown from './XivMarkdown.vue'

interface Props {
  /** 异步获取 markdown 正文的函数 */
  loader?: ContentLoader
  /** 加载时骨架屏的文本行数 */
  skeletonRows?: number
}
const props = withDefaults(defineProps<Props>(), {
  loader: undefined,
  skeletonRows: 4,
})

const content = ref('')
const loading = ref(false)
const failed = ref(false)

let requestId = 0
const load = async () => {
  const loader = props.loader
  const currentId = ++requestId
  failed.value = false
  if (!loader) {
    content.value = ''
    loading.value = false
    return
  }
  loading.value = true
  try {
    const result = await loader()
    // 加载期间 loader 已变化（如切换了路由），丢弃过期结果
    if (currentId !== requestId) return
    content.value = result
  } catch (e) {
    if (currentId !== requestId) return
    console.warn('Failed to load markdown content:', e)
    content.value = ''
    failed.value = true
  } finally {
    if (currentId === requestId) loading.value = false
  }
}

watch(() => props.loader, load, { immediate: true })
</script>

<template>
  <div v-if="loading" class="lazy-md-skeleton" aria-busy="true" aria-label="正在加载">
    <n-skeleton text style="width: 40%" />
    <n-skeleton text :repeat="Math.max(skeletonRows - 1, 1)" />
    <n-skeleton text style="width: 65%" />
  </div>
  <n-alert v-else-if="failed" type="error" :show-icon="false" class="my-2">
    加载失败
    <n-button text type="primary" @click="load">点此重试</n-button>
  </n-alert>
  <XivMarkdown v-else-if="content" :content="content" />
</template>

<style scoped>
.lazy-md-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}
</style>
