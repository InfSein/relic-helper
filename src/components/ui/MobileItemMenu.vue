<script setup lang="ts">
/**
 * 移动端物品上下文菜单（底部抽屉）
 *
 * 复用 getItemContexts 返回的 options 结构（含 children 子菜单、type:'divider'、show 字段、icon render function）。
 * icon 字段是 renderIcon 返回的 render function（本身渲染 n-icon），因此这里直接用 <component :is> 渲染，
 * 不再外层包裹 n-icon，避免 "[naive/icon]: don't wrap n-icon inside n-icon" 警告。
 */
interface Props {
  show: boolean
  options: any[]
}
const props = defineProps<Props>()
const emit = defineEmits<{
  'update:show': [boolean]
  'select': [key: string | number, option: any]
}>()

const handleItemClick = (key: string | number, option: any) => {
  emit('select', key, option)
  emit('update:show', false)
}
</script>

<template>
  <n-drawer
    :show="show"
    placement="bottom"
    :height="'auto'"
    @update:show="emit('update:show', $event)"
  >
    <div id="mobile-item-menu" class="mobile-context-menu">
      <template v-for="opt in options" :key="opt.key">
        <n-divider v-if="opt.type === 'divider'" class="my-1!" />
        <template v-else-if="opt.show !== false">
          <template v-if="opt.children && opt.children.length">
            <div class="menu-group-title pl-10!">{{ opt.label }}</div>
            <div
              v-for="child in opt.children"
              :key="child.key"
              v-show="child.show !== false"
              class="menu-item pl-10!"
              @click="handleItemClick(child.key, child)"
            >
              <component v-if="child.icon" :is="child.icon" />
              <span>{{ child.label }}</span>
            </div>
          </template>
          <div v-else class="menu-item" @click="handleItemClick(opt.key, opt)">
            <component v-if="opt.icon" :is="opt.icon" />
            <span>{{ opt.label }}</span>
          </div>
        </template>
      </template>
    </div>
  </n-drawer>
</template>

<style scoped>
.mobile-context-menu {
  padding: 8px 0 12px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  transition: background-color .15s;
}
.menu-item:active {
  background-color: var(--color-background-hover);
}
.menu-group-title {
  padding: 8px 16px 4px;
  font-size: 12px;
  color: var(--color-text-sub);
  font-weight: 600;
}
</style>
