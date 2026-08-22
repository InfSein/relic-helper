<script setup lang="ts">
import changelogContent from '../../CHANGELOG.md?raw'
import XivMarkdown from '@/components/ui/XivMarkdown.vue'
</script>

<template>
  <div class=" ">
    <n-h1>更新日志</n-h1>
    <XivMarkdown :content="changelogContent" />
  </div>
</template>

<style scoped>
:deep(.md-content h1) {
  display: none;
}
</style>
