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

  return userData
}
