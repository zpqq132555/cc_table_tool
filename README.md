# Table Tool - Cocos Creator 跨版本 Vue 数据编辑器

## 📖 简介

Table Tool 是一个基于 **Cocos Creator 跨版本插件框架** 开发的 **Vue 数据编辑器工具**，采用 **抽象接口 + 版本检测 + 工厂模式 + 适配器模式** 实现跨 Cocos Creator 2.x 和 3.x 版本的兼容。

### 项目目标

🎯 **打造一个功能强大的表格数据编辑器**，用于在 Cocos Creator 编辑器中便捷地管理和编辑游戏配置数据。

### 如果这个项目对你有帮助,恰好你心情不错,考虑请我喝杯瑞瑞吧. ☕️
![code](./code.jpg)

### 核心特性

- ✅ **跨版本兼容** - 自动检测 Cocos Creator 版本，使用对应的 API
- ✅ **统一接口** - 提供一致的开发体验，无需编写版本判断代码
- ✅ **模块化设计** - 核心功能与业务逻辑分离，易于扩展维护
- ✅ **TypeScript 支持** - 完整的类型定义，开发更安全高效
- ✅ **Vue 面板** - 基于 Vue 2.x 框架的现代化数据编辑面板
- ✅ **独立运行** - 可打包成独立 exe，脱离 Cocos 编辑器使用
- ✅ **开发友好** - 开发阶段独立运行，无需启动 Cocos 编辑器
- ✅ **通用工具库** - 文件操作、双向同步等常用工具方法

### 运行模式

| 模式 | 说明 | 用途 |
|------|------|------|
| **Standalone** | 浏览器独立运行 | 开发调试 |
| **Electron** | 桌面独立应用 | 打包 exe 分发 |
| **Cocos 2.x** | CC 2.x 插件模式 | 编辑器内使用 |
| **Cocos 3.x** | CC 3.x 插件模式 | 编辑器内使用 |

## 🚀 快速开始

**第一次使用？** 查看 **[快速开始.md](./快速开始.md)** - 5分钟上手指南

### 安装依赖

```bash
# 安装所有依赖（推荐）
npm run install:all

# 或分别安装
npm install                              # 主项目
cd src/panels/vue-editor && npm install  # Vue 编辑器
cd electron && npm install               # Electron 打包
```

### 开发模式

```bash
# Vue 编辑器独立开发（浏览器访问 http://localhost:5173）
npm run dev:editor

# Electron 桌面版开发（同时启动 Vue 编辑器和 Electron）
npm run dev:electron

# 仅启动 Electron（需先在其他终端运行 dev:editor）
npm run dev:electron:only
```

### 构建发布

```bash
# 构建 Cocos 插件（推荐）
npm run build:all      # 同时构建 v2 和 v3 版本

# 或分别构建
npm run build:v2       # 编译 Cocos 2.x 版本（含 Vue 编辑器）
npm run build:v3       # 编译 Cocos 3.x 版本（含 Vue 编辑器）

# 打包独立 exe
npm run build:exe
```

## 📁 目录结构

```
cc_table_tool/
├── package.json              # 主配置文件（Cocos 3.x 格式）
├── package.v2.json           # Cocos 2.x 专用配置
├── package.v3.json           # Cocos 3.x 专用配置
├── tsconfig.json             # TypeScript 基础配置
├── README.md                 # 本文档（简要说明）
├── 使用说明.md              # 详细使用文档
│
├── src/                      # 编辑器插件源代码
│   ├── index.ts              # 统一导出入口
│   ├── main.ts               # 插件主入口
│   │
│   ├── core/                 # 核心框架
│   │   ├── interfaces.ts     # 跨版本抽象接口
│   │   ├── version-detector.ts # 版本检测器
│   │   ├── factory.ts        # 适配器工厂
│   │   └── base-plugin.ts    # 基础插件类
│   │
│   ├── adapters/             # 版本适配器
│   │   ├── v2/               # Cocos 2.x 适配器
│   │   └── v3/               # Cocos 3.x 适配器
│   │
│   ├── tools/                # 编辑器工具类
│   │   └── Tools.ts          # 文件操作、双向同步等
│   │
│   └── panels/               # 面板定义
│       └── vue-editor/       # Vue 数据编辑器 ⭐
│           ├── package.json
│           ├── vite.config.ts
│           ├── index.html
│           └── src/
│               ├── main.ts
│               ├── App.vue
│               ├── api/      # 平台适配层
│               │   ├── index.ts
│               │   ├── standalone.ts
│               │   ├── cocos.ts
│               │   └── electron.ts
│               ├── components/   # Vue 组件
│               │   ├── ConfigManage.vue
│               │   ├── TableEditor.vue
│               │   ├── DataEditor.vue
│               │   ├── FieldEditor.vue
│               │   ├── FieldInput.vue
│               │   ├── ArrayEditor.vue
│               │   └── ObjectEditor.vue
│               └── utils/        # 工具模块
│                   ├── types.ts
│                   ├── dataManager.ts
│                   ├── fieldFactory.ts
│                   ├── importHelper.ts
│                   ├── importExamples.ts
│                   ├── serializer.ts
│                   └── InterfaceGenerator.ts
│
├── electron/                 # Electron 独立打包 ⭐
│   ├── package.json
│   ├── main.js
│   └── preload.js
│
├── dist/                     # 编译输出目录
│   ├── v2/                   # v2 编译产物
│   ├── v3/                   # v3 编译产物
│   └── vue-editor/           # Vue 编辑器构建产物
│
├── i18n/                     # 国际化
│
└── scripts/                  # 构建脚本
```

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      Table Tool                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Vue  数据编辑器 (核心UI)             │    │
│  │          (Vue 2.x - 兼容 Cocos 2.x/3.x)              │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                 │
│            ┌──────────────┼──────────────┐                  │
│            ▼              ▼              ▼                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │    独立运行    │ │  Cocos 2.x   │ │  Cocos 3.x   │         │
│  │  (Electron)  │ │     插件适配   │ │    插件适配   │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │  打包 exe     │ │ CC 2.x 编辑器 │ │ CC 3.x 编辑器 │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 开发流程

```
开发阶段                    测试阶段                    发布阶段
┌─────────────┐            ┌─────────────┐            ┌─────────────┐
│  独立开发     │     →      │  功能验收    │     →      │    多端发布   │
├─────────────┤            ├─────────────┤            ├─────────────┤
│ • Vue 热重载 │            │ • Cocos 2.x │            │ • exe 独立版 │
│ • 浏览器调试  │            │ • Cocos 3.x │            │ • CC 2.x 插件│
│ • 快速迭代    │            │ •  接口验证  │            │ • CC 3.x 插件│
└─────────────┘            └─────────────┘            └─────────────┘
```

## 🔧 核心设计模式

### 1. 抽象接口 (interfaces.ts)
定义所有版本通用的接口，屏蔽版本差异。

### 2. 版本检测 (version-detector.ts)
自动检测当前 Cocos Creator 版本，决定使用哪套适配器。

### 3. 工厂模式 (factory.ts)
根据版本动态创建对应的适配器实例。

### 4. 适配器模式 (adapters/)
将不同版本的 API 统一为相同接口。

### 5. 平台适配层 (api/)
Vue 编辑器的运行环境适配，统一 Standalone/Electron/Cocos 的 API。

## 📝 工具类说明

### Tools 编辑器工具类

```typescript
import { Tools } from './tools/Tools';

// 文件/目录操作
Tools.CopyFileSync(src, dest);           // 复制文件
Tools.CopyDirSync(srcDir, destDir);      // 复制目录
Tools.WriteFileSync(file, data);         // 写入文件
Tools.ReadDir(dir, callback);            // 遍历目录

// 目录时间检测
Tools.GetDirectoryModifyTime(dir);       // 获取目录最新修改时间

// 文件删除
Tools.DeleteFilesByPattern(dir, ['.meta']); // 按模式删除文件

// 双向同步
Tools.BidirectionalSync(dirA, dirB, {
    ignorePatterns: ['.meta', '.git'],   // 忽略的文件
    deletePatterns: ['.meta'],            // 同步后删除的文件
    preferDir: 'auto',                    // 'auto' | 'A' | 'B'
    onLog: console.log
});
```

## ✅ 版本兼容性

- ✅ Cocos Creator 2.4.x
- ✅ Cocos Creator 3.x (>=3.0.0)

## 📚 详细文档

**📖 完整文档导航** → [文档中心.md](./文档中心.md)

### 核心文档

- **[快速开始.md](./快速开始.md)** - 5分钟上手指南（新手必读 ⭐）
- **[使用说明.md](./使用说明.md)** - 详细使用指南和功能说明
- **[项目架构说明.md](./项目架构说明.md)** - 架构设计和核心模块详解
- **[FAQ.md](./FAQ.md)** - 常见问题与解答（30+ 问题）

### 开发文档

- **[数据管理模块说明](./src/panels/vue-editor/src/utils/README.md)** - 数据管理模块重构说明

### 组件文档

- [ArrayEditor 组件](./src/panels/vue-editor/src/components/ArrayEditor.README.md) - 数组编辑器使用说明
- [DataEditor 组件](./src/panels/vue-editor/src/components/DataEditor.README.md) - 数据编辑功能说明
- [FieldConstraints 说明](./src/panels/vue-editor/src/components/FieldConstraints.README.md) - 字段约束与验证
- [SelectFieldValidation 说明](./src/panels/vue-editor/src/components/SelectFieldValidation.README.md) - 下拉字段验证

## 🎯 开发计划

### 已完成 ✅
- ✅ 跨版本插件基础框架
- ✅ 版本检测器与适配器工厂
- ✅ v2/v3 适配器层
- ✅ 通用工具类（Tools）
- ✅ Vue 数据编辑器基础架构
- ✅ 多平台适配层（Standalone/Electron/Cocos）
- ✅ Electron 独立打包配置
- ✅ 数据管理模块（增删改查、导入导出）
- ✅ 字段编辑器（支持 7 种字段类型）
- ✅ 数组编辑器（支持定长/不定长数组）
- ✅ 对象编辑器（支持嵌套对象）
- ✅ 字段约束与验证系统
- ✅ JSON 导入导出功能
- ✅ 加密存储（.table 二进制格式）

### 进行中 🔄
- 🔄 用户体验优化
- 🔄 性能优化（大数据量处理）

### 待开发 📋
- 📋 Excel 文件导入/导出支持
- 📋 数据模板系统
- 📋 批量编辑功能
- 📋 数据关联与引用检查
- 📋 撤销/重做功能

## 📝 版本历史

### v1.0.0 (2026-02-08)
- ✅ 跨版本插件基础框架完成
- ✅ Vue 数据编辑器核心功能完成
- ✅ 支持 7 种字段类型（string, number, boolean, select, reward, array, object）
- ✅ 数据加密存储（.table 格式）
- ✅ JSON 导入导出功能
- ✅ 多平台运行（Standalone/Electron/Cocos）
- ✅ 字段约束与验证
- ✅ 代码重构与模块化（单文件不超过 500 行）

## 📄 许可证

MIT License
