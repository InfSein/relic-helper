import { relicRoutes } from '@/assets/data'
import type { RelicRouteKey } from '@/assets/data'

const modules = {
  summaries: import.meta.glob('./*/summary.md', {
    query: '?raw',
    import: 'default',
    eager: true
  }) as Record<string, string>,
  stageGuides: import.meta.glob('./*/stage_*.md', {
    query: '?raw',
    import: 'default',
    eager: true
  }) as Record<string, string>,
}

export const summaries = Object.fromEntries(
  relicRoutes.map(key => [key, (modules.summaries[`./${key}/summary.md`] ?? '')])
) as Record<RelicRouteKey, string>

export const stageGuides = Object.entries(modules.stageGuides).reduce(
  (acc, [path, content]) => {
    const match = path.match(/\.\/(.*?)\/stage_(\d+)\.md/)
    if (!match) return acc
    const [, relicKey, stageIndex] = match

    ;(acc[relicKey as RelicRouteKey] ??= {})[
      Number(stageIndex)
    ] = content

    return acc
  },

  Object.fromEntries(
    relicRoutes.map(key => [key, {}])
  ) as Record<RelicRouteKey, Record<number, string>>
)
