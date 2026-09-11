<!-- 
  FAR: Fixed Aspect Ratio
-->

<script setup lang="ts">
const props = defineProps({
  /** 图片地址 */
  src: {
    type: String,
    required: true,
  },
  /** 图片大小(宽/高一致) */
  size: {
    type: Number,
    default: undefined,
  },
  /** 图片API地址 */
  apiBase: {
    type: String,
    default: '/hqhelper-dawntrail',
  },
  /** 备用API地址 */
  apiBaseSpare: {
    type: String,
    default: ''
  },
});

const emit = defineEmits<{
  (e: 'load', event: Event): void
  (e: 'error', event: Event): void
}>()

const getUrl = () => {
  return props.src.replace('~ApiBase', props.apiBase)
}
const onImageLoad = (event: Event) => {
  emit('load', event)
}
const onImageLoadError = (event: Event) => {
  emit('error', event)
  const img = event.target as HTMLImageElement
  const new_src = img.src.replace(props.apiBase, props.apiBaseSpare)
  if (new_src === img.src) return
  img.src = new_src
}
</script>

<template>
  <img
    alt="-"
    :draggable="false"
    :src="getUrl()"
    :width="size"
    :height="size"
    class="no-select"
    @load="onImageLoad"
    @error="onImageLoadError"
  />
</template>

<style scoped>
</style>