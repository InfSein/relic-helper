# FFXIV 肝武助手 (Relic Weapon Helper)

一个帮助最终幻想14玩家跟踪和管理各个资料片肝位武器（Relic Weapons）制作进度的工具。

## 项目预览
- 统计所有武器阶段的完成情况
- 展示详细的素材需求清单
- Markdown 动态渲染：支持在说明文档中直接引用游戏物品，显示图标和悬浮窗。
- 魂晶时段助手：实时显示 12 颗魂晶在“月 / 日 / 刻”三个维度下的高概率时间段。

## 技术架构
- 前端框架: Vue 3 (Composition API)
- 构建工具: Vite
- UI 组件库: Naive UI
- 样式: Tailwind CSS 4
- 内容处理: Markdown-it + 自定义 Vue 渲染逻辑，支持 `{{item:id}}` 语法。
- 时间计算: 基于艾欧泽亚时间比例的实时倒计时计算。

## 本地运行方法
1. 安装依赖: `npm install`
2. 启动开发服务器: `npm run dev`
3. 浏览器访问: `http://localhost:5173`

## 开发说明
- 内容编辑: 在 `src/assets/contents` 下创建 `.md` 文件。
- 动态物品: 在 Markdown 中使用 `{{item:物品ID}}` 即可渲染带图标和详细信息的物品组件。例如：`这些都需要筹备物品 {{item:12768}} 才能完成。`
- 组件渲染: 使用 `XivMarkdown.vue` 渲染导入的 MD 内容。

## 测试方法和常用命令
- 类型检查: `npm run type-check`
- 打包: `npm run build`

## 已完成功能
- [x] 基础项目搭建与 Naive UI 集成
- [x] 肝武详细进度管理
- [x] 基于 Markdown 的内容渲染系统
- [x] 自定义 FFXIV 物品标签解析
- [x] 魂晶高概率时段表（含月/日/刻联动与倒计时）

## 待办事项
- [ ] 为 AtmaHelper 增加自动化测试，校验关键时段切换边界。

## 搜索记录
- 搜索结论：对于 Vue 3 + Vite 的 Markdown 渲染，采用 `?raw` 导入配合 `markdown-it` 解析，并在 Vue 组件中手动注入子组件是处理“混合动态组件”需求的最佳实践方案，避免了引入重型渲染引擎。
- 本次任务：已使用本地保存网页 (`ff14db.games.sina.com.cn.html` 与 `ff14db.games.sina.com.cn_files`) 完成逻辑提取，不需要额外外网搜索。
