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
├── App.vue          → 主界面组件
├── api/index.ts     → 统一 API 接口（已适配四种模式）
└── components/      → 自定义组件
```

**你不需要关心：**
- `src/core/` - 版本检测、适配器工厂（框架层）
- `src/adapters/` - v2/v3 适配器实现（框架层）
- `src/bridge/` - 通信桥接层（框架层）
- `src/panels/default/` - 面板加载器（框架层）

## 常用命令

```bash
npm run dev:editor   # 浏览器开发（推荐日常开发使用）
npm run build:all    # 构建所有版本（v2 + v3 + Vue 编辑器）
npm run build:exe    # 打包独立 exe
```

## Vue 编辑器 API

在 `src/panels/vue-editor/src/` 中使用统一 API：

```typescript
import { api } from './api';

// 文件操作 - 四种模式下自动适配
await api.importData();                    // 导入数据
await api.exportData(data);                // 导出数据
await api.readFile(path);                  // 读取文件
await api.writeFile(path, content);        // 写入文件

// 项目数据（Cocos/Electron 模式可用）
await api.loadProjectData('data/config.json');
await api.saveProjectData('data/config.json', data);

// UI 交互
api.showMessage('提示', 'info');
await api.confirm('确定删除?');
```

## 扩展 API

如需添加新功能，只需修改 `src/panels/vue-editor/src/api/` 下的文件：

1. 在 `index.ts` 的 `IEditorApi` 接口添加方法
2. 在 `standalone.ts`、`cocos.ts`、`electron.ts` 分别实现
3. 若需 Electron IPC，同步更新 `electron/preload.js` 和 `electron/main.js`
