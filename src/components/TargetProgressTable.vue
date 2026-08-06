<script setup lang="ts">
import { computed, h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import type { TableColumn } from 'naive-ui/es/data-table/src/interface'
import { XivJobs, XivUnpackedItems, type RelicDataGroup } from '@/assets/data'
import { renderTooltip } from '@/utils/ui'

interface TargetProgressTableProps {
  relicGroup: RelicDataGroup
  targetProgress: Record<number, number>
  targetPreProgress: number
}
const props = defineProps<TargetProgressTableProps>()

const emits = defineEmits<{
  (e: 'update:targetProgress', value: Record<number, number>): void
  (e: 'update:targetPreProgress', value: number): void
}>()

interface TableRow {
  stageIndex: number
  stageName_zh: string
  targetItems: number[]
}

const tableWidths = {
  stage: 128,
  job: 60,
}

const tableScrollX = computed(() => {
  return tableWidths.stage
    + props.relicGroup.jobs.length * tableWidths.job
    + (props.relicGroup.stage_prereqs ? tableWidths.job : 0)
})

const tableData = computed<TableRow[]>(() => {
  return props.relicGroup.targets.map((targetItems, stageIndex) => ({
    stageIndex,
    stageName_zh: props.relicGroup.stages_zh[stageIndex],
    targetItems,
  }))
})

const columns = computed<DataTableColumns<TableRow>>(() => [
  {
    title: '阶段',
    key: 'stage',
    width: tableWidths.stage,
    fixed: 'left',
    render(row) {
      return h('div', null, [
        h('div', null, row.stageName_zh),
        h('div', { class: 'text-right text-xs opacity-60' }, `iLv ${XivUnpackedItems[row.targetItems[0]]?.ilv || ''}`),
      ])
    },
  },
  ...(props.relicGroup.stage_prereqs ? [
    {
      title() {
        return renderTooltip(
          h('div', { class: 'w-full h-full flex items-center justify-center' }, [
            h('img', {
              src: '/image/game-job/companion/none.png',
              width: 24,
              height: 24,
              class: 'flex',
            }),
          ]),
          '前置'
        )
      },
      key: 'prereqs',
      width: tableWidths.job,
      align: 'center',
      render(row: TableRow) {
        if (!props.relicGroup.stage_prereqs?.[row.stageIndex]) {
          return null
        }
        const checked = props.targetPreProgress >= row.stageIndex
        return h(
          'div',
          { class: 'w-full flex justify-center py-2' },
          h('input', {
            type: 'checkbox',
            checked,
            class: 'w-4 h-4 cursor-pointer accent-primary',
            onChange: () => {
              const nextVal = checked ? row.stageIndex - 1 : row.stageIndex
              emits('update:targetPreProgress', nextVal)
            },
          })
        )
      },
    },
  ] : []) as TableColumn<TableRow>[],
  ...props.relicGroup.jobs.map((job): TableColumn<TableRow> => {
    return {
      title() {
        return renderTooltip(
          h('div', { class: 'w-full h-full flex items-center justify-center' }, [
            h('img', {
              src: XivJobs[job]?.job_icon_url,
              width: 24,
              height: 24,
              class: 'flex',
            }),
          ]),
          XivJobs[job]?.job_name_zh || ''
        )
      },
      key: `job-${job}`,
      width: tableWidths.job,
      align: 'center',
      render(row: TableRow) {
        const currentTargetStage = props.targetProgress[job] ?? -1
        const checked = currentTargetStage >= row.stageIndex
        return h(
          'div',
          { class: 'w-full flex justify-center py-2' },
          h('input', {
            type: 'checkbox',
            checked,
            class: 'w-4 h-4 cursor-pointer accent-primary',
            onChange: () => {
              const newProgress = { ...props.targetProgress }
              newProgress[job] = checked ? row.stageIndex - 1 : row.stageIndex
              emits('update:targetProgress', newProgress)
            },
          })
        )
      },
    }
  }),
  { title: '', key: 'empty' },
])
</script>

<template>
  <div class="progress-table">
    <n-data-table
      striped
      :columns="columns"
      :data="tableData"
      :scroll-x="tableScrollX"
    />
  </div>
</template>

<style scoped>
.progress-table :deep(.n-data-table) {
  --n-td-padding: 6px 12px !important;
}
</style>
