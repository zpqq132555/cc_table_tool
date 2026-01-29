# 数据管理模块重构说明

## 文件结构

```
utils/
├── data-manager.ts        # 主数据管理类 (~330 行)
├── types.ts               # 类型定义 (~170 行)
├── field-factory.ts       # 字段创建工具 (~100 行)
├── import-helper.ts       # 导入辅助工具 (~180 行)
├── serializer.ts          # 序列化和加密 (~110 行)
└── data-source.ts         # 旧的辅助工具（兼容性保留）
```

## 主要改进

### 1. 代码拆分
- 原 `data-manager.ts` 928 行 → 拆分为 5 个文件
- 单个文件不超过 350 行，便于维护

### 2. 响应式更新修复
- 添加 `refreshCounter` 强制触发 Vue 响应式更新
- 所有修改表数据的操作后调用 `forceRefresh()`
- 解决导入后 UI 不刷新问题

### 3. 导入逻辑优化
**旧逻辑**：将 JSON 对象的每个字段拆分为独立数据条目
```json
{
  "id": 1,
  "name": "测试"
}
```
→ 拆分为 2 条数据：`id` 和 `name`

**新逻辑**：将 JSON 对象作为单条数据的 info
```json
{
  "item1": {"id": 1, "name": "测试A"},
  "item2": {"id": 2, "name": "测试B"}
}
```
→ 创建 1 个表，包含 2 条数据：`item1` 和 `item2`

### 4. 类型安全
- 所有类型定义集中在 `types.ts`
- 导出统一的类型接口

## 使用方式

```typescript
import { dataManager } from './utils/data-manager';

// 所有 API 保持不变
await dataManager.load(filePath);
await dataManager.addTable(key, params);
await dataManager.importTableFromJson();
```

## 测试要点

1. ✅ 导入 JSON 后 UI 立即刷新
2. ✅ JSON 对象导入为单表（不拆分字段）
3. ✅ 所有表操作正常（增删改查、排序）
4. ✅ 数据保存和加载正常
