<script setup lang="ts">
import {
  OpenInNewFilled
} from '@vicons/material'
import XivFARImage from '../XivFARImage.vue'
import XivMap from './XivMap.vue'
import { getNearestAetheryte, type XivMapInfo } from '@/tools/map'

interface MapButtonProps {
  size: number,
  mapData: XivMapInfo,
  flagX: number,
  flagY: number,
  /** 手动指定悬浮窗的触发方式 */
  popTrigger?: 'hover' | 'click' | 'manual'
  popStyle?: string
  /** 禁用自身的 popover，仅渲染图标（用于父级已提供 popover 的场景） */
  noPopover?: boolean
}
const props = defineProps<MapButtonProps>()

const getMapName = () => {
  return props.mapData[`name_zh`]
}
const getMapSubName = () => {
  return props.mapData.name_ja + ' / ' + props.mapData.name_en
}

const handleOpenCafeMap = () => {
  window.open(`https://map.wakingsands.com/#f=mark&id=${props.mapData.map_id}&x=${props.flagX}&y=${props.flagY}`)
}
</script>

<template>
  <n-popover v-if="!noPopover"
    :trigger="popTrigger || 'hover'"
    :width="250"
    :placement="'right-start'"
    :style="popStyle"
  >
    <template #trigger>
      <XivFARImage
        :size="size"
        src="/ui/map.png"
      />
    </template>
    <div class="map">
      <div class="title">
        <div class="main">{{ getMapName() }}</div>
        <div class="subs">{{ getMapSubName() }}</div>
      </div>
      <XivMap
        :map-data="props.mapData"
        :map-size="222"
        :flag-x="props.flagX"
        :flag-y="props.flagY"
      />
      <div class="footer">
        <div class="recommended-aetheryte">
          <span>推荐</span>
          <span style="vertical-align: middle;">
            <XivFARImage
              :size="14"
              src="/ui/aetheryte.png"
            />
          </span>
          <span>
            {{  getNearestAetheryte(props.mapData, props.flagX, props.flagY)?.[`name_zh`] }}
          </span>
        </div>
        <div class="actions">
          <n-button size="small" @click="handleOpenCafeMap">
            <template #icon>
              <n-icon><OpenInNewFilled /></n-icon>
            </template>
            在FFCAFE中打开
          </n-button>
        </div>
      </div>
    </div>
  </n-popover>
  <XivFARImage
    v-else
    :size="size"
    src="/ui/map.png"
  />
</template>

<style scoped>
.map {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;

  .title {
    line-height: 1;
    text-align: center;

    .main {
      font-size: calc(var(--n-font-size) + 2px);
    }
    .subs {
      font-size: calc(var(--n-font-size) - 2px);
      color: var(--color-text-sub);
    }
  }
  .footer {
    width: 100%;
    text-align: left;
  }
}
</style>
