<template>
  <div class="data-editor-container">
    <!-- 头部 -->
    <header class="editor-header">
      <button class="btn btn-back" @click="$emit('back')">← 返回</button>
      <div class="header-info">
        <h1>📊 {{ tableName }}</h1>
        <span class="table-desc" v-if="tableDesc">{{ tableDesc }}</span>
      </div>
      <div class="header-spacer"></div>
      <button
        class="btn btn-outline"
        @click="handlePreviewAll"
        :disabled="!table || dataList.length === 0"
        title="预览当前表全部数据"
      >
        👁 预览
      </button>
      <button
        class="btn btn-outline"
        @click="handleExport"
        :disabled="!table || dataList.length === 0"
        title="导出当前数据表"
      >
        📤 导出数据
      </button>
      <button class="btn btn-primary" @click="handleAddData">
        ➕ 新增数据
      </button>
      <button class="btn btn-success" @click="handleSave">💾 保存</button>
    </header>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-panel">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 数据列表 -->
    <div v-else-if="table" class="editor-content">
      <!-- 数据表格 -->
      <div class="data-table-container">
        <table v-if="dataList.length > 0" class="data-table">
          <thead>
            <tr>
              <th class="col-index">#</th>
              <th class="col-display-name">显示名称</th>
              <th
                v-for="field in table.fields"
                :key="field.key"
                :class="`col-${field.type}`"
              >
                {{ field.name }}
                <span class="field-type"
                  >({{ getFieldTypeName(field.type) }})</span
                >
              </th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in dataList" :key="item.key">
              <td class="data-index">{{ idx + 1 }}</td>
              <td class="data-display-name">
                <div class="cell-content" :title="resolveDisplayName(item)">{{ resolveDisplayName(item) }}</div>
              </td>
              <td
                v-for="field in table.fields"
                :key="field.key"
                class="data-cell"
              >
                <div class="cell-content">
                  {{ formatCellValue(item.info[field.key], field.type) }}
                </div>
              </td>
              <td class="data-actions">
                <button
                  class="btn-action btn-preview"
                  @click="handlePreviewRow(item)"
                  title="预览当前行数据"
                >
                  👁
                </button>
                <button
                  class="btn-action btn-edit"
                  @click="handleEditData(item)"
                  title="编辑"
                >
                  ✏️
                </button>
                <button
                  class="btn-action btn-delete"
                  @click="handleDeleteData(item)"
                  title="删除"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <p>📭 暂无数据</p>
          <p class="tip">点击"新增数据"按钮添加数据</p>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-panel">
      <p>❌ 表不存在或加载失败</p>
      <button class="btn" @click="$emit('back')">返回</button>
    </div>

    <!-- 数据编辑对话框 -->
    <div
      v-if="showDataDialog"
      class="dialog-overlay"
      @click.self="showDataDialog = false"
    >
      <div class="dialog-container">
        <div class="dialog-header">
          <h2>{{ editingDataKey ? "编辑数据" : "新增数据" }}</h2>
          <button class="btn-close" @click="showDataDialog = false">✕</button>
        </div>

        <div class="dialog-content">
          <div class="form-group">
            <label class="form-label">
              数据 Key <span class="required">*</span>
            </label>
            <input
              v-model="editingData.key"
              type="text"
              class="form-input"
              placeholder="唯一标识符"
              :disabled="!!editingDataKey"
            />
          </div>

          <!-- 显示名称 -->
          <div class="form-group">
            <label class="form-label">
              显示名称
              <span class="field-type-tag">列表展示用</span>
            </label>
            <div class="display-name-editor">
              <select
                v-model="editingDisplayMode"
                class="form-input display-name-select"
                @change="handleDisplayModeChange"
              >
                <option value="">（默认：使用数据 Key）</option>
                <option
                  v-for="field in table?.fields"
                  :key="field.key"
                  :value="'field:' + field.key"
                >
                  字段：{{ field.name }}（{{ field.key }}）
                </option>
                <option value="custom">自定义输入</option>
              </select>
              <input
                v-if="editingDisplayMode === 'custom'"
                v-model="editingDisplayCustom"
                type="text"
                class="form-input display-name-input"
                placeholder="输入自定义显示名称"
              />
            </div>
          </div>

          <!-- 字段编辑 -->
          <div
            v-for="field in table?.fields"
            :key="field.key"
            class="form-group"
          >
            <label class="form-label">
              {{ field.name }}
              <span v-if="field.required" class="required">*</span>
              <span class="field-type-tag">{{
                getFieldTypeName(field.type)
              }}</span>
            </label>

            <!-- 根据字段类型渲染不同的输入控件 -->
            <FieldInput v-model="editingData.info[field.key]" :field="field" />
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn" @click="showDataDialog = false">取消</button>
          <button class="btn btn-primary" @click="handleSaveData">确定</button>
        </div>
      </div>
    </div>

    <!-- 预览对话框（与导出数据格式一致） -->
    <div
      v-if="showPreviewDialog"
      class="dialog-overlay"
      @click.self="showPreviewDialog = false"
    >
      <div class="dialog-container dialog-preview">
        <div class="dialog-header">
          <h2>{{ previewTitle }}</h2>
          <button class="btn-close" @click="showPreviewDialog = false">
            ✕
          </button>
        </div>
        <div class="dialog-content preview-content">
          <pre class="preview-json">{{ previewContent }}</pre>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-primary" @click="showPreviewDialog = false">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, getPlatform } from "../api";
import { dataManager, getFieldTypeName } from "../utils/dataManager";
import { getDefaultValue } from "../utils/fieldFactory";
import type { IFieldDef, ITableDef } from "../utils/types";
import FieldInput from "./FieldInput.vue";

/** 导出时按下拉 valueType 将对应字段转为 string 或 number */
function coerceInfoForExport(
  info: Record<string, any>,
  fields: IFieldDef[],
): Record<string, any> {
  const out = JSON.parse(JSON.stringify(info));
  for (const f of fields) {
    if (f.type === "select" && f.key in out) {
      const vt = (f as any).valueType || "string";
      const v = out[f.key];
      if (v === null || v === undefined) continue;
      out[f.key] = vt === "number" ? Number(v) : String(v);
    }
  }
  return out;
}

/** 导出/预览用：单条数据项（与导出文件格式一致） */
export interface IExportDataItem {
  key: string;
  index: number;
  info: Record<string, any>;
}

// Props
const props = defineProps<{
  tableKey?: string;
}>();

// Emits
const emit = defineEmits(["back", "saved"]);

// 状态
const loading = ref(true);
const table = ref<ITableDef | undefined>(undefined);
const showDataDialog = ref(false);
const showPreviewDialog = ref(false);
const previewTitle = ref("数据预览");
const previewContent = ref("");
const editingDataKey = ref<string | undefined>(undefined);
const editingData = ref<{ key: string; info: Record<string, any> }>({
  key: "",
  info: {},
});

// 显示名称编辑状态
const editingDisplayMode = ref<string>(""); // '' | 'field:xxx' | 'custom'
const editingDisplayCustom = ref<string>("");

// 计算属性
const tableName = computed(() => table.value?.name || "");
const tableDesc = computed(() => table.value?.desc || "");
const dataList = computed(() => {
  if (!table.value) return [];

  return Object.entries(table.value.data)
    .map(([key, value]) => ({
      key,
      index: value.index,
      info: value.info,
    }))
    .sort((a, b) => a.index - b.index);
});

// ==================== 生命周期 ====================
onMounted(() => {
  loadTable();
});

// ==================== 加载表 ====================
function loadTable() {
  try {
    loading.value = true;
    if (!props.tableKey) {
      console.error("[DataEditor] tableKey 为空");
      return;
    }
    table.value = dataManager.getTable(props.tableKey);
    console.log("[DataEditor] 表已加载:", props.tableKey, table.value);
  } catch (err) {
    console.error("[DataEditor] 加载表失败:", err);
  } finally {
    loading.value = false;
  }
}

// ==================== 解析显示名称 ====================
function resolveDisplayName(item: { key: string; info: Record<string, any> }): string {
  if (!table.value) return item.key;
  const dataItem = table.value.data[item.key];
  const dn = dataItem?.displayName;
  if (!dn || !dn.value) return item.key;
  if (dn.mode === 'field') {
    const val = item.info[dn.value];
    if (val === null || val === undefined || val === '') return item.key;
    return String(val);
  }
  if (dn.mode === 'custom') {
    return dn.value || item.key;
  }
  return item.key;
}

function handleDisplayModeChange() {
  // 切换到非 custom 时清空自定义文本
  if (editingDisplayMode.value !== 'custom') {
    editingDisplayCustom.value = '';
  }
}

// ==================== 格式化单元格值 ====================
function formatCellValue(value: any, fieldType: string): string {
  if (value === null || value === undefined) return "-";

  switch (fieldType) {
    case "boolean":
      return value ? "✓" : "✗";
    case "array":
      return Array.isArray(value) ? `[${value.length} 项]` : "-";
    case "object":
      return typeof value === "object" ? "{对象}" : "-";
    case "reward":
      return value.id ? `${value.id} x${value.count}` : "-";
    default:
      return String(value);
  }
}

// ==================== 新增数据 ====================
function handleAddData() {
  editingDataKey.value = undefined;
  editingData.value = {
    key: `item_${Date.now()}`,
    info: createDefaultInfo(),
  };
  editingDisplayMode.value = '';
  editingDisplayCustom.value = '';
  showDataDialog.value = true;
}

// ==================== 编辑数据 ====================
function handleEditData(item: { key: string; info: Record<string, any> }) {
  editingDataKey.value = item.key;
  editingData.value = {
    key: item.key,
    info: JSON.parse(JSON.stringify(item.info)), // 深拷贝
  };
  // 加载显示名称配置
  const dataItem = table.value?.data[item.key];
  const dn = dataItem?.displayName;
  if (dn && dn.value) {
    if (dn.mode === 'field') {
      editingDisplayMode.value = 'field:' + dn.value;
      editingDisplayCustom.value = '';
    } else if (dn.mode === 'custom') {
      editingDisplayMode.value = 'custom';
      editingDisplayCustom.value = dn.value;
    } else {
      editingDisplayMode.value = '';
      editingDisplayCustom.value = '';
    }
  } else {
    editingDisplayMode.value = '';
    editingDisplayCustom.value = '';
  }
  showDataDialog.value = true;
}

// ==================== 删除数据 ====================
async function handleDeleteData(item: {
  key: string;
  info: Record<string, any>;
}) {
  if (!confirm(`确定要删除数据 "${item.key}" 吗？`)) {
    return;
  }

  try {
    if (!table.value) return;

    delete table.value.data[item.key];
    await dataManager.save();

    console.log("[DataEditor] 数据已删除:", item.key);
  } catch (err) {
    console.error("[DataEditor] 删除数据失败:", err);
    alert("删除失败: " + (err as Error).message);
  }
}

// ==================== 保存数据 ====================
async function handleSaveData() {
  try {
    if (!table.value) return;

    // 验证 key
    if (!editingData.value.key.trim()) {
      alert("请输入数据 Key");
      return;
    }

    // 检查 key 是否已存在（新增时）
    if (!editingDataKey.value && table.value.data[editingData.value.key]) {
      alert(`Key "${editingData.value.key}" 已存在`);
      return;
    }

    // 保存数据
    const dataKey = editingDataKey.value || editingData.value.key;
    const currentIndex =
      table.value.data[dataKey]?.index ?? Object.keys(table.value.data).length;

    // 构建显示名称配置
    let displayName: import('../utils/types').IDisplayName | undefined;
    if (editingDisplayMode.value.startsWith('field:')) {
      displayName = { mode: 'field', value: editingDisplayMode.value.slice(6) };
    } else if (editingDisplayMode.value === 'custom' && editingDisplayCustom.value.trim()) {
      displayName = { mode: 'custom', value: editingDisplayCustom.value.trim() };
    }

    table.value.data[dataKey] = {
      index: currentIndex,
      displayName,
      info: editingData.value.info,
    };

    await dataManager.save();

    showDataDialog.value = false;
    console.log("[DataEditor] 数据已保存:", dataKey);
  } catch (err) {
    console.error("[DataEditor] 保存数据失败:", err);
    alert("保存失败: " + (err as Error).message);
  }
}

// ==================== 保存表 ====================
async function handleSave() {
  try {
    await dataManager.save();
    alert("保存成功！");
    emit("saved");
  } catch (err) {
    console.error("[DataEditor] 保存失败:", err);
    alert("保存失败: " + (err as Error).message);
  }
}

// ==================== 导出/预览数据（格式一致） ====================
/** 构建与导出文件一致的数据结构（下拉按 valueType 转为 string/number） */
function getExportPayload(): Record<string, any> | null {
  if (!table.value || !props.tableKey) return null;
  const fields = table.value.fields || [];
  const list = dataList.value.map((item) => ({
    key: item.key,
    index: item.index,
    info: coerceInfoForExport(item.info, fields),
  }));
  const data: Record<string, Record<string, any>> = {};
  list.forEach((item) => {
    data[item.key] = item.info;
  });
  return data;
}

/** 单行数据（预览行时用，与导出中一条一致；下拉按 valueType 转换） */
function getExportDataForRow(item: {
  key: string;
  index: number;
  info: Record<string, any>;
}): IExportDataItem {
  const fields = table.value?.fields || [];
  return {
    key: item.key,
    index: item.index,
    info: coerceInfoForExport(item.info, fields),
  };
}

// ==================== 预览 ====================
function handlePreviewRow(item: {
  key: string;
  index: number;
  info: Record<string, any>;
}) {
  const one = getExportDataForRow(item);
  previewTitle.value = `预览：${item.key}`;
  previewContent.value = JSON.stringify(one.info, null, 4);
  showPreviewDialog.value = true;
}

function handlePreviewAll() {
  const payload = getExportPayload();
  if (!payload) return;
  previewTitle.value = `预览：${props.tableKey}（全部 ${Object.keys(payload).length} 条）`;
  previewContent.value = JSON.stringify(payload, null, 4);
  showPreviewDialog.value = true;
}

// ==================== 导出（按平台） ====================
async function handleExport() {
  const payload = getExportPayload();
  if (!payload) return;
  const jsonStr = JSON.stringify(payload);
  const buffer = new TextEncoder().encode(jsonStr).buffer;
  const defaultName = `${props.tableKey || "data"}.json`;
  const platform = getPlatform();

  try {
    if (platform === "cocos-v2" || platform === "cocos-v3") {
      // Cocos 编辑器：弹窗选择保存路径后写入
      const path = await api.selectSavePath?.({
        title: "导出当前数据表",
        defaultName,
        extensions: ["json"],
      });
      if (!path) return;
      const ok = await api.writeBinaryFile(path, buffer);
      if (ok) alert("导出成功！");
      else alert("导出失败");
      return;
    }
    if (platform === "standalone") {
      // 网页/独立：触发下载或 File System Access API
      const ok = await api.writeBinaryFile(defaultName, buffer);
      if (ok) alert("导出成功！");
      else alert("导出失败");
      return;
    }
    if (platform === "electron") {
      // Electron：后续实现
      alert("Electron 导出功能即将支持，请先在 Cocos 编辑器或网页中使用导出。");
      return;
    }
    alert("当前环境暂不支持导出");
  } catch (err) {
    console.error("[DataEditor] 导出失败:", err);
    alert("导出失败: " + (err as Error).message);
  }
}

// ==================== 创建默认信息 ====================
function createDefaultInfo(): Record<string, any> {
  if (!table.value) return {};

  const info: Record<string, any> = {};

  table.value.fields.forEach((field) => {
    info[field.key] = getDefaultValue(field);
  });

  return info;
}
</script>

<style scoped>
.data-editor-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #cccccc;
}

/* 头部 */
.editor-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-info h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
}

.table-desc {
  font-size: 14px;
  color: #999;
}

.header-spacer {
  flex: 1;
}

/* 按钮 */
.btn {
  padding: 8px 16px;
  background: #3e3e42;
  border: 1px solid #555;
  border-radius: 4px;
  color: #cccccc;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn:hover {
  background: #4e4e52;
  border-color: #666;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:disabled:hover {
  background: #3e3e42;
  border-color: #555;
}

.btn-outline {
  background: transparent;
  border-color: #666;
  color: #cccccc;
}

.btn-outline:hover:not(:disabled) {
  background: #3e3e42;
  border-color: #888;
}

.btn-back {
  background: #2d2d30;
  border-color: #3e3e42;
}

.btn-primary {
  background: #0e639c;
  border-color: #1177bb;
  color: #ffffff;
}

.btn-primary:hover {
  background: #1177bb;
}

.btn-success {
  background: #0e7c0e;
  border-color: #0f930f;
  color: #ffffff;
}

.btn-success:hover {
  background: #0f930f;
}

/* 内容区 */
.editor-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

/* 数据表格 */
.data-table-container {
  background: #252526;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #3e3e42;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #2d2d30;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #ffffff;
  border-bottom: 2px solid #3e3e42;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #2d2d30;
}

.data-table tbody tr:hover {
  background: #2d2d30;
}

.col-index {
  width: 60px;
  text-align: center;
}

.col-actions {
  width: 140px;
  text-align: center;
}

.col-display-name {
  min-width: 120px;
  max-width: 200px;
}

.data-display-name {
  min-width: 120px;
  max-width: 200px;
  color: #4fc3f7;
  font-weight: 500;
}

.data-index {
  text-align: center;
  color: #888;
  font-family: monospace;
}

.data-cell {
  max-width: 300px;
}

.cell-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-type {
  font-size: 12px;
  color: #888;
  font-weight: normal;
  margin-left: 4px;
}

.data-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-action {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-action:hover {
  background: #3e3e42;
}

.btn-edit:hover {
  border-color: #4fc3f7;
  color: #4fc3f7;
}

.btn-delete:hover {
  border-color: #f44336;
  color: #f44336;
}

.btn-preview:hover {
  border-color: #9c27b0;
  color: #ce93d8;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 40px;
}

.empty-state p {
  margin: 16px 0;
  font-size: 18px;
  color: #999;
}

.empty-state .tip {
  font-size: 14px;
  color: #666;
}

/* 加载中 */
.loading-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #4fc3f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 错误面板 */
.error-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

/* 预览对话框 */
.dialog-preview .dialog-container {
  max-width: 720px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.preview-content {
  flex: 1;
  overflow: auto;
  padding: 0;
  min-height: 200px;
}

.preview-json {
  margin: 0;
  padding: 16px;
  font-size: 12px;
  line-height: 1.5;
  color: #d4d4d4;
  background: #1e1e1e;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 对话框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-container {
  background: #252526;
  border-radius: 8px;
  border: 1px solid #3e3e42;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #3e3e42;
}

.dialog-header h2 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
}

.btn-close {
  padding: 4px 8px;
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 20px;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #ffffff;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #3e3e42;
}

/* 表单 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #ffffff;
}

.required {
  color: #f44336;
  margin-left: 4px;
}

.field-type-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: rgba(79, 195, 247, 0.1);
  border: 1px solid rgba(79, 195, 247, 0.3);
  border-radius: 4px;
  font-size: 12px;
  color: #4fc3f7;
  font-weight: normal;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  color: #cccccc;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4fc3f7;
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.display-name-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.display-name-select {
  cursor: pointer;
}

.display-name-input {
  margin-top: 0;
}
</style>
