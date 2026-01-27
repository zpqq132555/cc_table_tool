# Table Tool - Cocos Creator 跨版本 Vue 数据编辑器

## 📖 简介

Table Tool 是一个基于 **Cocos Creator 跨版本插件框架** 开发的 **Vue 数据编辑器工具**，采用 **抽象接口 + 版本检测 + 工厂模式 + 适配器模式** 实现跨 Cocos Creator 2.x 和 3.x 版本的兼容。

### 项目目标

🎯 **打造一个功能强大的表格数据编辑器**，用于在 Cocos Creator 编辑器中便捷地管理和编辑游戏配置数据。

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

# Electron 桌面版开发
npm run dev:electron
```

### 构建发布

```bash
# 构建 Cocos 插件
npm run build:v2  # 编译 Cocos 2.x 版本
npm run build:v3  # 编译 Cocos 3.x 版本

# 构建 Vue 编辑器（用于 Cocos 插件）
npm run build:editor

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
│   ├── business/             # 业务功能模块
│   │
│   └── panels/               # 面板定义
│       └── vue-editor/       # Vue 数据编辑器 ⭐
│           ├── package.json
│           ├── vite.config.ts
│           ├── index.html
│           └── src/
│               ├── main.ts
│               ├── App.vue
│               └── api/      # 平台适配层
│                   ├── index.ts
│                   ├── standalone.ts
│                   ├── cocos.ts
│                   └── electron.ts
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

请查看 [使用说明.md](使用说明.md) 获取完整的使用文档。

## 🎯 开发计划

### 已完成 ✅
- ✅ 跨版本插件基础框架
- ✅ 版本检测器与适配器工厂
- ✅ v2/v3 适配器层
- ✅ 通用工具类（Tools）
- ✅ Vue 数据编辑器基础架构
- ✅ 多平台适配层（Standalone/Electron/Cocos）
- ✅ Electron 独立打包配置

### 进行中 🔄
- 🔄 表格数据编辑功能完善
- 🔄 数据导入/导出功能

### 待开发 📋
- 📋 Excel 文件导入支持
- 📋 JSON/CSV 数据格式支持
- 📋 数据模板系统
- 📋 批量编辑功能
- 📋 数据验证与校验系统

## 📝 版本历史

### v1.0.0 (2026-01-27)
- ✅ 搭建跨版本插件基础框架
- ✅ 实现版本检测器与适配器工厂
- ✅ 完成 v2/v3 适配器层
- ✅ 添加通用工具类（Tools）
- ✅ 创建 Vue 数据编辑器项目结构
- ✅ 实现多平台 API 适配层
- ✅ 配置 Electron 独立打包
- ✅ 完善项目文档

## 📄 许可证

MIT License
