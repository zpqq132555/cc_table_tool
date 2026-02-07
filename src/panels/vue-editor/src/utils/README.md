# 数据管理模块重构说明

## 文件结构

```
utils/
├── types.ts               # 类型定义 (~170 行)
├── fieldFactory.ts       # 字段创建工具 (~100 行)
├── importHelper.ts       # 导入辅助工具 (~180 行)
├── serializer.ts         # 序列化和加密 (~110 行)
├── dataManager.ts        # 主数据管理类 (~330 行)
└── importExamples.ts     # 导入示例说明
```

## 主要改进

### 1. 代码拆分
- 原 `dataManager.ts` 928 行 → 拆分为 5 个文件
- 单个文件不超过 350 行，便于维护
- 符合项目编码规范（单文件不超过 500 行）

### 2. 响应式更新修复
- 添加 `refreshCounter` 强制触发 Vue 响应式更新
- 所有修改表数据的操作后调用 `forceRefresh()`
- 解决导入后 UI 不刷新问题

### 3. 导入逻辑优化

**新逻辑**：将 JSON 对象作为单条数据的 info

```json
// 输入：对象形式（推荐）
{
  "item1": {"id": 1, "name": "测试A"},
  "item2": {"id": 2, "name": "测试B"}
}
// → 创建 1 个表，包含 2 条数据：item1 和 item2

// 输入：数组形式
[
  {"id": 1, "name": "测试A"},
  {"id": 2, "name": "测试B"}
]
// → 创建 1 个表，包含 2 条数据："1" 和 "2"（从id字段提取key）
```

### 4. 类型安全
- 所有类型定义集中在 `types.ts`
- 导出统一的类型接口
- 完整的 TypeScript 类型支持

### 5. 字段类型支持

支持 8 种字段类型：

1. **string** - 文本字段
   - 约束：`defaultValue`, `maxLength`

2. **number** - 数字字段
   - 约束：`defaultValue`, `min`, `max`, `step`

3. **boolean** - 布尔字段
   - 约束：`defaultValue`

4. **select** - 下拉选择
   - 约束：`options[]`, `defaultValue`

5. **reward** - 奖励对象
   - 结构：`{ id: string, count: number }`

6. **array** - 数组字段
   - 约束：`element` (元素类型), `fixedLength`
   - 支持定长/不定长数组
   - 支持嵌套类型

7. **object** - 对象字段
   - 约束：`properties[]` (子属性定义)
   - 支持嵌套对象

## 使用方式

```typescript
import { dataManager } from './utils/dataManager';

// 所有 API 保持不变
await dataManager.load(filePath);
await dataManager.addTable(key, params);
await dataManager.importTableFromJson();
await dataManager.exportAllTables();
```

## API 参考

### 数据管理
- `load(filePath)` - 加载 .table 文件
- `save()` - 保存数据
- `createNew(key, name)` - 创建新数据源

### 表管理
- `addTable(key, params)` - 添加表
- `updateTable(key, params)` - 更新表
- `deleteTable(key)` - 删除表
- `getTable(key)` - 获取表定义

### 数据管理
- `addData(tableKey, dataKey, data)` - 添加数据
- `updateData(tableKey, dataKey, data)` - 更新数据
- `deleteData(tableKey, dataKey)` - 删除数据

### 导入导出
- `importTableFromJson()` - 从 JSON 导入
- `exportTableToJson(tableKey)` - 导出单表
- `exportAllTables()` - 导出所有表

## 测试要点

1. ✅ 导入 JSON 后 UI 立即刷新
2. ✅ JSON 对象导入为单表（不拆分字段）
3. ✅ 所有表操作正常（增删改查、排序）
4. ✅ 数据保存和加载正常
5. ✅ 字段约束验证正常
6. ✅ 数组/对象嵌套类型支持
