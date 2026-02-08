# Copilot Instructions - Table Tool

## 项目概述

这是一个 **Cocos Creator 跨版本插件框架**，核心是 **Vue 数据编辑器**。框架已完成所有适配工作，**开发者只需关注 Vue 编辑器的页面和功能开发**。

### 运行模式（框架自动适配）

| 模式 | 用途 | 启动命令 |
|------|------|----------|
| **Standalone** | 浏览器开发调试 | `npm run dev:editor` → localhost:5173 |
| **Electron** | 独立桌面应用 | `npm run dev:electron` |
| **Cocos 2.x** | 编辑器插件 | `npm run build:v2` → dist/v2/ |
| **Cocos 3.x** | 编辑器插件 | `npm run build:v3` → dist/v3/ |

## 开发工作流

**你只需要关心：**
```
src/panels/vue-editor/src/
├── App.vue              → 主界面组件
├── api/index.ts         → 统一 API 接口（已适配四种模式）
├── utils/               → 数据管理、序列化、字段工厂等
│   ├── types.ts           → 类型定义
│   ├── dataManager.ts     → 数据管理器
│   ├── fieldFactory.ts    → 字段工厂
│   ├── importHelper.ts    → 导入助手
│   ├── serializer.ts      → 序列化（.table 文件加密存储）
│   └── InterfaceGenerator.ts → TypeScript 接口生成器
└── components/          → 自定义组件
```

**你不需要关心：**
- `src/core/` - 版本检测、适配器工厂（框架层）
- `src/adapters/` - v2/v3 适配器实现（框架层）
- `src/bridge/` - 通信桥接层（框架层）
- `src/panels/default/` - 面板加载器（框架层）

## 架构说明

### 运行环境分离

本项目有两个独立的运行环境：

```
1. 主进程（Node.js）
   └─ src/main.ts + src/adapters/
   └─ 直接使用适配器工厂 (AdapterFactory)
   └─ 处理 Cocos v2/v3 版本差异
   
2. Vue 面板（iframe 浏览器环境）
   └─ src/panels/vue-editor/src/
   └─ 无法直接访问 Node.js 模块
   └─ 通过 IPC 调用主进程功能
```

### 为什么 Vue 面板不能直接使用适配器？

**关键问题**：
- `src/adapters/` 是 Node.js 模块（依赖 `Editor` 全局对象的主进程 API）
- Vue 面板运行在 iframe 中（浏览器环境，无法 require Node.js 模块）
- iframe 中的 `Editor` 对象是精简版，只有 IPC 通信能力

**解决方案 - IPC 桥接**：

```typescript
// Vue 面板 (src/panels/vue-editor/src/api/cocos.ts)
function sendToMain(method: string, ...args: any[]) {
    // v3: Editor.Message.request('cc-table-tool', method, ...args)
    // v2: Editor.Ipc.sendToMain('cc-table-tool:' + method, ...args)
}

// 主进程 (src/main.ts)
export const messages = {
    'select-file': async (options) => {
        const adapter = getEditor(); // 使用适配器工厂
        return adapter.selectFile(options);
    }
};
```

### 平台 API 的职责

Vue 编辑器的三个平台实现：

| 平台 | 环境 | 实现方式 |
|------|------|----------|
| **cocos.ts** | Cocos iframe | IPC 调用主进程适配器 |
| **electron.ts** | Electron 渲染进程 | IPC 调用主进程 |
| **standalone.ts** | 纯浏览器 | 使用浏览器 API（FileSystemAccess） |

**开发者只需关注**：
- 不同平台的 API 调用方式（IPC vs 浏览器 API）
- Cocos 的 v2/v3 差异由主进程适配器处理

## 常用命令

```bash
npm run dev:editor   # 浏览器开发（推荐日常开发使用）
npm run build:all    # 构建所有版本（v2 + v3 + Vue 编辑器）
npm run build:exe    # 打包独立 exe
```

## Vue 编辑器 API

在 `src/panels/vue-editor/src/` 中使用统一 API：

```typescript
import { api, getPlatform } from './api';

// 平台检测
const platform = getPlatform(); // 'cocos-v2' | 'cocos-v3' | 'electron' | 'standalone'

// 文件操作 - 四种模式下自动适配
await api.readFile(path);                  // 读取文本文件
await api.readBinaryFile(path);            // 读取二进制文件 (ArrayBuffer)
await api.writeBinaryFile(path, buffer);   // 写入二进制文件 (ArrayBuffer)
await api.selectFile({ extensions: ['table'] });  // 选择文件
await api.selectDirectory();               // 选择目录
await api.selectSavePath({ defaultName: 'data', extensions: ['table'] });  // 选择保存路径
await api.exists(path);                    // 检查文件/目录是否存在
await api.createDirectory(path);           // 创建目录
```

## 数据源格式

数据存储为加密的 `.table` 二进制文件：

```typescript
import { serializeDataSource, deserializeDataSource } from './utils/serializer';

// 序列化为加密二进制
const buffer = serializeDataSource(dataSource);

// 反序列化
const loaded = deserializeDataSource(arrayBuffer);
```

## 扩展 API

如需添加新功能，只需修改 `src/panels/vue-editor/src/api/` 下的文件：

1. 在 `index.ts` 的 `IEditorApi` 接口添加方法
2. 在 `standalone.ts`、`cocos.ts`、`electron.ts` 分别实现
3. 若需 Electron IPC，同步更新 `electron/preload.js` 和 `electron/main.js`

## 编码规范

### 文件组织

- **单个类/文件行数限制**：单个类或文件尽量不超过 **500 行**
  - 超过 500 行时，考虑拆分为多个模块
  - 示例：`dataManager.ts` (928行) → 拆分为 6 个文件（`types.ts`, `fieldFactory.ts`, `importHelper.ts`, `serializer.ts`, `InterfaceGenerator.ts`, `dataManager.ts`）

### 命名规范

- **函数/方法命名**：使用 **驼峰命名法 (camelCase)**
  ```typescript
  // ✅ 正确
  function handleCreateData() {}
  async function importTableFromJson() {}
  
  // ❌ 错误
  function handle_create_data() {}
  function ImportTableFromJson() {}
  ```

- **文件夹命名**：使用 **驼峰命名法 (camelCase)**
  ```
  ✅ 正确：
  src/panels/vueEditor/
  src/utils/
  src/components/
  
  ❌ 错误：
  src/Panels/VueEditor/
  src/Utils/
  src/Components/
  ```

- **文件命名**：使用 **驼峰命名 (camelCase)**，工具类/生成器可用 **大驼峰 (PascalCase)**
  ```
  ✅ 正确：
  dataManager.ts
  fieldFactory.ts
  importHelper.ts
  InterfaceGenerator.ts
  
  ❌ 错误：
  data-manager.ts
  field-factory.ts
  import-helper.ts
  ```

- **类命名**：使用 **大驼峰命名法 (PascalCase)**
  ```typescript
  // ✅ 正确
  class DataManager {}
  class FieldFactory {}
  
  // ❌ 错误
  class dataManager {}
  class field_factory {}
  ```

- **常量命名**：使用 **全大写 + 下划线**
  ```typescript
  // ✅ 正确
  const MAGIC_NUMBER = 0x5442_4C45;
  const ENCRYPT_KEY = 'table_tool_2024';
  
  // ❌ 错误
  const magicNumber = 0x5442_4C45;
  const encryptKey = 'table_tool_2024';
  ```

### 代码拆分原则

当单个文件行数超过限制时，按以下原则拆分：

1. **类型定义** → 独立的 `types.ts`
2. **工具函数** → 独立的 `utils/` 或 `helpers/`
3. **业务逻辑** → 按功能拆分（如 `serializer.ts`, `importer.ts`）
4. **保持职责单一**：每个文件只负责一个明确的功能模块
