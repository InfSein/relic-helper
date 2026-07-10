<script setup lang="ts">
import {
  TrendingUpRound,
} from '@vicons/material'
import { getItemInfo } from '@/tools/item'
import EorzeaTime from '@/utils/eorzea-time'

const currentET = inject<Ref<EorzeaTime>>('currentET')!

// #region Constants
const atmaItems = [
  { id: 7854, name: '摩羯座', area: '东部林区', element: 'ice', dayAltElement: 'umbral' },
  { id: 7853, name: '水瓶座', area: '拉诺西亚高地', element: 'ice', dayAltElement: 'umbral' },
  { id: 7859, name: '双鱼座', area: '拉诺西亚低地', element: 'water', dayAltElement: 'umbral' },
  { id: 7856, name: '白羊座', area: '中央拉诺西亚', element: 'water', dayAltElement: 'umbral' },
  { id: 7855, name: '金牛座', area: '东萨纳兰', element: 'wind', dayAltElement: 'astral' },
  { id: 7857, name: '双子座', area: '西萨纳兰', element: 'wind', dayAltElement: 'astral' },
  { id: 7862, name: '巨蟹座', area: '西拉诺西亚', element: 'lightning', dayAltElement: 'astral' },
  { id: 7858, name: '狮子座', area: '拉诺西亚外地', element: 'lightning', dayAltElement: 'astral' },
  { id: 7851, name: '处女座', area: '中央林区', element: 'fire', dayAltElement: 'astral' },
  { id: 7861, name: '天秤座', area: '中萨纳兰', element: 'fire', dayAltElement: 'astral' },
  { id: 7852, name: '天蝎座', area: '南萨纳兰', element: 'earth', dayAltElement: 'umbral' },
  { id: 7860, name: '射手座', area: '北部林区', element: 'earth', dayAltElement: 'umbral' }
] as const

const dayElements = ['wind', 'lightning', 'fire', 'earth', 'ice', 'water', 'astral', 'umbral'] as const
const hourElements = ['wind', 'lightning', 'fire', 'earth', 'ice', 'water'] as const
// #endregion

const atmaRows = computed(() => {
  const state = {
    monthIndex: currentET.value.month - 1,
    dayIndex: currentET.value.day - 1,
    hour: currentET.value.hour,
  }
  const currentWeekday = state.dayIndex % 8
  const currentDayElement = dayElements[currentWeekday]
  const currentHourElement = hourElements[state.hour % 6]
  const currentHourElementIndex = state.hour % 6

  const lastRow = {
    monthMatched: false,
    dayMatched: false,
    hourMatched: false,
  }

  return atmaItems.map((item, index) => {
    const monthMatched = state.monthIndex === index
    const dayMatched = currentDayElement === item.element || currentDayElement === item.dayAltElement
    const hourMatched = currentHourElement === item.element

    const row = {
      id: item.id,
      name: item.name,
      area: item.area,
      month: {
        matched: monthMatched,
        hideTopBorder: lastRow.monthMatched && monthMatched,
        hideRightBorder: monthMatched && dayMatched,
        cd: monthMatched ? currentET.value.toNextMonthLocalMs : calCountdown(
          state.monthIndex, index, currentET.value.inMonthMs, 12, EorzeaTime.ET_MS_PER_MONTH
        ),
      },
      day: {
        matched: dayMatched,
        hideTopBorder: lastRow.dayMatched && dayMatched,
        hideRightBorder: dayMatched && hourMatched,
        cd: dayMatched ? currentET.value.toNextDayLocalMs : Math.min(
          calCountdown(currentWeekday, dayElements.indexOf(item.element), currentET.value.inDayMs, 8, EorzeaTime.ET_MS_PER_DAY),
          calCountdown(currentWeekday, dayElements.indexOf(item.dayAltElement), currentET.value.inDayMs, 8, EorzeaTime.ET_MS_PER_DAY)
        ),
      },
      hour: {
        matched: hourMatched,
        hideTopBorder: lastRow.hourMatched && hourMatched,
        hideRightBorder: false,
        cd: hourMatched ? currentET.value.toNextHourLocalMs : calCountdown(
          currentHourElementIndex, hourElements.indexOf(item.element), currentET.value.inHourMs, 6, EorzeaTime.ET_MS_PER_HOUR
        ),
      },
    }

    lastRow.monthMatched = monthMatched
    lastRow.dayMatched = dayMatched
    lastRow.hourMatched = hourMatched

    return row
  })

  function calCountdown(
    current: number, target: number, offsetMs: number,
    /** 周期系数 */ cycleRate: number,
    /** 周期毫秒 */ cycleMs: number
  ) {
    let delta = (target - current + cycleRate) % cycleRate
    if (delta === 0) delta = cycleRate
    return (delta * cycleMs - offsetMs) * EorzeaTime.LOCAL_PER_ET_RATE
  }
})

const formatCountdown = (localMilliseconds: number) => {
  let secondsTotal = Math.floor(Math.max(0, localMilliseconds) / 1000)
  const seconds = secondsTotal % 60
  secondsTotal = (secondsTotal - seconds) / 60
  const minutes = secondsTotal % 60
  secondsTotal = (secondsTotal - minutes) / 60
  const hours = secondsTotal % 24
  const days = (secondsTotal - hours) / 24

  if (days === 0) {
    if (hours === 0) {
      if (minutes === 0)
        return `${seconds}秒`
      if (minutes === 1)
        return `${60 + seconds}秒`
      return `${minutes}分钟`
    }
    if (hours === 1)
      return `${60 + minutes}分钟`
    return `${hours}小时${minutes}分钟`
  }

  if (days === 1)
    return `${24 + hours}小时`

  return `${days}天${hours}小时`
}
</script>

<template>
  <div>
    <n-h1>魂晶计时器</n-h1>
    <n-p>玄不改非……仅供参考！</n-p>
    <n-table striped :single-line="false" class="table-fixed">
      <colgroup>
        <col class="w-50" />
        <col class="w-45" />
        <col />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th rowspan="2">魂晶</th>
          <th rowspan="2">地点</th>
          <th colspan="3">游戏内对应</th>
        </tr>
        <tr>
          <th>月</th>
          <th>日</th>
          <th>刻</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in atmaRows" :key="row.id">
          <td class="text-center"><ItemSpan inline :item-info="getItemInfo(row.id)" /></td>
          <td class="text-center">{{ row.area }}</td>
          <td
            v-for="key in (['month', 'day', 'hour'] as const)" :key="key"
            class="relative"
            :class="{ 'matched': row[key].matched, 'hide-top': row[key].hideTopBorder, 'hide-right': row[key].hideRightBorder }"
          >
            <div class="flex flex-col items-center gap-1">
              <template v-if="row[key].matched">
                <div>掉落概率提升！</div>
                <div class="text-xs text-gray-500">
                  {{ formatCountdown(row[key].cd) }}后结束
                </div>
                <div class="absolute right-1 -bottom-3">
                  <n-icon :size="48" :component="TrendingUpRound" />
                </div>
              </template>
              <template v-else>
                <div>
                  {{ formatCountdown(row[key].cd) }}后到来
                </div>
              </template>
            </div>
          </td>
        </tr>
      </tbody>
    </n-table>

    <n-h2>使用说明</n-h2>
    <n-ul>
      <n-li>装备了+1(天极)或更高阶段的古武之后，才能通过完成FATE获取魂晶。</n-li>
      <n-li>同一行内显示的“掉落概率提升！”越多，该魂晶此时的掉落概率就越高。</n-li>
      <n-li>请校准设备的时区/时间后再使用本工具。</n-li>
      <n-li>
        相关代码逻辑参考了新浪游戏电子书攻略组的
        <a target="_blank" href="http://ff14db.games.sina.com.cn/">原魂晶计时器</a>
        工具。
      </n-li>
    </n-ul>
  </div>
</template>

<style scoped>
th {
  text-align: center;
  font-weight: bold;
}
td.matched {
  color: var(--color-primary) !important;
  background-color: var(--color-primary-sub) !important;
  border: 1px solid var(--color-primary) !important;

  &.hide-top {
    border-top-color: transparent !important;
  }
  &.hide-right {
    border-right-color: transparent !important;
  }
}
</style>
