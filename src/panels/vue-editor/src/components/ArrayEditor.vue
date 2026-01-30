<template>
  <div class="array-editor">
    <div class="array-header">
      <span class="array-info">
        {{ isFixedLength ? `固定长度数组 (${fixedLength})` : `不定长数组 (${arrayValue.length} 项)` }}
      </span>
      <button 
        v-if="!isFixedLength"
        type="button" 
        class="btn-add-item"
        @click="handleAddItem"
        title="添加元素"
      >
        ➕ 添加元素
      </button>
    </div>

    <div v-if="arrayValue.length === 0" class="array-empty">
      <p>数组为空</p>
      <p v-if="!isFixedLength" class="tip">点击"添加元素"按钮添加数据</p>
    </div>

    <div v-else class="array-items">
      <div 
        v-for="(item, index) in arrayValue" 
        :key="index"
        class="array-item"
        :class="{ 'is-dragging': dragIndex === index }"
      >
        <div class="item-header">
          <span class="item-index">#{{ index + 1 }}</span>
          <div class="item-actions">
            <button
              type="button"
              class="btn-move"
              @click="handleMoveUp(index)"
              :disabled="index === 0"
              title="上移"
            >
              ▲
            </button>
            <button
              type="button"
              class="btn-move"
              @click="handleMoveDown(index)"
              :disabled="index === arrayValue.length - 1"
              title="下移"
            >
              ▼
            </button>
            <button
              v-if="!isFixedLength"
              type="button"
              class="btn-delete"
              @click="handleDeleteItem(index)"
              title="删除"
            >
              🗑️
            </button>
          </div>
        </div>

        <div class="item-content">
          <!-- 递归渲染字段输入 -->
          <FieldInput
            v-model="arrayValue[index]"
            :field="elementField"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getDefaultValue } from '../utils/fieldFactory';
import type { IArrayField } from '../utils/types';
import FieldInput from './FieldInput.vue';

// Props
const props = defineProps<{
  modelValue: any[];
  field: IArrayField;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: any[]): void;
}>();

// 状态
const dragIndex = ref<number | null>(null);

// 计算属性
const arrayValue = computed({
  get() {
    return Array.isArray(props.modelValue) ? props.modelValue : [];
  },
  set(value) {
    emit('update:modelValue', value);
  }
});

const elementField = computed(() => props.field.element);

const isFixedLength = computed(() => {
  return props.field.fixedLength !== undefined && props.field.fixedLength > 0;
});

const fixedLength = computed(() => props.field.fixedLength || 0);

// 监听固定长度变化，初始化数组
watch(
  () => props.field.fixedLength,
  (newLength) => {
    if (newLength && newLength > 0 && arrayValue.value.length === 0) {
      initializeFixedArray(newLength);
    }
  },
  { immediate: true }
);

// ==================== 初始化固定长度数组 ====================
function initializeFixedArray(length: number) {
  const defaultValue = getDefaultValue(elementField.value);
  const newArray = Array.from({ length }, () => getDefaultValue(elementField.value));
  emit('update:modelValue', newArray);
}

// ==================== 添加元素 ====================
function handleAddItem() {
  if (isFixedLength.value) return;
  
  const defaultValue = getDefaultValue(elementField.value);
  const newArray = [...arrayValue.value, defaultValue];
  emit('update:modelValue', newArray);
}

// ==================== 删除元素 ====================
function handleDeleteItem(index: number) {
  if (isFixedLength.value) return;
  
  if (!confirm(`确定要删除第 ${index + 1} 个元素吗？`)) {
    return;
  }
  
  const newArray = arrayValue.value.filter((_, i) => i !== index);
  emit('update:modelValue', newArray);
}

// ==================== 上移元素 ====================
function handleMoveUp(index: number) {
  if (index <= 0) return;
  
  const newArray = [...arrayValue.value];
  [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
  emit('update:modelValue', newArray);
}

// ==================== 下移元素 ====================
function handleMoveDown(index: number) {
  if (index >= arrayValue.value.length - 1) return;
  
  const newArray = [...arrayValue.value];
  [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
  emit('update:modelValue', newArray);
}
</script>

<style scoped>
.array-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
}

/* 头部 */
.array-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid #3e3e42;
}

.array-info {
  font-size: 14px;
  font-weight: 500;
  color: #cccccc;
}

.btn-add-item {
  padding: 6px 12px;
  background: #0e639c;
  border: 1px solid #1177bb;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-add-item:hover {
  background: #1177bb;
}

/* 空状态 */
.array-empty {
  padding: 24px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.array-empty .tip {
  margin-top: 8px;
  font-size: 12px;
  color: #777;
}

/* 数组项列表 */
.array-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

/* 单个数组项 */
.array-item {
  background: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 8px;
  transition: all 0.2s;
}

.array-item:hover {
  border-color: #555;
}

.array-item.is-dragging {
  opacity: 0.5;
}

/* 项头部 */
.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #3e3e42;
}

.item-index {
  font-size: 13px;
  font-weight: 600;
  color: #0e639c;
}

.item-actions {
  display: flex;
  gap: 4px;
}

.btn-move,
.btn-delete {
  padding: 2px 8px;
  background: #3e3e42;
  border: 1px solid #555;
  border-radius: 3px;
  color: #cccccc;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-move:hover:not(:disabled),
.btn-delete:hover {
  background: #4e4e52;
  border-color: #666;
}

.btn-move:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-delete {
  background: #a82a2a;
  border-color: #c13535;
}

.btn-delete:hover {
  background: #c13535;
}

/* 项内容 */
.item-content {
  padding: 4px 0;
}

/* 滚动条样式 */
.array-items::-webkit-scrollbar {
  width: 8px;
}

.array-items::-webkit-scrollbar-track {
  background: #1e1e1e;
  border-radius: 4px;
}

.array-items::-webkit-scrollbar-thumb {
  background: #3e3e42;
  border-radius: 4px;
}

.array-items::-webkit-scrollbar-thumb:hover {
  background: #4e4e52;
}
</style>
