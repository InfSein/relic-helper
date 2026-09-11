<script setup lang="ts">
import { computed } from 'vue'
import changelogContent from '../../CHANGELOG.md?raw'
import XivMarkdown from '@/components/ui/XivMarkdown.vue'
import ChangelogVersionTitle from '@/components/ui/ChangelogVersionTitle.vue'

interface ChangelogItem {
  category: string
  content: string
}

interface VersionSection {
  rawTitle: string
  version: string
  displayVersion: string
  date?: string
  items: ChangelogItem[]
  isLatest: boolean
}

/**
 * 深度解析 CHANGELOG.md 内容为按版本、按分类条目的结构化列表
 */
const parseChangelog = (markdown: string): VersionSection[] => {
  const lines = markdown.split('\n')
  const versions: VersionSection[] = []
  let currentVer: Partial<VersionSection> | null = null
  let currentCategory = ''
  let currentItemLines: string[] = []

  const flushItem = () => {
    if (currentVer && currentItemLines.length > 0) {
      const itemText = currentItemLines.join('\n').trim()
      if (itemText) {
        currentVer.items = currentVer.items || []
        currentVer.items.push({
          category: currentCategory || '更新',
          content: itemText,
        })
      }
      currentItemLines = []
    }
  }

  const flushVersion = () => {
    flushItem()
    if (currentVer && currentVer.rawTitle) {
      versions.push(currentVer as VersionSection)
      currentVer = null
      currentCategory = ''
    }
  }

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/)
    if (h2Match) {
      flushVersion()
      const rawTitle = h2Match[1].trim()

      // 提取版本号（如 Version 0.3.0、0.3.0、v0.3.0）
      const verMatch = rawTitle.match(/(?:Version\s+|v)?([0-9]+\.[0-9]+(?:\.[0-9]+)?(?:-[\w.]+)?)/i)
      const version = verMatch ? verMatch[1] : rawTitle
      const displayVersion = `v${version.replace(/^v/i, '')}`

      // 提取发布日期（如 2026-09-11、2026/08/22）
      const dateMatch = rawTitle.match(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/)
      const date = dateMatch ? dateMatch[1].replace(/\//g, '-') : undefined

      currentVer = {
        rawTitle,
        version,
        displayVersion,
        date,
        items: [],
        isLatest: versions.length === 0,
      }
      continue
    }

    if (!currentVer) continue

    const h3Match = line.match(/^###\s+(.+)$/)
    if (h3Match) {
      flushItem()
      currentCategory = h3Match[1].trim()
      continue
    }

    const bulletMatch = line.match(/^[*+-]\s+(.+)$/)
    if (bulletMatch) {
      flushItem()
      currentItemLines.push(bulletMatch[1].trim())
      continue
    }

    // 列表项后续多行内容
    if (currentItemLines.length > 0 && line.trim()) {
      currentItemLines.push(line.trim())
    }
  }

  flushVersion()
  return versions
}

const versions = computed(() => parseChangelog(changelogContent))

const getCategoryClass = (category: string) => {
  switch (category) {
    case '新增':
      return 'tag-add'
    case '优化':
      return 'tag-opt'
    case '修复':
      return 'tag-fix'
    default:
      return 'tag-default'
  }
}
</script>

<template>
  <div class="changelog-view">
    <n-h1>更新笔记</n-h1>

    <div class="version-list">
      <div
        v-for="ver in versions"
        :key="ver.version"
        class="version-card"
        :class="{ 'latest-card': ver.isLatest }"
      >
        <!-- 现代二级标题版本组件 -->
        <ChangelogVersionTitle
          :version="ver.version"
          :display-version="ver.displayVersion"
          :date="ver.date"
          :raw-title="ver.rawTitle"
          :is-latest="ver.isLatest"
        />

        <!-- 版本更新条目：一行一行渲染 -->
        <div class="version-items">
          <div
            v-for="(item, idx) in ver.items"
            :key="idx"
            class="changelog-item"
          >
            <span class="item-tag" :class="getCategoryClass(item.category)">
              {{ item.category }}
            </span>
            <div class="item-content">
              <XivMarkdown :content="item.content" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.changelog-view {
  width: 100%;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
  padding: 0 32px;
}

.version-card {
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  border-radius: 14px;
  padding: 16px;
  transition: all 0.25s ease;
}

.version-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.version-card.latest-card {
  border-color: rgba(24, 160, 88, 0.35);
  box-shadow: 0 2px 12px rgba(24, 160, 88, 0.05);
}

:global(.theme-dark) .version-card.latest-card {
  border-color: rgba(99, 226, 183, 0.3);
  box-shadow: 0 2px 12px rgba(99, 226, 183, 0.06);
}

.version-items {
  margin-top: 12px;
  padding: 0 4px;
  display: flex;
  flex-direction: column;
}

.changelog-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--color-border);
}

.changelog-item:last-child {
  border-bottom: none;
  padding-bottom: 2px;
}

.item-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 4px;
  flex-shrink: 0;
  user-select: none;
  line-height: 1.5;
}

/* 新增 - 翠绿 */
.tag-add {
  background-color: rgba(24, 160, 88, 0.1);
  color: #18a058;
  border: 1px solid rgba(24, 160, 88, 0.22);
}

/* 优化 - 蔚蓝 */
.tag-opt {
  background-color: rgba(32, 128, 240, 0.1);
  color: #2080f0;
  border: 1px solid rgba(32, 128, 240, 0.22);
}

/* 修复 - 琥珀橙 */
.tag-fix {
  background-color: rgba(240, 160, 32, 0.1);
  color: #f0a020;
  border: 1px solid rgba(240, 160, 32, 0.22);
}

/* 默认分类 */
.tag-default {
  background-color: var(--color-background-hover);
  color: var(--color-text-sub);
  border: 1px solid var(--color-border);
}

/* 深色模式下适配分类标签 */
:global(.theme-dark) .tag-add {
  background-color: rgba(99, 226, 183, 0.12);
  color: #63e2b7;
  border-color: rgba(99, 226, 183, 0.3);
}

:global(.theme-dark) .tag-opt {
  background-color: rgba(112, 192, 232, 0.12);
  color: #70c0e8;
  border-color: rgba(112, 192, 232, 0.3);
}

:global(.theme-dark) .tag-fix {
  background-color: rgba(242, 201, 125, 0.12);
  color: #f2c97d;
  border-color: rgba(242, 201, 125, 0.3);
}

.item-content {
  flex: 1;
  min-width: 0;
  font-size: 0.85rem;
  color: var(--color-text);
  line-height: 1.6;
}

.item-content :deep(.xiv-markdown) {
  display: inline;
  line-height: inherit;
}

.item-content :deep(.xiv-markdown .md-content) {
  display: inline;
}

.item-content :deep(.xiv-markdown p) {
  display: inline;
  margin: 0;
  line-height: inherit;
}
</style>
