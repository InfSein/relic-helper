<!--
  FAR: Fixed Aspect Ratio
-->

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { ItemInfo } from '@/tools/item'

interface XivFARImageProps {
  src: string | ItemInfo
  alt?: string
  size?: number
  lazy?: boolean
}
const props = withDefaults(defineProps<XivFARImageProps>(), {
  lazy: true,
})

const emit = defineEmits<{
  (e: 'load', event?: Event): void
  (e: 'error', event: Event): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)
const isLoaded = ref(false)
const loadFailed = ref(false)
const isIntersected = ref(!props.lazy)

let observer: IntersectionObserver | null = null

// 检查缓存命中时图片是否已直接完成加载，并通知父组件
const checkImgComplete = () => {
  if (!isLoaded.value && imgRef.value?.complete && imgRef.value.naturalWidth > 0) {
    isLoaded.value = true
    emit('load')
  }
}

onMounted(() => {
  if (props.lazy && containerRef.value) {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            isIntersected.value = true
            observer?.disconnect()
            observer = null
            nextTick(checkImgComplete)
          }
        },
        { rootMargin: '200px' }
      )
      observer.observe(containerRef.value)
    } else {
      isIntersected.value = true
      nextTick(checkImgComplete)
    }
  } else {
    nextTick(checkImgComplete)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

const imgData = computed(() => {
  if (typeof props.src === 'string') {
    return {
      src: props.src,
      alt: props.alt || '?',
    }
  } else {
    return {
      src: props.src?.iconUrl || '',
      alt: props.alt || (props.src?.name_zh || '?')[0],
    }
  }
})

watch(
  () => imgData.value.src,
  (newSrc, oldSrc) => {
    if (newSrc !== oldSrc) {
      isLoaded.value = false
      loadFailed.value = false
      nextTick(checkImgComplete)
    }
  }
)

const onImageLoad = (event: Event) => {
  if (!isLoaded.value) {
    isLoaded.value = true
    emit('load', event)
  }
}

const onImageLoadError = (event: Event) => {
  loadFailed.value = true
  emit('error', event)
}
</script>

<template>
  <div
    ref="containerRef"
    class="inline-flex shrink-0 items-center justify-center relative select-none overflow-hidden"
    :style="size ? `width: ${size}px; height: ${size}px;` : undefined"
  >
    <n-skeleton
      v-if="!loadFailed && !isLoaded"
      :width="size"
      :height="size"
      class="w-full h-full rounded shrink-0 absolute inset-0"
    />
    <img
      v-if="isIntersected && !loadFailed"
      ref="imgRef"
      alt="never"
      :draggable="false"
      :src="imgData.src"
      :width="size"
      :height="size"
      class="select-none w-full h-full object-contain"
      :class="{ 'opacity-0': !isLoaded }"
      @load="onImageLoad"
      @error="onImageLoadError"
    />
    <div
      v-if="loadFailed"
      class="inline-flex shrink-0 items-center justify-center select-none overflow-hidden text-base bg-sub rounded w-full h-full"
      :style="`font-size: ${(size ?? 14) / 2 + 1}px`"
    >
      {{ imgData.alt }}
    </div>
  </div>
</template>

<style scoped>
</style>
