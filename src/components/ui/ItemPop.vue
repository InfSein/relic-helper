<script lang="ts" setup>
import {
  OpenInNewFilled,
} from '@vicons/material'
import ItemSpan from './ItemSpan.vue'
import XivFARImage from './XivFARImage.vue'
import LocationSpan from './map/LocationSpan.vue'
import HelpButton from './HelpButton.vue'
import {
  XivJobs, type XivJob,
  XivAttributes
} from '@/assets/data'
import type EorzeaTime from '@/utils/eorzea-time'
import { getItemInfo, type ItemInfo } from '@/tools/item'

const currentET = inject<Ref<EorzeaTime>>('currentET')!

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

const showItemHqAttr = ref(true)

onMounted(() => {
  if (!itemHasHQ.value) {
    showItemHqAttr.value = false
  }
})

const getJobName = (jobInfo: XivJob) => {
  return jobInfo?.job_name_zh || '???'
}

const getItemName = () => {
  return props.itemInfo.name_zh || '未翻译的物品'
}
/** 获取物品副名称(即其他语言的名称) */
const getItemSubName = () => {
  return props.itemInfo.name_ja + ' / ' + props.itemInfo.name_en
}
const getItemDescriptions = () => {
  let description = props.itemInfo.descZH

  // * 处理特殊字符(好像只有E端有)
  // 处理颜色字符
  description = description.replace(/\{\{color\|id=(\d+)\|([^}]+)\}\}/g, (match, id, text) => {
    let color = ''
    if (id == 504) color = 'orange'

    if (color) {
      return `<span style="color: ${color}">${text}</span>`
    } else {
      return text
    }
  })
  // 处理斜体
  description = description.replace(/\{\{Italic\|([^}]*)\}\}/g, '<span class="italic">$1</span>')

  const descs = description.split('<br>')
  return `<p>${descs.join('</p><p>')}</p>`
}
const getItemTypeName = () => {
  return props.itemInfo.uiTypeNameZH
}
const getAttrName = (attrId: number) => {
  const attr = XivAttributes[attrId]
  if (!attr) {
    return '???'
  }
  return attr.name_zh
}
const getPlaceName = () => {
  return props.itemInfo.gatherInfo?.placeNameZH
}
const itemHasHQ = computed(() => {
  if (props.itemInfo.tempAttrsProvided?.length) {
    return props.itemInfo.tempAttrsProvided.every(subArr => subArr[1])
  } else {
    return props.itemInfo.attrsProvided.every(subArr => subArr[2] > 0)
  }
})
const itemTempAttrTexts = computed(() : string[] => {
  if (!props.itemInfo.tempAttrsProvided?.length) {
    return []
  }
  return props.itemInfo.tempAttrsProvided.map(attr => buildAttrText(attr, showItemHqAttr.value))

  function buildAttrText(attr: number[], hq: boolean) {
    const attrId = attr[0]
    const attrPercent = hq ? attr[4] : attr[2]
    const attrMax = hq ? attr[5] : attr[3]
    switch (attrId) {
      case 7: // 体力
      case 8: // 魔力
        return `${getAttrName(attrId)} +${attrPercent} (Max ${attrMax})`
      default:
        return `${getAttrName(attrId)} +${attrPercent}% (Max ${attrMax})`
    }
  }
})
const itemGatherDifficulty = computed(() => {
  if (!props.itemInfo.gatherInfo?.difficulty) return undefined

  const [diffGather, diffPerception] = props.itemInfo.gatherInfo.difficulty
  const diffText = diffGather !== diffPerception
    ? `难度系数：获得${diffGather} / 鉴别${diffPerception}`
    : `难度系数：${diffGather}`

  const processThreshold = (threshold: { field: string; value: number; upstair?: boolean; }, keyval: number) => {
    const func = threshold.upstair ? Math.ceil : Math.floor
    return { ...threshold, value: func(threshold.value * keyval) }
  }
  const gatherThresholds = [
    {
      field: '同级100%获得率',
      value: 0.8,
    },
    ...(
      !props.itemInfo.collectable ? [
        {
          field: '高产/丰收+2',
          value: 0.9,
        },
        {
          field: '高产/丰收+3',
          value: 1.1,
        },
      ] : []
    ),
    ...(
      props.itemInfo.collectable ? [
        {
          field: '提纯+200',
          value: 0.95,
          upstair: true,
        },
        {
          field: '慎重触发率25%',
          value: 1,
        },
      ] : []
    )
  ].map(threshold => processThreshold(threshold, diffGather))
  const perceptionThresholds = [
    ...(
      !props.itemInfo.collectable ? [
        {
          field: '同级30%额外采集率',
          value: 0.95,
          upstair: true,
        },
        {
          field: '同级60%额外采集率',
          value: 1.5,
          upstair: true,
        },
      ] : []
    ),
    ...(
      props.itemInfo.collectable ? [
        {
          field: '集中检查倍率125%',
          value: 0.95,
          upstair: true,
        },
        {
          field: '价值提升概率40%',
          value: 1,
        },
      ] : []
    ),
  ].map(threshold => processThreshold(threshold, diffPerception))

  return {
    diffGather, diffPerception,
    diffText,
    gatherThresholds, perceptionThresholds,
  }
})
const itemCraftRequires = computed(() => {
  const requires : {
    id: number;
    count: number;
  }[] = []
  requires.push(...props.itemInfo.craftRequireCrystals)
  requires.push(...props.itemInfo.craftRequires)
  return requires
})
const itemTailDescriptions = computed(() => {
  const descriptions : string[] = []
  // if (itemLanguage.value === 'zh') {
  //   if (props.itemInfo.usedZHTemp) {
  //     descriptions.push(t('item.text.zh_name_is_temp'))
  //   } else if (props.itemInfo.chsOffline) {
  //     descriptions.push(t('item.text.not_installed_in_chs'))
  //   }
  // }
  return descriptions
})
interface RenderedTradeCost {
  costId: number
  costCount: number
  receiveCount: number
  receive2Id?: number
  receive2Count?: number
  cost2Id?: number
  cost2Count?: number
  cost3Id?: number
  cost3Count?: number
  level: number // 嵌套层级，方便渲染缩进或分隔
}
const tradeCostList = computed(() => {
  const result: RenderedTradeCost[] = []
  let current = props.itemInfo.tradeInfo
  let level = 0

  while (current) {
    result.push({
      costId: current.costId,
      costCount: current.costCount,
      receiveCount: current.receiveCount,
      receive2Id: current.receive2Id,
      receive2Count: current.receive2Count,
      cost2Id: current.cost2Id,
      cost2Count: current.cost2Count,
      cost3Id: current.cost3Id,
      cost3Count: current.cost3Count,
      level
    })
    current = current.tradeAlter
    level++
  }

  return result
})
const timeCanGather = (timeLimit: {start: string, end: string}) => {
  try {
    const parseTime = (time: string) => time.split(':').reduce((acc, val, idx) => acc + parseInt(val) * [60, 1][idx], 0)
    const s = parseTime(timeLimit.start)
    const e = parseTime(timeLimit.end)
    const c = currentET.value.hour * 60 + currentET.value.minute
    if (c >= s && c <= e) {
      return '现可采集'
    }
  } catch (err) {
    console.error(err)
  }
  return ''
}

const openInMomola = () => {
  window.open(`https://fish.ffmomola.com/ng/#/wiki/fish/${props.itemInfo.id}`)
}
const openInAngler = () => {
  const name = getItemName()
  const domain = `https://cn.ff14angler.com/`
  window.open(`${domain}?search=${name}`)
}

const openInBestCraft = () => {
  window.open(`https://tnze.yyyy.games/#/recipe?recipeId=${props.itemInfo?.craftInfo?.recipeId}`)
}
</script>

<template>
  <n-popover
    v-if="itemInfo.id && !disablePop"
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
    <div class="item-popover">
      <!-- 抬头 -->
      <div class="base-info">
        <XivFARImage
          class="item-icon"
          :src="itemInfo.iconUrl"
          :size="35"
        />
        <div class="item-names">
          <div class="main">
            <span>{{ getItemName() }}</span>
            <!-- <span class="extra-name" v-if="itemLanguage === 'zh' && itemInfo.usedZHTemp">
              {{ t('common.temp_trans') }}
            </span> -->
          </div>
          <div class="sub">{{ getItemSubName() }}</div>
        </div>
      </div>
      <div class="item-level">{{ `物品品级 ${itemInfo.itemLevel}` }}</div>
      <n-divider class="item-divider" />
      <div class="item-descriptions">
        <!-- 版本/ID等 -->
        <div class="item-attributes">
          <div class="item-type">
            <XivFARImage
              class="item-icon"
              :src="itemInfo.uiTypeIconUrl"
              :size="14"
            />
            <p>{{ getItemTypeName() }}</p>
          </div>
          <p>{{ `[Patch ${itemInfo.patch}] [${itemInfo.id}]` }}</p>
        </div>
        <!-- 游戏内物品描述 -->
        <div class="main-descriptions" v-html="getItemDescriptions()"></div>
        <!-- 装备属性 -->
        <div class="description-block" v-if="itemInfo.attrsProvided.length">
          <div class="title">
            属性
          </div>
          <n-divider class="item-divider" />
          <div class="content armor" v-if="showItemHqAttr">
            <div
              class="item"
              v-for="(attr, index) in itemInfo.attrsProvided"
              :key="'attr-hq' + index"
            >
              <div>{{ `${getAttrName(attr[0])} +${attr[2]}` }}</div>
            </div>
          </div>
          <div class="content armor" v-else>
            <div
              class="item"
              v-for="(attr, index) in itemInfo.attrsProvided"
              :key="'attr-nq' + index"
            >
              <div>{{ `${getAttrName(attr[0])} +${attr[1]}` }}</div>
            </div>
          </div>
        </div>
        <!-- 使用效果(食物/爆发药) -->
        <div class="description-block" v-if="itemInfo.tempAttrsProvided.length">
          <div class="title">
            效果
          </div>
          <n-divider class="item-divider" />
          <div class="content">
            <div class="item" v-for="(attrText, atIndex) in itemTempAttrTexts" :key="'temp-attr-' + atIndex">
              <div>{{ attrText }}</div>
            </div>
          </div>
        </div>
        <!-- 采集 -->
        <div class="description-block" v-if="itemInfo.gatherInfo || itemInfo.isFishingItem">
          <div class="title">
            采集
            <div v-if="itemInfo.gatherInfo" class="extra">
              <XivFARImage
                class="icon"
                :src="XivJobs[itemInfo.gatherInfo.jobId].job_icon_url"
              />
              <p v-if="itemInfo.gatherInfo.level !== itemInfo.gatherInfo.nodelevel">
                {{ `${itemInfo.gatherInfo.level}级${getJobName(XivJobs[itemInfo.gatherInfo.jobId])}` }}
              </p>
              <p v-else>{{ getJobName(XivJobs[itemInfo.gatherInfo.jobId]) }}</p>
            </div>
            <div v-if="itemInfo.isFishingItem" class="extra">
              <XivFARImage
                class="icon"
                :src="XivJobs[18].job_icon_url"
              />
              <p>{{ getJobName(XivJobs[18]) }}</p>
            </div>
            <div v-if="itemInfo.gatherInfo?.[`gntype_zh`]" class="extra">
              {{ ' - ' }}
              {{ itemInfo.gatherInfo[`gntype_zh`] }}
            </div>
          </div>
          <n-divider class="item-divider" />
          <div class="content" v-if="itemInfo.gatherInfo">
            <div class="other-attrs" v-if="itemGatherDifficulty" style="gap: 2px;">
              {{ itemGatherDifficulty.diffText }}
              <HelpButton
                :size="12"
                icon="question"
                color="var(--color-info)"
                pop-type="popover"
                :placement="'right-start'"
                style="padding: 0;"
              >
                <div>
                  <div class="bold">获得力阈值</div>
                  <n-table size="small" class="content-table tiny-table w-full">
                    <thead>
                      <tr>
                        <th>{{ '项目' }}</th>
                        <th>{{ '阈值' }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(threshold, index) in itemGatherDifficulty.gatherThresholds"
                        :key="'gatherThresholds-' + index"
                      >
                        <td>{{ threshold.field }}</td>
                        <td>{{ threshold.value }}</td>
                      </tr>
                    </tbody>
                  </n-table>
                  <div style="height: 4px;" />
                  <div class="bold">鉴别力阈值</div>
                  <n-table size="small" class="content-table tiny-table w-full">
                    <thead>
                      <tr>
                        <th>{{ '项目' }}</th>
                        <th>{{ '阈值' }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(threshold, index) in itemGatherDifficulty.perceptionThresholds"
                        :key="'perceptionThresholds-' + index"
                      >
                        <td>{{ threshold.field }}</td>
                        <td>{{ threshold.value }}</td>
                      </tr>
                    </tbody>
                  </n-table>
                </div>
              </HelpButton>
            </div>
            <div>采集位置：</div>
            <div class="item">
              <LocationSpan
                :place-id="itemInfo.gatherInfo.placeID"
                :place-name="getPlaceName()"
                :coordinate-x="itemInfo.gatherInfo.posX"
                :coordinate-y="itemInfo.gatherInfo.posY"
                pop-style="padding: 0;"
              />
            </div>
            <div class="other-attrs" v-if="itemInfo.gatherInfo.recommAetheryte" style="margin-left: 1em;">
              ※ 推荐传送点 -
              {{ itemInfo.gatherInfo.recommAetheryte?.[`name_zh`] }}
            </div>
          </div>
          <div class="content" v-if="itemInfo.gatherInfo?.timeLimitInfo?.length">
            <div>采集限时：</div>
            <div
              class="item"
              v-for="(timeLimit, timeLimitIndex) in itemInfo.gatherInfo?.timeLimitInfo"
              :key="'time-limit-' + timeLimitIndex"
            >
              <div>{{ timeLimit.start }} ~ {{ timeLimit.end }}</div>
              <div class="green">{{ timeCanGather(timeLimit) }}</div>
            </div>
          </div>
          <div class="content" v-if="itemInfo.gatherInfo?.folkloreId || itemInfo?.gatherInfo?.requirement">
            <div>采集条件：</div>
            <div class="item small-font" v-if="itemInfo?.gatherInfo?.requirement">
              <div>
                {{ `鉴别力 ${itemInfo.gatherInfo?.requirement}` }}
              </div>
            </div>
            <div class="item small-font" v-if="itemInfo.gatherInfo?.folkloreId">
              {{ '需要习得：' }}
              <ItemSpan span-max-width="180px" :img-size="12" :item-info="getItemInfo(itemInfo.gatherInfo.folkloreId)" :container-id="containerId" />
            </div>
          </div>
          <div class="content" v-if="itemInfo.isFishingItem">
            <div>可尝试：</div>
            <div class="item actions">
              <n-button size="small" @click="openInAngler">
                <template #icon>
                  <n-icon><OpenInNewFilled /></n-icon>
                </template>
                在饿猫中搜索
              </n-button>
              <n-button size="small" @click="openInMomola">
                <template #icon>
                  <n-icon><OpenInNewFilled /></n-icon>
                </template>
                在鱼糕中打开
              </n-button>
            </div>
          </div>
        </div>
        <!-- 需求 -->
        <div class="description-block" v-if="itemInfo.relicInfo?.stageNeeds?.length">
          <div class="title">需求</div>
          <n-divider class="item-divider" />
          <div class="content">
            <div>制作此武器需要收集以下物品：</div>
            <template v-for="(need, index) in itemInfo.relicInfo.stageNeeds" :key="index">
              <div class="item trade-item">
                <ItemSpan
                  span-max-width="230px"
                  :item-info="getItemInfo(need.itemId)"
                  :amount="need.count"
                  show-amount
                  :container-id="containerId"
                />
              </div>
            </template>
          </div>
        </div>
        <!-- 兑换 -->
        <div class="description-block" v-if="tradeCostList.length && !itemInfo.relicInfo?.stageNeeds?.length">
          <div class="title">兑换</div>
          <n-divider class="item-divider" />
          <div class="content">
            <div>该物品可通过兑换获得：</div>
            <template v-for="(cost, index) in tradeCostList" :key="index">
              <div class="item trade-item">
                {{ index > 0 ? '或' : '' }}
                <ItemSpan
                  span-max-width="230px"
                  :item-info="getItemInfo(cost.costId)"
                  :amount="cost.costCount"
                  show-amount
                  :container-id="containerId"
                />
              </div>
              <div class="item trade-item trade-item-l2" v-if="cost.cost2Id">
                {{ '与' }}
                <ItemSpan
                  span-max-width="210px"
                  :item-info="getItemInfo(cost.cost2Id)"
                  :amount="cost.cost2Count"
                  show-amount
                  :container-id="containerId"
                />
              </div>
              <div class="item trade-item trade-item-l2" v-if="cost.cost3Id">
                {{ '与' }}
                <ItemSpan
                  span-max-width="210px"
                  :item-info="getItemInfo(cost.cost3Id)"
                  :amount="cost.cost3Count"
                  show-amount
                  :container-id="containerId"
                />
              </div>
              <div class="item other-attrs flex-nowrap!" v-if="cost.receiveCount > 1">
                {{ `每次兑换可获得${cost.receiveCount}个` }}
              </div>
              <div class="item other-attrs trade-item" v-if="cost.receive2Id && cost.receive2Count">
                {{ `通过此兑换还可获得` }}
                <ItemSpan
                  span-max-width="80px"
                  :item-info="getItemInfo(cost.receive2Id)"
                  :img-size="12"
                  :amount="cost.receive2Count"
                  :show-amount="cost.receive2Count > 1"
                  :container-id="containerId"
                  style="width: fit-content;"
                />
              </div>
            </template>
          </div>
        </div>
        <!-- 制作 -->
        <div class="description-block" v-if="itemInfo.craftRequires.length">
          <div class="title">
            制作
            <div class="extra">
              <XivFARImage
                class="icon"
                :src="XivJobs[itemInfo.craftInfo?.jobId].job_icon_url"
              />
              <p>
                {{ `${itemInfo.craftInfo?.craftLevel}级` +
                  '★'.repeat(itemInfo.craftInfo?.starCount || 0)+
                  getJobName(XivJobs[itemInfo.craftInfo?.jobId]) + '配方'
                }}
              </p>
            </div>
          </div>
          <n-divider class="item-divider" />
          <div class="content">
            <div class="other-attrs">
              {{ `耐久 ${itemInfo.craftInfo?.durability} / ` +
                `难度 ${itemInfo.craftInfo?.progress} / ` +
                `品质 ${itemInfo.craftInfo?.quality}`
              }}
              <a
                v-if="itemInfo?.craftInfo?.recipeId"
                style="padding: 0; display: flex; align-items: center; line-height: 1.2; cursor: pointer;"
                title="在BestCraft中模拟制作"
                @click="openInBestCraft"
              >
                <n-icon :size="12"><OpenInNewFilled /></n-icon>
                {{ '模拟制作' }}
              </a>
            </div>
            <div
              class="item"
              v-for="(item, index) in itemCraftRequires"
              :key="'recipe-' + index"
            >
              <ItemSpan :item-info="getItemInfo(item.id)" :amount="item.count" show-amount :container-id="containerId" />
            </div>
            <div class="other-attrs" v-if="(itemInfo.craftInfo?.yields || 1) > 1">
              {{ `每次制作会产出${itemInfo.craftInfo?.yields}个成品` }}
            </div>
            <div v-if="itemInfo.craftInfo?.thresholds?.craftsmanship || itemInfo.craftInfo?.thresholds?.control || itemInfo.craftInfo?.masterRecipeId">
              <div>{{ '制作条件' }}</div>
              <div class="item small-font">
                <div v-if="itemInfo.craftInfo?.thresholds?.craftsmanship">
                  {{ `作业精度${itemInfo.craftInfo?.thresholds?.craftsmanship}` }}
                </div>
                <div v-if="itemInfo.craftInfo?.thresholds?.control">
                  {{ `加工精度${itemInfo.craftInfo?.thresholds?.control}` }}
                </div>
              </div>
              <div class="item small-font" v-if="itemInfo.craftInfo?.masterRecipeId">
                {{ '需要习得' }}
                <ItemSpan span-max-width="180px" :img-size="12" :item-info="getItemInfo(itemInfo.craftInfo.masterRecipeId)" :container-id="containerId" />
              </div>
            </div>
            <div class="other-attrs">
              <div v-if="!itemInfo.craftInfo?.qsable" style="color: var(--color-error);">{{ '无法进行简易制作' }}</div>
              <div v-if="!itemInfo.craftInfo?.hqable" style="color: var(--color-error);">{{ '无法制作优质道具' }}</div>
            </div>
          </div>
        </div>
        <!-- 插槽，目前好像没用到 -->
        <slot name="extra-descriptions" />
        <!-- 注 -->
        <div class="tail-descriptions">
          <p v-for="(desc, index) in itemTailDescriptions" :key="'tail-descriptions' + index">
            {{ desc }}
          </p>
        </div>
      </div>
    </div>
  </n-popover>
  <slot v-else />
</template>

<style scoped>
.small-font {
  font-size: calc(var(--n-font-size) - 2px);
}
.content-table {
  td {
    min-width: 50px;
  }
  tr>th:not(:first-child),
  tr>td:not(:first-child) {
    text-align: right;
  }
}
.item-popover {
  user-select: text;

  .base-info {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    margin-top: 2%;

    .item-names {
      .main span {
        line-height: 1;
        font-size: calc(var(--n-font-size) + 2px);
      }
      .sub,
      .main span.extra-name {
        line-height: 1;
        font-size: calc(var(--n-font-size) - 2px);
        color: var(--color-text-sub);
      }
    }
  }
  .item-level {
    line-height: 1.2;
    margin-top: 3px;
  }
  .item-divider {
    margin: 0 2px;
  }
  .item-descriptions {
    display: flex;
    flex-direction: column;
    gap: 3px;

    .item-attributes {
      display: flex;
      align-items: center;
      gap: 3px;
      line-height: 1.2;
      flex-wrap: wrap;

      .item-type {
        display: flex;
        align-items: center;
        gap: 1px;
      }
      .item-type::before { content: "["; }
      .item-type::after { content: "]"; }
    }
    .main-descriptions {
      text-indent: 1em;
      line-height: 1.2;
    }
    .temp-attr-descriptions {
      line-height: 1.2;

      .title {
        margin-top: 2px;
      }
      .content {
        margin-left: 1em;
      }
      .content .block p::before {
        content: "· ";
      }
      .extra {
        font-size: calc(var(--n-font-size) - 2px);
        margin: 2px 0 5px;
      }
    }
    .description-block {
      line-height: 1.2;

      .title {
        font-weight: bold;
        display: flex;
        align-items: baseline;
        --size-small: calc(var(--n-font-size) - 2px);
        --textgap-left: calc(var(--n-font-size) - 1px);

        .extra {
          margin-left: 3px;
          font-weight: normal;
          font-size: var(--size-small);
          line-height: 1;

          img {
            float: left;
            height: var(--size-small);
            display: block;
          }
          p {
            font-size: var(--size-small);
            padding-left: var(--textgap-left);
          }
        }
        .extra::after {
          content: '';
          clear: both;
          display: block;
        }
      }
      .content .item {
        margin-left: 1em;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 3px;
      }
      .content .item.trade-item {
        flex-wrap: nowrap;
      }
      .content .item.trade-item-l2 {
        margin-left: 1.5em;
      }
      .content .item.actions {
        margin: 3px 1em;
        flex-direction: column;

        button {
          width: 100%;
        }
      }
      .content.armor {
        width: fit-content;
        display: grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        column-gap: 5px;
      }
      .content .list {
        margin-left: 1em;
        padding-left: 1em;
        li::marker {
          content: ' > ';
        }
      }
      .content .content-table {
        width: fit-content;
        margin-top: 2px;
        margin-left: 1em;
      }
      .content .other-attrs,
      .content.extra {
        display: flex;
        align-items: center;
        gap: 0 5px;
        flex-wrap: wrap;
        font-size: calc(var(--n-font-size) - 2px);
      }
    }
    .tail-descriptions {
      margin-top: 5px;
      font-size: calc(var(--n-font-size) - 2px);
      line-height: 1;
    }
  }
}
</style>
