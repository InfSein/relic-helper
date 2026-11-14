/**
 * 点数（神典石）道具定义
 * * 新增神典石时只需在此处追加即可，素材统计会自动识别其本身及其兑换道具
 */
export const TomestoneFallbackNames: Readonly<Record<number, string>> = {
  28: '亚拉戈诗学神典石',
  48: '亚拉戈数理神典石',
}

export const isTomestone = (itemId: number): boolean =>
  Object.prototype.hasOwnProperty.call(TomestoneFallbackNames, itemId)

export const getTomestoneFallbackName = (itemId: number): string =>
  TomestoneFallbackNames[itemId] ?? ''
