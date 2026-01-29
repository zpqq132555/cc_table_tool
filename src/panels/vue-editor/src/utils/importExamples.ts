/**
 * 导入逻辑测试示例
 */

// 示例 1: 数组形式
// 输入：
const arrayInput = [
    { id: 1, name: "物品A", value: 100 },
    { id: 2, name: "物品B", value: 200 },
    { id: 3, name: "物品C", value: 300 }
];

// 结果：创建 1 个表，包含 3 条数据
// - 数据 key: "1", "2", "3" (从 id 字段提取)
// - 每条数据的 info 包含完整对象
// 
// tableDef.data = {
//   "1": { index: 0, info: { id: 1, name: "物品A", value: 100 } },
//   "2": { index: 1, info: { id: 2, name: "物品B", value: 200 } },
//   "3": { index: 2, info: { id: 3, name: "物品C", value: 300 } }
// }

// ============================================================

// 示例 2: 对象形式（推荐）
// 输入：
const objectInput = {
    "item_sword": { name: "宝剑", attack: 50, price: 100 },
    "item_shield": { name: "盾牌", defense: 30, price: 80 },
    "item_potion": { name: "药水", heal: 50, price: 20 }
};

// 结果：创建 1 个表，包含 3 条数据
// - 数据 key 直接使用对象的 key
// - 每条数据的 info 包含完整对象
//
// tableDef.data = {
//   "item_sword": { index: 0, info: { name: "宝剑", attack: 50, price: 100 } },
//   "item_shield": { index: 1, info: { name: "盾牌", defense: 30, price: 80 } },
//   "item_potion": { index: 2, info: { name: "药水", heal: 50, price: 20 } }
// }

// ============================================================

// 旧逻辑的问题（已修复）：
// 
// 输入：{ id: 1, name: "测试" }
// 
// 旧结果：创建 1 个表，包含 2 条数据
// - "id": { info: 1 }        ❌ 错误：将字段拆分为数据
// - "name": { info: "测试" }  ❌ 错误：将字段拆分为数据
//
// 新结果：创建 1 个表，包含 1 条数据
// - "item_0": { info: { id: 1, name: "测试" } } ✅ 正确：整个对象作为一条数据

export { };

