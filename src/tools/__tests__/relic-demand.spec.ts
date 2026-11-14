import { describe, expect, it } from 'vitest'
import type { RelicDataGroup } from '@/assets/data'
import { isTomestone } from '@/constants/tomestones'
import {
  applyOwnedToDemand,
  calcRelicDemand,
  calcSingleStageDemand,
  getRemainingCount,
} from '../relic-demand'

// 使用真实解包数据中的道具 ID：
const POETICS = 28 // 亚拉戈诗学神典石
const SCALEPOWDER = 30273 // 萨维奈灵鳞粉：250 诗学兑换 1 个
const ARCANITE = 47750 // 新月矿石：500 数理兑换 1 个
const PEISTE_LEATHER = 5284 // 毒蜥蜴革：可制作
const ASTRAL_NODULE = 13575 // 星极水晶：非点数兑换、不可制作

const JOB_A = 101
const JOB_B = 102

/** 构造一个测试用肝武组，只填写需求计算用到的字段 */
const makeGroup = (overrides: Partial<RelicDataGroup> = {}): RelicDataGroup => ({
  id: 999,
  key: 'test',
  rtkey: 'relic',
  name_zh: '测试武器',
  short_zh: '测试',
  patch: '0.0',
  jobs: [JOB_A, JOB_B],
  stages_zh: ['一', '二', '三'],
  targets: [[1, 2], [3, 4], [5, 6]],
  stage_reqs: [
    [[SCALEPOWDER, 1]],
    [[ASTRAL_NODULE, 2], [PEISTE_LEATHER, 3]],
    [[ARCANITE, 1], [POETICS, 100]],
  ],
  stage_prereqs: null,
  ...overrides,
})

const counts = (result: ReturnType<typeof calcRelicDemand>) => Object.fromEntries(
  [...result.tomestoneItems, ...result.craftItems, ...result.otherItems]
    .map(item => [item.itemId, item.needCount])
)

describe('calcRelicDemand', () => {
  it('汇总 (当前, 目标] 区间内各职业的阶段需求', () => {
    const result = calcRelicDemand(
      makeGroup(),
      { [JOB_A]: -1, [JOB_B]: 0 },
      -1,
      { [JOB_A]: 1, [JOB_B]: 2 },
      -1,
    )
    // JOB_A: 阶段 0、1；JOB_B: 阶段 1、2
    expect(counts(result)).toEqual({
      [SCALEPOWDER]: 1,
      [ASTRAL_NODULE]: 4,
      [PEISTE_LEATHER]: 6,
      [ARCANITE]: 1,
      [POETICS]: 100,
    })
    expect(result.hasAnyDemand).toBe(true)
  })

  it('目标不高于当前进度时无需求', () => {
    const result = calcRelicDemand(
      makeGroup(),
      { [JOB_A]: 2, [JOB_B]: 1 },
      -1,
      { [JOB_A]: 1, [JOB_B]: 1 },
      -1,
    )
    expect(result.hasAnyDemand).toBe(false)
    expect(result.tomestoneSummaries).toEqual([])
  })

  it('缺失的职业进度按未开始 / 不需要处理', () => {
    const result = calcRelicDemand(makeGroup(), {}, -1, { [JOB_A]: 0 }, -1)
    expect(counts(result)).toEqual({ [SCALEPOWDER]: 1 })
  })

  it('前置任务需求只统计 (当前前置, 目标前置] 区间', () => {
    const group = makeGroup({
      stage_prereqs: [null, [[ASTRAL_NODULE, 5]], [[ASTRAL_NODULE, 7]]],
    })
    const result = calcRelicDemand(group, {}, 0, {}, 1)
    expect(counts(result)).toEqual({ [ASTRAL_NODULE]: 5 })
  })

  it('按点数 / 制作 / 其他分类，并按道具 ID 升序排序', () => {
    const result = calcRelicDemand(
      makeGroup(),
      {},
      -1,
      { [JOB_A]: 2, [JOB_B]: 2 },
      -1,
    )
    expect(result.tomestoneItems.map(i => i.itemId)).toEqual([POETICS, SCALEPOWDER, ARCANITE])
    expect(result.craftItems.map(i => i.itemId)).toEqual([PEISTE_LEATHER])
    expect(result.otherItems.map(i => i.itemId)).toEqual([ASTRAL_NODULE])
  })

  it('点数汇总按兑换价格换算并按货币分别累计', () => {
    const result = calcRelicDemand(
      makeGroup(),
      {},
      -1,
      { [JOB_A]: 2, [JOB_B]: 2 },
      -1,
    )
    const summary = Object.fromEntries(result.tomestoneSummaries.map(s => [s.costId, s.totalNeeded]))
    // 诗学：灵鳞粉 2 × 250 + 直接需求 200；数理：新月矿石 2 × 500
    expect(summary).toEqual({ 28: 2 * 250 + 200, 48: 2 * 500 })

    const powder = result.tomestoneItems.find(i => i.itemId === SCALEPOWDER)!
    expect(powder.tradeDetails).toMatchObject({ costId: 28, costCount: 250, receiveCount: 1, totalTomestonesNeeded: 500 })
  })
})

describe('calcSingleStageDemand', () => {
  it('只统计尚未完成该阶段的职业', () => {
    const result = calcSingleStageDemand(makeGroup(), { [JOB_A]: 1, [JOB_B]: -1 }, -1, 1)
    expect(counts(result)).toEqual({ [ASTRAL_NODULE]: 2, [PEISTE_LEATHER]: 3 })
  })

  it('前置未完成时计入该阶段前置需求', () => {
    const group = makeGroup({ stage_prereqs: [null, [[ARCANITE, 2]], null] })
    expect(counts(calcSingleStageDemand(group, { [JOB_A]: 9, [JOB_B]: 9 }, 0, 1)))
      .toEqual({ [ARCANITE]: 2 })
    expect(calcSingleStageDemand(group, { [JOB_A]: 9, [JOB_B]: 9 }, 1, 1).hasAnyDemand)
      .toBe(false)
  })
})

describe('getRemainingCount', () => {
  it.each([
    [10, 3, 7],
    [10, 15, 0],
    [10, undefined, 10],
    [10, -4, 10],
  ])('need=%i owned=%s → %i', (need, owned, expected) => {
    expect(getRemainingCount(need, owned)).toBe(expected)
  })
})

describe('applyOwnedToDemand', () => {
  it('扣除已有数量、移除已满足的道具，并重算点数汇总', () => {
    const base = calcRelicDemand(makeGroup(), {}, -1, { [JOB_A]: 2, [JOB_B]: 2 }, -1)
    const result = applyOwnedToDemand(base, {
      [SCALEPOWDER]: 1,
      [ARCANITE]: 5,
      [POETICS]: 50,
    })
    expect(counts(result)).toEqual({
      [POETICS]: 150,
      [SCALEPOWDER]: 1,
      [ASTRAL_NODULE]: 4,
      [PEISTE_LEATHER]: 6,
    })
    const summary = Object.fromEntries(result.tomestoneSummaries.map(s => [s.costId, s.totalNeeded]))
    expect(summary).toEqual({ 28: 250 + 150 })
  })

  it('不修改原始结果', () => {
    const base = calcRelicDemand(makeGroup(), {}, -1, { [JOB_A]: 0 }, -1)
    applyOwnedToDemand(base, { [SCALEPOWDER]: 1 })
    expect(counts(base)).toEqual({ [SCALEPOWDER]: 1 })
  })
})

describe('isTomestone', () => {
  it('识别诗学与数理神典石', () => {
    expect(isTomestone(28)).toBe(true)
    expect(isTomestone(48)).toBe(true)
    expect(isTomestone(SCALEPOWDER)).toBe(false)
    expect(isTomestone(0)).toBe(false)
  })
})
