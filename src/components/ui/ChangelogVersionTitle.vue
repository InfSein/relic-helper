<script setup lang="ts">
import {
  RocketLaunchOutlined,
  LocalOfferOutlined,
  CalendarMonthOutlined,
} from '@vicons/material'

interface Props {
  version: string
  displayVersion?: string
  date?: string
  rawTitle?: string
  isLatest?: boolean
}

withDefaults(defineProps<Props>(), {
  displayVersion: '',
  date: '',
  rawTitle: '',
  isLatest: false,
})
</script>

<template>
  <div
    class="changelog-version-header"
    :class="{ 'is-latest': isLatest }"
  >
    <!-- 左侧：图标 + 版本号 + 最新标识 -->
    <div class="header-left">
      <div class="version-icon-box" :class="{ 'latest-icon': isLatest }">
        <n-icon :size="18">
          <component :is="isLatest ? RocketLaunchOutlined : LocalOfferOutlined" />
        </n-icon>
      </div>

      <div class="version-info">
        <span class="version-number">{{ displayVersion || `v${version}` }}</span>
      </div>
    </div>

    <!-- 右侧：发布日期 -->
    <div v-if="date" class="header-right">
      <div class="date-chip">
        <n-icon :size="14" class="date-icon">
          <CalendarMonthOutlined />
        </n-icon>
        <span class="date-text">{{ date }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.changelog-version-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  background-color: var(--color-background-embedded);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-border);
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.changelog-version-header:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

/* 最新版本高亮样式 */
.changelog-version-header.is-latest {
  border-left-color: var(--color-primary);
  background: linear-gradient(
    90deg,
    var(--color-primary-sub) 0%,
    var(--color-background-embedded) 45%
  );
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.version-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: var(--color-background-hover);
  color: var(--color-text-sub);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.version-icon-box.latest-icon {
  background-color: var(--color-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(24, 160, 88, 0.35);
}

.changelog-version-header:hover .version-icon-box {
  transform: scale(1.05);
}

.version-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.version-number {
  font-family: 'Michroma', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--color-text);
  line-height: 1.2;
}

.is-latest .version-number {
  color: var(--color-primary);
}

.latest-badge {
  font-weight: 600;
  padding: 0 8px;
  height: 22px;
  display: inline-flex;
  align-items: center;
}

.pulse-indicator {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-primary);
  margin-right: 5px;
  animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.3);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.date-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 6px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-sub);
  font-family: 'Michroma', monospace, sans-serif;
  font-size: 0.8rem;
  user-select: none;
}

.date-icon {
  opacity: 0.75;
}

@media (max-width: 640px) {
  .changelog-version-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
  }

  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
