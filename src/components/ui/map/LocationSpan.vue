<script setup lang="ts">
import {
  OpenInNewFilled
} from '@vicons/material'
import MapButton from './MapButton.vue'
import XivFARImage from '../XivFARImage.vue'
import XivMap from './XivMap.vue'
import { XivMaps, getNearestAetheryte } from '@/tools/map'

interface LocationSpanProps {
  placeId: number,
  placeName?: string,
  coordinateX: number,
  coordinateY: number,

  size?: number,
  hideMapName?: boolean,
  hideCoordinates?: boolean,
  hideMapButton?: boolean
  /** 手动指定地图按钮悬浮窗的触发方式 */
  popTrigger?: 'hover' | 'click' | 'manual'
  popStyle?: string
  inline?: boolean
}
const props = defineProps<LocationSpanProps>()

const placeName = computed(() => {
  if (props.placeName) {
    return props.placeName
  }
  return XivMaps[props.placeId]?.name_zh
})

const mapData = computed(() => {
  return XivMaps[props.placeId]
})
const showMapButton = computed(() => {
  return !props.hideMapButton && mapData.value
})
const mapButtonSize = computed(() => {
  return props.size ?? 14
})

const handleOpenCafeMap = () => {
  if (mapData.value) {
    window.open(`https://map.wakingsands.com/#f=mark&id=${mapData.value.map_id}&x=${props.coordinateX}&y=${props.coordinateY}`)
  }
}
</script>

<template>
  <!-- inline 模式：整体可悬浮弹出地图 -->
  <n-popover
    v-if="inline && showMapButton"
    :trigger="popTrigger || 'hover'"
    :width="250"
    :placement="'right-start'"
    :style="popStyle"
  >
    <template #trigger>
      <span class="container-inline">
        <MapButton
          :size="mapButtonSize"
          :map-data="mapData"
          :flag-x="coordinateX"
          :flag-y="coordinateY"
          no-popover
        />
        <span v-if="!hideMapName">{{ placeName }}</span>
        <span v-if="!hideCoordinates">{{ `(${coordinateX.toFixed(1)}, ${coordinateY.toFixed(1)})` }}</span>
      </span>
    </template>
    <div class="map">
      <div class="title">
        <div class="main">{{ placeName }}</div>
        <div class="subs">{{ mapData?.name_ja + ' / ' + mapData?.name_en }}</div>
      </div>
      <XivMap
        :map-data="mapData"
        :map-size="222"
        :flag-x="coordinateX"
        :flag-y="coordinateY"
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
            {{ getNearestAetheryte(mapData, coordinateX, coordinateY)?.[`name_zh`] }}
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
  <span v-else-if="inline" class="container-inline">
    <span v-if="!hideMapName">{{ placeName }}</span>
    <span v-if="!hideCoordinates">{{ `(${coordinateX.toFixed(1)}, ${coordinateY.toFixed(1)})` }}</span>
  </span>
  <div v-else class="container">
    <span v-if="!hideMapName">{{ placeName }}</span>
    <span v-if="!hideCoordinates">{{ `(${coordinateX.toFixed(1)}, ${coordinateY.toFixed(1)})` }}</span>
    <span
      v-if="showMapButton"
      class="map-button no-select"
      :style="{
        lineHeight: mapButtonSize + 'px'
      }"
    >
      <MapButton
        :size="mapButtonSize"
        :map-data="mapData"
        :flag-x="coordinateX"
        :flag-y="coordinateY"
        :pop-trigger="popTrigger"
        :pop-style="popStyle"
      />
    </span>
  </div>
</template>

<style scoped>
.container > *:not(:first-child) {
  margin-left: 3px;
}
.container-inline {
  display: inline-flex;
  align-items: center;
  vertical-align: text-bottom;
  line-height: normal;
  gap: 3px;
  position: relative;
  top: 3px;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 1px 4px;

  &:hover {
    background-color: var(--color-background-hover);
  }
}
.map-button {
  vertical-align: middle;
}

/* popover 内的地图样式 */
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
