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
    <div v-else-if="field.type === 'number'" class="number-input-wrapper">
      <button 
        type="button" 
        class="number-btn number-btn-minus"
        @click="decrementNumber"
        tabindex="-1"
      >−</button>
      <input
        ref="numberInputRef"
        v-model.number="inputValue"
        type="number"
        class="form-input number-input"
        :min="(field as any).min"
        :max="(field as any).max"
        :step="(field as any).step"
        :placeholder="field.desc || `请输入${field.name}`"
        @keydown="handleNumberKeydown"
      />
      <button 
        type="button" 
        class="number-btn number-btn-plus"
        @click="incrementNumber"
        tabindex="-1"
      >+</button>
    </div>

    <!-- 布尔字段 -->
    <div 
      v-else-if="field.type === 'boolean'" 
      class="checkbox-wrapper"
      tabindex="0"
      ref="booleanRef"
      @keydown="handleBooleanKeydown"
      @click="toggleBoolean"
    >
      <div class="checkbox-box" :class="{ 'is-checked': inputValue }">
        <span class="checkbox-icon">{{ inputValue ? '✓' : '' }}</span>
      </div>
      <span class="checkbox-text">{{ inputValue ? '是' : '否' }}</span>
    </div>

    <!-- 下拉选择 -->
    <div 
      v-else-if="field.type === 'select'" 
      class="custom-select"
      ref="selectRef"
      tabindex="0"
      @keydown="handleSelectKeydown"
      @focus="handleSelectFocus"
      @blur="handleSelectBlur"
    >
      <div 
        class="select-trigger" 
        @click="toggleSelectDropdown"
        :class="{ 'is-open': showSelectDropdown }"
      >
        <span class="select-value">
          {{ getSelectLabel(inputValue) || '无选项' }}
        </span>
        <span class="select-arrow">▼</span>
      </div>
      <div v-if="showSelectDropdown" class="select-dropdown">
        <div 
          v-for="(opt, idx) in (field as any).options"
          :key="opt.value"
          class="select-option"
          :class="{ 
            'is-selected': inputValue === opt.value,
            'is-highlighted': highlightedIndex === Number(idx)
          }"
          @click="handleSelectOption(opt.value)"
          @mouseenter="highlightedIndex = Number(idx)"
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
      <div class="number-input-wrapper reward-count-wrapper">
        <button 
          type="button" 
          class="number-btn number-btn-minus"
          @click="decrementRewardCount"
          tabindex="-1"
        >−</button>
        <input
          :value="rewardCount"
          @input="updateRewardCount($event)"
          @keydown="handleRewardCountKeydown"
          type="number"
          class="form-input number-input"
          placeholder="数量"
          min="0"
        />
        <button 
          type="button" 
          class="number-btn number-btn-plus"
          @click="incrementRewardCount"
          tabindex="-1"
        >+</button>
      </div>
    </div>

    <!-- 数组字段 -->
    <ArrayEditor
      v-else-if="field.type === 'array'"
      v-model="inputValue"
      :field="field"
    />

    <!-- 对象字段 -->
    <ObjectEditor
      v-else-if="field.type === 'object'"
      v-model="inputValue"
      :field="field"
    />

    <!-- 未知类型 -->
    <div v-else class="unknown-type">
      <span>不支持的字段类型: {{ (field as any).type }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import type { IFieldDef } from '../utils/types';
import ArrayEditor from './ArrayEditor.vue';
import ObjectEditor from './ObjectEditor.vue';

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
const showSelectDropdown = ref(false);
const highlightedIndex = ref(-1);
const selectBlurTimeout = ref<number | null>(null);

// Refs
const numberInputRef = ref<HTMLInputElement | null>(null);
const booleanRef = ref<HTMLDivElement | null>(null);
const selectRef = ref<HTMLDivElement | null>(null);

// 计算属性
const inputValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  }
});

// ==================== 精度修正工具函数 ====================
/**
 * 计算数值的小数位数
 */
function getDecimalPlaces(num: number): number {
  const str = String(num);
  const decimalIndex = str.indexOf('.');
  return decimalIndex >= 0 ? str.length - decimalIndex - 1 : 0;
}

/**
 * 修正浮点数精度问题
 * @param value 需要修正的数值
 * @param step 步长
 * @param originalValue 原始值（用于保持原始精度）
 */
function fixPrecision(value: number, step: number = 1, originalValue: number = 0): number {
  // 取步长精度和原始值精度中的较大值
  const stepPrecision = getDecimalPlaces(step);
  const originalPrecision = getDecimalPlaces(originalValue);
  const precision = Math.max(stepPrecision, originalPrecision);
  
  // 使用 toFixed 修正精度，然后转回数字
  return Number(value.toFixed(precision));
}

// ==================== 数字字段处理 ====================
function getStep(): number {
  return (props.field as any).step ?? 1;
}

function getMin(): number | undefined {
  return (props.field as any).min;
}

function getMax(): number | undefined {
  return (props.field as any).max;
}

function incrementNumber() {
  const step = getStep();
  const max = getMax();
  const original = Number(props.modelValue) || 0;
  let newValue = fixPrecision(original + step, step, original);
  
  if (max !== undefined && newValue > max) {
    newValue = max;
  }
  
  emit('update:modelValue', newValue);
}

function decrementNumber() {
  const step = getStep();
  const min = getMin();
  const original = Number(props.modelValue) || 0;
  let newValue = fixPrecision(original - step, step, original);
  
  if (min !== undefined && newValue < min) {
    newValue = min;
  }
  
  emit('update:modelValue', newValue);
}

function handleNumberKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    incrementNumber();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    decrementNumber();
  }
}

// ==================== 布尔字段处理 ====================
function toggleBoolean() {
  emit('update:modelValue', !props.modelValue);
}

function handleBooleanKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleBoolean();
  }
}

// ==================== 下拉选择处理 ====================
function getSelectOptions(): Array<{ value: any; label: string }> {
  const field = props.field as any;
  return field.options || [];
}

function getTotalOptionsCount(): number {
  return getSelectOptions().length;
}

function handleSelectFocus() {
  // 清除延迟关闭
  if (selectBlurTimeout.value) {
    clearTimeout(selectBlurTimeout.value);
    selectBlurTimeout.value = null;
  }
  
  if (!showSelectDropdown.value) {
    showSelectDropdown.value = true;
    // 设置当前选中项为高亮
    const options = getSelectOptions();
    const currentIndex = options.findIndex(opt => opt.value === props.modelValue);
    highlightedIndex.value = currentIndex >= 0 ? currentIndex + 1 : 0;
  }
}

function handleSelectBlur() {
  // 延迟关闭，允许点击选项
  selectBlurTimeout.value = window.setTimeout(() => {
    showSelectDropdown.value = false;
    highlightedIndex.value = -1;
  }, 150);
}

function handleSelectKeydown(e: KeyboardEvent) {
  const totalOptions = getTotalOptionsCount();
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (!showSelectDropdown.value) {
        showSelectDropdown.value = true;
        highlightedIndex.value = 0;
      } else {
        highlightedIndex.value = (highlightedIndex.value + 1) % totalOptions;
      }
      scrollToHighlighted();
      break;
      
    case 'ArrowUp':
      e.preventDefault();
      if (!showSelectDropdown.value) {
        showSelectDropdown.value = true;
        highlightedIndex.value = totalOptions - 1;
      } else {
        highlightedIndex.value = highlightedIndex.value <= 0 
          ? totalOptions - 1 
          : highlightedIndex.value - 1;
      }
      scrollToHighlighted();
      break;
      
    case 'Enter':
      e.preventDefault();
      if (showSelectDropdown.value && highlightedIndex.value >= 0) {
        const options = getSelectOptions();
        const option = options[highlightedIndex.value];
        if (option) {
          handleSelectOption(option.value);
        }
      } else {
        showSelectDropdown.value = true;
        highlightedIndex.value = 0;
      }
      break;
      
    case 'Escape':
      e.preventDefault();
      showSelectDropdown.value = false;
      highlightedIndex.value = -1;
      break;
      
    case ' ':
      e.preventDefault();
      if (!showSelectDropdown.value) {
        showSelectDropdown.value = true;
        highlightedIndex.value = 0;
      }
      break;
  }
}

function scrollToHighlighted() {
  nextTick(() => {
    const dropdown = selectRef.value?.querySelector('.select-dropdown');
    const highlighted = dropdown?.querySelector('.is-highlighted');
    if (highlighted && dropdown) {
      highlighted.scrollIntoView({ block: 'nearest' });
    }
  });
}

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
  const current = props.modelValue || { id: '', count: 1 };
  emit('update:modelValue', { ...current, count: Number(target.value) || 1 });
}

function incrementRewardCount() {
  const current = props.modelValue || { id: '', count: 1 };
  const step = 1; // 奖励数量默认步长为 1
  const original = Number(current.count) || 1;
  const newCount = fixPrecision(original + step, step, original);
  emit('update:modelValue', { ...current, count: newCount });
}

function decrementRewardCount() {
  const current = props.modelValue || { id: '', count: 1 };
  const step = 1;
  const original = Number(current.count) || 1;
  let newCount = fixPrecision(original - step, step, original);
  if (newCount < 1) newCount = 1; // 数量不能为负
  emit('update:modelValue', { ...current, count: newCount });
}

function handleRewardCountKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    incrementRewardCount();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    decrementRewardCount();
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

/* 数字输入框容器 */
.number-input-wrapper {
  display: flex;
  align-items: stretch;
}

.number-input-wrapper .number-input {
  flex: 1;
  border-radius: 0;
  border-left: none;
  border-right: none;
  text-align: center;
  appearance: textfield;
  -moz-appearance: textfield;
}

.number-input-wrapper .number-input::-webkit-inner-spin-button,
.number-input-wrapper .number-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-btn {
  width: 32px;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  color: #cccccc;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.number-btn:hover {
  background: #3e3e42;
  color: #ffffff;
}

.number-btn:active {
  background: #007acc;
}

.number-btn-minus {
  border-radius: 4px 0 0 4px;
}

.number-btn-plus {
  border-radius: 0 4px 4px 0;
}

/* 布尔复选框 - 可聚焦 */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  outline: none;
  transition: all 0.2s;
}

.checkbox-wrapper:focus {
  border-color: #007acc;
  background: rgba(0, 122, 204, 0.1);
}

.checkbox-wrapper:hover {
  background: rgba(255, 255, 255, 0.05);
}

.checkbox-box {
  width: 20px;
  height: 20px;
  background: #1e1e1e;
  border: 2px solid #3e3e42;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox-box.is-checked {
  background: #007acc;
  border-color: #007acc;
}

.checkbox-icon {
  color: #ffffff;
  font-size: 14px;
  font-weight: bold;
}

.checkbox-text {
  color: #cccccc;
  font-size: 14px;
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

/* 自定义下拉框 */
.custom-select {
  position: relative;
  width: 100%;
  outline: none;
}

.custom-select:focus .select-trigger {
  border-color: #007acc;
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

.select-option.is-highlighted {
  background: #094771;
  color: #ffffff;
}

.select-option.is-selected {
  background: rgba(0, 122, 204, 0.2);
  color: #4fc3f7;
}

.select-option.is-highlighted.is-selected {
  background: #094771;
  color: #ffffff;
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

.reward-input .reward-count-wrapper {
  width: 130px;
  flex-shrink: 0;
}

.reward-input .reward-count-wrapper .number-input {
  min-width: 0;
}

.reward-separator {
  color: #888;
  font-size: 16px;
  flex-shrink: 0;
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
