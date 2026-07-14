<script setup lang="ts">
import { relicData } from '@/assets/data';
import { CopyToClipboard } from '@/tools';
import { getItemContexts, getItemInfo } from '@/tools/item';
import { useIsMobile } from '@/composables/useIsMobile';
import MobileItemMenu from './ui/MobileItemMenu.vue';
import {
  SearchOutlined,
  InfoOutlined,
} from '@vicons/material'

const NAIVE_UI_MESSAGE = useMessage()
const { isMobile } = useIsMobile()

interface ProgressTableCellProps {
  hide?: boolean
  relicId: number
  rowIndex: number
  itemId: number
  itemCollected: boolean
}
const props = defineProps<ProgressTableCellProps>()

const emits = defineEmits(['collectCheckboxClicked'])

const itemInfo = computed(() => getItemInfo(props.itemId ?? 0))

const handleCheckboxClick = () => {
  emits('collectCheckboxClicked', props.rowIndex)
}

// #region 右键菜单相关

const showDropdownRef = ref(false)
const xRef = ref(0)
const yRef = ref(0)

const handleMobileCopy = async (content: string, successMessage?: string) => {
  const response = await CopyToClipboard(content, 'mobile-item-menu')
  if (response) {
    NAIVE_UI_MESSAGE.error('复制失败')
  } else {
    NAIVE_UI_MESSAGE.success(successMessage ?? '复制成功')
  }
}
const { options, handleKeyEvent } = getItemContexts(itemInfo.value, handleMobileCopy)
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  showDropdownRef.value = false
  nextTick().then(() => {
    showDropdownRef.value = true
    xRef.value = e.clientX
    yRef.value = e.clientY
  })
}
const handleSelect = async (key: string | number, option: any) => {
  showDropdownRef.value = false
  if (option?.click) {
    option.click()
  } else {
    handleKeyEvent(key, option)
  }
}
const onClickoutside = () => {
  showDropdownRef.value = false
}

// * 移动端通过长按来弹出右键菜单
// 注：这些事件也只会在移动端触发，不用担心在电脑端的兼容性
const touchTimeoutEvent = ref<number | undefined>(undefined)
const handleItemButtonTouchStart = (e: TouchEvent) => {
  touchTimeoutEvent.value = setTimeout(() => {
    if (e?.touches?.length) {
      xRef.value = e.touches[0].clientX
      yRef.value = e.touches[0].clientY
      showDropdownRef.value = true
    } else {
      console.error('No touches found in handleItemButtonTouchStart. event:', e)
    }
  }, 500) // 长按500毫秒触发长按事件
}
const handleItemButtonTouchMove = (/*e: TouchEvent*/) => {
  // 如果有移动则取消所有事件
  clearTimeout(touchTimeoutEvent.value)
  touchTimeoutEvent.value = 0
}
const handleItemButtonTouchEnd = (/*e: TouchEvent*/) => {
  // 按下时长不足以触发长按事件时,触发点击事件
  clearTimeout(touchTimeoutEvent.value)
  if (touchTimeoutEvent.value !== 0) {
    // do click if event added later
  }
}

// #endregion
</script>

<template>
  <div v-if="!hide" class="w-full h-full flex flex-col items-center justify-center">
    <n-checkbox
      size="large"
      :checked="itemCollected"
      @click.stop="handleCheckboxClick"
    />
    <n-divider class="my-1!" />
    <div class="flex gap-1">
      <ItemPop v-if="itemId" :item-info="itemInfo">
        <n-button
          size="tiny"
          class="ptc-action-button"
          @contextmenu="handleContextMenu"
          @touchstart.passive="handleItemButtonTouchStart"
          @touchmove.passive="handleItemButtonTouchMove"
          @touchend.passive="handleItemButtonTouchEnd"
        >
          <n-icon size="13"><SearchOutlined /></n-icon>
          <!-- 桌面端：原位置式 n-dropdown 菜单（右键/长按触发） -->
          <n-dropdown
            v-if="!isMobile"
            size="small"
            placement="bottom-start"
            trigger="manual"
            :x="xRef"
            :y="yRef"
            :options="options"
            :show="showDropdownRef"
            :on-clickoutside="onClickoutside"
            @select="handleSelect"
          />
        </n-button>
      </ItemPop>
      <n-popover v-else placement="right-start">
        <template #trigger>
          <n-button size="tiny" class="ptc-action-button">
            <n-icon size="13"><InfoOutlined /></n-icon>
          </n-button>
        </template>
        <div class="">
          <div class="text-lg">前置任务</div>
          <n-divider class="mt-0! mb-0.5!" />
          <div>该阶段肝武需要完成前置任务才可制作。</div>
          <template v-if="relicData.relicGroups[relicId].stage_prereqs?.[rowIndex]">
            <div>前置任务中需要收集以下物品：</div>
            <div class="ml-4">
              <div v-for="item in relicData.relicGroups[relicId]!.stage_prereqs![rowIndex]" :key="item[0]">
                <ItemSpan :item-info="getItemInfo(item[0])" :amount="item[1]" show-amount />
              </div>
            </div>
          </template>
        </div>
      </n-popover>
    </div>

    <!-- 移动端：长按菜单改为底部抽屉 -->
    <MobileItemMenu
      v-if="isMobile"
      v-model:show="showDropdownRef"
      :options="options"
      @select="handleSelect"
    />
  </div>
</template>

<style scoped>
.ptc-action-button {
  --n-height: 16px !important;
  width: var(--n-height);
  padding: initial;
}
</style>
