import { relicRoutes } from '@/assets/data'
import type { RelicRouteKey } from '@/assets/data'

export type ContentLoader = () => Promise<string>

/**
 * 攻略 markdown 按需加载：
 * * 是否存在某篇攻略可同步判断（glob 的 key 在构建期即确定）
 * * 正文在首次需要时才以独立 chunk 异步加载
 */
const modules = {
  summaries: import.meta.glob('./*/summary.md', {
    query: '?raw',
    import: 'default',
  }) as Record<string, ContentLoader>,
  stageGuides: import.meta.glob('./*/stage_*.md', {
    query: '?raw',
    import: 'default',
  }) as Record<string, ContentLoader>,
}

export const summaryLoaders = Object.fromEntries(
  relicRoutes
    .map(key => [key, modules.summaries[`./${key}/summary.md`]] as const)
    .filter(([, loader]) => !!loader)
) as Partial<Record<RelicRouteKey, ContentLoader>>

export const stageGuideLoaders = Object.entries(modules.stageGuides).reduce(
  (acc, [path, loader]) => {
    const match = path.match(/\.\/(.*?)\/stage_(\d+)\.md/)
    if (!match) return acc
    const [, relicKey, stageIndex] = match

    ;(acc[relicKey as RelicRouteKey] ??= {})[
      Number(stageIndex)
    ] = loader

    return acc
  },

  Object.fromEntries(
    relicRoutes.map(key => [key, {}])
  ) as Record<RelicRouteKey, Record<number, ContentLoader>>
)
