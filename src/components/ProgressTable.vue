<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import type { TableColumn } from 'naive-ui/es/data-table/src/interface'
import ProgressTableCell from './ProgressTableCell.vue'
import { XivJobs, XivUnpackedItems, type RelicDataGroup } from '@/assets/data'
import { useStore } from '@/stores'
import { renderTooltip } from '@/utils/ui'

const store = useStore()

const stillShowTable = ref(false)

interface ProgressTableProps {
  relicGroup: RelicDataGroup
  /** 指定要展示的阶段index。如果不指定则展示所有阶段。 */
  showStageIndex?: number
}
const props = defineProps<ProgressTableProps>()

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
  return props.relicGroup.targets.map((targetItems, stageIndex) => {
    return {
      stageIndex: stageIndex,
      stageName_zh: props.relicGroup.stages_zh[stageIndex],
      targetItems: targetItems,
    }
  }).filter(row => {
    if (props.showStageIndex === undefined) {
      return true
    }
    return row.stageIndex === props.showStageIndex
  })
})

const columns = computed<DataTableColumns<TableRow>>(() => [
  {
    title: '阶段',
    key: 'stage',
    width: tableWidths.stage,
    fixed: 'left',
    render(row) {
      return h(
        'div', null,
        [
          h('div', null, row.stageName_zh),
          h('div', { class: 'text-right text-xs' }, `iLv ${XivUnpackedItems[row.targetItems[0]].ilv}`)
        ]
      )
    }
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
      render(row) {
        return h(
          ProgressTableCell,
          {
            hide: !props.relicGroup.stage_prereqs?.[row.stageIndex],
            relicId: props.relicGroup.id,
            rowIndex: row.stageIndex,
            itemId: 0,
            itemCollected: store.userData.relicPreProgress[props.relicGroup.id] >= row.stageIndex,
            onCollectCheckboxClicked: (rowIndex: number) => {
              const rowWasChecked = store.userData.relicPreProgress[props.relicGroup.id] >= row.stageIndex
              if (rowWasChecked) {
                store.userData.relicPreProgress[props.relicGroup.id] = rowIndex - 1
              } else {
                store.userData.relicPreProgress[props.relicGroup.id] = rowIndex
              }
              store.updateUserData()
            }
          }
        )
      }
    }
  ] : []) as TableColumn<TableRow>[],
  ...props.relicGroup.jobs.map((job, jobIndex): TableColumn<TableRow> => {
    return {
      //title: XivJobs[job].job_name_zh,
      title() {
        return renderTooltip(
          h('div', { class: 'w-full h-full flex items-center justify-center' }, [
            h('img', {
              src: XivJobs[job].job_icon_url,
              width: 24,
              height: 24,
              class: 'flex',
            }),
          ]),
          XivJobs[job].job_name_zh
        )
      },
      key: `job-${job}`,
      width: tableWidths.job,
      align: 'center',
      render(row) {
        return h(
          ProgressTableCell,
          {
            relicId: props.relicGroup.id,
            rowIndex: row.stageIndex,
            itemId: row.targetItems[jobIndex],
            itemCollected: store.userData.relicProgress[props.relicGroup.id][job] >= row.stageIndex,
            onCollectCheckboxClicked: (rowIndex: number) => {
              const rowWasChecked = store.userData.relicProgress[props.relicGroup.id][job] >= row.stageIndex
              if (rowWasChecked) {
                store.userData.relicProgress[props.relicGroup.id][job] = rowIndex - 1
              } else {
                store.userData.relicProgress[props.relicGroup.id][job] = rowIndex
              }
              store.updateUserData()
            }
          }
        )
      }
    }
  }),
  { title: '', key: 'empty', } // 空白列是必须的，否则不同表格之间列宽可能会不一致
])

const relicAllCollected = computed(() => {
  return Object.values(store.userData.relicProgress[props.relicGroup.id])
    .every(stageIndex => stageIndex >= props.relicGroup.targets.length - 1)
})
const allCollectedAlertData = computed(() => {
  const progressData = Object.values(store.userData.relicProgress[props.relicGroup.id])
  if (props.showStageIndex !== undefined) {
    return {
      show: progressData.every(stageIndex => stageIndex >= props.showStageIndex!),
      title: `此阶段已全收集！`,
    }
  } else {
    return {
      show: relicAllCollected.value,
      title: `「${props.relicGroup.name_zh}」已全收集！`,
    }
  }
})
</script>

<template>
  <n-alert
    v-if="allCollectedAlertData.show && !stillShowTable"
    type="success"
    :title="allCollectedAlertData.title"
  >
    如果仍想查看收集表格，请点击
    <a href="javascript:void(0)" class="p-[2px 0]!" @click="stillShowTable = true">这里</a>
    。
  </n-alert>
  <div v-else class="progress-table">
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
