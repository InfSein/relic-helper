import { relicData } from '@/assets/data'
import type { UserData } from '@/types/user-data'

/**
 * 肝武进度数据编解码模块
 * 
 * 【编码协议规范 - 版本 0x01】
 * 1. 编码目标：仅导出当前肝武进度（relicProgress 及 relicPreProgress）。
 * 2. 存储格式：[1 字节版本号 0x01] + [按 group 定义顺序打包的 4-bit nibble 数据流]。
 * 3. 单个进度数值转换：stageIndex 范围为 -1 ~ 13（未开始为 -1）。统一做 +1 偏移，转化为 0 ~ 14，存储在 4 个二进制位（nibble）中。
 * 4. 组打包顺序（按 relicData.relicGroups 固定的 id 升序）：
 *    - 如果该组存在 stage_prereqs，则先压入 1 个 4-bit nibble 表示 relicPreProgress[groupId]。
 *    - 依次遍历 group.jobs 中的各个 jobId，压入 1 个 4-bit nibble 表示 relicProgress[groupId][jobId]。
 * 5. 字节流转 Base64url：将 Uint8Array 转化为标准的无补位 Base64url 字符串 (URL Safe)，去除等号并将 +/ 替换为 -_。
 * 
 * 【未来扩展与兼容指南】
 * - 如果已有肝武增加了新阶段：阶段数超过 14 时（4 bits 无法容纳），升级版本号至 0x02，并在 0x02 中改用 8-bit 或变长编码。
 * - 如果新增了全新的肝武组或新增了职业：只要不改变旧版本的数据排列逻辑，可提升版本号至 0x02，解包时先读取 1 字节版本号，分支处理不同版本的字节长度及对应字段映射。
 */

const CURRENT_VERSION = 0x01

/**
 * Uint8Array 转 Base64url 字符串
 */
function uint8ArrayToBase64Url(uint8: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i])
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Base64url 字符串转 Uint8Array
 */
function base64UrlToUint8Array(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * 将当前肝武进度编码为短字符串
 */
export function encodeProgress(userData: UserData): string {
  // 按 id 升序排列 group
  const sortedGroups = Object.values(relicData.relicGroups).sort((a, b) => a.id - b.id)

  const nibbles: number[] = []

  for (const group of sortedGroups) {
    const gid = group.id
    // 如果有前置，压入前置进度 (stageIndex + 1)
    if (group.stage_prereqs) {
      const preVal = userData.relicPreProgress[gid] ?? -1
      // 限制 0 ~ 15
      const encodedPre = Math.min(Math.max(preVal + 1, 0), 15)
      nibbles.push(encodedPre)
    }

    // 压入各职业进度
    const progressMap = userData.relicProgress[gid] || {}
    for (const jobId of group.jobs) {
      const jobVal = progressMap[jobId] ?? -1
      const encodedJob = Math.min(Math.max(jobVal + 1, 0), 15)
      nibbles.push(encodedJob)
    }
  }

  // 拼接 nibbles 为 Uint8Array
  // 第 0 字节为版本号
  const totalBytes = 1 + Math.ceil(nibbles.length / 2)
  const bytes = new Uint8Array(totalBytes)
  bytes[0] = CURRENT_VERSION

  for (let i = 0; i < nibbles.length; i++) {
    const nibble = nibbles[i] & 0x0f
    const byteIndex = 1 + Math.floor(i / 2)
    if (i % 2 === 0) {
      // 偶数索引存高 4 位
      bytes[byteIndex] |= (nibble << 4)
    } else {
      // 奇数索引存低 4 位
      bytes[byteIndex] |= nibble
    }
  }

  return uint8ArrayToBase64Url(bytes)
}

/**
 * 解码导出的短字符串，恢复进度数据
 * @throws Error 如果字符串无效或版本不匹配
 */
export function decodeProgress(code: string): {
  relicProgress: Record<number, Record<number, number>>
  relicPreProgress: Record<number, number>
} {
  const trimmed = code.trim()
  if (!trimmed) {
    throw new Error('导入字符串不能为空')
  }

  let bytes: Uint8Array
  try {
    bytes = base64UrlToUint8Array(trimmed)
  } catch {
    throw new Error('无效的导入码格式，无法解析为有效字节')
  }

  if (bytes.length < 1) {
    throw new Error('导入数据内容为空')
  }

  const version = bytes[0]
  if (version !== CURRENT_VERSION) {
    throw new Error(`不支持的编码版本: 0x${version.toString(16)}`)
  }

  // 展开 nibbles
  const nibbles: number[] = []
  for (let i = 1; i < bytes.length; i++) {
    const byte = bytes[i]
    nibbles.push((byte >> 4) & 0x0f)
    nibbles.push(byte & 0x0f)
  }

  const sortedGroups = Object.values(relicData.relicGroups).sort((a, b) => a.id - b.id)

  const relicProgress: Record<number, Record<number, number>> = {}
  const relicPreProgress: Record<number, number> = {}

  let nibbleIndex = 0

  for (const group of sortedGroups) {
    const gid = group.id
    relicProgress[gid] = {}

    // 读前置进度
    if (group.stage_prereqs) {
      if (nibbleIndex >= nibbles.length) {
        throw new Error('导入码数据不完整')
      }
      const rawVal = nibbles[nibbleIndex++]
      relicPreProgress[gid] = rawVal - 1
    }

    // 读职业进度
    for (const jobId of group.jobs) {
      if (nibbleIndex >= nibbles.length) {
        throw new Error('导入码数据不完整')
      }
      const rawVal = nibbles[nibbleIndex++]
      relicProgress[gid][jobId] = rawVal - 1
    }
  }

  return {
    relicProgress,
    relicPreProgress,
  }
}
