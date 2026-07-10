# 渲染测试

这是一个用于测试 Markdown 渲染系统的文件。

### 1. 基础语法测试
- **粗体文字**
- *斜体文字*
- [外部链接](https://ff14.huijiwiki.com)

### 2. 自定义组件测试
基础引用：{{item:10058}}

带数量引用：{{item:10058|amount=99|showAmount=true}}

隐藏图标：{{item:10058|hideIcon=true}}

隐藏名称：{{item:10058|hideName=true}}

### 3. 段落测试
这是一段普通的文本，中间穿插了一个物品 {{item:10058}}，然后继续写完了这一段。
应当能够正常换行和保持间距。

### 4. 表格测试

| 阶段    | 需要的物品                |
| ------- | ------------------------- |
| stage 1 | {{item:10058}}            |
| stage 2 | {{item:10058|amount=99|showAmount=true}} |
| stage 3 | {{item:10058}}            |

