import { describe, expect, it } from 'vitest'
import { relicData } from '@/assets/data'
import type { UserData } from '@/types/user-data'
import { decodeProgress, encodeProgress } from '../progress-codec'

const groups = Object.values(relicData.relicGroups).sort((a, b) => a.id - b.id)

/** 构造一份进度数据，`pick` 决定每个职业 / 前置的阶段值 */
const buildUserData = (pick: (stageCount: number, i: number) => number): UserData => {
  const relicProgress: UserData['relicProgress'] = {}
  const relicPreProgress: UserData['relicPreProgress'] = {}
  for (const group of groups) {
    relicProgress[group.id] = Object.fromEntries(
      group.jobs.map((jobId, i) => [jobId, pick(group.targets.length, i)])
    )
    if (group.stage_prereqs) {
      relicPreProgress[group.id] = pick(group.stage_prereqs.length, group.id)
    }
  }
  return {
    relicProgress,
    relicPreProgress,
    relicTargetProgress: {},
    relicTargetPreProgress: {},
    demandItemOwned: {},
  }
}

const toBytes = (code: string) => {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0))
}
const fromBytes = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

describe('progress-codec', () => {
  it('所有肝武的阶段数都能放进 4-bit（v1 协议前提）', () => {
    for (const group of groups) {
      // 编码值 = stageIndex + 1，最大为 targets.length，必须 <= 15
      expect(group.targets.length, group.key).toBeLessThanOrEqual(15)
      if (group.stage_prereqs) {
        expect(group.stage_prereqs.length, group.key).toBeLessThanOrEqual(15)
      }
    }
  })

  it.each([
    ['全部未开始', () => -1],
    ['全部完成', (n: number) => n - 1],
    ['混合进度', (n: number, i: number) => (i % (n + 1)) - 1],
  ])('编码后再解码保持一致：%s', (_, pick) => {
    const data = buildUserData(pick)
    const decoded = decodeProgress(encodeProgress(data))
    expect(decoded.relicProgress).toEqual(data.relicProgress)
    expect(decoded.relicPreProgress).toEqual(data.relicPreProgress)
  })

  it('输出为无补位的 Base64url 字符串', () => {
    const code = encodeProgress(buildUserData((n, i) => (i * 7) % n))
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('缺失的进度按未开始 (-1) 处理', () => {
    const data = buildUserData(() => -1)
    data.relicProgress = {}
    data.relicPreProgress = {}
    const decoded = decodeProgress(encodeProgress(data))
    expect(decoded.relicProgress).toEqual(buildUserData(() => -1).relicProgress)
  })

  it('超出范围的数值被截断在 -1 ~ 14 之间', () => {
    const data = buildUserData(() => -1)
    const g = groups[0]
    data.relicProgress[g.id][g.jobs[0]] = 99
    data.relicProgress[g.id][g.jobs[1]] = -5
    const decoded = decodeProgress(encodeProgress(data))
    expect(decoded.relicProgress[g.id][g.jobs[0]]).toBe(14)
    expect(decoded.relicProgress[g.id][g.jobs[1]]).toBe(-1)
  })

  it('忽略首尾空白', () => {
    const data = buildUserData(() => 0)
    expect(decodeProgress(`  ${encodeProgress(data)}\n`).relicProgress).toEqual(data.relicProgress)
  })

  describe('非法输入', () => {
    it('空字符串', () => {
      expect(() => decodeProgress('   ')).toThrow('导入字符串不能为空')
    })

    it('无法解析的字符', () => {
      expect(() => decodeProgress('!!!@@@')).toThrow()
    })

    it('不支持的版本号', () => {
      const bytes = toBytes(encodeProgress(buildUserData(() => 0)))
      bytes[0] = 0x7f
      expect(() => decodeProgress(fromBytes(bytes))).toThrow('不支持的编码版本: 0x7f')
    })

    it('数据被截断', () => {
      const bytes = toBytes(encodeProgress(buildUserData(() => 0)))
      expect(() => decodeProgress(fromBytes(bytes.slice(0, 3)))).toThrow('导入码数据不完整')
    })
  })
})
