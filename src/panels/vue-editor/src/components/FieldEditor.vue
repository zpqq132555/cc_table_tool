<template>
  <div class="field-editor">
    <!-- 基础信息 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">
          字段 Key <span class="required">*</span>
        </label>
        <input 
          type="text" 
          class="form-input" 
          v-model="form.key"
          placeholder="例如: name"
          :class="{ 'input-error': errors.key }"
        />
        <span v-if="errors.key" class="error-text">{{ errors.key }}</span>
      </div>
      
      <div class="form-group">
        <label class="form-label">
          显示名称 <span class="required">*</span>
        </label>
        <input 
          type="text" 
          class="form-input" 
          v-model="form.name"
          placeholder="例如: 名称"
          :class="{ 'input-error': errors.name }"
        />
        <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">
          字段类型 <span class="required">*</span>
        </label>
        <select class="form-select" v-model="form.type" @change="handleTypeChange">
          <option v-for="t in fieldTypes" :key="t.value" :value="t.value">
            {{ t.label }}
          </option>
        </select>
      </div>
      
      <div class="form-group form-group-checkbox">
        <label class="checkbox-label">
          <input type="checkbox" v-model="form.required" />
          <span class="checkbox-text">必填字段</span>
        </label>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group form-group-full">
        <label class="form-label">描述</label>
        <input 
          type="text" 
          class="form-input" 
          v-model="form.desc"
          placeholder="字段描述信息"
        />
      </div>
    </div>

    <!-- 类型特定配置 -->
    <div class="type-config">
      <!-- 数字类型配置 -->
      <template v-if="form.type === 'number'">
        <div class="config-title">数字配置</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">默认值</label>
            <input type="number" class="form-input" v-model.number="typeConfig.defaultValue" placeholder="0" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">最小值</label>
            <input type="number" class="form-input" v-model.number="typeConfig.min" placeholder="不限" />
          </div>
          <div class="form-group">
            <label class="form-label">最大值</label>
            <input type="number" class="form-input" v-model.number="typeConfig.max" placeholder="不限" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">步长</label>
            <input type="number" class="form-input" v-model.number="typeConfig.step" placeholder="1" />
          </div>
        </div>
      </template>

      <!-- 文本类型配置 -->
      <template v-if="form.type === 'string'">
        <div class="config-title">文本配置</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">默认值</label>
            <input type="text" class="form-input" v-model="typeConfig.defaultValue" />
          </div>
          <div class="form-group">
            <label class="form-label">最大长度</label>
            <input type="number" class="form-input" v-model.number="typeConfig.maxLength" placeholder="不限" />
          </div>
          <div class="form-group form-group-checkbox">
            <label class="checkbox-label">
              <input type="checkbox" v-model="typeConfig.multiline" />
              <span class="checkbox-text">多行文本</span>
            </label>
          </div>
        </div>
      </template>

      <!-- 布尔类型配置 -->
      <template v-if="form.type === 'boolean'">
        <div class="config-title">开关配置</div>
        <div class="form-row">
          <div class="form-group form-group-checkbox">
            <label class="checkbox-label">
              <input type="checkbox" v-model="typeConfig.defaultValue" />
              <span class="checkbox-text">默认开启</span>
            </label>
          </div>
        </div>
      </template>

      <!-- 下拉类型配置 -->
      <template v-if="form.type === 'select'">
        <div class="config-title">下拉选项配置</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">默认值</label>
            <select class="form-select" v-model="typeConfig.defaultValue">
              <option value="">-- 请选择 --</option>
              <option v-for="(opt, i) in typeConfig.options" :key="i" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="options-list">
          <div class="options-header">
            <span>选项列表</span>
            <button class="btn-small btn-add-option" @click="addOption">➕ 添加选项</button>
          </div>
          <div v-for="(opt, index) in typeConfig.options" :key="index" class="option-item">
            <input type="text" class="form-input" v-model="opt.label" placeholder="显示文本" />
            <input type="text" class="form-input" v-model="opt.value" placeholder="实际值" />
            <button class="btn-icon btn-delete-option" @click="removeOption(Number(index))">🗑️</button>
          </div>
          <div v-if="typeConfig.options.length === 0" class="options-empty">
            暂无选项，请添加
          </div>
        </div>
      </template>

      <!-- 奖励类型配置 -->
      <template v-if="form.type === 'reward'">
        <div class="config-title">奖励配置</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">默认ID</label>
            <input type="text" class="form-input" v-model="typeConfig.defaultValue.id" placeholder="奖励ID" />
          </div>
          <div class="form-group">
            <label class="form-label">默认数量</label>
            <input 
              type="number" 
              class="form-input" 
              v-model.number="typeConfig.defaultValue.count" 
              min="1"
              @input="validateRewardCount"
              @blur="validateRewardCount"
            />
          </div>
        </div>
      </template>

      <!-- 数组类型配置 -->
      <template v-if="form.type === 'array'">
        <div class="config-title">数组配置</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">固定长度</label>
            <input type="number" class="form-input" v-model.number="typeConfig.fixedLength" placeholder="0 表示不定长" />
          </div>
          <div class="form-group">
            <label class="form-label">元素类型</label>
            <select class="form-select" v-model="typeConfig.elementType" @change="handleElementTypeChange">
              <option v-for="t in allFieldTypes" :key="t.value" :value="t.value">
                {{ t.label }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- 嵌套元素配置 -->
        <div v-if="typeConfig.elementType === 'array' || typeConfig.elementType === 'object'" class="nested-config">
          <div class="nested-header">
            <span class="nested-title">📦 元素定义</span>
            <button class="btn-small btn-edit-nested" @click="openElementEditor">
              ✏️ 编辑元素结构
            </button>
          </div>
          <div class="nested-preview">
            <span v-if="typeConfig.element">{{ getNestedPreview(typeConfig.element) }}</span>
            <span v-else class="nested-empty">未配置，点击编辑按钮配置元素结构</span>
          </div>
        </div>
      </template>

      <!-- 对象类型配置 -->
      <template v-if="form.type === 'object'">
        <div class="config-title">对象属性配置</div>
        <div class="options-list">
          <div class="options-header">
            <span>属性列表</span>
            <button class="btn-small btn-add-option" @click="addProperty">➕ 添加属性</button>
          </div>
          <div v-for="(prop, index) in typeConfig.properties" :key="index" class="property-item-full">
            <div class="property-row">
              <input type="text" class="form-input" v-model="prop.key" placeholder="属性名" />
              <input type="text" class="form-input" v-model="prop.name" placeholder="显示名称" />
              <select class="form-select form-select-small" v-model="prop.type" @change="handlePropertyTypeChange(Number(index))">
                <option v-for="t in allFieldTypes" :key="t.value" :value="t.value">
                  {{ t.label }}
                </option>
              </select>
              <button 
                v-if="prop.type === 'array' || prop.type === 'object'" 
                class="btn-icon btn-edit-nested" 
                @click="openPropertyEditor(Number(index))"
                title="编辑嵌套结构"
              >
                ⚙️
              </button>
              <button class="btn-icon btn-delete-option" @click="removeProperty(Number(index))">🗑️</button>
            </div>
            <div v-if="prop.type === 'array' || prop.type === 'object'" class="property-nested-preview">
              <span v-if="prop.nestedDef">{{ getNestedPreview(prop.nestedDef) }}</span>
              <span v-else class="nested-empty">点击 ⚙️ 配置嵌套结构</span>
            </div>
          </div>
          <div v-if="typeConfig.properties.length === 0" class="options-empty">
            暂无属性，请添加
          </div>
        </div>
      </template>
    </div>
    
    <!-- 嵌套字段编辑对话框 -->
    <div v-if="showNestedDialog" class="dialog-overlay" @click.self="closeNestedDialog">
      <div class="dialog dialog-nested">
        <div class="dialog-header">
          <h3>{{ nestedDialogTitle }}</h3>
          <button class="btn-close" @click="closeNestedDialog">✕</button>
        </div>
        <div class="dialog-content">
          <FieldEditor 
            :field="nestedEditingField"
            :depth="(depth || 0) + 1"
            @save="handleNestedSave"
            @cancel="closeNestedDialog"
          />
        </div>
      </div>
    </div>

    <!-- 按钮 -->
    <div class="form-actions">
      <button class="btn btn-cancel" @click="$emit('cancel')">取消</button>
      <button class="btn btn-save" @click="handleSave" :disabled="!isValid">保存</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FieldType, IFieldDef } from '../utils/dataManager';

// Props
interface Props {
  field?: IFieldDef | null;
  /** 嵌套深度，用于限制递归 */
  depth?: number;
}

const props = defineProps<Props>();

// 最大嵌套深度
const MAX_DEPTH = 5;

// Emits
const emit = defineEmits(['save', 'cancel']);

// 字段类型选项
const fieldTypes = [
  { value: 'string', label: '文本 (string)' },
  { value: 'number', label: '数字 (number)' },
  { value: 'boolean', label: '开关 (boolean)' },
  { value: 'select', label: '下拉 (select)' },
  { value: 'reward', label: '奖励 (reward)' },
  { value: 'array', label: '数组 (array)' },
  { value: 'object', label: '对象 (object)' },
];

// 简单类型（用于数组元素和对象属性）
const simpleFieldTypes = [
  { value: 'string', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '开关' },
  { value: 'reward', label: '奖励' },
];

// 所有类型（包括可嵌套的类型）
const allFieldTypes = computed(() => {
  const currentDepth = props.depth || 0;
  const baseTypes = [
    { value: 'string', label: '文本' },
    { value: 'number', label: '数字' },
    { value: 'boolean', label: '开关' },
    { value: 'select', label: '下拉' },
    { value: 'reward', label: '奖励' },
  ];
  
  // 如果未达到最大深度，允许嵌套
  if (currentDepth < MAX_DEPTH) {
    baseTypes.push(
      { value: 'array', label: '数组' },
      { value: 'object', label: '对象' }
    );
  }
  
  return baseTypes;
});

// 表单数据
const form = reactive({
  key: '',
  name: '',
  type: 'string' as FieldType,
  desc: '',
  required: false,
});

// 类型特定配置
const typeConfig = reactive<any>({
  defaultValue: '',
  // number
  min: undefined,
  max: undefined,
  step: undefined,
  // string
  maxLength: undefined,
  multiline: false,
  // select
  options: [] as { label: string; value: string }[],
  // array
  fixedLength: 0,
  elementType: 'string',
  element: null as IFieldDef | null,  // 嵌套元素定义
  // object
  properties: [] as { key: string; name: string; type: FieldType; nestedDef?: IFieldDef }[],
});

// 嵌套编辑对话框状态
const showNestedDialog = ref(false);
const nestedDialogTitle = ref('');
const nestedEditingField = ref<IFieldDef | null>(null);
const nestedEditingContext = ref<{ type: 'element' | 'property'; index?: number } | null>(null);

// 错误信息
const errors = reactive({
  key: '',
  name: '',
});

// 表单验证
const isValid = computed(() => {
  return form.key.trim() !== '' && form.name.trim() !== '' && !errors.key && !errors.name;
});

// 监听 key 变化
watch(() => form.key, (newKey) => {
  if (!newKey.trim()) {
    errors.key = '请输入字段 Key';
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newKey)) {
    errors.key = 'Key 只能包含字母、数字和下划线';
  } else {
    errors.key = '';
  }
});

// 监听 name 变化
watch(() => form.name, (newName) => {
  if (!newName.trim()) {
    errors.name = '请输入显示名称';
  } else {
    errors.name = '';
  }
});

// 类型改变时重置配置
function handleTypeChange() {
  switch (form.type) {
    case 'string':
      typeConfig.defaultValue = '';
      typeConfig.maxLength = undefined;
      typeConfig.multiline = false;
      break;
    case 'number':
      typeConfig.defaultValue = 0;
      typeConfig.min = undefined;
      typeConfig.max = undefined;
      typeConfig.step = undefined;
      break;
    case 'boolean':
      typeConfig.defaultValue = false;
      break;
    case 'select':
      typeConfig.defaultValue = '';
      typeConfig.options = [];
      break;
    case 'reward':
      typeConfig.defaultValue = { id: '', count: 1 };
      break;
    case 'array':
      typeConfig.fixedLength = 0;
      typeConfig.elementType = 'string';
      typeConfig.element = null;
      break;
    case 'object':
      typeConfig.properties = [];
      break;
  }
}

// 添加选项
function addOption() {
  typeConfig.options.push({ label: '', value: '' });
}

// 删除选项
function removeOption(index: number) {
  typeConfig.options.splice(index, 1);
}

// 验证奖励数量
function validateRewardCount() {
  if (typeConfig.defaultValue && typeConfig.defaultValue.count <= 0) {
    typeConfig.defaultValue.count = 1;
  }
}

// 添加属性
function addProperty() {
  typeConfig.properties.push({ key: '', name: '', type: 'string', nestedDef: null });
}

// 删除属性
function removeProperty(index: number) {
  typeConfig.properties.splice(index, 1);
}

// 元素类型改变
function handleElementTypeChange() {
  if (typeConfig.elementType === 'array' || typeConfig.elementType === 'object') {
    typeConfig.element = null; // 重置嵌套定义
  }
}

// 属性类型改变
function handlePropertyTypeChange(index: number) {
  const prop = typeConfig.properties[index];
  if (prop.type !== 'array' && prop.type !== 'object') {
    prop.nestedDef = null;
  }
}

// 打开元素编辑器（数组的元素类型）
function openElementEditor() {
  nestedDialogTitle.value = '编辑数组元素结构';
  nestedEditingContext.value = { type: 'element' };
  
  if (typeConfig.element) {
    nestedEditingField.value = JSON.parse(JSON.stringify(typeConfig.element));
  } else {
    // 创建默认的嵌套字段
    nestedEditingField.value = {
      type: typeConfig.elementType,
      key: 'item',
      name: '元素',
    } as IFieldDef;
  }
  
  showNestedDialog.value = true;
}

// 打开属性编辑器（对象的属性）
function openPropertyEditor(index: number) {
  const prop = typeConfig.properties[index];
  nestedDialogTitle.value = `编辑属性 "${prop.name || prop.key}" 的结构`;
  nestedEditingContext.value = { type: 'property', index };
  
  if (prop.nestedDef) {
    nestedEditingField.value = JSON.parse(JSON.stringify(prop.nestedDef));
  } else {
    nestedEditingField.value = {
      type: prop.type,
      key: prop.key || 'prop',
      name: prop.name || '属性',
    } as IFieldDef;
  }
  
  showNestedDialog.value = true;
}

// 关闭嵌套对话框
function closeNestedDialog() {
  showNestedDialog.value = false;
  nestedEditingField.value = null;
  nestedEditingContext.value = null;
}

// 保存嵌套编辑
function handleNestedSave(field: IFieldDef) {
  if (!nestedEditingContext.value) return;
  
  if (nestedEditingContext.value.type === 'element') {
    typeConfig.element = field;
  } else if (nestedEditingContext.value.type === 'property') {
    const index = nestedEditingContext.value.index!;
    typeConfig.properties[index].nestedDef = field;
  }
  
  closeNestedDialog();
}

// 获取嵌套结构预览文本
function getNestedPreview(field: IFieldDef): string {
  if (!field) return '';
  
  switch (field.type) {
    case 'array':
      const arrField = field as any;
      const elemType = arrField.element?.type || 'unknown';
      return `数组<${elemType}>${arrField.fixedLength ? `[${arrField.fixedLength}]` : '[]'}`;
    case 'object':
      const objField = field as any;
      const propCount = objField.properties?.length || 0;
      return `对象 { ${propCount} 个属性 }`;
    default:
      return `${field.type}: ${field.name}`;
  }
}

// 初始化
onMounted(() => {
  if (props.field) {
    form.key = props.field.key;
    form.name = props.field.name;
    form.type = props.field.type;
    form.desc = props.field.desc || '';
    form.required = props.field.required || false;

    // 加载类型特定配置
    switch (props.field.type) {
      case 'string':
        typeConfig.defaultValue = props.field.defaultValue || '';
        typeConfig.maxLength = props.field.maxLength;
        typeConfig.multiline = props.field.multiline || false;
        break;
      case 'number':
        typeConfig.defaultValue = props.field.defaultValue ?? 0;
        typeConfig.min = props.field.min;
        typeConfig.max = props.field.max;
        typeConfig.step = props.field.step;
        break;
      case 'boolean':
        typeConfig.defaultValue = props.field.defaultValue || false;
        break;
      case 'select':
        typeConfig.defaultValue = props.field.defaultValue || '';
        typeConfig.options = [...props.field.options];
        break;
      case 'reward':
        typeConfig.defaultValue = props.field.defaultValue 
          ? { ...props.field.defaultValue } 
          : { id: '', count: 0 };
        break;
      case 'array':
        typeConfig.fixedLength = props.field.fixedLength || 0;
        typeConfig.elementType = props.field.element?.type || 'string';
        // 保存完整的嵌套元素定义
        if (props.field.element && (props.field.element.type === 'array' || props.field.element.type === 'object')) {
          typeConfig.element = JSON.parse(JSON.stringify(props.field.element));
        }
        break;
      case 'object':
        typeConfig.properties = props.field.properties.map(p => {
          const prop: any = {
            key: p.key,
            name: p.name,
            type: p.type,
            nestedDef: null,
          };
          // 保存完整的嵌套定义
          if (p.type === 'array' || p.type === 'object') {
            prop.nestedDef = JSON.parse(JSON.stringify(p));
          }
          return prop;
        });
        break;
    }
  }
});

// 保存
function handleSave() {
  if (!isValid.value) return;

  let field: IFieldDef;

  switch (form.type) {
    case 'string':
      field = {
        type: 'string',
        key: form.key,
        name: form.name,
        desc: form.desc || undefined,
        required: form.required || undefined,
        defaultValue: typeConfig.defaultValue || undefined,
        maxLength: typeConfig.maxLength || undefined,
        multiline: typeConfig.multiline || undefined,
      };
      break;
    case 'number':
      field = {
        type: 'number',
        key: form.key,
        name: form.name,
        desc: form.desc || undefined,
        required: form.required || undefined,
        defaultValue: typeConfig.defaultValue ?? 0,
        min: typeConfig.min,
        max: typeConfig.max,
        step: typeConfig.step,
      };
      break;
    case 'boolean':
      field = {
        type: 'boolean',
        key: form.key,
        name: form.name,
        desc: form.desc || undefined,
        required: form.required || undefined,
        defaultValue: typeConfig.defaultValue || false,
      };
      break;
    case 'select':
      field = {
        type: 'select',
        key: form.key,
        name: form.name,
        desc: form.desc || undefined,
        required: form.required || undefined,
        options: typeConfig.options,
        defaultValue: typeConfig.defaultValue || undefined,
      };
      break;
    case 'reward':
      field = {
        type: 'reward',
        key: form.key,
        name: form.name,
        desc: form.desc || undefined,
        required: form.required || undefined,
        defaultValue: typeConfig.defaultValue,
      };
      break;
    case 'array':
      // 构建元素定义
      let element: IFieldDef;
      if (typeConfig.elementType === 'array' || typeConfig.elementType === 'object') {
        // 使用嵌套编辑器定义的结构
        if (typeConfig.element) {
          element = typeConfig.element;
        } else {
          // 默认结构
          element = typeConfig.elementType === 'array' 
            ? { type: 'array', key: 'item', name: '元素', element: { type: 'string', key: 'subitem', name: '子元素' } as IFieldDef, fixedLength: 0 } as any
            : { type: 'object', key: 'item', name: '元素', properties: [] } as any;
        }
      } else {
        element = { type: typeConfig.elementType, key: 'item', name: '元素' } as IFieldDef;
      }
      
      field = {
        type: 'array',
        key: form.key,
        name: form.name,
        desc: form.desc || undefined,
        required: form.required || undefined,
        fixedLength: typeConfig.fixedLength || 0,
        element,
      };
      break;
    case 'object':
      // 构建属性定义
      const properties: IFieldDef[] = typeConfig.properties.map((p: any) => {
        if ((p.type === 'array' || p.type === 'object') && p.nestedDef) {
          // 使用完整的嵌套定义
          return {
            ...p.nestedDef,
            key: p.key,
            name: p.name,
          };
        } else {
          return { type: p.type, key: p.key, name: p.name } as IFieldDef;
        }
      });
      
      field = {
        type: 'object',
        key: form.key,
        name: form.name,
        desc: form.desc || undefined,
        required: form.required || undefined,
        properties,
      };
      break;
    default:
      return;
  }

  emit('save', field);
}
</script>

<style scoped>
.field-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group-full {
  flex: 1 1 100%;
}

.form-group-checkbox {
  flex: none;
  justify-content: flex-end;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #cccccc;
}

.required {
  color: #f44336;
}

.form-input,
.form-select {
  padding: 8px 10px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  color: #d4d4d4;
  font-size: 13px;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23999' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
}

.form-select option {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 8px;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #4fc3f7;
}

.input-error {
  border-color: #f44336 !important;
}

.error-text {
  font-size: 11px;
  color: #f44336;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  height: 100%;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
}

.checkbox-text {
  font-size: 13px;
  color: #cccccc;
}

/* 类型配置 */
.type-config {
  background: #1e1e1e;
  border-radius: 6px;
  padding: 16px;
  margin-top: 8px;
}

.config-title {
  font-size: 13px;
  font-weight: 600;
  color: #4fc3f7;
  margin-bottom: 12px;
}

/* 选项列表 */
.options-list {
  margin-top: 12px;
}

.options-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
  color: #999;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-add-option {
  background: #4caf50;
  color: white;
}

.btn-add-option:hover {
  background: #45a049;
}

.option-item,
.property-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.option-item .form-input,
.property-item .form-input {
  flex: 1;
}

.property-item .form-select-small {
  width: 100px;
  flex: none;
}

/* 完整属性项（支持嵌套） */
.property-item-full {
  margin-bottom: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.property-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.property-row .form-input {
  flex: 1;
}

.property-row .form-select-small {
  width: 100px;
  flex: none;
}

.property-nested-preview {
  margin-top: 8px;
  padding: 6px 10px;
  background: rgba(79, 195, 247, 0.1);
  border-radius: 4px;
  font-size: 12px;
  color: #4fc3f7;
}

/* 嵌套配置区域 */
.nested-config {
  margin-top: 12px;
  padding: 12px;
  background: rgba(79, 195, 247, 0.05);
  border: 1px dashed #4fc3f7;
  border-radius: 6px;
}

.nested-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.nested-title {
  font-size: 13px;
  font-weight: 500;
  color: #4fc3f7;
}

.btn-edit-nested {
  background: #2196f3;
  color: white;
  font-size: 12px;
}

.btn-edit-nested:hover {
  background: #1976d2;
}

.nested-preview {
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  font-size: 12px;
  color: #999;
}

.nested-empty {
  color: #666;
  font-style: italic;
}

.btn-icon.btn-edit-nested {
  background: rgba(33, 150, 243, 0.2);
  color: #4fc3f7;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-icon.btn-edit-nested:hover {
  background: rgba(33, 150, 243, 0.4);
}

.btn-delete-option {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.btn-delete-option:hover {
  background: rgba(244, 67, 54, 0.2);
}

.options-empty {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 13px;
}

/* 嵌套对话框 */
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

.dialog {
  background: #252526;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-nested {
  max-width: 650px;
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
  font-size: 16px;
  color: #fff;
}

.btn-close {
  background: transparent;
  border: none;
  color: #999;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.dialog-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* 按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #3e3e42;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #3e3e42;
  color: #cccccc;
}

.btn-cancel:hover {
  background: #4e4e52;
}

.btn-save {
  background: #4caf50;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #45a049;
}

.btn-save:disabled {
  background: #3e3e42;
  color: #666;
  cursor: not-allowed;
}
</style>
