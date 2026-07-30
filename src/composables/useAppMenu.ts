import {
  HomeFilled,
  NoteAltFilled,
  EventNoteFilled,
  AlignVerticalCenterOutlined,
  MenuBookOutlined,
} from '@vicons/material'
import { relicData } from '@/assets/data'
import { renderIcon } from '@/utils/ui'

// #region 自定义菜单项
type MenuItem =
  | {
    type: 'title',
    label: string
  }
  | {
    type: 'router',
    icon: Component,
    label: string,
    routeKey: string,
  }
  | {
    type: 'button',
    icon: Component,
    label: string,
    onClick: () => void,
  }

const menuItems = computed(() : MenuItem[] => {
  return [
    {
      type: 'router',
      icon: HomeFilled,
      label: '首页',
      routeKey: '/',
    },
    {
      type: 'router',
      icon: NoteAltFilled,
      label: '进度总览',
      routeKey: '/po',
    },
    ...Object.values(relicData.relicGroups).map((group) => {
      const items : MenuItem[] = [
        {
          type: 'title',
          label: menuData.menuCollapsed ? group.short_zh : group.name_zh,
        },
        {
          type: 'router',
          icon: EventNoteFilled,
          label: '概览',
          routeKey: `/${group.rtkey}/overview`,
        }
      ]

      if (group.rtkey === 'relic') {
        items.push({
          type: 'router',
          icon: AlignVerticalCenterOutlined,
          label: '魂晶计时器',
          routeKey: '/relic/atma',
        })
        items.push({
          type: 'router',
          icon: MenuBookOutlined,
          label: '黄道文书图鉴',
          routeKey: '/relic/book',
        })
      }

      return items
    }).flat(),
    /*
    {
      type: 'title',
      label: menuData.menuCollapsed ? '组1' : '示例组1',
    },
    {
      type: 'button',
      icon: BookIcon,
      label: '示例项1',
      onClick: () => {
        console.log('示例项1')
      },
    },
    {
      type: 'button',
      icon: BookIcon,
      label: '示例项2',
      onClick: () => {
        console.log('示例项2')
      },
    },
    */
  ]
})
// #endregion

const menuData = reactive({
  currMenu: '',
  menuCollapsed: false,
})

const useAppMenu = () => {
  const route = useRoute()
  const router = useRouter()

  const appMenuOptions = computed(() => {
    return menuItems.value.map((item) => {
      switch (item.type) {
        case 'title':
          return {
            type: 'group',
            key: item.label,
            label: item.label,
            children: [],
          }
        case 'router':
          return {
            label: item.label,
            key: `router_${item.routeKey}`,
            icon: renderIcon(item.icon),
            onClick: () => {
              router.push(item.routeKey)
            }
          }
        case 'button':
          return {
            label: item.label,
            key: item.label,
            icon: renderIcon(item.icon),
            onClick: item.onClick,
          }
      }
    })
  })

  const updateCurrMenu = (path: string | null) => {
    if (!path) return
    menuData.currMenu = `router_${path}`
  }
  watch(
    () => route.matched.length > 0 ? route.path : null,
    updateCurrMenu,
    { immediate: true }
  )

  return {
    menuData,
    appMenuOptions,
  }
}

export default useAppMenu
