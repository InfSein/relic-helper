import type { Component } from 'vue'
import { h, type VNode, type VNodeChild } from 'vue'
import { NIcon, NTooltip } from 'naive-ui'


export function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

export function renderTooltip(trigger: VNode, content: string): VNodeChild {
  return h(NTooltip, null, {
    trigger: () => trigger,
    default: () => content
  })
}
