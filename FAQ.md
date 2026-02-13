# Table Tool 常见问题与解答 (FAQ)

## 📋 目录
- [安装与配置](#安装与配置)
- [开发调试](#开发调试)
- [功能使用](#功能使用)
- [数据管理](#数据管理)
- [错误处理](#错误处理)
- [性能优化](#性能优化)

---

## 安装与配置

### Q1: 如何安装插件依赖？

**A**:
```bash
# 方式1：一键安装所有依赖（推荐）
npm run install:all

# 方式2：分别安装
npm install                              # 主项目
npm run install:editor                   # Vue 编辑器
npm run install:electron                 # Electron 打包
```

### Q2: Cocos 插件无法启用？

**A**: 检查以下几点：
1. **编译插件**：
   ```bash
   npm run build:v2  # Cocos 2.x
   # 或
   npm run build:v3  # Cocos 3.x
   ```

2. **检查目录结构**：
   ```
   your-project/
   └── packages/        # Cocos 2.x
       └── cc_table_tool/
   
   your-project/
   └── extensions/      # Cocos 3.x
       └── cc_table_tool/
   ```

3. **重新加载插件**：
   - Cocos 2.x: `开发者 → 重新加载插件`
   - Cocos 3.x: `开发者 → 重新加载扩展`

### Q3: 编译时出现类型错误？

**A**: 
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 确保安装了类型定义
npm install --save-dev @types/node @cocos/creator-types
```

---

## 开发调试

### Q4: 如何在浏览器中开发调试？

**A**:
```bash
# 启动开发服务器
npm run dev:editor

# 浏览器访问
http://localhost:5173
```

**优势**：
- ✅ 热重载（HMR）
- ✅ Vue DevTools
- ✅ 快速迭代

### Q5: 如何调试 Electron 版本？

**A**:
```bash
# 启动 Electron 开发模式
npm run dev:electron

# 或分步启动
npm run dev:editor              # 终端1：启动 Vue 开发服务器
npm run dev:electron:only       # 终端2：启动 Electron
```

**打开 DevTools**：
```javascript
// electron/main.js
mainWindow.webContents.openDevTools();  // 取消注释这行
```

### Q6: 如何调试 Cocos 插件？

**A**:
```bash
# 1. 构建插件（启用 watch 模式）
npm run watch    # 自动重新编译

# 2. 在 Cocos 中重新加载插件

# 3. 打开开发者工具
# Cocos 2.x/3.x: 菜单 → 开发者 → 开发者工具
```

**在代码中添加日志**：
```typescript
// 主进程
this.editor.log('调试信息');
console.log('更多信息');

// Vue 面板
console.log('Vue 组件调试');
```

### Q7: 如何查看 IPC 通信？

**A**:
```typescript
// 在 src/panels/vue-editor/src/api/cocos.ts 中添加日志
async function sendToMain(method: string, ...args: any[]) {
    console.log('[IPC Send]', method, args);
    const result = await Editor.Message.request('cc-table-tool', method, ...args);
    console.log('[IPC Result]', result);
    return result;
}
```

---

## 功能使用

### Q8: 如何创建新表？

**A**:
1. 打开数据编辑器
2. 点击 "配置管理"
3. 点击 "新建表"
4. 填写表名和描述
5. 添加字段定义
6. 保存表配置

### Q9: 支持哪些字段类型？

**A**: 目前支持 7 种字段类型：

| 类型 | 说明 | 约束 |
|------|------|------|
| `string` | 文本 | maxLength |
| `number` | 数字 | min, max, step |
| `boolean` | 布尔值 | - |
| `select` | 下拉选择 | options[] |
| `reward` | 奖励对象 | { id, count } |
| `array` | 数组 | element, fixedLength |
| `object` | 对象 | properties[] |

### Q10: 如何设置字段约束？

**A**: 在字段编辑器中配置：

```typescript
// 数字字段示例
{
  type: 'number',
  key: 'attack',
  name: '攻击力',
  defaultValue: 0,
  min: 0,         // 最小值
  max: 9999,      // 最大值
  step: 1         // 步长
}

// 文本字段示例
{
  type: 'string',
  key: 'name',
  name: '名称',
  defaultValue: '',
  maxLength: 50   // 最大长度
}

// 下拉字段示例
{
  type: 'select',
  key: 'rarity',
  name: '稀有度',
  options: [
    { label: '普通', value: 'common' },
    { label: '稀有', value: 'rare' },
    { label: '史诗', value: 'epic' }
  ],
  defaultValue: 'common'
}
```

### Q11: 如何使用数组字段？

**A**:

**定长数组**：
```typescript
{
  type: 'array',
  key: 'scores',
  name: '成绩（5项）',
  fixedLength: 5,        // 固定长度
  element: {
    type: 'number',
    key: 'score',
    name: '分数',
    defaultValue: 0
  }
}
```

**不定长数组**：
```typescript
{
  type: 'array',
  key: 'tags',
  name: '标签列表',
  // fixedLength 不设置或为 0
  element: {
    type: 'string',
    key: 'tag',
    name: '标签'
  }
}
```

### Q12: 如何使用对象字段？

**A**:
```typescript
{
  type: 'object',
  key: 'attributes',
  name: '属性',
  properties: [
    {
      type: 'number',
      key: 'hp',
      name: '生命值',
      defaultValue: 100
    },
    {
      type: 'number',
      key: 'mp',
      name: '魔法值',
      defaultValue: 50
    }
  ]
}
```

**支持嵌套**：
```typescript
{
  type: 'object',
  key: 'character',
  name: '角色',
  properties: [
    {
      type: 'string',
      key: 'name',
      name: '名字'
    },
    {
      type: 'object',    // 嵌套对象
      key: 'stats',
      name: '属性',
      properties: [
        { type: 'number', key: 'str', name: '力量' },
        { type: 'number', key: 'agi', name: '敏捷' }
      ]
    }
  ]
}
```

---

## 数据管理

### Q13: 如何导入 JSON 数据？

**A**:

**对象格式（推荐）**：
```json
{
  "item_sword": {
    "name": "宝剑",
    "attack": 50,
    "price": 100
  },
  "item_shield": {
    "name": "盾牌",
    "defense": 30,
    "price": 80
  }
}
```

**数组格式**：
```json
[
  { "id": 1, "name": "物品A", "value": 100 },
  { "id": 2, "name": "物品B", "value": 200 }
]
```

**操作步骤**：
1. 点击 "从 JSON 导入"
2. 选择 JSON 文件
3. 自动创建表和数据
4. 点击保存

### Q14: 如何导出数据？

**A**:

**导出单表**：
1. 进入数据编辑页面
2. 点击 "导出 JSON"
3. 选择保存位置

**导出所有表**：
1. 在主页面点击 "导出全部"
2. 选择保存目录
3. 生成多个 JSON 文件（每表一个）

### Q15: 数据存储在哪里？

**A**:

**Cocos 模式**：
- 默认路径：`项目根目录/table_data.table`
- 格式：加密二进制文件

**Standalone/Electron 模式**：
- 用户选择的任意位置
- 格式：`.table` 文件

**文件结构**：
```
.table 文件格式：
┌─────────────────────┐
│ Magic Header (8B)   │  → 0x5442_4C45_5645_5230
├─────────────────────┤
│ Encrypted Data      │  → AES 加密
├─────────────────────┤
│ Compressed JSON     │  → GZIP 压缩
└─────────────────────┘
```

### Q16: 如何备份数据？

**A**:
```bash
# 方式1：导出为 JSON（推荐）
点击 "导出全部" → 保存 JSON 文件

# 方式2：复制 .table 文件
cp table_data.table table_data_backup.table

# 方式3：版本控制
git add table_data.table
git commit -m "备份表数据"
```

---

## 错误处理

### Q17: 导入后 UI 不刷新？

**A**: 这个问题已修复。如果仍然遇到：

```typescript
// 检查 dataManager.ts 中是否有 forceRefresh()
private forceRefresh() {
    this.refreshCounter++;  // 强制触发 Vue 响应式更新
}

// 所有修改表数据的操作后应调用
addTable() {
    // ...
    this.forceRefresh();
}
```

### Q18: 保存时提示"无法写入文件"？

**A**:
1. **检查文件权限**：
   ```bash
   # Windows
   icacls table_data.table /grant Users:F
   
   # Mac/Linux
   chmod 666 table_data.table
   ```

2. **检查磁盘空间**

3. **关闭其他程序占用**（如防病毒软件）

### Q19: 字段约束不生效？

**A**:

**检查字段定义**：
```typescript
// ✅ 正确
{
  type: 'number',
  min: 0,
  max: 100
}

// ❌ 错误（约束在错误的位置）
{
  type: 'number',
  constraints: {  // 不需要 constraints 包裹
    min: 0,
    max: 100
  }
}
```

**FieldInput 组件验证**：
```vue
<template>
  <input
    type="number"
    :min="field.min"
    :max="field.max"
    :step="field.step"
    @input="validateInput"
  />
</template>
```

### Q20: 下拉字段没有选项？

**A**: 

**问题**：创建 select 字段时未添加选项

**解决**：
1. select 字段**必须**至少有一个选项
2. 编辑器会提示：⚠️ 必须至少添加一个选项
3. 保存前会验证

```typescript
// 正确的 select 字段
{
  type: 'select',
  options: [
    { label: '选项1', value: 'opt1' }  // 至少一个
  ]
}
```

---

## 性能优化

### Q21: 大数据量时卡顿怎么办？

**A**:

**方案1：分页加载**
```typescript
// 待实现功能
const pageSize = 50;
const currentPage = 1;
const displayData = allData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
);
```

**方案2：虚拟滚动**
```bash
# 安装虚拟滚动库
npm install vue-virtual-scroller
```

**方案3：数据懒加载**
```typescript
// 只加载可见区域的数据
const visibleData = computed(() => {
    return allData.filter(item => isInViewport(item));
});
```

### Q22: 如何优化文件加载速度？

**A**:

1. **启用压缩**（已默认启用）：
   ```typescript
   // serializer.ts
   const compressed = pako.gzip(json);  // GZIP 压缩
   ```

2. **使用 Web Worker**：
   ```typescript
   // 在后台线程处理大文件
   const worker = new Worker('data-worker.js');
   worker.postMessage({ type: 'load', file });
   ```

3. **增量加载**：
   ```typescript
   // 先加载元数据，按需加载表数据
   await loadMetadata();
   await loadTable(tableKey);  // 仅加载需要的表
   ```

### Q23: 如何减少内存占用？

**A**:

```typescript
// 1. 及时释放不用的数据
dataManager.unloadTable(tableKey);

// 2. 使用 WeakMap 缓存
const cache = new WeakMap();

// 3. 避免深拷贝大对象
// ❌ 差
const copy = JSON.parse(JSON.stringify(largeData));

// ✅ 好（使用引用）
const ref = largeData;

// ✅ 更好（按需拷贝）
const copy = { ...largeData, modifiedField: newValue };
```

---

## 开发扩展

### Q24: 如何添加新的字段类型？

**A**: 参见 [项目架构说明.md](./项目架构说明.md#开发指南)

步骤：
1. 更新 `types.ts`
2. 更新 `fieldFactory.ts`
3. 更新 `FieldInput.vue`
4. 测试

### Q25: 如何扩展平台 API？

**A**:

```typescript
// 1. 在 api/index.ts 中添加方法
export interface IEditorApi {
    // 新增方法
    uploadToCloud(data: any): Promise<void>;
}

// 2. 在各平台实现
// api/standalone.ts
async uploadToCloud(data: any) {
    // 浏览器实现（使用 Fetch API）
}

// api/cocos.ts
async uploadToCloud(data: any) {
    // IPC 调用主进程
    return sendToMain('upload-to-cloud', data);
}

// api/electron.ts
async uploadToCloud(data: any) {
    // Electron IPC
    return window.electronAPI.uploadToCloud(data);
}

// 3. 更新 IPC 处理（如果需要）
// src/main.ts
export const messages = {
    'upload-to-cloud': async (data) => {
        // 主进程实现
    }
};
```

### Q26: 如何添加自定义组件？

**A**:

```typescript
// 1. 创建组件
// src/panels/vue-editor/src/components/MyComponent.vue
<template>
  <div class="my-component">
    <!-- 组件内容 -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'MyComponent',
    props: {
        // props 定义
    }
});
</script>

// 2. 在 App.vue 中使用
import MyComponent from './components/MyComponent.vue';

export default {
    components: {
        MyComponent
    }
}
```

---

## 其他问题

### Q27: 支持多语言吗？

**A**: 
- **Cocos 菜单**：支持（i18n/ 目录）
- **Vue 编辑器**：目前仅中文（可扩展 vue-i18n）

### Q28: 可以在游戏运行时使用吗？

**A**: 
- **编辑器工具**：仅在编辑器中使用
- **运行时读取**：需要自行实现 .table 文件解析器

推荐方案：
```typescript
// 导出为 JSON，在游戏中加载
cc.resources.load('data/items.json', (err, json) => {
    const items = json.json;
});
```

### Q29: 如何贡献代码？

**A**:
1. Fork 项目
2. 创建功能分支
3. 提交 Pull Request
4. 遵循编码规范

### Q30: 在哪里获取帮助？

**A**:
- **文档**：查看 README.md 和使用说明.md
- **示例**：参考 importExamples.ts
- **邮件**：306964942@qq.com
- **Issues**：在 GitHub 提交问题

---

## 🆕 新功能相关 (v1.0.1)

### Q31: 操作日志保存在哪里？

**A**: 
- **位置**：数据源文件同目录下的 `table_tool_operations.log`
- **格式**：纯文本，每行一条记录
- **示例**：`[2026-02-13 14:30:15] CREATE_TABLE [playerData] 新建数据表「玩家数据」`
- **容量**：自动保留最近 200 条记录

**注意**：仅在 Cocos 模式下启用，浏览器/Electron 模式不记录日志。

### Q32: Interface 文件为什么不更新？

**A**: 
这是 v1.0.1 的优化特性，避免无意义的时间戳更新：

- **智能比较**：导出时会比较接口定义的实际内容（忽略时间戳）
- **跳过更新**：如果接口定义未变化，则不更新文件
- **好处**：减少不必要的 Git 提交记录

如果确需强制更新，删除旧的 TS 文件后重新导出即可。

### Q33: 删除表后导出文件还在？

**A**: 
v1.0.1 已自动处理：

- **自动清理**：删除数据表时会同步删除：
  - JSON 文件：`jsonDir/exportPath/tableKey.json`
  - TS 文件：`tsDir/exportPath/ITableKey.ts`
- **资源刷新**：自动刷新 Cocos 资源数据库

如果是 v1.0.0 版本遗留的文件，需要手动删除。

### Q34: 如何查看操作日志？

**A**:
```bash
# 在数据源目录下查找
cd <data-source-dir>
cat table_tool_operations.log

# 或用文本编辑器打开
# 日志格式：[时间] 操作类型 [目标] 描述
```

---

**最后更新**：2026-02-13  
**维护者**：oldP
