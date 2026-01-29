<template>
  <div class="field-input">
    <!-- 文本字段 -->
    <input
      v-if="field.type === 'string'"
      v-model="inputValue"
      type="text"
      class="form-input"
      :placeholder="field.desc || `请输入${field.name}`"
    />

    <!-- 数字字段 -->
    <input
      v-else-if="field.type === 'number'"
      v-model.number="inputValue"
      type="number"
      class="form-input"
      :min="(field as any).min"
      :max="(field as any).max"
      :step="(field as any).step"
      :placeholder="field.desc || `请输入${field.name}`"
    />

    <!-- 布尔字段 -->
    <label v-else-if="field.type === 'boolean'" class="checkbox-label">
      <input
        v-model="inputValue"
        type="checkbox"
        class="form-checkbox"
      />
      <span>{{ inputValue ? '是' : '否' }}</span>
    </label>

    <!-- 下拉选择 -->
    <div v-else-if="field.type === 'select'" class="custom-select">
      <div 
        class="select-trigger" 
        @click="toggleSelectDropdown"
        :class="{ 'is-open': showSelectDropdown }"
      >
        <span class="select-value">
          {{ getSelectLabel(inputValue) || '请选择' }}
        </span>
        <span class="select-arrow">▼</span>
      </div>
      <div v-if="showSelectDropdown" class="select-dropdown">
        <div 
          class="select-option"
          :class="{ 'is-selected': inputValue === '' }"
          @click="handleSelectOption('')"
        >
          请选择
        </div>
        <div 
          v-for="opt in (field as any).options"
          :key="opt.value"
          class="select-option"
          :class="{ 'is-selected': inputValue === opt.value }"
          @click="handleSelectOption(opt.value)"
        >
          {{ opt.label }}
        </div>
      </div>
    </div>

    <!-- 奖励字段 -->
    <div v-else-if="field.type === 'reward'" class="reward-input">
      <input
        :value="rewardId"
        @input="updateRewardId($event)"
        type="text"
        class="form-input reward-id"
        placeholder="物品ID"
      />
      <span class="reward-separator">×</span>
      <input
        :value="rewardCount"
        @input="updateRewardCount($event)"
        type="number"
        class="form-input reward-count"
        placeholder="数量"
        min="0"
      />
    </div>

    <!-- 数组字段 -->
    <div v-else-if="field.type === 'array'" class="array-input">
      <div class="array-preview" @click="showArrayEditor = true">
        <span>数组 ({{ arrayValue.length }} 项)</span>
        <button type="button" class="btn-edit-array">编辑</button>
      </div>
      
      <!-- 简单数组编辑对话框 -->
      <div v-if="showArrayEditor" class="mini-dialog-overlay" @click.self="showArrayEditor = false">
        <div class="mini-dialog">
          <div class="mini-dialog-header">
            <span>编辑数组</span>
            <button @click="showArrayEditor = false">✕</button>
          </div>
          <div class="mini-dialog-content">
            <textarea
              v-model="arrayJson"
              class="form-textarea"
              rows="10"
              placeholder="输入 JSON 数组，例如：[1, 2, 3]"
            ></textarea>
          </div>
          <div class="mini-dialog-footer">
            <button class="btn" @click="showArrayEditor = false">取消</button>
            <button class="btn btn-primary" @click="saveArrayJson">确定</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 对象字段 -->
    <div v-else-if="field.type === 'object'" class="object-input">
      <div class="object-preview" @click="showObjectEditor = true">
        <span>对象 ({{ Object.keys(objectValue).length }} 个属性)</span>
        <button type="button" class="btn-edit-object">编辑</button>
      </div>
      
      <!-- 简单对象编辑对话框 -->
      <div v-if="showObjectEditor" class="mini-dialog-overlay" @click.self="showObjectEditor = false">
        <div class="mini-dialog">
          <div class="mini-dialog-header">
            <span>编辑对象</span>
            <button @click="showObjectEditor = false">✕</button>
          </div>
          <div class="mini-dialog-content">
            <textarea
              v-model="objectJson"
              class="form-textarea"
              rows="10"
              placeholder='输入 JSON 对象，例如：{"key": "value"}'
            ></textarea>
          </div>
          <div class="mini-dialog-footer">
            <button class="btn" @click="showObjectEditor = false">取消</button>
            <button class="btn btn-primary" @click="saveObjectJson">确定</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 未知类型 -->
    <div v-else class="unknown-type">
      <span>不支持的字段类型: {{ (field as any).type }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { IFieldDef } from '../utils/types';

// Props
const props = defineProps<{
  modelValue: any;
  field: IFieldDef;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();

// 状态
const showArrayEditor = ref(false);
const showObjectEditor = ref(false);
const showSelectDropdown = ref(false);
const arrayJson = ref('');
const objectJson = ref('');

// 计算属性
const inputValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  }
});

// 奖励字段的单独处理
const rewardId = computed(() => {
  const val = props.modelValue || { id: '', count: 0 };
  return val.id;
});

const rewardCount = computed(() => {
  const val = props.modelValue || { id: '', count: 0 };
  return val.count;
});

function updateRewardId(e: Event) {
  const target = e.target as HTMLInputElement;
  const current = props.modelValue || { id: '', count: 0 };
  emit('update:modelValue', { ...current, id: target.value });
}

function updateRewardCount(e: Event) {
  const target = e.target as HTMLInputElement;
  const current = props.modelValue || { id: '', count: 0 };
  emit('update:modelValue', { ...current, count: Number(target.value) || 0 });
}

const arrayValue = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue : [];
});

const objectValue = computed(() => {
  return typeof props.modelValue === 'object' && props.modelValue !== null && !Array.isArray(props.modelValue)
    ? props.modelValue
    : {};
});

// 监听数组值变化，更新 JSON 字符串
watch(() => props.modelValue, (newVal) => {
  if (props.field.type === 'array' && Array.isArray(newVal)) {
    arrayJson.value = JSON.stringify(newVal, null, 2);
  } else if (props.field.type === 'object' && typeof newVal === 'object') {
    objectJson.value = JSON.stringify(newVal, null, 2);
  }
}, { immediate: true });

// 保存数组 JSON
function saveArrayJson() {
  try {
    const parsed = JSON.parse(arrayJson.value);
    if (!Array.isArray(parsed)) {
      alert('请输入有效的 JSON 数组');
      return;
    }
    emit('update:modelValue', parsed);
    showArrayEditor.value = false;
  } catch (err) {
    alert('JSON 格式错误: ' + (err as Error).message);
  }
}

// 保存对象 JSON
function saveObjectJson() {
  try {
    const parsed = JSON.parse(objectJson.value);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      alert('请输入有效的 JSON 对象');
      return;
    }
    emit('update:modelValue', parsed);
    showObjectEditor.value = false;
  } catch (err) {
    alert('JSON 格式错误: ' + (err as Error).message);
  }
}

// 自定义下拉框方法
function toggleSelectDropdown() {
  showSelectDropdown.value = !showSelectDropdown.value;
}

function handleSelectOption(value: any) {
  emit('update:modelValue', value);
  showSelectDropdown.value = false;
}

function getSelectLabel(value: any): string {
  const field = props.field as any;
  if (!field.options) return '';
  const option = field.options.find((opt: any) => opt.value === value);
  return option ? option.label : '';
}
</script>

<style scoped>
.field-input {
  width: 100%;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  color: #cccccc;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #007acc;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  color: #cccccc;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #007acc;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* 自定义下拉框 */
.custom-select {
  position: relative;
  width: 100%;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.2s;
}

.select-trigger:hover {
  border-color: #007acc;
}

.select-trigger.is-open {
  border-color: #007acc;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.select-value {
  flex: 1;
  color: #cccccc;
  font-size: 14px;
}

.select-arrow {
  font-size: 10px;
  color: #888;
  transition: transform 0.2s;
}

.select-trigger.is-open .select-arrow {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #1e1e1e;
  border: 1px solid #007acc;
  border-top: none;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.select-option {
  padding: 8px 12px;
  cursor: pointer;
  color: #cccccc;
  font-size: 14px;
  transition: background 0.2s;
}

.select-option:hover {
  background: #2d2d30;
}

.select-option.is-selected {
  background: rgba(0, 122, 204, 0.2);
  color: #4fc3f7;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  color: #cccccc;
  font-size: 14px;
  cursor: pointer;
  max-height: 200px;
  overflow-y: auto;
}

.form-select option {
  padding: 8px 12px;
  background: #1e1e1e;
  color: #cccccc;
}

.form-select:focus {
  outline: none;
  border-color: #007acc;
}

.reward-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reward-input .reward-id {
  flex: 1;
}

.reward-input .reward-count {
  width: 100px;
}

.reward-separator {
  color: #888;
  font-size: 16px;
}

.array-input,
.object-input {
  position: relative;
}

.array-preview,
.object-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  cursor: pointer;
}

.array-preview:hover,
.object-preview:hover {
  border-color: #007acc;
}

.btn-edit-array,
.btn-edit-object {
  padding: 4px 12px;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.btn-edit-array:hover,
.btn-edit-object:hover {
  background: #005a9e;
}

.mini-dialog-overlay {
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

.mini-dialog {
  background: #252526;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.mini-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #3e3e42;
}

.mini-dialog-header button {
  background: none;
  border: none;
  color: #cccccc;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-dialog-header button:hover {
  color: white;
}

.mini-dialog-content {
  padding: 16px;
  flex: 1;
  overflow: auto;
}

.mini-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #3e3e42;
}

.btn {
  padding: 6px 16px;
  background: #3e3e42;
  color: #cccccc;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
}

.btn:hover {
  background: #4e4e52;
}

.btn-primary {
  background: #007acc;
  color: white;
}

.btn-primary:hover {
  background: #005a9e;
}

.unknown-type {
  padding: 8px 12px;
  background: #3e1e1e;
  border: 1px solid #6e3e3e;
  border-radius: 4px;
  color: #ff6b6b;
}
</style>
