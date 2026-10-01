<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { relicGroupMapByRtKey, type RelicRouteKey } from '@/assets/data'
import { useStore } from '@/stores'
import ProgressTable from '@/components/ProgressTable.vue'
import TargetProgressTable from '@/components/TargetProgressTable.vue'
import ItemSpan from '@/components/ui/ItemSpan.vue'
import { getItemInfo } from '@/tools/item'
import { calcRelicDemand, type RelicDemandResult, type TomestoneSummary } from '@/tools/relic-demand'
import { useIsMobile } from '@/composables/useIsMobile'
import {
  RefreshOutlined,
  ClearOutlined,
  ArrowBackOutlined,
  ArrowForwardOutlined,
} from '@vicons/material'

const router = useRouter()
const store = useStore()
const { isMobile } = useIsMobile()

const groupKey = computed(() => router.currentRoute.value.params.groupKey as RelicRouteKey)
const groupData = computed(() => relicGroupMapByRtKey[groupKey.value])

watch(groupData, (val) => {
  if (!val) {
    router.replace('/404')
  }
}, { immediate: true })

// 分页面：0 为“设置目标”，1 为“素材统计”
const activePageIndex = ref<number>(0)

// 本地可编辑的目标进度
const localTargetProgress = ref<Record<number, number>>({})
const localTargetPreProgress = ref<number>(-1)

// 是否正在初始化标识，避免初始化时触发 watcher 进行多余保存
const isInitializing = ref(false)

// 保存目标进度到用户数据
const saveTargetProgress = () => {
  if (!groupData.value || isInitializing.value) return
  const gid = groupData.value.id
  store.userData.relicTargetProgress[gid] = { ...localTargetProgress.value }
  store.userData.relicTargetPreProgress[gid] = localTargetPreProgress.value
  store.updateUserData()
}

// 初始化本地目标进度
const initLocalTarget = () => {
  if (!groupData.value) return
  isInitializing.value = true
  const gid = groupData.value.id
  const savedTarget = store.userData.relicTargetProgress[gid]
  const savedPreTarget = store.userData.relicTargetPreProgress[gid]

  if (savedTarget) {
    localTargetProgress.value = { ...savedTarget }
  } else {
    // 默认勾选所有职业的最终阶段
    const finalStage = groupData.value.targets.length - 1
    localTargetProgress.value = Object.fromEntries(
      groupData.value.jobs.map(j => [j, finalStage])
    )
  }

  if (savedPreTarget !== undefined) {
    localTargetPreProgress.value = savedPreTarget
  } else {
    localTargetPreProgress.value = groupData.value.stage_prereqs ? groupData.value.stage_prereqs.length - 1 : -1
  }

  // 若 store 中尚未记录目标进度，保存默认设置
  if (!savedTarget) {
    store.userData.relicTargetProgress[gid] = { ...localTargetProgress.value }
    store.userData.relicTargetPreProgress[gid] = localTargetPreProgress.value
    store.updateUserData()
  }

  nextTick(() => {
    isInitializing.value = false
  })
}

watch(groupData, () => {
  initLocalTarget()
}, { immediate: true })

// 监听目标进度更改并立刻记录保存
watch(
  [localTargetProgress, localTargetPreProgress],
  () => {
    saveTargetProgress()
  },
  { deep: true }
)

// 快捷操作
const selectAllTargets = () => {
  if (!groupData.value) return
  const finalStage = groupData.value.targets.length - 1
  localTargetProgress.value = Object.fromEntries(
    groupData.value.jobs.map(j => [j, finalStage])
  )
  if (groupData.value.stage_prereqs) {
    localTargetPreProgress.value = groupData.value.stage_prereqs.length - 1
  }
}

const clearTargets = () => {
  if (!groupData.value) return
  localTargetProgress.value = Object.fromEntries(
    groupData.value.jobs.map(j => [j, -1])
  )
  localTargetPreProgress.value = -1
}

// 统计分析结果
const demandResult = computed<RelicDemandResult | null>(() => {
  if (!groupData.value) return null
  const gid = groupData.value.id
  const currentProgress = store.userData.relicProgress[gid] || {}
  const currentPreProgress = store.userData.relicPreProgress[gid] ?? -1

  return calcRelicDemand(
    groupData.value,
    currentProgress,
    currentPreProgress,
    localTargetProgress.value,
    localTargetPreProgress.value
  )
})

// 检查物品是否标记为已拥有
const isItemOwned = (itemId: number, currentNeedCount: number): boolean => {
  if (!groupData.value) return false
  const gid = groupData.value.id
  const savedCount = store.userData.demandItemOwned?.[gid]?.[itemId]
  if (savedCount === undefined) return false
  return savedCount >= currentNeedCount
}

// 计算实际剩余所需的点数需求总计（排除已标记为完全收集的道具）
const tomestoneSummaries = computed<TomestoneSummary[]>(() => {
  if (!demandResult.value || !groupData.value) return []

  return demandResult.value.tomestoneSummaries.map(summary => {
    let totalNeeded = 0

    demandResult.value!.tomestoneItems.forEach(item => {
      if (item.tradeDetails?.costId === summary.costId) {
        // 如果道具未被标记为已完全收集，则按全部未收集来计算点数需求
        if (!isItemOwned(item.itemId, item.needCount)) {
          totalNeeded += item.tradeDetails.totalTomestonesNeeded
        }
      }
    })

    return {
      ...summary,
      totalNeeded,
    }
  })
})

// 切换已拥有状态，勾选时持久化保存当前需求数量
const toggleItemOwned = (itemId: number, currentNeedCount: number, checked: boolean) => {
  if (!groupData.value) return
  const gid = groupData.value.id
  if (!store.userData.demandItemOwned) {
    store.userData.demandItemOwned = {}
  }
  if (!store.userData.demandItemOwned[gid]) {
    store.userData.demandItemOwned[gid] = {}
  }
  if (checked) {
    store.userData.demandItemOwned[gid][itemId] = currentNeedCount
  } else {
    delete store.userData.demandItemOwned[gid][itemId]
  }
  store.updateUserData()
}

// 确认目标进度并滑向统计结果页面
const confirmAndGoToStats = () => {
  saveTargetProgress()
  activePageIndex.value = 1
}

// 切回设置目标页面
const backToSettings = () => {
  activePageIndex.value = 0
}

// Shift + 鼠标滚轮 或 导航切页
const lastWheelTime = ref<number>(0)
const handleWheel = (e: WheelEvent) => {
  // 支持 shift+滚轮 或 主要是横向滚轮
  const isShiftWheel = e.shiftKey
  const isHorizontalWheel = Math.abs(e.deltaX) > Math.abs(e.deltaY)

  if (isShiftWheel || isHorizontalWheel) {
    const now = Date.now()
    if (now - lastWheelTime.value < 400) return // 400ms cooldown
    lastWheelTime.value = now

    const delta = isShiftWheel ? e.deltaY : e.deltaX
    if (delta > 0 && activePageIndex.value === 0) {
      activePageIndex.value = 1
    } else if (delta < 0 && activePageIndex.value === 1) {
      activePageIndex.value = 0
    }
  }
}

const mainContainerRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (mainContainerRef.value) {
    mainContainerRef.value.addEventListener('wheel', handleWheel, { passive: true })
  }
})

onUnmounted(() => {
  if (mainContainerRef.value) {
    mainContainerRef.value.removeEventListener('wheel', handleWheel)
  }
})
</script>

<template>
  <div ref="mainContainerRef" class="p-4 flex flex-col gap-4 overflow-hidden">
    <!-- 头部区域 -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <n-h1 class="mb-0!">{{ groupData?.name_zh }} — 素材统计</n-h1>
      <n-button-group size="small">
        <n-button :type="activePageIndex === 0 ? 'primary' : 'default'" @click="activePageIndex = 0">
          进度与目标
        </n-button>
        <n-button :type="activePageIndex === 1 ? 'primary' : 'default'" @click="activePageIndex = 1">
          素材统计
        </n-button>
      </n-button-group>
    </div>

    <!-- 滑动容器外框 -->
    <div class="w-full overflow-hidden">
      <!-- 内部滑轨：包含 2 个 100% 宽度的子页面 -->
      <div
        class="flex transition-transform duration-300 ease-in-out w-[200%]"
        :style="{ transform: `translateX(-${activePageIndex * 50}%)` }"
      >
        <!-- 分页面 0：当前进度与目标进度设置 -->
        <div class="w-1/2 pr-2 flex flex-col gap-4">
          <div class="flex justify-end items-center">
            <n-button size="small" secondary type="primary" :icon-placement="'right'" @click="confirmAndGoToStats">
              <template #icon>
                <n-icon class="ml-1"><ArrowForwardOutlined /></n-icon>
              </template>
              查看素材统计
            </n-button>
          </div>

          <!-- 当前进度（默认折叠） -->
          <n-card
            title="当前进度"
            size="small"
            embedded
            collapsible
            :default-collapsed="true"
          >
            <ProgressTable v-if="groupData" :relic-group="groupData" />
          </n-card>

          <!-- 目标进度（默认展开） -->
          <n-card
            title="目标进度"
            size="small"
            embedded
            collapsible
            :default-collapsed="false"
          >
            <template #header-extra>
              <div class="flex gap-2">
                <n-button size="tiny" secondary type="primary" @click="selectAllTargets">
                  <template #icon><n-icon><RefreshOutlined /></n-icon></template>
                  全选
                </n-button>
                <n-button size="tiny" secondary type="warning" @click="clearTargets">
                  <template #icon><n-icon><ClearOutlined /></n-icon></template>
                  清空
                </n-button>
              </div>
            </template>
            <TargetProgressTable
              v-if="groupData"
              :relic-group="groupData"
              v-model:target-progress="localTargetProgress"
              v-model:target-pre-progress="localTargetPreProgress"
            />
          </n-card>
        </div>

        <!-- 分页面 1：素材统计结果 -->
        <div class="w-1/2 pl-2 flex flex-col gap-4">
          <div class="flex justify-between items-center">
            <n-button size="small" secondary @click="backToSettings">
              <template #icon><n-icon><ArrowBackOutlined /></n-icon></template>
              返回修改目标
            </n-button>
          </div>

          <n-card title="素材统计结果" size="small" class="bg-primary/5!">
            <template v-if="demandResult && demandResult.hasAnyDemand">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- 1. 点数道具 -->
                <n-card size="small" title="点数道具" class="h-full">
                  <template #header-extra>
                    <n-tag size="small" type="info">{{ demandResult.tomestoneItems.length }} 种</n-tag>
                  </template>

                  <!-- 点数总和展示 -->
                  <n-alert v-if="tomestoneSummaries.length > 0" type="info" title="点数需求总计" class="mb-3">
                    <div v-for="ts in tomestoneSummaries" :key="ts.costId" class="mt-1">
                      <ItemSpan v-if="!isMobile" :item-info="getItemInfo(ts.costId)" :amount="ts.totalNeeded" show-amount />
                      <div v-else class="text-xs">
                        {{ getItemInfo(ts.costId).name_zh }} x{{ ts.totalNeeded.toLocaleString() }}
                      </div>
                    </div>
                  </n-alert>

                  <div class="flex flex-col gap-2">
                    <div
                      v-for="item in demandResult.tomestoneItems"
                      :key="item.itemId"
                      class="p-1.5 bg-slate-500/5 rounded flex justify-between items-center transition-opacity"
                      :class="{ 'opacity-40': isItemOwned(item.itemId, item.needCount) }"
                    >
                      <ItemSpan :item-info="item.itemInfo" :amount="item.needCount" show-amount />
                      <n-checkbox
                        :checked="isItemOwned(item.itemId, item.needCount)"
                        @update:checked="(val: boolean) => toggleItemOwned(item.itemId, item.needCount, val)"
                      />
                    </div>
                  </div>
                </n-card>

                <!-- 2. 制作道具 -->
                <n-card size="small" title="制作道具" class="h-full">
                  <template #header-extra>
                    <n-tag size="small" type="success">{{ demandResult.craftItems.length }} 种</n-tag>
                  </template>
                  <div v-if="demandResult.craftItems.length === 0" class="text-xs opacity-50 text-center py-4">
                    无制作道具需求
                  </div>
                  <div v-else class="flex flex-col gap-2">
                    <div
                      v-for="item in demandResult.craftItems"
                      :key="item.itemId"
                      class="p-1.5 bg-slate-500/5 rounded flex justify-between items-center transition-opacity"
                      :class="{ 'opacity-40': isItemOwned(item.itemId, item.needCount) }"
                    >
                      <ItemSpan :item-info="item.itemInfo" :amount="item.needCount" show-amount />
                      <n-checkbox
                        :checked="isItemOwned(item.itemId, item.needCount)"
                        @update:checked="(val: boolean) => toggleItemOwned(item.itemId, item.needCount, val)"
                      />
                    </div>
                  </div>
                </n-card>

                <!-- 3. 其他道具 -->
                <n-card size="small" title="其他道具" class="h-full">
                  <template #header-extra>
                    <n-tag size="small" type="warning">{{ demandResult.otherItems.length }} 种</n-tag>
                  </template>
                  <div v-if="demandResult.otherItems.length === 0" class="text-xs opacity-50 text-center py-4">
                    无其他道具需求
                  </div>
                  <div v-else class="flex flex-col gap-2">
                    <div
                      v-for="item in demandResult.otherItems"
                      :key="item.itemId"
                      class="p-1.5 bg-slate-500/5 rounded flex justify-between items-center transition-opacity"
                      :class="{ 'opacity-40': isItemOwned(item.itemId, item.needCount) }"
                    >
                      <ItemSpan :item-info="item.itemInfo" :amount="item.needCount" show-amount />
                      <n-checkbox
                        :checked="isItemOwned(item.itemId, item.needCount)"
                        @update:checked="(val: boolean) => toggleItemOwned(item.itemId, item.needCount, val)"
                      />
                    </div>
                  </div>
                </n-card>
              </div>
            </template>

            <template v-else>
              <n-result status="success" title="无需任何道具" description="根据当前的进度与目标进度，你不需要再收集额外的道具了！">
              </n-result>
            </template>
          </n-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
