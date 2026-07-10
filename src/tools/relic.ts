import { relicData, type RelicRouteKey } from "@/assets/data"

export interface RelicItemInfo {
  group: RelicRouteKey
  stageIndex: number
  jobId: number
  stageNeeds: { itemId: number, count: number }[]
}

export const getRelicItemMap = () => {
  const map: Record<number, RelicItemInfo> = {}
  Object.values(relicData.relicGroups).forEach(group => {
    Object.values(group.targets).forEach((stageTargets, stageIndex) => {
      stageTargets.forEach((itemId, jobIndex) => {
        map[itemId] = {
          group: group.rtkey,
          stageIndex,
          jobId: group.jobs[jobIndex],
          stageNeeds: group.stage_reqs?.[stageIndex]?.map(([itemId, count]) => ({ itemId, count })) ?? []
        }
      })
    })
  })
  return map
}
