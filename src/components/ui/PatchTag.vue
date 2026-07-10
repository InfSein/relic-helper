<script setup lang="ts">

interface PatchTagProps {
  patch: string
  belong?: string
}
const props = defineProps<PatchTagProps>()

type Expansion = 2 | 3 | 4 | 5 | 6 | 7

const expansion = computed<Expansion | undefined>(() => {
  switch (props.patch[0]) {
    case '7': return 7
    case '6': return 6
    case '5': return 5
    case '4': return 4
    case '3': return 3
    case '2': return 2
    default: return undefined
  }
})
const expansionName = computed(() => {
  switch (expansion.value) {
    case 7: return '金曦之遗辉'
    case 6: return '晓月之终途'
    case 5: return '暗影之逆焰'
    case 4: return '红莲之狂潮'
    case 3: return '苍穹之禁城'
    case 2: return '重生之境'
    default: return '???'
  }
})

const tagColor = computed<[string, string]>(() => {
  switch (expansion.value) {
    case 7: return ['#E5B522', '#F3F3F3']
    case 6: return ['#BF7813', '#F3F3F3']
    case 5: return ['#5047B3', '#F3F3F3']
    case 4: return ['#A22A3E', '#F3F3F3']
    case 3: return ['#4C7EE8', '#F3F3F3']
    case 2: return ['#666666', '#F3F3F3']
    default: return ['#BBB', '#555']
  }
})

</script>

<template>
  <n-tooltip :keep-alive-on-hover="false">
    <template #trigger>
      <span
        class="patch-tag"
        :style="{ backgroundColor: tagColor[0], color: tagColor[1] }"
      >
        {{ props.patch }}
      </span>
    </template>
    <div class="select-none">
      {{ `${belong ?"「"+belong+"」" :'这'}是「${expansionName}」资料片实装的内容` }}
    </div>
  </n-tooltip>
</template>

<style scoped>
.patch-tag {
  font-family: 'Michroma', sans-serif;
  padding: 2px 6px 4px 6px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1;
  font-weight: bold;
  user-select: none;
}
</style>
