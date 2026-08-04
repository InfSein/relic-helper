<script setup lang="ts">

const imgs = [
  '/image/phantom/mmh-1.jpg',
  '/image/phantom/mmh-2.jpg',
]

</script>

<template>
  <div>
    <n-h1>战斗的记忆 - 野怪分布图</n-h1>
    <n-p>出处未知，仅作搬运；不得不说还是这样看着最清楚</n-p>
    <div class="flex flex-wrap justify-between max-w-300 mx-auto">
      <img v-for="img in imgs" :key="img" :src="img" class="w-120 max-w-full" />
    </div>
  </div>
</template>

<style scoped>
</style>
