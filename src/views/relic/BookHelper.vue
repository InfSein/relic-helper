<script setup lang="ts">
import EventItemSpan from '@/components/ui/EventItemSpan.vue'
import { relicNotes } from '@/assets/data'
import { getImgCdnUrl } from '@/tools/item'
import { XivMaps } from '@/tools/map'

type BookCategory = "enemies" | "dungeons" | "fates" | "leves"
const bookCategories : { key: BookCategory, label: string, disabled?: boolean }[] = [
  { key: 'enemies', label: '讨伐敌人' },
  { key: 'dungeons', label: '迷宫探险', disabled: true },
  { key: 'fates', label: '危命任务', disabled: true },
  { key: 'leves', label: '理符任务', disabled: true },
]

const enemyColumns = computed(() => {
  const enemies = currBookData.value.enemies || []
  return [
    { key: 'col1', items: enemies.slice(0, 2), itemClass: 'w-32 h-32' },
    { key: 'col2', items: enemies.slice(2, 5), itemClass: 'w-24 h-24' },
    { key: 'col3', items: enemies.slice(5, 8), itemClass: 'w-24 h-24' },
    { key: 'col4', items: enemies.slice(8, 10), itemClass: 'w-32 h-32' }
  ]
})

const currBook = ref(Number(Object.keys(relicNotes)[0]))
const currCategory = ref<BookCategory>(bookCategories[0].key)
const currFocus = ref<number | undefined>(undefined)

const currBookData = computed(() => relicNotes[currBook.value])
const currFooterDescription = computed(() => {
  if (!currFocus.value) return '点击项目以查看详情。'
  const key = currCategory.value
  if (key === 'dungeons') {
    const dungeon = currBookData.value[key].find((item) => item.id === currFocus.value)
    if (!dungeon) return '???'
    return `${dungeon.level}级 ${dungeon.dname[2]} - ${dungeon.mname[2]}`
  }
  return currBookData.value[key].find((item) => item.id === currFocus.value)?.name?.[2] ?? '???'
})
const currBookItemLocation = computed(() => {
  if (!currFocus.value) return undefined
  const key = currCategory.value
  if (key === 'leves') {
    return currBookData.value[key].find((item) => item.id === currFocus.value)?.npc?.location
  }
  return currBookData.value[key].find((item) => item.id === currFocus.value)?.location
})
const currBookItemMapData = computed(() => {
  if (!currBookItemLocation.value) return undefined
  return {
    mapInfo: XivMaps[currBookItemLocation.value[0]],
    x: currBookItemLocation.value[1],
    y: currBookItemLocation.value[2],
  }
})

const handleBookSwitch = (bookId: number) => {
  currBook.value = bookId
  currFocus.value = undefined
}
const handleBookItemClick = (id: number) => {
  currFocus.value = id
}
</script>

<template>
  <div>
    <n-h1>黄道文书图鉴</n-h1>
    <n-p>其他的还没做好，目前只能看讨伐敌人章节（</n-p>
    <div class="max-w-4xl flex flex-wrap items-center gap-1 gap-x-1.5">
      <n-button
        v-for="book in Object.values(relicNotes)"
        :key="book.id"
        type="primary"
        size="small"
        :ghost="currBook !== book.id"
        @click="handleBookSwitch(book.id)"
      >
        <EventItemSpan :item="book" />
      </n-button>
    </div>
    <n-divider class="mt-2! mb-3!" />
    <div class="min-h-120 flex gap-2 flex-wrap">
      <div class="flex-1 min-w-125">
        <n-card size="small" class="h-full">
          <n-layout class="h-full">
            <n-layout has-sider class="h-[calc(100%-40px)]">
              <n-layout-sider
                bordered
                :width="120"
                :native-scrollbar="false"
              >
                <n-menu
                  v-model:value="currCategory"
                  :options="bookCategories"
                />
              </n-layout-sider>
              <n-layout>
                <div class="w-full h-full flex items-center justify-center">
                  <div v-if="currCategory === 'enemies'" class="grid grid-cols-[repeat(4,auto)] gap-4">
                    <div
                      v-for="col in enemyColumns"
                      :key="col.key"
                      class="h-full flex flex-col justify-between gap-1"
                    >
                      <div
                        v-for="enemy in col.items"
                        :key="enemy.id"
                        class="book-item"
                        :class="[
                          currFocus === enemy.id ? 'focused' : '',
                          col.itemClass,
                        ]"
                        @click="handleBookItemClick(enemy.id)"
                      >
                        <img
                          :src="getImgCdnUrl(enemy.icon)"
                          :class="col.itemClass"
                        />
                      </div>
                    </div>
                  </div>
                  <div v-else-if="currCategory === 'dungeons'" class="relative w-150 h-80">
                    <div
                      class="absolute w-full h-full overflow-hidden"
                      style="clip-path: polygon(0 0, 69% 0, 58% 100%, 0% 100%);"
                    >
                      <div>
                        <img :src="getImgCdnUrl(currBookData.dungeons[0].icon)" class="w-2/3 h-1/2 object-cover" />
                      </div>
                      <div>
                        <img :src="getImgCdnUrl(currBookData.dungeons[1].icon)" class="w-2/3 h-1/2 object-cover" />
                      </div>
                    </div>
                    <div
                      class="absolute right-0 top-0 w-1/2 h-full overflow-hidden"
                      style="clip-path: polygon(69% 0, 100% 0%, 100% 100%, 49% 100%);"
                    >
                      <img :src="getImgCdnUrl(currBookData.dungeons[2].icon)" class="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </n-layout>
            </n-layout>
            <n-layout-footer bordered>
              <div class="w-full px-4 py-2">
                {{ currFooterDescription }}
              </div>
            </n-layout-footer>
          </n-layout>
        </n-card>
      </div>
      <div class="w-100 max-w-full">
        <n-card size="small" class="h-full">
          <div class="w-full h-full flex items-center justify-center">
            <div v-if="currBookItemMapData" class="text-center">
              <XivMap
                :map-data="currBookItemMapData.mapInfo"
                :flag-x="currBookItemMapData.x"
                :flag-y="currBookItemMapData.y"
                :map-size="350"
              />
              <n-divider class="my-2!" />
              <div class="text-xl">{{ currBookItemMapData.mapInfo.name_zh }}</div>
              <div class="text-xs">{{ `(X: ${currBookItemMapData.x.toFixed(1)}, Y: ${currBookItemMapData.y.toFixed(1)})` }}</div>
            </div>
            <div v-else class="w-full h-full flex items-center justify-center">请先选择一个项目。</div>
          </div>
        </n-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.book-item {
  cursor: pointer;

  &:hover {
    background-color: var(--color-background-hover);
  }
  &.focused {
    background-color: var(--color-primary);
  }
}
</style>
