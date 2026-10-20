<script setup lang="ts">
import { computed } from 'vue'
import ItemSpan from '@/components/ui/ItemSpan.vue'
import { getRemainingCount, type DemandItemInfo } from '@/tools/relic-demand'

interface Props {
  item: DemandItemInfo
  /** 用户已筹集的该物品数量 */
  owned: number
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:owned', count: number): void
}>()

// 剩余需筹备数量
const remaining = computed(() => getRemainingCount(props.item.needCount, props.owned))
// 是否已全收集
const isCollected = computed(() => remaining.value === 0)
// 仅总需数量为 0/1 时不显示数量输入框
const showInput = computed(() => props.item.needCount > 1)

const onInputUpdate = (val: number | null) => {
  const count = Math.min(Math.max(val ?? 0, 0), props.item.needCount)
  emit('update:owned', count)
}

// 勾选视为已拥有全部所需数量，取消勾选则清零
const onCheckedUpdate = (checked: boolean) => {
  emit('update:owned', checked ? props.item.needCount : 0)
}
</script>

<template>
  <div
    class="p-1.5 bg-slate-500/5 rounded flex justify-between items-center gap-2 transition-opacity"
    :class="{ 'opacity-40': isCollected }"
  >
    <ItemSpan :item-info="item.itemInfo" :amount="remaining" show-amount />
    <div class="flex items-center gap-2 shrink-0">
      <n-input-number
        v-if="showInput"
        size="tiny"
        class="w-28"
        :value="owned"
        :min="0"
        :max="item.needCount"
        :show-button="false"
        @update:value="onInputUpdate"
      >
        <template #prefix>已有</template>
        <template #suffix>/ {{ item.needCount }}</template>
      </n-input-number>
      <n-checkbox :checked="isCollected" @update:checked="onCheckedUpdate" />
    </div>
  </div>
</template>

<style scoped>
/* 输入框中的数字居中显示 */
:deep(.n-input__input-el) {
  text-align: center;
}
</style>
