<script setup lang="ts" name="ErrorView404">
const route = useRoute()

const descriptions = computed(() => {
  return [
    `访问的页面 (${route.path}) 不存在。`,
    '请尝试回到上一页或直接返回首页。'
  ]
})
</script>

<template>
  <div class="h-[calc(100vh-160px)] flex items-center justify-center">
    <n-result status="404" title="404 NOT FOUND">
      <div>
        <p v-for="(description, index) in descriptions" :key="index">{{ description }}</p>
      </div>
      <template #footer>
        <div class="flex justify-center gap-1">
          <n-button @click="$router.go(-1)">返回上一页</n-button>
          <n-button @click="$router.push('/')">返回首页</n-button>
        </div>
      </template>
    </n-result>
  </div>
</template>

<style scoped>
</style>
