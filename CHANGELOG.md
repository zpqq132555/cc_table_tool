# 更新日志 (Changelog)

所有重要改动都将记录在此文件中。

版本格式遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.1] - 2026-02-13

### 新增 (Added)

- **操作日志功能**：在 Cocos 模式下自动记录数据表操作日志
  - 日志文件：`table_tool_operations.log`（数据源同目录）
  - 保留最近 200 条记录
  - 记录内容：新建表、删除表、修改表结构、导出表、导入表等

### 优化 (Changed)

- **智能 Interface 生成**：导出 TypeScript 接口文件时比较内容
  - 仅当接口定义实际发生变化时才更新文件
  - 避免因时间戳变化导致不必要的 Git 提交
  - 应用于单表导出和批量导出

### 修复 (Fixed)

- **删除表时清理导出文件**：删除数据表时自动删除对应的 JSON 和 TS 文件
  - 同步删除：`jsonDir/exportPath/tableKey.json`
  - 同步删除：`tsDir/exportPath/ITableKey.ts`
  - 自动刷新 Cocos 资源数据库

---

## [1.0.0] - 2026-02-12

### 初始版本 (Initial Release)

#### 核心特性

- ✅ **跨版本兼容**：支持 Cocos Creator 2.x 和 3.x
- ✅ **Vue 数据编辑器**：基于 Vue 3.x 的现代化编辑面板
- ✅ **多种运行模式**：
  - Standalone（浏览器独立开发）
  - Electron（桌面独立应用）
  - Cocos 2.x/3.x（编辑器插件）
- ✅ **丰富的字段类型**：
  - 基础类型：string, number, boolean
  - 复合类型：select, array, object, reward
- ✅ **数据导入导出**：
  - JSON 格式导出
  - TypeScript 接口自动生成
  - 支持分离导出和批量导入
- ✅ **表结构管理**：
  - 可视化字段编辑器
  - 字段约束和验证
  - 表头排序和搜索
- ✅ **加密存储**：`.table` 二进制格式加密保存

#### 技术架构

- 适配器模式实现跨版本兼容
- IPC 通信桥接面板与主进程
- 工厂模式创建版本适配器
- TypeScript 类型安全

---

## 版本说明

### 版本号格式

采用 **主版本号.次版本号.修订号** (MAJOR.MINOR.PATCH)：

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 标签类型

- `Added` - 新增功能
- `Changed` - 功能变更/优化
- `Deprecated` - 即将废弃的功能
- `Removed` - 已移除的功能
- `Fixed` - 问题修复
- `Security` - 安全性修复
