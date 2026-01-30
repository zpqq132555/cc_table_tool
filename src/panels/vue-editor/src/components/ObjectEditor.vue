<template>
  <div class="object-editor">
    <div class="object-header">
      <span class="object-info">
        对象 ({{ Object.keys(objectValue).length }} 个属性)
      </span>
    </div>

    <div v-if="properties.length === 0" class="object-empty">
      <p>对象没有定义任何属性</p>
    </div>

    <div v-else class="object-properties">
      <div 
        v-for="prop in properties" 
        :key="prop.key"
        class="property-item"
      >
        <div class="property-header">
          <span class="property-name">{{ prop.name }}</span>
          <span class="property-type">({{ getFieldTypeName(prop.type) }})</span>
        </div>

        <div class="property-content">
          <!-- 递归渲染字段输入 -->
          <FieldInput
            v-model="objectValue[prop.key]"
            :field="prop"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import type { IFieldDef, IObjectField } from '../utils/types';
import { getDefaultValue, getFieldTypeName } from '../utils/fieldFactory';
import FieldInput from './FieldInput.vue';

// Props
const props = defineProps<{
  modelValue: Record<string, any>;
  field: IObjectField;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void;
}>();

// 计算属性
const objectValue = computed({
  get() {
    return props.modelValue || {};
  },
  set(value) {
    emit('update:modelValue', value);
  }
});

const properties = computed(() => props.field.properties || []);

// 监听属性定义变化，初始化对象
watch(
  () => props.field.properties,
  (newProperties) => {
    if (newProperties && newProperties.length > 0) {
      const currentValue = objectValue.value;
      const newValue: Record<string, any> = {};
      
      // 为每个属性设置值，保留已有值或使用默认值
      newProperties.forEach(prop => {
        if (currentValue[prop.key] !== undefined) {
          newValue[prop.key] = currentValue[prop.key];
        } else {
          newValue[prop.key] = getDefaultValue(prop);
        }
      });
      
      emit('update:modelValue', newValue);
    }
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
.object-editor {
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
.object-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid #3e3e42;
}

.object-info {
  font-size: 14px;
  font-weight: 500;
  color: #cccccc;
}

/* 空状态 */
.object-empty {
  padding: 24px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

/* 属性列表 */
.object-properties {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

/* 单个属性 */
.property-item {
  background: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 10px;
  transition: all 0.2s;
}

.property-item:hover {
  border-color: #555;
}

/* 属性头部 */
.property-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #3e3e42;
}

.property-name {
  font-size: 13px;
  font-weight: 600;
  color: #4fc3f7;
}

.property-type {
  font-size: 12px;
  color: #999;
}

/* 属性内容 */
.property-content {
  padding: 4px 0;
}

/* 滚动条样式 */
.object-properties::-webkit-scrollbar {
  width: 8px;
}

.object-properties::-webkit-scrollbar-track {
  background: #1e1e1e;
  border-radius: 4px;
}

.object-properties::-webkit-scrollbar-thumb {
  background: #3e3e42;
  border-radius: 4px;
}

.object-properties::-webkit-scrollbar-thumb:hover {
  background: #4e4e52;
}
</style>
