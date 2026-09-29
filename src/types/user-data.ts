import { relicData } from '@/assets/data'
import { assignDefaults } from '@/tools'

export interface UserData {
  /**
   * 肝武进度
   * @struct `relicId` -> (`jobId` -> `stageIndex`)
   */
  relicProgress: Record<number, Record<number, number>>
  /**
   * 肝武前置进度
   * @struct `relicId` -> `stageIndex`
   */
  relicPreProgress: Record<number, number>
  /**
   * 肝武目标进度
   * @struct `relicId` -> (`jobId` -> `stageIndex`)
   */
  relicTargetProgress: Record<number, Record<number, number>>
  /**
   * 肝武前置目标进度
   * @struct `relicId` -> `stageIndex`
   */
  relicTargetPreProgress: Record<number, number>
  /**
   * 素材统计：物品已拥有标记
   * @struct `relicGroupId` -> (`itemId` -> 勾选时的需求数量)
   */
  demandItemOwned: Record<number, Record<number, number>>
}

export type UserDataKey = keyof UserData;

const defaultUserData : UserData = {
  relicProgress: Object.fromEntries(
    Object.values(relicData.relicGroups).map(relicGroup => [
      relicGroup.id,
      Object.fromEntries(
        relicGroup.jobs.map(jobId => [jobId, -1])
      )
    ])
  ),
  relicPreProgress: Object.fromEntries(
    Object.values(relicData.relicGroups).map(relicGroup => [
      relicGroup.id,
      -1
    ])
  ),
  relicTargetProgress: Object.fromEntries(
    Object.values(relicData.relicGroups).map(relicGroup => [
      relicGroup.id,
      Object.fromEntries(
        relicGroup.jobs.map(jobId => [jobId, relicGroup.targets.length - 1])
      )
    ])
  ),
  relicTargetPreProgress: Object.fromEntries(
    Object.values(relicData.relicGroups).map(relicGroup => [
      relicGroup.id,
      relicGroup.stage_prereqs ? relicGroup.stage_prereqs.length - 1 : -1
    ])
  ),
  demandItemOwned: Object.fromEntries(
    Object.values(relicData.relicGroups).map(relicGroup => [
      relicGroup.id,
      {}
    ])
  ),
}

export const fixUserData = (userData?: UserData) => {
  // 处理特定环境下的设置项
  if (!userData) {
    userData = {} as UserData
  }
  userData = assignDefaults(defaultUserData, userData || {}) as UserData

  // 处理复杂结构体
  userData.relicProgress = assignDefaults(
    defaultUserData.relicProgress, userData.relicProgress || {}
  ) as Record<number, Record<number, number>>
  userData.relicTargetProgress = assignDefaults(
    defaultUserData.relicTargetProgress, userData.relicTargetProgress || {}
  ) as Record<number, Record<number, number>>
  userData.demandItemOwned = assignDefaults(
    defaultUserData.demandItemOwned, userData.demandItemOwned || {}
  ) as Record<number, Record<number, number>>

  return userData
}
