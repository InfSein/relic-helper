<script setup lang="ts">
import XivFARImage from '../XivFARImage.vue'
import { type XivMapAetheryteInfo, type XivMapInfo } from '@/tools/map'

interface MapButtonProps {
  mapData: XivMapInfo,
  mapSize: number,
  flagX: number,
  flagY: number
}
const props = defineProps<MapButtonProps>()

const mapScale = computed(() => {
  let basement = 40
  console.log('mapid', props.mapData.map_id)
  if (props.mapData.map_id === 694) basement = 20 // 主城：拉闸含
  if (props.mapData.map_id === 855) basement = 22 // 主城：图来有啦
  return props.mapSize / basement
})

const getPositionStyle = (x: number, y: number) => {
  return {
    left: `${(x - 1) * mapScale.value}px`,
    top: `${(y - 1) * mapScale.value}px`,
    width: '16px',
    height: '16px'
  }
}
const getAetheryteName = (aetheryte: XivMapAetheryteInfo) => {
  return aetheryte[`name_zh`]
}

const isMapLoaded = ref(false)
const mapImageRef = ref<InstanceType<typeof XivFARImage> | null>(null)

const handleMapLoad = () => {
  isMapLoaded.value = true
}

const checkImageLoaded = () => {
  const imgEl = (mapImageRef.value?.$el ?? null) as HTMLImageElement | null
  if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
    isMapLoaded.value = true
  }
}

watch(
  () => props.mapData.map_src,
  () => {
    isMapLoaded.value = false
    nextTick(() => {
      checkImageLoaded()
    })
  }
)

onMounted(() => {
  nextTick(() => {
    checkImageLoaded()
  })
})
</script>

<template>
  <div class="map-wrapper">
    <div class="map-content" :style="{ width: mapSize + 'px', height: mapSize + 'px' }">
      <!-- 骨架屏 -->
      <n-skeleton
        v-if="!isMapLoaded"
        class="map-skeleton"
        :width="mapSize"
        :height="mapSize"
        :sharp="true"
      />
      <!-- 地图 -->
      <XivFARImage
        ref="mapImageRef"
        class="map-image"
        :size="mapSize"
        :src="mapData.map_src"
        @load="handleMapLoad"
      />
      <div v-show="isMapLoaded" class="markers-overlay">
        <!-- 目的地旗帜 -->
        <XivFARImage
          class="marker flag"
          src="/ui/flag.png"
          :style="getPositionStyle(flagX, flagY)"
        />
        <!-- 以太之光 -->
        <template v-for="aetheryte in mapData.aetherytes" :key="aetheryte.x + '-' + aetheryte.y">
          <n-tooltip
            :trigger="'hover'"
            :show-arrow="false"
            :keep-alive-on-hover="false"
            style="padding: 4px 8px;"
            content-style="padding: 0;"
          >
            <template #trigger>
              <XivFARImage
                class="marker aetheryte"
                src="/ui/aetheryte.png"
                :style="getPositionStyle(aetheryte.x, aetheryte.y)"
              />
            </template>
            <div class="aetheryte-tooltip">
              <p>{{ getAetheryteName(aetheryte) }}</p>
            </div>
          </n-tooltip>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;

  .map-content {
    position: relative;
    overflow: hidden;

    .map-skeleton {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
    }

    .map-image {
      display: block;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .markers-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;

      .marker {
        position: absolute;
        transform: translate(-50%, -50%);
        z-index: 1;
        pointer-events: auto;
      }
    }
  }
}

.aetheryte-tooltip {
  text-align: center;
  font-size: 12px;
}
</style>
