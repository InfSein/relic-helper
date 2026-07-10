/* eslint-disable */
// @ts-nocheck

// 这个文件用于定义全局组件。

export {}

/* prettier-ignore */
declare module 'vue' {
  export interface GlobalComponents {
    Dialog: typeof import('./components/ui/Dialog.vue')['default']
  }
}
