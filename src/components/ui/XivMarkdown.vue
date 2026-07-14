<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue'
import MarkdownIt from 'markdown-it'
import { getItemInfo } from '@/tools/item'
import ItemSpan from './ItemSpan.vue'
import LocationSpan from './map/LocationSpan.vue'

interface Props {
  content?: string
}
const props = defineProps<Props>()

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

const isMounted = ref(false)
const renderCount = ref(0) // 用于强制触发 Teleport 更新
const componentId = Math.random().toString(36).slice(2, 10)

/**
 * 提取所有需要渲染的物品及其占位符 ID
 */
const itemTasks = computed(() => {
  if (!props.content) return []
  const itemRegex = /\{\{item:(\d+)(?:\|([^}]+))?\}\}/g
  const tasks: { id: number; extra: string; uid: string }[] = []
  let match
  let index = 0
  while ((match = itemRegex.exec(props.content)) !== null) {
    tasks.push({
      id: parseInt(match[1]),
      extra: match[2] || '',
      uid: `xiv-md-item-${componentId}-${renderCount.value}-${index++}`
    })
  }
  return tasks
})

/**
 * 提取所有需渲染的地图坐标及占位符 ID
 */
const locTasks = computed(() => {
  if (!props.content) return []
  const locRegex = /\{\{loc:(\d+)\|([\d.-]+)\|([\d.-]+)(?:\|([^}]+))?\}\}/g
  const tasks: { placeId: number; coordinateX: number; coordinateY: number; extra: string; uid: string }[] = []
  let match
  let index = 0
  while ((match = locRegex.exec(props.content)) !== null) {
    tasks.push({
      placeId: parseInt(match[1]),
      coordinateX: parseFloat(match[2]),
      coordinateY: parseFloat(match[3]),
      extra: match[4] || '',
      uid: `xiv-md-loc-${componentId}-${renderCount.value}-${index++}`
    })
  }
  return tasks
})

/**
 * 将 Markdown 渲染为带占位符的 HTML
 */
const mdHtml = computed(() => {
  if (!props.content) return ''
  let itemIndex = 0
  let locIndex = 0

  // 先替换 loc 占位符
  const locReplaceRegex = /\{\{loc:\d+\|[\d.-]+\|[\d.-]+(?:\|[^}]+)?\}\}/g
  let tempContent = props.content.replace(locReplaceRegex, () => {
    const uid = `xiv-md-loc-${componentId}-${renderCount.value}-${locIndex++}`
    return `<span id="${uid}" class="xiv-loc-mount-point"></span>`
  })

  // 再替换 item 占位符
  const itemReplaceRegex = /\{\{item:\d+(?:\|[^}]+)?\}\}/g
  tempContent = tempContent.replace(itemReplaceRegex, () => {
    const uid = `xiv-md-item-${componentId}-${renderCount.value}-${itemIndex++}`
    return `<span id="${uid}" class="xiv-item-mount-point"></span>`
  })

  return md.render(tempContent)
})

const parseExtraParams = (extra: string) => {
  const params: any = {}
  if (!extra) return params
  const parts = extra.split('|')
  parts.forEach(p => {
    if (p.includes('=')) {
      const [key, value] = p.split('=')
      if (value === 'true') params[key] = true
      else if (value === 'false') params[key] = false
      else if (!isNaN(Number(value))) params[key] = Number(value)
      else params[key] = value
    } else {
      params[p] = true
    }
  })
  return params
}

onMounted(() => {
  isMounted.value = true
})

// 当内容变化时，增加计数器以更新 ID 并触发 Teleport
watch(() => props.content, () => {
  renderCount.value++
  nextTick(() => {
    isMounted.value = true
  })
})
</script>

<template>
  <div class="xiv-markdown">
    <!-- 整体渲染 HTML，保证表格等标签不被截断 -->
    <div class="md-content" v-html="mdHtml"></div>

    <!-- 利用 Teleport 将组件传送到指定的占位符中 -->
    <!-- 这样做的好处是组件依然在 Vue 的主渲染树中，可以正常继承 provide/inject（如 useMessage） -->
    <template v-if="isMounted">
      <Teleport v-for="task in itemTasks" :key="task.uid" :to="`#${task.uid}`">
        <ItemSpan
          inline
          v-bind="parseExtraParams(task.extra)"
          :item-info="getItemInfo(task.id)"
        />
      </Teleport>
      <Teleport v-for="task in locTasks" :key="task.uid" :to="`#${task.uid}`">
        <LocationSpan
          inline
          :place-id="task.placeId"
          :coordinate-x="task.coordinateX"
          :coordinate-y="task.coordinateY"
          v-bind="parseExtraParams(task.extra)"
        />
      </Teleport>
    </template>
  </div>
</template>

<style scoped>
.xiv-markdown {
  line-height: 1.8;
  word-break: break-all;
}

.xiv-markdown :deep(p) {
  margin-bottom: 0.8em;
}

/* 基础间距优化 */
.xiv-markdown :deep(h1),
.xiv-markdown :deep(h2),
.xiv-markdown :deep(h3) {
  margin-top: 1.2em;
  margin-bottom: 0.6em;
  font-weight: bold;
}

.xiv-markdown :deep(ul), .xiv-markdown :deep(ol) {
  padding-left: 1.5em;
  margin-bottom: 0.8em;
}

/* 表格样式支持 */
.xiv-markdown :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}

.xiv-markdown :deep(th), .xiv-markdown :deep(td) {
  border: 1px solid var(--color-border);
  padding: 8px;
  text-align: left;
}

.xiv-markdown :deep(th) {
  font-weight: bold;
  background-color: var(--color-background-hover);
}

/* base.css 全局 font-weight: normal 覆盖了 strong/b 的默认 bold，在此恢复 */
.xiv-markdown :deep(strong),
.xiv-markdown :deep(b) {
  font-weight: bold;
}

.xiv-item-mount-point {
  display: inline-flex;
  vertical-align: middle;
}

.xiv-loc-mount-point {
  display: inline-flex;
  vertical-align: middle;
}
</style>
