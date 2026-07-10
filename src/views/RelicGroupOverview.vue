<script setup lang="ts">
import { relicGroupMapByRtKey, type RelicRouteKey } from '@/assets/data'
import XivMarkdown from '@/components/ui/XivMarkdown.vue'
import ProgressTable from '@/components/ProgressTable.vue'
import { stageGuides, summaries } from '@/assets/contents'
import { useStore } from '@/stores'

const router = useRouter()

const groupKey = computed(() => {
  return router.currentRoute.value.params.groupKey as RelicRouteKey
})
const groupData = computed(() => {
  return relicGroupMapByRtKey[groupKey.value]
})

watch(groupData, (groupData) => {
  if (!groupData) {
    router.replace('/404')
  }
}, { immediate: true })

const stages = computed(() => {
  return groupData.value?.targets?.map((target, stageIndex) => {
    return {
      key: `${groupKey.value}-${stageIndex}`,
      index: stageIndex,
      name_zh: groupData.value.stages_zh[stageIndex],
      targets: target,
      jobs: groupData.value.jobs,
      reqs: groupData.value.stage_reqs[stageIndex],
      prereqs: groupData.value.stage_prereqs?.[stageIndex],
      guide: stageGuides[groupKey.value][stageIndex] ?? ''
    }
  }) ?? []
})

const store = useStore()

const defaultExpandedKeys = computed(() => {
  const group = groupData.value
  if (!group) return []
  const progressData = store.userData.relicProgress[group.id]
  if (!progressData) return stages.value.map(s => s.key)
  return stages.value
    .filter(stage => {
      return !Object.values(progressData)
        .every(progress => progress >= stage.index)
    })
    .map(stage => stage.key)
})
</script>

<template>
  <div class="p-4">
    <n-h1>{{ groupData?.name_zh }} — 概览</n-h1>
    <XivMarkdown v-if="summaries[groupKey]" :content="summaries[groupKey]" />
    <template v-for="stage in stages" :key="stage.key">
      <n-collapse v-if="stage.guide" arrow-placement="right" class="n-collapse-fix" :default-expanded-names="defaultExpandedKeys.includes(stage.key) ? [stage.key] : []">
        <n-collapse-item :name="stage.key">
          <template #header>
            <n-h2>{{ stage.name_zh }}</n-h2>
          </template>
          <XivMarkdown :content="stage.guide" />
        </n-collapse-item>
      </n-collapse>
      <n-h2 v-else>{{ stage.name_zh }}</n-h2>
      <ProgressTable
        :relicGroup="groupData"
        :show-stage-index="stage.index"
      />
    </template>
  </div>
</template>

<style scoped>
.n-collapse-fix {
  margin: 28px 0 20px 0;
}
.n-collapse-fix :deep(.n-collapse-item) {
  border-bottom: none;
}
.n-collapse-fix :deep(.n-collapse-item__header) {
  padding: 0;
}
.n-collapse-fix :deep(.n-collapse-item__content) {
  padding-top: 0;
}
.n-collapse-fix :deep(.n-h2) {
  margin-bottom: 0;
}
</style>
