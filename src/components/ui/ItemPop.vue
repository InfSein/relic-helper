<script lang="ts" setup>
import ItemPopContent from './ItemPopContent.vue'
import { useIsMobile } from '@/composables/useIsMobile'
import type { ItemInfo } from '@/tools/item'

interface ItemPopProps {
  /** 道具信息 */
  itemInfo: ItemInfo

  /** 悬浮窗使用自定义宽度 */
  popUseCustomWidth?: boolean;
  /** 悬浮窗的自定义宽度，必须同时设置`popUseCustomWidth`才能生效 */
  popCustomWidth?: number;
  /** 悬浮窗的最大宽度 */
  popMaxWidth?: string;
  /** 手动指定悬浮窗的触发方式 */
  popTrigger?: 'hover' | 'click' | 'manual'

  /** 是否禁用物品信息提示框(可选,默认false) */
  disablePop?: boolean;

  /** 物品按钮所处容器的ID，在模态框等场景时必须传递，否则无法正常复制物品名 */
  containerId?: string
}
const props = defineProps<ItemPopProps>()

const { isMobile } = useIsMobile()
const mobileShow = ref(false)
</script>

<template>
  <!-- 桌面端：保留原 n-popover 不变 -->
  <n-popover
    v-if="!isMobile && itemInfo.id && !disablePop"
    scrollable
    :trigger="popTrigger || 'hover'"
    :placement="'right-start'"
    :width="popUseCustomWidth ? popCustomWidth : undefined"
    :style="{
      maxWidth: popMaxWidth ?? '290px',
      maxHeight: '550px',
    }"
  >
    <template #trigger>
      <slot />
    </template>
    <ItemPopContent :item-info="itemInfo" :container-id="containerId" />
  </n-popover>

  <!-- 移动端：点击触发底部抽屉展示物品详情 -->
  <template v-else-if="isMobile && itemInfo.id && !disablePop">
    <span class="mobile-item-trigger" @click="mobileShow = true">
      <slot />
    </span>
    <n-drawer v-model:show="mobileShow" placement="bottom" :height="'60%'">
      <div class="mobile-item-drawer">
        <ItemPopContent :item-info="itemInfo" container-id="mobile-item-menu" />
      </div>
    </n-drawer>
  </template>

  <slot v-else />
</template>

<style scoped>
/* display:contents 让触发器不产生额外盒子，slot 内容按原布局渲染，
   点击事件仍可通过冒泡被 span 捕获 */
.mobile-item-trigger {
  display: contents;
}
.mobile-item-drawer {
  padding: 16px;
  overflow-y: auto;
  height: 100%;
  -webkit-overflow-scrolling: touch;
}
</style>
