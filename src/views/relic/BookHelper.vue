<script setup lang="ts">
import EventItemSpan from '@/components/ui/EventItemSpan.vue'
import { relicNotes } from '@/assets/data'
import { getImgCdnUrl } from '@/tools/item'
import { XivMaps } from '@/tools/map'
import { useIsMobile } from '@/composables/useIsMobile'

type BookCategory = "enemies" | "dungeons" | "fates" | "leves"
const bookCategories : { key: BookCategory, label: string }[] = [
  { key: 'enemies', label: '讨伐敌人' },
  { key: 'dungeons', label: '迷宫探险' },
  { key: 'fates', label: '危命任务' },
  { key: 'leves', label: '理符任务' },
]

/**
 * 理符类型映射
 * 1: 行会理符任务-普通佣兵任务
 * 2: 军队理符任务-黑涡团任务
 * 3: 军队理符任务-双蛇党任务
 * 4: 军队理符任务-恒辉队任务
 */
const LEVE_TYPE_MAP: Record<number, { label: string, tagType: 'default' | 'error' | 'warning' | 'info' }> = {
  1: { label: '普通佣兵任务', tagType: 'default' },
  2: { label: '黑涡团任务', tagType: 'error' },
  3: { label: '双蛇党任务', tagType: 'warning' },
  4: { label: '恒辉队任务', tagType: 'info' },
}

const { isMobile } = useIsMobile()

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

watch(currCategory, () => {
  currFocus.value = undefined
})

const currFooterDescription = computed(() => {
  if (!currFocus.value) return '点击项目以查看详情。'
  const key = currCategory.value
  if (key === 'dungeons') {
    return currBookData.value.dungeons?.find((item) => item.id === currFocus.value)?.dname?.[2] ?? '???'
  }
  if (key === 'fates') {
    return currBookData.value.fates?.find((item) => item.id === currFocus.value)?.name?.[2] ?? '???'
  }
  if (key === 'leves') {
    return currBookData.value.leves?.find((item) => item.id === currFocus.value)?.name?.[2] ?? '???'
  }
  return currBookData.value.enemies?.find((item) => item.id === currFocus.value)?.name?.[2] ?? '???'
})

const currBookItemLocation = computed(() => {
  if (!currFocus.value) return undefined
  const key = currCategory.value
  if (key === 'dungeons') {
    return undefined
  }
  if (key === 'leves') {
    return currBookData.value.leves?.find((item) => item.id === currFocus.value)?.npc?.location
  }
  return currBookData.value[key]?.find((item) => item.id === currFocus.value)?.location
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
    <n-p>点击各个章节可查看对应的讨伐敌人、迷宫、危命任务和理符任务详情及地图分布。</n-p>
    <div :class="isMobile ? 'flex overflow-x-auto gap-1.5 pb-1 mobile-book-tabs' : 'max-w-4xl flex flex-wrap items-center gap-1 gap-x-1.5'">
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
    <div v-if="!isMobile" class="min-h-120 flex gap-2 flex-wrap">
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
                  <!-- 讨伐敌人 -->
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

                  <!-- 迷宫探险 -->
                  <div v-else-if="currCategory === 'dungeons'" class="w-full max-w-lg flex flex-col gap-3">
                    <div
                      v-for="dungeon in currBookData.dungeons"
                      :key="dungeon.id"
                      class="book-card-item"
                      :class="{ focused: currFocus === dungeon.id }"
                      @click="handleBookItemClick(dungeon.id)"
                    >
                      <img :src="getImgCdnUrl(dungeon.icon)" class="book-card-icon" />
                      <div class="flex-1 min-w-0">
                        <div class="card-title-row">
                          <n-tag size="small" type="primary" :bordered="false">{{ dungeon.level }}级</n-tag>
                          <span class="card-title">{{ dungeon.dname[2] }}</span>
                        </div>
                        <div class="card-sub-text">
                          目标首领：{{ dungeon.mname[2] }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 危命任务 -->
                  <div v-else-if="currCategory === 'fates'" class="w-full max-w-lg flex flex-col gap-3">
                    <div
                      v-for="fate in currBookData.fates"
                      :key="fate.id"
                      class="book-card-item"
                      :class="{ focused: currFocus === fate.id }"
                      @click="handleBookItemClick(fate.id)"
                    >
                      <img :src="getImgCdnUrl(fate.icon)" class="book-card-icon" />
                      <div class="flex-1 min-w-0">
                        <div class="card-title-row">
                          <span class="card-title">{{ fate.name[2] }}</span>
                        </div>
                        <div class="card-sub-text">
                          位置：{{ XivMaps[fate.location[0]]?.name_zh ?? '未知' }} (X: {{ fate.location[1].toFixed(1) }}, Y: {{ fate.location[2].toFixed(1) }})
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 理符任务 -->
                  <div v-else-if="currCategory === 'leves'" class="w-full max-w-lg flex flex-col gap-3">
                    <div
                      v-for="leve in currBookData.leves"
                      :key="leve.id"
                      class="book-card-item"
                      :class="{ focused: currFocus === leve.id }"
                      @click="handleBookItemClick(leve.id)"
                    >
                      <img :src="getImgCdnUrl(leve.icon)" class="book-card-icon" />
                      <div class="flex-1 min-w-0">
                        <div class="card-title-row">
                          <n-tag
                            size="small"
                            :type="LEVE_TYPE_MAP[leve.type]?.tagType || 'default'"
                            :bordered="false"
                          >
                            {{ LEVE_TYPE_MAP[leve.type]?.label || '理符任务' }}
                          </n-tag>
                          <span class="card-title">{{ leve.name[2] }}</span>
                        </div>
                        <div class="card-sub-text">
                          接取NPC：{{ leve.npc.name[2] }}（{{ XivMaps[leve.npc.location[0]]?.name_zh ?? '未知' }} X: {{ leve.npc.location[1].toFixed(1) }}, Y: {{ leve.npc.location[2].toFixed(1) }}）
                        </div>
                      </div>
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
            <!-- 迷宫探险保持空白 -->
            <div v-if="currCategory === 'dungeons'"></div>
            <!-- 地图展示 -->
            <div v-else-if="currBookItemMapData" class="text-center">
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

    <!-- 移动端：黄道文书图鉴重排 -->
    <div v-else class="book-mobile">
      <!-- 分类 Tab（横向滚动） -->
      <div class="book-tabs">
        <n-button
          v-for="cat in bookCategories"
          :key="cat.key"
          class="book-tab"
          :type="currCategory === cat.key ? 'primary' : 'default'"
          @click="currCategory = cat.key"
        >
          {{ cat.label }}
        </n-button>
      </div>

      <!-- 敌人网格：复用桌面端 4 列 2-3-3-2 结构，等比例缩小 -->
      <div v-if="currCategory === 'enemies'" class="book-enemies-grid-mobile">
        <div
          v-for="col in enemyColumns"
          :key="col.key"
          class="book-col-mobile"
        >
          <div
            v-for="enemy in col.items"
            :key="enemy.id"
            class="book-grid-item-mobile"
            :class="[
              currFocus === enemy.id ? 'focused' : '',
              (col.key === 'col1' || col.key === 'col4') ? 'size-lg' : 'size-sm'
            ]"
            @click="handleBookItemClick(enemy.id)"
          >
            <img :src="getImgCdnUrl(enemy.icon)" />
          </div>
        </div>
      </div>

      <!-- 迷宫探险移动端 -->
      <div v-else-if="currCategory === 'dungeons'" class="flex flex-col gap-2">
        <div
          v-for="dungeon in currBookData.dungeons"
          :key="dungeon.id"
          class="book-card-item mobile"
          :class="{ focused: currFocus === dungeon.id }"
          @click="handleBookItemClick(dungeon.id)"
        >
          <img :src="getImgCdnUrl(dungeon.icon)" class="book-card-icon" />
          <div class="flex-1 min-w-0">
            <div class="card-title-row">
              <n-tag size="tiny" type="primary" :bordered="false">{{ dungeon.level }}级</n-tag>
              <span class="card-title">{{ dungeon.dname[2] }}</span>
            </div>
            <div class="card-sub-text">
              目标首领：{{ dungeon.mname[2] }}
            </div>
          </div>
        </div>
      </div>

      <!-- 危命任务移动端 -->
      <div v-else-if="currCategory === 'fates'" class="flex flex-col gap-2">
        <div
          v-for="fate in currBookData.fates"
          :key="fate.id"
          class="book-card-item mobile"
          :class="{ focused: currFocus === fate.id }"
          @click="handleBookItemClick(fate.id)"
        >
          <img :src="getImgCdnUrl(fate.icon)" class="book-card-icon" />
          <div class="flex-1 min-w-0">
            <div class="card-title-row">
              <span class="card-title">{{ fate.name[2] }}</span>
            </div>
            <div class="card-sub-text">
              位置：{{ XivMaps[fate.location[0]]?.name_zh ?? '未知' }} (X: {{ fate.location[1].toFixed(1) }}, Y: {{ fate.location[2].toFixed(1) }})
            </div>
          </div>
        </div>
      </div>

      <!-- 理符任务移动端 -->
      <div v-else-if="currCategory === 'leves'" class="flex flex-col gap-2">
        <div
          v-for="leve in currBookData.leves"
          :key="leve.id"
          class="book-card-item mobile"
          :class="{ focused: currFocus === leve.id }"
          @click="handleBookItemClick(leve.id)"
        >
          <img :src="getImgCdnUrl(leve.icon)" class="book-card-icon" />
          <div class="flex-1 min-w-0">
            <div class="card-title-row">
              <n-tag
                size="tiny"
                :type="LEVE_TYPE_MAP[leve.type]?.tagType || 'default'"
                :bordered="false"
              >
                {{ LEVE_TYPE_MAP[leve.type]?.label || '理符任务' }}
              </n-tag>
              <span class="card-title">{{ leve.name[2] }}</span>
            </div>
            <div class="card-sub-text">
              接取NPC：{{ leve.npc.name[2] }}（{{ XivMaps[leve.npc.location[0]]?.name_zh ?? '未知' }}）
            </div>
          </div>
        </div>
      </div>

      <!-- 描述 -->
      <div class="book-footer-mobile">{{ currFooterDescription }}</div>

      <!-- 移动端地图（迷宫探险不显示地图模块） -->
      <template v-if="currCategory !== 'dungeons'">
        <div v-if="currBookItemMapData" class="book-map-mobile">
          <XivMap
            :map-data="currBookItemMapData.mapInfo"
            :flag-x="currBookItemMapData.x"
            :flag-y="currBookItemMapData.y"
            :map-size="300"
          />
          <n-divider class="my-2!" />
          <div class="text-center">
            <div class="text-lg">{{ currBookItemMapData.mapInfo.name_zh }}</div>
            <div class="text-xs">{{ `(X: ${currBookItemMapData.x.toFixed(1)}, Y: ${currBookItemMapData.y.toFixed(1)})` }}</div>
          </div>
        </div>
        <div v-else class="book-map-mobile book-map-empty">请先选择一个项目。</div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.book-item {
  cursor: pointer;

  &:hover {
    background-color: var(--app-color-background-hover);
  }
  &.focused {
    background-color: var(--app-color-primary);
  }
}

.book-card-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: var(--app-color-background-embedded);
  border: 1px solid var(--app-color-border);
  cursor: pointer;
  height: 76px;
  box-sizing: border-box;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--app-color-background-hover);
    border-color: var(--app-color-primary);
  }

  &.focused {
    border-color: var(--app-color-primary);
    background-color: var(--app-color-background-hover);
    box-shadow: 0 0 0 1px var(--app-color-primary);
  }

  .book-card-icon {
    width: 52px;
    height: 52px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .card-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 24px;
    margin-bottom: 4px;
  }

  .card-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--app-color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-sub-text {
    font-size: 12px;
    color: var(--app-color-text-sub);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.mobile {
    height: 64px;
    padding: 8px 10px;
    gap: 10px;

    .book-card-icon {
      width: 44px;
      height: 44px;
    }

    .card-title-row {
      min-height: 20px;
      margin-bottom: 2px;
      gap: 6px;
    }

    .card-title {
      font-size: 13px;
    }

    .card-sub-text {
      font-size: 11px;
    }
  }
}

/* === 移动端文书按钮横向滚动 === */
.mobile-book-tabs {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.mobile-book-tabs::-webkit-scrollbar {
  display: none;
}

/* === 移动端黄道文书重排 === */
.book-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.book-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.book-enemies-grid-mobile {
  display: grid;
  grid-template-columns: repeat(4, auto);
  gap: 8px;
  justify-content: center;
}
.book-col-mobile {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 4px;
}
.book-grid-item-mobile {
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  background: var(--app-color-background-embedded);
}
.book-grid-item-mobile.focused {
  border-color: var(--app-color-primary);
}
.book-grid-item-mobile.size-lg {
  width: 64px;
  height: 64px;
}
.book-grid-item-mobile.size-sm {
  width: 48px;
  height: 48px;
}
.book-grid-item-mobile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.book-footer-mobile {
  padding: 8px 12px;
  background: var(--app-color-background-embedded);
  border-radius: 6px;
  font-size: 13px;
  color: var(--app-color-text);
  min-height: 36px;
}
.book-map-mobile {
  background: var(--app-color-background);
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  padding: 12px;
}
.book-map-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-color-text-sub);
  font-size: 13px;
  min-height: 120px;
}
</style>
