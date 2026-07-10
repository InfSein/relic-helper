/* eslint-disable */
// @ts-nocheck

// 这个文件通过 unplugin-auto-import 生成。
// * 当你对项目引用的 naive-ui 组件进行了增加/减少时，
// * 请执行 build, 然后将生成的 src/components.d.ts 的内容复制到这个文件中。

export {}

/* prettier-ignore */
declare module 'vue' {
  export interface GlobalComponents {
    NButton: typeof import('naive-ui')['NButton']
    NConfigProvider: typeof import('naive-ui')['NConfigProvider']
    NDialogProvider: typeof import('naive-ui')['NDialogProvider']
    NGlobalStyle: typeof import('naive-ui')['NGlobalStyle']
    NIcon: typeof import('naive-ui')['NIcon']
    NLayout: typeof import('naive-ui')['NLayout']
    NLayoutFooter: typeof import('naive-ui')['NLayoutFooter']
    NLayoutHeader: typeof import('naive-ui')['NLayoutHeader']
    NLayoutSider: typeof import('naive-ui')['NLayoutSider']
    NMenu: typeof import('naive-ui')['NMenu']
    NMessageProvider: typeof import('naive-ui')['NMessageProvider']
    NResult: typeof import('naive-ui')['NResult']
    NText: typeof import('naive-ui')['NText']
  }
}
