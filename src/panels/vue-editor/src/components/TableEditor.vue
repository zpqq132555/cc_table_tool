<template>
  <div class="table-editor">
    <!-- 头部 -->
    <header class="editor-header">
      <h1>{{ isEdit ? '✏️ 编辑数据表' : '➕ 新增数据表' }}</h1>
    </header>

    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <button class="btn btn-back" @click="handleCancel">
        ← 返回
      </button>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-save" @click="handleSave" :disabled="!isValid">
        💾 保存
      </button>
    </div>

    <!-- 表单内容 -->
    <div class="editor-content">
      <div class="form-container">
        <!-- 基本信息 -->
        <div class="form-section">
          <h3 class="section-title">📋 基本信息</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">
                数据表 Key <span class="required">*</span>
                <span class="form-hint">导出文件名</span>
              </label>
              <input 
                type="text" 
                class="form-input" 
                v-model="form.key"
                :disabled="isEdit"
                placeholder="例如: level_config"
                :class="{ 'input-error': errors.key }"
              />
              <span v-if="errors.key" class="error-text">{{ errors.key }}</span>
            </div>
            
            <div class="form-group">
              <label class="form-label">
                显示名称 <span class="required">*</span>
                <span class="form-hint">主页面按钮显示</span>
              </label>
              <input 
                type="text" 
                class="form-input" 
                v-model="form.name"
                placeholder="例如: 关卡配置"
                :class="{ 'input-error': errors.name }"
              />
              <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">
                导出路径
                <span class="form-hint">导出设置父目录下的子目录</span>
              </label>
              <input 
                type="text" 
                class="form-input" 
                v-model="form.exportPath"
                placeholder="例如: configs/levels"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">
                列表显示字段
                <span class="form-hint">列表中显示的字段key</span>
              </label>
              <select class="form-select" v-model="form.listDisplayField">
                <option value="">-- 请选择 --</option>
                <option v-for="field in form.fields" :key="field.key" :value="field.key">
                  {{ field.name }} ({{ field.key }})
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group form-group-full">
              <label class="form-label">描述</label>
              <textarea 
                class="form-textarea" 
                v-model="form.desc"
                placeholder="表的描述信息..."
                rows="2"
              ></textarea>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group form-group-checkbox">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.separateExport" />
                <span class="checkbox-text">分离导出</span>
                <span class="form-hint">是否为每个数据项单独导出文件（如关卡数据）</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 字段定义 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">📐 字段定义</h3>
          </div>

          <!-- 字段列表 -->
          <div v-if="form.fields.length > 0" class="fields-list">
            <div 
              v-for="(field, index) in form.fields" 
              :key="index" 
              class="field-item"
            >
              <div class="field-header">
                <span class="field-index">{{ index + 1 }}</span>
                <span class="field-type-badge" :class="'type-' + field.type">
                  {{ getFieldTypeName(field.type) }}
                </span>
                <span class="field-name">{{ field.name }}</span>
                <span class="field-key">({{ field.key }})</span>
                <div class="field-actions">
                  <button class="btn-icon" @click="handleEditField(index)" title="编辑">
                    ✏️
                  </button>
                  <button class="btn-icon" @click="handleMoveField(index, -1)" :disabled="index === 0" title="上移">
                    ⬆️
                  </button>
                  <button class="btn-icon" @click="handleMoveField(index, 1)" :disabled="index === form.fields.length - 1" title="下移">
                    ⬇️
                  </button>
                  <button class="btn-icon btn-delete-field" @click="handleDeleteField(index)" title="删除">
                    🗑️
                  </button>
                </div>
              </div>
              <div class="field-info">
                <span v-if="field.required" class="field-required">必填</span>
                <span v-if="field.desc" class="field-desc">{{ field.desc }}</span>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="fields-empty">
            <p>暂无字段定义</p>
            <p class="tip">点击下方"添加字段"按钮创建字段</p>
          </div>

          <!-- 添加字段按钮（放在列表下方，无需上移点击） -->
          <div class="fields-list-actions">
            <button class="btn btn-add-field" @click="handleAddField">
              ➕ 添加字段
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 字段编辑对话框 -->
    <div v-if="showFieldDialog" class="dialog-overlay" @click.self="closeFieldDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ editingFieldIndex >= 0 ? '编辑字段' : '添加字段' }}</h3>
          <button class="btn-close" @click="closeFieldDialog">✕</button>
        </div>
        <div class="dialog-content">
          <FieldEditor 
            :field="editingField"
            @save="handleFieldSave"
            @cancel="closeFieldDialog"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import {
    dataManager,
    getFieldTypeName,
    type IFieldDef
} from '../utils/dataManager';
import FieldEditor from './FieldEditor.vue';

// Props
interface Props {
  /** 编辑模式下传入的表 key */
  tableKey?: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits(['back', 'saved']);

// 是否编辑模式
const isEdit = computed(() => !!props.tableKey);

// 表单数据
const form = reactive<{
  key: string;
  name: string;
  exportPath: string;
  desc: string;
  separateExport: boolean;
  listDisplayField: string;
  fields: IFieldDef[];
}>({
  key: '',
  name: '',
  exportPath: '',
  desc: '',
  separateExport: false,
  listDisplayField: '',
  fields: [],
});

// 错误信息
const errors = reactive<{
  key: string;
  name: string;
}>({
  key: '',
  name: '',
});

// 字段编辑对话框
const showFieldDialog = ref(false);
const editingFieldIndex = ref(-1);
const editingField = ref<IFieldDef | null>(null);

// 表单验证
const isValid = computed(() => {
  return form.key.trim() !== '' && form.name.trim() !== '' && !errors.key && !errors.name;
});

// 监听 key 变化进行验证
watch(() => form.key, (newKey) => {
  if (!newKey.trim()) {
    errors.key = '请输入数据表 Key';
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newKey)) {
    errors.key = 'Key 只能包含字母、数字和下划线，且不能以数字开头';
  } else if (!isEdit.value && dataManager.isTableKeyExists(newKey)) {
    errors.key = '该 Key 已存在';
  } else {
    errors.key = '';
  }
});

// 监听 name 变化进行验证
watch(() => form.name, (newName) => {
  if (!newName.trim()) {
    errors.name = '请输入显示名称';
  } else {
    errors.name = '';
  }
});

// 初始化
onMounted(() => {
  if (props.tableKey) {
    // 编辑模式：加载现有数据
    const table = dataManager.getTable(props.tableKey);
    if (table) {
      form.key = props.tableKey;
      form.name = table.name;
      form.exportPath = table.exportPath;
      form.desc = table.desc;
      form.separateExport = table.separateExport;
      form.listDisplayField = table.listDisplayField;
      form.fields = JSON.parse(JSON.stringify(table.fields)); // 深拷贝
    }
  }
});

// ==================== 保存 ====================
async function handleSave() {
  if (!isValid.value) return;

  try {
    if (isEdit.value) {
      // 更新表
      await dataManager.updateTable(form.key, {
        name: form.name,
        exportPath: form.exportPath,
        desc: form.desc,
        separateExport: form.separateExport,
        listDisplayField: form.listDisplayField,
        fields: form.fields,
      });
    } else {
      // 新增表
      await dataManager.addTable({
        key: form.key,
        name: form.name,
        exportPath: form.exportPath,
        desc: form.desc,
        separateExport: form.separateExport,
        listDisplayField: form.listDisplayField,
        fields: form.fields,
      });
    }

    console.log('[TableEditor] 保存成功');
    emit('saved');
  } catch (err) {
    console.error('[TableEditor] 保存失败:', err);
    alert('保存失败: ' + (err as Error).message);
  }
}

// ==================== 取消 ====================
function handleCancel() {
  emit('back');
}

// ==================== 添加字段 ====================
function handleAddField() {
  editingFieldIndex.value = -1;
  editingField.value = null;
  showFieldDialog.value = true;
}

// ==================== 编辑字段 ====================
function handleEditField(index: number) {
  editingFieldIndex.value = index;
  editingField.value = JSON.parse(JSON.stringify(form.fields[index]));
  showFieldDialog.value = true;
}

// ==================== 移动字段 ====================
function handleMoveField(index: number, direction: number) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= form.fields.length) return;
  
  const temp = form.fields[index];
  form.fields[index] = form.fields[newIndex];
  form.fields[newIndex] = temp;
}

// ==================== 删除字段 ====================
function handleDeleteField(index: number) {
  if (confirm(`确定要删除字段 "${form.fields[index].name}" 吗？`)) {
    form.fields.splice(index, 1);
  }
}

// ==================== 字段保存 ====================
function handleFieldSave(field: IFieldDef) {
  if (editingFieldIndex.value >= 0) {
    // 编辑现有字段
    form.fields[editingFieldIndex.value] = field;
  } else {
    // 添加新字段
    form.fields.push(field);
  }
  closeFieldDialog();
}

// ==================== 关闭字段对话框 ====================
function closeFieldDialog() {
  showFieldDialog.value = false;
  editingFieldIndex.value = -1;
  editingField.value = null;
}
</script>

<style scoped>
.table-editor {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.editor-header {
  flex-shrink: 0;
  padding: 16px 24px;
  background: linear-gradient(135deg, #2c3e50 0%, #27ae60 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.editor-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
}

.editor-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
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
}

.btn-save {
  background: #4caf50;
  color: #ffffff;
}

.btn-save:hover:not(:disabled) {
  background: #45a049;
}

.btn-save:disabled {
  background: #3e3e42;
  color: #666;
  cursor: not-allowed;
}

.editor-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.form-container {
  max-width: 1000px;
  margin: 0 auto;
}

/* 表单分区 */
.form-section {
  background: #252526;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #4fc3f7;
}

.section-header .section-title {
  margin: 0;
}

/* 表单行 */
.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group-full {
  flex: 1 1 100%;
}

.form-group-checkbox {
  flex: none;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #cccccc;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.required {
  color: #f44336;
}

.form-hint {
  font-size: 12px;
  color: #666;
  font-weight: 400;
}

.form-input,
.form-select,
.form-textarea {
  padding: 10px 12px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  color: #d4d4d4;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #4fc3f7;
}

.form-input:disabled {
  background: #2d2d30;
  color: #666;
  cursor: not-allowed;
}

.input-error {
  border-color: #f44336 !important;
}

.error-text {
  font-size: 12px;
  color: #f44336;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-select {
  cursor: pointer;
}

/* 复选框 */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-text {
  font-size: 14px;
  font-weight: 500;
  color: #cccccc;
}

/* 字段列表 */
.btn-add-field {
  padding: 6px 12px;
  background: #4caf50;
  color: #ffffff;
  font-size: 13px;
}

.btn-add-field:hover {
  background: #45a049;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-item {
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  padding: 12px 16px;
  transition: border-color 0.2s;
}

.field-item:hover {
  border-color: #4fc3f7;
}

.field-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-index {
  width: 24px;
  height: 24px;
  background: rgba(79, 195, 247, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #4fc3f7;
}

.field-type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.type-string { background: #2196f3; color: white; }
.type-number { background: #ff9800; color: white; }
.type-boolean { background: #9c27b0; color: white; }
.type-select { background: #00bcd4; color: white; }
.type-reward { background: #e91e63; color: white; }
.type-array { background: #4caf50; color: white; }
.type-object { background: #795548; color: white; }

.field-name {
  font-weight: 600;
  color: #ffffff;
}

.field-key {
  color: #666;
  font-size: 13px;
}

.field-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-icon:hover:not(:disabled) {
  background: #3e3e42;
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-delete-field:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.2);
}

.field-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  padding-left: 36px;
}

.field-required {
  padding: 2px 6px;
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border-radius: 4px;
  font-size: 11px;
}

.field-desc {
  font-size: 13px;
  color: #888;
}

.fields-empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.fields-empty p {
  margin: 8px 0;
}

.fields-empty .tip {
  font-size: 13px;
}

.fields-list-actions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* 对话框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: #252526;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #999;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #3e3e42;
  color: #ffffff;
}

.dialog-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}
</style>
