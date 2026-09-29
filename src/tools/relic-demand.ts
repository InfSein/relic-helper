import {
  type RelicDataGroup,
  XivUnpackedRecipes,
  XivUnpackedTradeMap,
} from '@/assets/data'
import { getItemInfo, type ItemInfo } from './item'

export interface DemandItemInfo {
  itemId: number
  itemInfo: ItemInfo
  needCount: number
  category: 'tomestone' | 'craft' | 'other'
  tradeDetails?: {
    costId: number
    costName: string
    costCount: number
    receiveCount: number
    totalTomestonesNeeded: number
  }
}

export interface TomestoneSummary {
  costId: number
  costName: string
  totalNeeded: number
}

export interface RelicDemandResult {
  tomestoneItems: DemandItemInfo[]
  craftItems: DemandItemInfo[]
  otherItems: DemandItemInfo[]
  tomestoneSummaries: TomestoneSummary[]
  hasAnyDemand: boolean
}

/**
 * 内部分类与归类辅助函数，支持按照道具 ID 升序排序
 */
const classifyAndSortItems = (itemNeedMap: Map<number, number>): RelicDemandResult => {
  const tomestoneItems: DemandItemInfo[] = []
  const craftItems: DemandItemInfo[] = []
  const otherItems: DemandItemInfo[] = []
  const tomestoneTotalsMap = new Map<number, { costName: string; totalNeeded: number }>()

  itemNeedMap.forEach((needCount, itemId) => {
    if (needCount <= 0) return

    const itemInfo = getItemInfo(itemId)
    const tradeInfo = XivUnpackedTradeMap[itemId]

    // 检查是否直接就是点数货币 (28: 诗学, 48: 数理)
    if (itemId === 28 || itemId === 48) {
      const costName = itemInfo.name_zh || (itemId === 28 ? '亚拉戈诗学神典石' : '亚拉戈数理神典石')
      tomestoneItems.push({
        itemId,
        itemInfo,
        needCount,
        category: 'tomestone',
        tradeDetails: {
          costId: itemId,
          costName,
          costCount: 1,
          receiveCount: 1,
          totalTomestonesNeeded: needCount,
        },
      })

      // 汇总点数需求
      const currentTomestoneTotal = tomestoneTotalsMap.get(itemId) || { costName, totalNeeded: 0 }
      currentTomestoneTotal.totalNeeded += needCount
      tomestoneTotalsMap.set(itemId, currentTomestoneTotal)
    }
    // 检查是否为点数兑换道具 (costId为 28: 诗学 或 48: 数理)
    else if (tradeInfo && (tradeInfo.costId === 28 || tradeInfo.costId === 48)) {
      const costItemInfo = getItemInfo(tradeInfo.costId)
      const costName = costItemInfo.name_zh || (tradeInfo.costId === 28 ? '亚拉戈诗学神典石' : '亚拉戈数理神典石')
      const receiveCount = tradeInfo.receiveCount || 1
      const costCount = tradeInfo.costCount
      const totalTomestonesNeeded = Math.ceil(needCount / receiveCount) * costCount

      tomestoneItems.push({
        itemId,
        itemInfo,
        needCount,
        category: 'tomestone',
        tradeDetails: {
          costId: tradeInfo.costId,
          costName,
          costCount,
          receiveCount,
          totalTomestonesNeeded,
        },
      })

      // 汇总点数需求
      const currentTomestoneTotal = tomestoneTotalsMap.get(tradeInfo.costId) || { costName, totalNeeded: 0 }
      currentTomestoneTotal.totalNeeded += totalTomestonesNeeded
      tomestoneTotalsMap.set(tradeInfo.costId, currentTomestoneTotal)
    }
    // 检查是否为制作道具
    else if (!!XivUnpackedRecipes[itemId] || !!itemInfo.craftInfo?.recipeId) {
      craftItems.push({
        itemId,
        itemInfo,
        needCount,
        category: 'craft',
      })
    }
    // 其他道具
    else {
      otherItems.push({
        itemId,
        itemInfo,
        needCount,
        category: 'other',
      })
    }
  })

  // 按道具 ID 升序排序
  tomestoneItems.sort((a, b) => a.itemId - b.itemId)
  craftItems.sort((a, b) => a.itemId - b.itemId)
  otherItems.sort((a, b) => a.itemId - b.itemId)

  const tomestoneSummaries: TomestoneSummary[] = Array.from(tomestoneTotalsMap.entries()).map(([costId, val]) => ({
    costId,
    costName: val.costName,
    totalNeeded: val.totalNeeded,
  }))

  const hasAnyDemand = tomestoneItems.length > 0 || craftItems.length > 0 || otherItems.length > 0

  return {
    tomestoneItems,
    craftItems,
    otherItems,
    tomestoneSummaries,
    hasAnyDemand,
  }
}

/**
 * 根据当前进度与目标进度计算所需道具并分组归类
 */
export const calcRelicDemand = (
  group: RelicDataGroup,
  currentProgress: Record<number, number>,
  currentPreProgress: number,
  targetProgress: Record<number, number>,
  targetPreProgress: number
): RelicDemandResult => {
  const itemNeedMap = new Map<number, number>()

  // 1. 统计前置任务物品需求
  if (group.stage_prereqs) {
    group.stage_prereqs.forEach((prereqItems, stageIndex) => {
      if (!prereqItems || prereqItems.length === 0) return
      if (targetPreProgress >= stageIndex && currentPreProgress < stageIndex) {
        prereqItems.forEach(([itemId, count]) => {
          const currentNeed = itemNeedMap.get(itemId) || 0
          itemNeedMap.set(itemId, currentNeed + count)
        })
      }
    })
  }

  // 2. 统计各职业各阶段物品需求
  group.jobs.forEach(jobId => {
    const currStage = currentProgress[jobId] ?? -1
    const targStage = targetProgress[jobId] ?? -1
    if (targStage > currStage) {
      for (let s = currStage + 1; s <= targStage; s++) {
        const reqs = group.stage_reqs[s]
        if (reqs && reqs.length > 0) {
          reqs.forEach(([itemId, count]) => {
            const currentNeed = itemNeedMap.get(itemId) || 0
            itemNeedMap.set(itemId, currentNeed + count)
          })
        }
      }
    }
  })

  return classifyAndSortItems(itemNeedMap)
}

/**
 * 专门针对“仅统计单阶段”的需求计算
 * 不需要考虑之前未收集的阶段，只统计该 stageIndex 本身尚缺少的道具
 */
export const calcSingleStageDemand = (
  group: RelicDataGroup,
  currentProgress: Record<number, number>,
  currentPreProgress: number,
  stageIndex: number
): RelicDemandResult => {
  const itemNeedMap = new Map<number, number>()

  // 1. 阶段前置需求
  if (group.stage_prereqs?.[stageIndex]) {
    if (currentPreProgress < stageIndex) {
      group.stage_prereqs[stageIndex]!.forEach(([itemId, count]) => {
        const currentNeed = itemNeedMap.get(itemId) || 0
        itemNeedMap.set(itemId, currentNeed + count)
      })
    }
  }

  // 2. 该阶段各职业需求
  const reqs = group.stage_reqs[stageIndex]
  if (reqs && reqs.length > 0) {
    group.jobs.forEach(jobId => {
      const currStage = currentProgress[jobId] ?? -1
      // 只要该职业当前还没有到达/完成 stageIndex
      if (currStage < stageIndex) {
        reqs.forEach(([itemId, count]) => {
          const currentNeed = itemNeedMap.get(itemId) || 0
          itemNeedMap.set(itemId, currentNeed + count)
        })
      }
    })
  }

  return classifyAndSortItems(itemNeedMap)
}
