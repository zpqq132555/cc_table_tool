<template>
  <div class="config-container">
    <header class="config-header">
      <h1>⚙️ 配置管理</h1>
    </header>

    <!-- 功能按钮栏 -->
    <div class="config-toolbar">
      <button class="btn btn-back" @click="$emit('back')">← 返回</button>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-import" @click="handleImportTable">
        📄 导入数据表
      </button>
      <button class="btn btn-import-folder" @click="handleImportFolder">
        📂 导入文件夹
      </button>
      <button class="btn btn-add" @click="handleAddTable">➕ 新增数据表</button>
    </div>

    <!-- 表格 -->
    <div class="config-content">
      <div class="config-table-container">
        <table v-if="tableList.length > 0" class="config-table">
          <thead>
            <tr>
              <th class="col-order">排序</th>
              <th>表名</th>
              <th>Key</th>
              <th>导出路径</th>
              <th>描述</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(table, idx) in tableList" :key="table.key">
              <td class="table-order">
                <div class="order-controls">
                  <button
                    class="btn-order"
                    @click="handleMoveUp(idx)"
                    :disabled="idx === 0"
                    title="上移"
                  >
                    ⬆️
                  </button>
                  <span class="order-number">{{ idx + 1 }}</span>
                  <button
                    class="btn-order"
                    @click="handleMoveDown(idx)"
                    :disabled="idx === tableList.length - 1"
                    title="下移"
                  >
                    ⬇️
                  </button>
                </div>
              </td>
              <td class="table-name">{{ table.name }}</td>
              <td class="table-key">{{ table.key }}</td>
              <td class="table-path">{{ table.exportPath }}</td>
              <td class="table-desc">{{ table.desc }}</td>
              <td class="table-actions">
                <button
                  class="btn-action btn-edit"
                  @click="handleEditTable(table)"
                >
                  ✏️ 编辑
                </button>
                <button
                  class="btn-action btn-delete"
                  @click="handleDeleteTable(table)"
                >
                  🗑️ 删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 空状态 -->
        <div v-else class="config-empty">
          <p>📭 暂无表数据</p>
          <p class="tip">点击上方"新增数据表"按钮创建新表</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { dataManager } from "../utils/dataManager";

// Emits
const emit = defineEmits(["back", "add", "edit", "delete"]);

// 响应式表列表
const tableList = computed(() => dataManager.tableList);

// ==================== 新增表 ====================
function handleAddTable() {
  console.log("[ConfigManage] 新增数据表");
  emit("add");
}

// ==================== 导入数据表 ====================
async function handleImportTable() {
  try {
    console.log("[ConfigManage] 导入数据表");
    const count = await dataManager.importTableFromJson();
    if (count > 0) {
      // 导入成功，UI 应该自动更新（因为 tableList 是 computed）
      console.log(
        "[ConfigManage] 导入成功，当前表数量:",
        tableList.value.length,
      );
      alert(`成功导入 ${count} 个数据表`);
    }
  } catch (err) {
    console.error("[ConfigManage] 导入失败:", err);
    alert("导入失败: " + (err as Error).message);
  }
}

// ==================== 导入文件夹 ====================
async function handleImportFolder() {
  try {
    console.log("[ConfigManage] 导入文件夹");
    const count = await dataManager.importTablesFromFolder();
    if (count > 0) {
      alert(`成功导入 ${count} 个数据表`);
    }
  } catch (err) {
    console.error("[ConfigManage] 导入文件夹失败:", err);
    alert("导入失败: " + (err as Error).message);
  }
}

// ==================== 编辑表 ====================
function handleEditTable(table: any) {
  console.log("[ConfigManage] 编辑表:", table);
  emit("edit", table);
}

// ==================== 删除表 ====================
function handleDeleteTable(table: any) {
  console.log("[ConfigManage] 删除表:", table);
  emit("delete", table);
}

// ==================== 上移表 ====================
async function handleMoveUp(index: number) {
  if (index === 0) return;

  try {
    const list = tableList.value;
    const currentTable = list[index];
    const prevTable = list[index - 1];

    await dataManager.swapTableOrder(currentTable.key, prevTable.key);
    console.log("[ConfigManage] 上移表:", currentTable.key);
  } catch (err) {
    console.error("[ConfigManage] 上移失败:", err);
    alert("上移失败: " + (err as Error).message);
  }
}

// ==================== 下移表 ====================
async function handleMoveDown(index: number) {
  const list = tableList.value;
  if (index >= list.length - 1) return;

  try {
    const currentTable = list[index];
    const nextTable = list[index + 1];

    await dataManager.swapTableOrder(currentTable.key, nextTable.key);
    console.log("[ConfigManage] 下移表:", currentTable.key);
  } catch (err) {
    console.error("[ConfigManage] 下移失败:", err);
    alert("下移失败: " + (err as Error).message);
  }
}
</script>

<style scoped>
/* 配置管理容器 - 全屏显示 */
.config-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.config-header {
  flex-shrink: 0;
  padding: 16px 24px;
  background: linear-gradient(135deg, #2c3e50 0%, #e67e22 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.config-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
}

.config-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

/* 配置管理页面 */
.config-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #252526;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.toolbar-spacer {
  flex: 1;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back {
  background: #3e3e42;
  color: #ffffff;
}

.btn-back:hover {
  background: #4e4e52;
  transform: translateX(-2px);
}

.btn-add {
  background: #4caf50;
  color: #ffffff;
}

.btn-add:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.btn-import {
  background: #ff9800;
  color: #ffffff;
}

.btn-import:hover {
  background: #f57c00;
  transform: translateY(-1px);
}

.btn-import-folder {
  background: #9c27b0;
  color: #ffffff;
}

.btn-import-folder:hover {
  background: #7b1fa2;
  transform: translateY(-1px);
}

.config-table-container {
  background: #252526;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.config-table {
  width: 100%;
  border-collapse: collapse;
}

.config-table thead {
  background: #2d2d30;
}

.config-table th {
  padding: 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #4fc3f7;
  border-bottom: 2px solid #3e3e42;
}

.col-order {
  width: 120px;
}

.config-table tbody tr {
  border-bottom: 1px solid #3e3e42;
  transition: background 0.2s;
}

.config-table tbody tr:hover {
  background: #2d2d30;
}

.config-table td {
  padding: 16px;
  font-size: 14px;
  color: #cccccc;
}

.table-order {
  width: 120px;
}

.order-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-number {
  min-width: 20px;
  text-align: center;
  font-weight: 600;
  color: #4fc3f7;
  font-size: 14px;
}

.btn-order {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: rgba(79, 195, 247, 0.1);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-order:hover:not(:disabled) {
  background: rgba(79, 195, 247, 0.3);
  transform: scale(1.1);
}

.btn-order:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.table-name {
  font-weight: 600;
  color: #ffffff;
}

.table-key {
  font-family: "Consolas", "Monaco", monospace;
  color: #4fc3f7;
  font-size: 13px;
}

.table-path {
  color: #999;
  font-size: 13px;
}

.table-desc {
  color: #aaa;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-edit {
  background: #2196f3;
  color: #ffffff;
}

.btn-edit:hover {
  background: #1976d2;
  transform: translateY(-1px);
}

.btn-delete {
  background: #f44336;
  color: #ffffff;
}

.btn-delete:hover {
  background: #d32f2f;
  transform: translateY(-1px);
}

.config-empty {
  text-align: center;
  padding: 80px 40px;
}

.config-empty p {
  margin: 16px 0;
  font-size: 18px;
  color: #999;
}

.config-empty .tip {
  font-size: 14px;
  color: #666;
}
</style>
