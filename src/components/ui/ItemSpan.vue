<script setup lang="ts">
import {
  InfoOutlined
} from '@vicons/material'
import ItemPop from './ItemPop.vue'
import XivFARImage from './XivFARImage.vue'
import MobileItemMenu from './MobileItemMenu.vue'
import { CopyToClipboard } from '@/tools'
import { getItemContexts, type ItemInfo } from '@/tools/item'
import { useIsMobile } from '@/composables/useIsMobile'

const NAIVE_UI_MESSAGE = useMessage()
const { isMobile } = useIsMobile()

interface ItemSpanProps {
  itemInfo: ItemInfo
  amount?: number
  showAmount?: boolean
  imgSize?: number
  spanMaxWidth?: string
  hideIcon?: boolean
  hideName?: boolean
  hidePopIcon?: boolean
  inline?: boolean
  containerId?: string
  containerStyle?: string
}
const props = defineProps<ItemSpanProps>()

const itemSpanNode = ref<HTMLElement>()
const itemAmountNode = ref<HTMLElement>()

const needLimitNameWidth = ref(false)

const calculateUi = () => {
  if (props.inline) {
    needLimitNameWidth.value = false
    return
  }
  if (props.spanMaxWidth && itemSpanNode.value) {
    const maxWidth = parseInt(props.spanMaxWidth.replace('px', ''), 10)
    const spanWidth = measureNaturalWidth(itemSpanNode.value)
    if (maxWidth > 0 && spanWidth > maxWidth) {
      needLimitNameWidth.value = true
    }
  }

  function measureNaturalWidth(el: HTMLElement): number {
    if (!el || !el.parentElement) return 0

    const clone = el.cloneNode(true) as HTMLElement

    clone.style.visibility = 'hidden'
    clone.style.position = 'absolute'
    clone.style.maxWidth = 'none'
    clone.style.width = 'auto'

    el.parentElement.appendChild(clone)
    const width = clone.offsetWidth
    el.parentElement.removeChild(clone)

    return width
  }
}

onMounted(() => {
  calculateUi()
})

const getItemName = () => {
  return props.itemInfo.name_zh || '未翻译的物品'
}
const itemAmount = computed(() => {
  const _amount = props.amount ?? 0
  return _amount.toLocaleString()
})

// #region 右键菜单相关

const showDropdownRef = ref(false)
const xRef = ref(0)
const yRef = ref(0)

const handleCopy = async (content: string, successMessage?: string) => {
  let container : HTMLElement | undefined | null
  if (props.containerId) {
    container = document.getElementById(props.containerId)
  }
  const response = await CopyToClipboard(content, container)
  if (response) {
    NAIVE_UI_MESSAGE.error('复制失败')
  } else {
    NAIVE_UI_MESSAGE.success(successMessage ?? '复制成功')
  }
}
const { options, handleKeyEvent } = getItemContexts(props.itemInfo, handleCopy)
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

const containerStyle = computed(() => {
  const styles = [
    (props.containerStyle ?? ''),
  ]

  if (needLimitNameWidth.value) {
    let itemAmountwidth = 0
    if (props.showAmount && !!itemAmountNode.value) {
      itemAmountwidth += Math.ceil(itemAmountNode.value.offsetWidth)
      if (props.amount) {
        const offset = 3
        itemAmountwidth += offset
      }
    }
    styles.push(`--item-name-maxwidth: calc(100% - ${itemAmountwidth}px)`)
  }
  styles.push(`max-width: ${props.spanMaxWidth ?? 'unset'}`)

  return styles.join('; ')
})
</script>

<template>
  <ItemPop
    v-if="inline"
    :item-info="itemInfo"
    pop-use-custom-width
    :pop-custom-width="275"
  >
    <span
      class="container-inline"
      :style="containerStyle"
      @contextmenu="handleContextMenu"
      @touchstart.passive="handleItemButtonTouchStart"
      @touchmove.passive="handleItemButtonTouchMove"
      @touchend.passive="handleItemButtonTouchEnd"
    >
      <XivFARImage
        v-show="!hideIcon"
        class="select-none"
        :size="imgSize ?? 14"
        :src="itemInfo.iconUrl"
        :title="(hideName && hidePopIcon) ? getItemName() : ''"
      />
      <span v-show="!hideName" class="item-name">
        {{ hideName ? '' : getItemName() }}
      </span>
      <span v-show="showAmount" ref="itemAmountNode" class="item-amount">
        {{ showAmount ? (' x' + itemAmount) : '' }}
      </span>

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
    </span>
  </ItemPop>
  <div v-else ref="itemSpanNode" class="container" :style="containerStyle">
    <div v-if="!itemInfo?.valid" class="item-text-container">未知物品({{itemInfo?.id}})</div>
    <template v-else>
      <XivFARImage
        v-show="!hideIcon"
        class="select-none"
        :size="imgSize ?? 14"
        :src="itemInfo.iconUrl"
        :title="(hideName && hidePopIcon) ? getItemName() : ''"
      />
      <div class="item-text-container">
        <span v-show="!hideName" class="item-name">
          {{ hideName ? '' : getItemName() }}
        </span>
        <span v-if="!hideName && showAmount">&nbsp;</span>
        <span v-show="showAmount" ref="itemAmountNode" class="item-amount">
          {{ showAmount ? (' x' + itemAmount) : '' }}
        </span>
      </div>
      <ItemPop
        v-if="!hidePopIcon"
        :item-info="itemInfo"
        pop-use-custom-width
        :pop-custom-width="275"
      >
        <n-icon v-if="!hidePopIcon" class="item-popicon" size="14" color="#3b7fef"
          @contextmenu="handleContextMenu"
          @touchstart.passive="handleItemButtonTouchStart"
          @touchmove.passive="handleItemButtonTouchMove"
          @touchend.passive="handleItemButtonTouchEnd"
        >
          <InfoOutlined />
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
        </n-icon>
      </ItemPop>
    </template>
  </div>

  <!-- 移动端：右键/长按菜单改为底部抽屉 -->
  <MobileItemMenu
    v-if="isMobile"
    v-model:show="showDropdownRef"
    :options="options"
    @select="handleSelect"
  />
</template>

<style scoped>
.container {
  display: flex;
  align-items: center;
  gap: 3px;

  .item-text-container {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .item-name {
      display: inline-block;
      max-width: var(--item-name-maxwidth);
      vertical-align: top;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-amount {
      display: inline-block;
      vertical-align: top;
      white-space: nowrap;
    }
  }

  .item-popicon {
    cursor: pointer;
  }
}
.container-inline {
  display: inline-flex;
  align-items: center;
  vertical-align: text-bottom;
  line-height: normal;
  gap: 2px;
  position: relative;
  top: 3px;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 1px 4px;

  &:hover {
    background-color: var(--color-background-hover);
  }
}
</style>
