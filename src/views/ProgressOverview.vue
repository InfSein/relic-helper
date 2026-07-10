<script setup lang="ts">
import PatchTag from '@/components/ui/PatchTag.vue'
import { relicData } from '@/assets/data'
import { useStore } from '@/stores'
import { InsertChartOutlined } from '@vicons/material'

const store = useStore()

const relicGroups = computed(() => {
  return Object.values(relicData.relicGroups)
})

const relicStats = computed(() => {
  let totalPointsAcrossAll = 0
  let collectedPointsAcrossAll = 0

  const groupStats = relicGroups.value.map(group => {
    const jobsCount = group.jobs.length
    const stagesCount = group.targets.length
    const totalPoints = jobsCount * stagesCount
    const progressMap = store.userData.relicProgress[group.id] || {}

    let collectedPoints = 0
    group.jobs.forEach(jobId => {
      const currentStage = progressMap[jobId] // -1 表示未开始, 0 表示完成第1阶段
      if (currentStage !== undefined && currentStage >= 0) {
        collectedPoints += (currentStage + 1)
      }
    })

    totalPointsAcrossAll += totalPoints
    collectedPointsAcrossAll += collectedPoints

    return {
      id: group.id,
      key: group.key,
      name: group.name_zh,
      short: group.short_zh,
      totalPoints,
      collectedPoints,
      percentage: Math.floor((collectedPoints / totalPoints) * 100),
    }
  })

  return {
    totalPoints: totalPointsAcrossAll,
    collectedPoints: collectedPointsAcrossAll,
    totalPercentage: Math.floor((collectedPointsAcrossAll / totalPointsAcrossAll) * 100) || 0,
    groups: groupStats
  }
})
</script>

<template>
  <div id="pr-main" class="flex gap-4">
    <div class="flex-1 min-w-0">
      <n-h1 id="summary">汇总数据</n-h1>
      <div>
        <n-card class="bg-primary/5!" :bordered="false">
          <div class="flex flex-wrap items-center justify-around gap-12 p-2">
            <div class="my-auto flex flex-col items-center gap-4">
              <n-progress
                type="circle"
                :status="relicStats.totalPercentage === 100 ? 'success' : 'info'"
                :percentage="relicStats.totalPercentage"
                :stroke-width="8"
                class="w-36!"
              >
                <div class="text-center">
                  <div class="text-3xl font-black text-primary">{{ relicStats.totalPercentage }}%</div>
                  <div class="text-xs font-medium opacity-50 tracking-wider">
                    <span>{{ relicStats.collectedPoints }}</span>
                    <span class="select-none"> / </span>
                    <span>{{ relicStats.totalPoints }}</span>
                  </div>
                </div>
              </n-progress>
            </div>

            <div class="flex-1 min-w-75">
              <div class="mb-4 text-slate-500 font-bold flex items-center gap-2 uppercase tracking-wide text-xs">
                <n-icon :size="18"><InsertChartOutlined /></n-icon>
                各组进度
              </div>
              <n-grid :x-gap="16" :y-gap="16" :cols="3" responsive="screen" item-responsive>
                <n-grid-item v-for="group in relicStats.groups" :key="group.id" span="3 m:1">
                  <n-card size="small" embedded>
                    <div class="flex justify-between items-center mb-2">
                      <div class="font-bold text-sm">{{ group.name }}</div>
                      <div class="text-xs opacity-60" style="font-family: 'Michroma', sans-serif;">
                        {{ group.collectedPoints }}／{{ group.totalPoints }}
                      </div>
                    </div>
                    <n-progress
                      type="line"
                      :status="group.percentage === 100 ? 'success' : undefined"
                      :percentage="group.percentage"
                      border-radius="4px"
                      :height="14"
                    />
                  </n-card>
                </n-grid-item>
              </n-grid>
            </div>
          </div>
        </n-card>
      </div>

      <n-h1>收集表格</n-h1>
      <template
        v-for="relicGroup in relicGroups"
        :key="relicGroup.key"
      >
        <n-h2 :id="relicGroup.key">
          {{ relicGroup.name_zh }}
          <div class="ml-2 flex items-center">
            <PatchTag :patch="relicGroup.patch" :belong="relicGroup.name_zh" />
          </div>
        </n-h2>
        <ProgressTable
          :relicGroup="relicGroup"
        />
      </template>
    </div>

    <div class="w-48">
      <n-anchor
        affix
        listen-to="#pr-main"
        :trigger-top="88"
      >
        <n-anchor-link title="汇总数据" href="#summary" />

        <n-anchor-link
          v-for="relicGroup in relicGroups"
          :key="relicGroup.key"
          :title="relicGroup.name_zh"
          :href="`#${relicGroup.key}`"
        />
      </n-anchor>
    </div>
  </div>
</template>

<style scoped>
:deep(.n-progress.n-progress--line .n-progress-icon.n-progress-icon--as-text) {
  text-align: right;
}

h2 {
  display: flex;
  align-items: baseline;
}
</style>
