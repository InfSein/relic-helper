<script setup lang="ts">
import { computed, ref } from 'vue'
import { InfoOutlined } from '@vicons/material'
import type { RelicDataGroup } from '@/assets/data'
import { useStore } from '@/stores'
import { calcRelicDemand, calcSingleStageDemand } from '@/tools/relic-demand'
import { getItemInfo } from '@/tools/item'
import ItemSpan from '@/components/ui/ItemSpan.vue'
import { useIsMobile } from '@/composables/useIsMobile'

interface Props {
  relicGroup: RelicDataGroup
  targetScope: 'all' | 'stage'
  stageIndex?: number
  popoverTitle?: string
}
const props = defineProps<Props>()

const store = useStore()
const { isMobile } = useIsMobile()
const mobileShow = ref(false)

// 是否已经全收集
const isAllCollected = computed(() => {
  const group = props.relicGroup
  if (!group) return false
  const progressData = store.userData.relicProgress[group.id] || {}
  const preProgress = store.userData.relicPreProgress[group.id] ?? -1

  if (props.targetScope === 'stage' && props.stageIndex !== undefined) {
    const s = props.stageIndex
    if (group.stage_prereqs?.[s] && preProgress < s) return false
    return group.jobs.every(job => (progressData[job] ?? -1) >= s)
  } else {
    const finalStage = group.targets.length - 1
    if (group.stage_prereqs && preProgress < group.stage_prereqs.length - 1) return false
    return group.jobs.every(job => (progressData[job] ?? -1) >= finalStage)
  }
})

const demandResult = computed(() => {
  const group = props.relicGroup
  if (!group) return null

  const currentProgress = store.userData.relicProgress[group.id] || {}
  const currentPreProgress = store.userData.relicPreProgress[group.id] ?? -1

  if (props.targetScope === 'all') {
    const finalStage = group.targets.length - 1
    const targetProgress = Object.fromEntries(group.jobs.map(jobId => [jobId, finalStage]))
    const targetPreProgress = group.stage_prereqs ? group.stage_prereqs.length - 1 : -1
    return calcRelicDemand(
      group,
      currentProgress,
      currentPreProgress,
      targetProgress,
      targetPreProgress
    )
  } else if (props.stageIndex !== undefined) {
    return calcSingleStageDemand(
      group,
      currentProgress,
      currentPreProgress,
      props.stageIndex
    )
  }

  return null
})

const popoverTitle = computed(() => {
  if (props.popoverTitle) return props.popoverTitle
  if (props.targetScope === 'all') {
    return '距离全收集尚需道具'
  }
  return `距离本阶段全收集尚需道具`
})
</script>

<template>
  <!-- 桌面端：Popover 悬浮窗 -->
  <n-popover v-if="!isMobile" placement="right" trigger="hover" style="max-width: 360px;">
    <template #trigger>
      <n-icon size="18" class="cursor-pointer text-primary opacity-70 hover:opacity-100 transition-opacity flex items-center" @click.stop>
        <InfoOutlined />
      </n-icon>
    </template>

    <div class="p-1">
      <!-- 1. 已全收集 -->
      <template v-if="isAllCollected">
        <div class="text-sm font-bold text-green-600 py-0.5">
          {{ targetScope === 'stage' ? '此阶段已全收集！' : `「${relicGroup.name_zh}」已全收集！` }}
        </div>
      </template>

      <!-- 2. 未全收集 -->
      <template v-else>
        <div class="font-bold text-sm mb-1.5 flex items-center gap-1">
          {{ popoverTitle }}
        </div>
        <n-divider class="my-1.5!" />

        <!-- 2.1 需要收集道具 -->
        <template v-if="demandResult && demandResult.hasAnyDemand">
          <!-- 详细道具列表 -->
          <div class="flex flex-col gap-1.5 max-h-80 overflow-y-auto pr-1 text-xs">
            <!-- 点数道具 -->
            <div v-if="demandResult.tomestoneSummaries.length > 0">
              <div class="font-medium text-slate-400 mb-0.5">点数统计：</div>
              <div v-for="summary in demandResult.tomestoneSummaries" :key="summary.costId" class="ml-1 my-0.5">
                <ItemSpan :item-info="getItemInfo(summary.costId)" :amount="summary.totalNeeded" show-amount />
              </div>
            </div>

            <div v-if="demandResult.tomestoneItems.length > 0">
              <div class="font-medium text-slate-400 mb-0.5">点数道具：</div>
              <div v-for="item in demandResult.tomestoneItems" :key="item.itemId" class="ml-1 my-0.5">
                <ItemSpan :item-info="item.itemInfo" :amount="item.needCount" show-amount />
              </div>
            </div>

            <div v-if="demandResult.craftItems.length > 0">
              <div class="font-medium text-slate-400 mb-0.5">制作道具：</div>
              <div v-for="item in demandResult.craftItems" :key="item.itemId" class="ml-1 my-0.5">
                <ItemSpan :item-info="item.itemInfo" :amount="item.needCount" show-amount />
              </div>
            </div>

            <div v-if="demandResult.otherItems.length > 0">
              <div class="font-medium text-slate-400 mb-0.5">其他道具：</div>
              <div v-for="item in demandResult.otherItems" :key="item.itemId" class="ml-1 my-0.5">
                <ItemSpan :item-info="item.itemInfo" :amount="item.needCount" show-amount />
              </div>
            </div>
          </div>
        </template>

        <!-- 2.2 未全收集，但不需要收集任何道具 -->
        <template v-else>
          <div class="text-xs text-slate-500 font-medium py-0.5">
            无
          </div>
        </template>
      </template>
    </div>
  </n-popover>

  <!-- 移动端：点击触发底部抽屉展示素材统计 -->
  <template v-else>
    <n-icon size="18" class="cursor-pointer text-primary opacity-70 hover:opacity-100 transition-opacity flex items-center" @click.stop="mobileShow = true">
      <InfoOutlined />
    </n-icon>
    <n-drawer v-model:show="mobileShow" placement="bottom" :height="'60%'">
      <div class="p-4 overflow-y-auto h-full">
        <!-- 1. 已全收集 -->
        <template v-if="isAllCollected">
          <div class="text-base font-bold text-green-600 py-2 text-center">
            {{ targetScope === 'stage' ? '此阶段已全收集！' : `「${relicGroup.name_zh}」已全收集！` }}
          </div>
        </template>

        <!-- 2. 未全收集 -->
        <template v-else>
          <div class="font-bold text-base mb-2 flex items-center gap-1">
            {{ popoverTitle }}
          </div>
          <n-divider class="my-2!" />

          <!-- 2.1 需要收集道具 -->
          <template v-if="demandResult && demandResult.hasAnyDemand">
            <!-- 点数统计 -->
            <n-alert v-if="demandResult.tomestoneSummaries.length > 0" type="info" title="点数总计" class="mb-3">
              <div v-for="ts in demandResult.tomestoneSummaries" :key="ts.costId" class="my-1">
                <ItemSpan :item-info="getItemInfo(ts.costId)" :amount="ts.totalNeeded" show-amount />
              </div>
            </n-alert>

            <!-- 详细道具列表 -->
            <div class="flex flex-col gap-2 text-sm">
              <div v-if="demandResult.tomestoneItems.length > 0">
                <div class="font-medium text-slate-400 mb-1">点数道具：</div>
                <div v-for="item in demandResult.tomestoneItems" :key="item.itemId" class="ml-1 my-1">
                  <ItemSpan :item-info="item.itemInfo" :amount="item.needCount" show-amount />
                </div>
              </div>

              <div v-if="demandResult.craftItems.length > 0">
                <div class="font-medium text-slate-400 mb-1">制作道具：</div>
                <div v-for="item in demandResult.craftItems" :key="item.itemId" class="ml-1 my-1">
                  <ItemSpan :item-info="item.itemInfo" :amount="item.needCount" show-amount />
                </div>
              </div>

              <div v-if="demandResult.otherItems.length > 0">
                <div class="font-medium text-slate-400 mb-1">其他道具：</div>
                <div v-for="item in demandResult.otherItems" :key="item.itemId" class="ml-1 my-1">
                  <ItemSpan :item-info="item.itemInfo" :amount="item.needCount" show-amount />
                </div>
              </div>
            </div>
          </template>

          <!-- 2.2 未全收集，但不需要收集任何道具 -->
          <template v-else>
            <div class="text-sm text-slate-500 font-medium py-2">
              无
            </div>
          </template>
        </template>
      </div>
    </n-drawer>
  </template>
</template>

<style scoped>
</style>
