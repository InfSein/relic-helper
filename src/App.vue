<script setup lang="ts">
import { darkTheme, lightTheme } from 'naive-ui'
import {
  DarkModeTwotone, LightModeTwotone, MenuOutlined,
} from '@vicons/material'
import { RouterView } from 'vue-router'
import Dialog from './components/ui/Dialog.vue'
import AppLogo from '@/assets/icons/app-logo.svg?url'
import GithubIcon from '@/assets/icons/external/github.svg'
import useAppMenu from '@/composables/useAppMenu'
import { useIsMobile } from '@/composables/useIsMobile'
import AppInfo from '@/constants/app-info'
import { useStore } from '@/stores'
import { sleep } from './tools'
import { registerDialogProvider } from '@/utils/dialog'
import EorzeaTime from './utils/eorzea-time'

const { menuData, appMenuOptions } = useAppMenu()
const store = useStore()

const dialogRef = ref<InstanceType<typeof Dialog> | null>(null)

onMounted(async () => {
  // 注册对话框
  if (dialogRef.value) {
    registerDialogProvider(dialogRef.value)
  } else {
    console.warn('dialogRef is not set, dialog provider will not be registered.')
  }
  await sleep(500)
})

const appHeaderButtons = computed(() => {
  return [
    {
      key: 'switch_theme',
      icon: theme.value === 'light' ? LightModeTwotone : DarkModeTwotone,
      onClick: () => {
        switchTheme()
      }
    },
    {
      key: 'external_github',
      icon: GithubIcon,
      onClick: () => {
        window.open(AppInfo.repoUrl)
      }
    }
  ]
})

const theme = computed(() => store.appConfig.theme)
const naiveUiTheme = computed(() => theme.value === 'light' ? lightTheme : darkTheme)
const switchTheme = () => {
  store.appConfig.theme = theme.value === 'light' ? 'dark' : 'light'
  store.updateAppConfig()
}

const currentET = ref<EorzeaTime>(new EorzeaTime())
setInterval(() => {
  currentET.value = new EorzeaTime()
}, 200)
provide('currentET', currentET)

const appClasses = computed(() => {
  return [
    theme.value === 'dark' ? 'theme-dark' : 'theme-light',
  ].join(' ')
})

// #region 移动端适配（方案 B：汉堡 + 抽屉）
// 桌面端（≥768px）isMobile 为 false，以下逻辑全部不生效，UI 零改动
const { isMobile } = useIsMobile()
const drawerOpen = ref(false)

// 路由切换后自动关闭抽屉
const route = useRoute()
watch(() => route.path, () => {
  if (isMobile.value) {
    drawerOpen.value = false
  }
})

// 进入移动端时展开菜单，确保抽屉内显示完整标签
watch(isMobile, (mobile) => {
  if (mobile) {
    menuData.menuCollapsed = false
  }
})
// #endregion
</script>

<template>
  <n-config-provider
    :theme="naiveUiTheme"
  >
    <n-global-style />
    <n-dialog-provider>
      <n-message-provider placement="top">
        <n-layout position="absolute" :class="appClasses">
          <n-layout-header bordered class="h-14">
            <div class="h-full px-6 grid grid-cols-[auto_1fr_auto] app-header-inner">
              <div class="flex items-center gap-2">
                <n-button v-if="isMobile" quaternary class="mr-1!" @click="drawerOpen = true">
                  <n-icon :size="22"><MenuOutlined /></n-icon>
                </n-button>
                <img width="28" height="28" :src="AppLogo" />
                <div class="flex items-baseline gap-1">
                  <span class="text-lg">{{ AppInfo.name }}</span>
                  <span class="text-xs">v{{ AppInfo.version }}</span>
                </div>
              </div>
              <div />
              <div class="flex items-center gap-1">
                <n-button
                  v-for="item in appHeaderButtons"
                  :key="item.key"
                  quaternary
                  @click="item.onClick"
                >
                  <n-icon :size="18"><component :is="item.icon" /></n-icon>
                </n-button>
              </div>
            </div>
          </n-layout-header>
          <n-layout has-sider position="absolute" class="top-14! bottom-14!">
            <n-layout-sider
              v-if="!isMobile"
              bordered
              :width="300"
              content-class="p-6"
              :native-scrollbar="false"
              collapse-mode="width"
              :collapsed-width="112"
              show-trigger="arrow-circle"
              v-model:collapsed="menuData.menuCollapsed"
            >
              <n-menu
                v-model:value="menuData.currMenu"
                :collapsed-width="64"
                :collapsed-icon-size="22"
                :options="appMenuOptions"
              />
            </n-layout-sider>
            <n-layout :native-scrollbar="false" :content-class="isMobile ? 'p-4' : 'p-8'">
              <router-view />
            </n-layout>
          </n-layout>
          <n-layout-footer bordered position="absolute" class="h-14">
            <div class="h-full px-6 flex flex-col items-center justify-center">
              <n-text depth="3" class="text-sm">
                &copy; InfSein, 2026. All rights reserved.
                </n-text>
              <n-text depth="3" class="text-xs footer-notice">
                Content contributed by third parties remains the property of their respective owners.
                FINAL FANTASY XIV-related materials, including but not limited to icons and images, are the property of SQUARE ENIX CO., LTD.
              </n-text>
            </div>
          </n-layout-footer>

          <!-- 移动端抽屉菜单（方案 B） -->
          <n-drawer v-if="isMobile" v-model:show="drawerOpen" :width="280" placement="left">
            <n-drawer-content title="导航" closable>
              <n-menu
                v-model:value="menuData.currMenu"
                :options="appMenuOptions"
              />
            </n-drawer-content>
          </n-drawer>

          <Dialog ref="dialogRef" />
        </n-layout>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<style scoped>
:deep(.n-menu-item-group-title) {
  padding-left: 16px !important;
}
</style>
