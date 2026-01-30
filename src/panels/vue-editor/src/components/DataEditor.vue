<template>
  <div class="data-editor-container">
    <!-- 头部 -->
    <header class="editor-header">
      <button class="btn btn-back" @click="$emit('back')">
        ← 返回
      </button>
      <div class="header-info">
        <h1>📊 {{ tableName }}</h1>
        <span class="table-desc" v-if="tableDesc">{{ tableDesc }}</span>
      </div>
      <div class="header-spacer"></div>
      <button class="btn btn-primary" @click="handleAddData">
        ➕ 新增数据
      </button>
      <button class="btn btn-success" @click="handleSave">
        💾 保存
      </button>
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
              <th 
                v-for="field in table.fields" 
                :key="field.key"
                :class="`col-${field.type}`"
              >
                {{ field.name }}
                <span class="field-type">({{ getFieldTypeName(field.type) }})</span>
              </th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in dataList" :key="item.key">
              <td class="data-index">{{ idx + 1 }}</td>
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
                <button class="btn-action btn-edit" @click="handleEditData(item)">
                  ✏️
                </button>
                <button class="btn-action btn-delete" @click="handleDeleteData(item)">
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
    <div v-if="showDataDialog" class="dialog-overlay" @click.self="showDataDialog = false">
      <div class="dialog-container">
        <div class="dialog-header">
          <h2>{{ editingDataKey ? '编辑数据' : '新增数据' }}</h2>
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

          <!-- 字段编辑 -->
          <div 
            v-for="field in table?.fields" 
            :key="field.key"
            class="form-group"
          >
            <label class="form-label">
              {{ field.name }}
              <span v-if="field.required" class="required">*</span>
              <span class="field-type-tag">{{ getFieldTypeName(field.type) }}</span>
            </label>
            
            <!-- 根据字段类型渲染不同的输入控件 -->
            <FieldInput
              v-model="editingData.info[field.key]"
              :field="field"
            />
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn" @click="showDataDialog = false">取消</button>
          <button class="btn btn-primary" @click="handleSaveData">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { dataManager, getFieldTypeName } from '../utils/dataManager';
import { getDefaultValue } from '../utils/fieldFactory';
import type { ITableDef } from '../utils/types';
import FieldInput from './FieldInput.vue';

// Props
const props = defineProps<{
  tableKey?: string;
}>();

// Emits
const emit = defineEmits(['back', 'saved']);

// 状态
const loading = ref(true);
const table = ref<ITableDef | undefined>(undefined);
const showDataDialog = ref(false);
const editingDataKey = ref<string | undefined>(undefined);
const editingData = ref<{ key: string; info: Record<string, any> }>({
  key: '',
  info: {}
});

// 计算属性
const tableName = computed(() => table.value?.name || '');
const tableDesc = computed(() => table.value?.desc || '');
const dataList = computed(() => {
  if (!table.value) return [];
  
  return Object.entries(table.value.data)
    .map(([key, value]) => ({
      key,
      index: value.index,
      info: value.info
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
      console.error('[DataEditor] tableKey 为空');
      return;
    }
    table.value = dataManager.getTable(props.tableKey);
    console.log('[DataEditor] 表已加载:', props.tableKey, table.value);
  } catch (err) {
    console.error('[DataEditor] 加载表失败:', err);
  } finally {
    loading.value = false;
  }
}

// ==================== 格式化单元格值 ====================
function formatCellValue(value: any, fieldType: string): string {
  if (value === null || value === undefined) return '-';
  
  switch (fieldType) {
    case 'boolean':
      return value ? '✓' : '✗';
    case 'array':
      return Array.isArray(value) ? `[${value.length} 项]` : '-';
    case 'object':
      return typeof value === 'object' ? '{对象}' : '-';
    case 'reward':
      return value.id ? `${value.id} x${value.count}` : '-';
    default:
      return String(value);
  }
}

// ==================== 新增数据 ====================
function handleAddData() {
  editingDataKey.value = undefined;
  editingData.value = {
    key: `item_${Date.now()}`,
    info: createDefaultInfo()
  };
  showDataDialog.value = true;
}

// ==================== 编辑数据 ====================
function handleEditData(item: { key: string; info: Record<string, any> }) {
  editingDataKey.value = item.key;
  editingData.value = {
    key: item.key,
    info: JSON.parse(JSON.stringify(item.info)) // 深拷贝
  };
  showDataDialog.value = true;
}

// ==================== 删除数据 ====================
async function handleDeleteData(item: { key: string; info: Record<string, any> }) {
  if (!confirm(`确定要删除数据 "${item.key}" 吗？`)) {
    return;
  }

  try {
    if (!table.value) return;
    
    delete table.value.data[item.key];
    await dataManager.save();
    
    console.log('[DataEditor] 数据已删除:', item.key);
  } catch (err) {
    console.error('[DataEditor] 删除数据失败:', err);
    alert('删除失败: ' + (err as Error).message);
  }
}

// ==================== 保存数据 ====================
async function handleSaveData() {
  try {
    if (!table.value) return;
    
    // 验证 key
    if (!editingData.value.key.trim()) {
      alert('请输入数据 Key');
      return;
    }

    // 检查 key 是否已存在（新增时）
    if (!editingDataKey.value && table.value.data[editingData.value.key]) {
      alert(`Key "${editingData.value.key}" 已存在`);
      return;
    }

    // 保存数据
    const dataKey = editingDataKey.value || editingData.value.key;
    const currentIndex = table.value.data[dataKey]?.index ?? Object.keys(table.value.data).length;
    
    table.value.data[dataKey] = {
      index: currentIndex,
      info: editingData.value.info
    };

    await dataManager.save();
    
    showDataDialog.value = false;
    console.log('[DataEditor] 数据已保存:', dataKey);
  } catch (err) {
    console.error('[DataEditor] 保存数据失败:', err);
    alert('保存失败: ' + (err as Error).message);
  }
}

// ==================== 保存表 ====================
async function handleSave() {
  try {
    await dataManager.save();
    alert('保存成功！');
    emit('saved');
  } catch (err) {
    console.error('[DataEditor] 保存失败:', err);
    alert('保存失败: ' + (err as Error).message);
  }
}

// ==================== 创建默认信息 ====================
function createDefaultInfo(): Record<string, any> {
  if (!table.value) return {};
  
  const info: Record<string, any> = {};
  
  table.value.fields.forEach(field => {
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
  width: 120px;
  text-align: center;
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
  to { transform: rotate(360deg); }
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
</style>
