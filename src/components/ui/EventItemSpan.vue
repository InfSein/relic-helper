<script setup lang="ts">
import { getImgCdnUrl } from '@/tools/item'

interface EventItem {
  name: string[]
  icon: number
}

interface EventItemSpanProps {
  item: EventItem
  size?: number
}
const props = defineProps<EventItemSpanProps>()

const itemIcon = computed(() => getImgCdnUrl(props.item.icon))
const itemName = computed(() => props.item.name[2] || '???')
</script>

<template>
  <span class="container">
    <XivFARImage
      class="select-none"
      :size="size ?? 14"
      :src="itemIcon"
    />
    <span>
      {{ itemName }}
    </span>
  </span>
</template>

<style scoped>
.container {
  display: inline-flex;
  align-items: center;
  vertical-align: text-bottom;
  line-height: normal;
  gap: 2px;
  position: relative;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 1px 4px;
}
</style>
