// #region Import for other ts files
// #endregion

export const relicRoutes = [
  'relic', 'anima', 'eureka', 'resist', 'mdvl', 'phantom',
] as const
export type RelicRouteKey = typeof relicRoutes[number]

// #region Unpacks

import JsonXivUnpackedGatheringItems from './unpacks/gathering-items.json'
export const XivUnpackedGatheringItems = JsonXivUnpackedGatheringItems as Record<number, {
  level: number
  star: number
  /**
   * 采集点类型I
   * * 0=采掘,1=碎石,2=采伐,3=割草
   */
  type: number
  /**
   * 采集点类型II
   * todo ??待考察 * 1=常规点，2=收藏品，3=工艺馆，4=灵砂，5=传承录
   */
  pointType: number
  pointLevel: number
  territory: number
  place: number
  coords: { x: string, y: string }
  bonuses: number[][]
  difficulty: number[]
  popType: "normal" | "legendary" | "ephemeral"
  requirement?: number
  popTime?: {
    start1: string
    end1: string
    start2: string
    end2: string
    start3: string
    end3: string
  }
  /**
   * 采集点是否需要习得传承录方可采集
   * * 为数字时，代表所需传承录的道具ID
   * * 为 undefined 时，代表不需要传承录或缺失数据
   */
  folkloreBook?: number
}>

import JsonRelicData from './unpacks/relicdata.json'
export interface relicData {
  relicGroups: Record<number, RelicDataGroup>
}
export interface RelicDataGroup {
  id: number
  key: string
  rtkey: RelicRouteKey
  name_zh: string
  short_zh: string
  patch: string
  jobs: number[]
  stages_zh: string[]
  targets: number[][]
  stage_reqs: number[][][]
  stage_prereqs: (number[][] | null)[] | null
}
export const relicData = JsonRelicData as relicData
export const relicGroupMapByRtKey = Object.fromEntries(
  Object.values(relicData.relicGroups).map((group) => [group.rtkey, group])
) as Record<RelicRouteKey, RelicDataGroup>

import JsonRelicNotes from './unpacks/relic-notes.json'
export interface RelicNote {
  id: number
  icon: number
  name: string[]
  enemies: {
    id: number
    name: string[]
    count: number
    icon: number
    location: number[]
  }[]
  dungeons: {
    id: number
    level: number
    dname: string[]
    mname: string[]
    icon: number
    location: number[]
  }[]
  fates: {
    id: number
    name: string[]
    icon: number
    location: number[]
  }[]
  leves: {
    id: number
    name: string[]
    icon: number
    type: number
    npc: {
      name: string[]
      location: number[]
    }
  }[]
}
export const relicNotes = JsonRelicNotes as Record<number, RelicNote>

import JsonXivUnpackedItems from './unpacks/items.json'
export interface XivUnpackedItem {
  rids: number[]
  id: number
  name: string[]
  desc: string[]
  icon: number
  ilv: number
  elv: number
  uc: number
  sc: number
  so: number
  jobs: number
  hqable: boolean
  tradable: boolean
  collectable: boolean
  rarity: number
  p: string
  bpm: number[][]
  apm: any[][]
  // 允许扩展
  [key: string]: any

}
export const XivUnpackedItems = JsonXivUnpackedItems as Record<number, XivUnpackedItem>

import JsonXivUnpackedMaps from './unpacks/maps.json'
export interface XivUnpackedMap {
  regionId: number
  zoneId: number
  placeId: number
  weatherRate: number
  mapId: number
  mapSrc: string
  aetherytes: {
    placeId: number
    x: number
    y: number
  }[]
}
export const XivUnpackedMaps = JsonXivUnpackedMaps as Record<number, XivUnpackedMap>

import JsonXivUnpackedPlaceNames from './unpacks/place-name.json'
/**
 * 解包的地点名称
 * * `key`: placeID
 * * `value`: placeNames，顺序 [日文, 英文, 中文]
 */
export const XivUnpackedPlaceNames = JsonXivUnpackedPlaceNames as Record<number, string[]>

import JsonXivUnpackedRecipes from './unpacks/recipes.json'
export interface XivUnpackedRecipe {
  id: number
  clv: number
  star: number
  target: number
  rlv: number
  job: number
  yields: number
  sp: number[]
  qsable: boolean
  hqable: boolean
  thresholds: number[]
  srb: number
  materials: number[]
  crystals: number[]
}
export const XivUnpackedRecipes = JsonXivUnpackedRecipes as Record<number, XivUnpackedRecipe>

import JsonXivUnpackedTerritories from './unpacks/territory.json'
export const XivUnpackedTerritories = JsonXivUnpackedTerritories as Record<number, number[]>

export interface ItemTradeInfo {
  receiveCount: number
  receive2Id?: number
  receive2Count?: number
  costId: number,
  costCount: number
  cost2Id?: number
  cost2Count?: number
  cost3Id?: number
  cost3Count?: number
  tradeAlter?: ItemTradeInfo
}
import JsonXivUnpackedTradeMap from './unpacks/trade-map.json'
export const XivUnpackedTradeMap = JsonXivUnpackedTradeMap as Record<number, ItemTradeInfo>
// #endregion

// #region Other
import JsonXivAttributes from './xiv-attributes.json'
export const XivAttributes = JsonXivAttributes as Record<number, {
  name_zh: string
  name_en: string
  name_ja: string
  name_de: string
  name_fr: string
}>

import JsonXivItemTypes from './xiv-item-types.json'
export const XivItemTypes = JsonXivItemTypes as Record<number, {
  id: number
  icon: number
  name: string[]
  /** 顺序号，固定2个元素。第1个为majorOrder，第2个为minorOrder。 */
  order: number[]
}>

import JsonXivJobs from './xiv-jobs.json'
export interface XivJob {
  job_id: number
  short_name: string
  job_name_en: string
  job_name_zh: string
  job_name_ja: string
  job_icon_url: string
}
export const XivJobs = JsonXivJobs as Record<number, XivJob>
// #endregion
