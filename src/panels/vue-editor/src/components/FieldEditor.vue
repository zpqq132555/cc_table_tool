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
            <label class="form-label">值类型</label>
            <select class="form-select" v-model="typeConfig.selectValueType">
              <option value="string">字符串</option>
              <option value="number">数字</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">默认值</label>
            <select class="form-select" v-model="typeConfig.defaultValue">
              <option v-for="(opt, i) in typeConfig.options" :key="i" :value="opt.value">
                {{ opt.label }}
              </option>
              <option v-if="typeConfig.options.length === 0" :value="typeConfig.selectValueType === 'number' ? undefined : ''" disabled>
                -- 请先添加选项 --
              </option>
            </select>
          </div>
        </div>
        <div class="options-list">
          <div class="options-header">
            <span>选项列表 <span v-if="typeConfig.options.length === 0" class="required">*</span></span>
          </div>
          <div v-for="(opt, index) in typeConfig.options" :key="index" class="option-item">
            <input type="text" class="form-input" v-model="opt.label" placeholder="显示文本" />
            <div style="display:flex;align-items:center;gap:6px;width:220px;">
              <template v-if="typeConfig.selectValueType === 'number'">
                <button type="button" class="btn-tiny" @click="changeOptionNumber(typeConfig.options, Number(index), -1)">-</button>
              </template>
              <input 
                :type="typeConfig.selectValueType === 'number' ? 'number' : 'text'" 
                class="form-input" 
                :value="opt.value" 
                @input="(e: any) => setSelectOptionValue(typeConfig.options, Number(index), typeConfig.selectValueType === 'number' ? Number(e.target.value) : e.target.value)"
                :placeholder="typeConfig.selectValueType === 'number' ? '数字' : '实际值'"
                style="flex:1;min-width:0;"
              />
              <template v-if="typeConfig.selectValueType === 'number'">
                <button type="button" class="btn-tiny" @click="changeOptionNumber(typeConfig.options, Number(index), 1)">+</button>
              </template>
            </div>
            <button class="btn-icon btn-move-up" :disabled="index === 0" @click="moveOptionUp(Number(index))" title="上移">⬆️</button>
            <button class="btn-icon btn-move-down" :disabled="index === typeConfig.options.length - 1" @click="moveOptionDown(Number(index))" title="下移">⬇️</button>
            <button class="btn-icon btn-delete-option" @click="removeOption(Number(index))">🗑️</button>
          </div>
          <button class="btn-small btn-add-option" style="margin-top:8px;" @click="addOption">➕ 添加选项</button>
          <div v-if="selectOptionsError" class="options-error">{{ selectOptionsError }}</div>
          <div v-if="typeConfig.options.length === 0" class="options-empty options-required">
            ⚠️ 必须至少添加一个选项
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
            <input type="number" class="form-input" v-model.number="typeConfig.fixedLength" placeholder="0 表示不定长" min="0" />
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
        
        <!-- 元素约束配置（针对基本类型） -->
        <div v-if="typeConfig.elementType && typeConfig.elementType !== 'array' && typeConfig.elementType !== 'object'" class="element-constraints">
          <div class="config-subtitle">元素约束</div>
          
          <!-- 数字类型元素约束 -->
          <template v-if="typeConfig.elementType === 'number'">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">默认值</label>
                <input type="number" class="form-input form-input-small" v-model.number="typeConfig.elementConstraints.defaultValue" placeholder="0" />
              </div>
              <div class="form-group">
                <label class="form-label">最小值</label>
                <input type="number" class="form-input form-input-small" v-model.number="typeConfig.elementConstraints.min" placeholder="不限" />
              </div>
              <div class="form-group">
                <label class="form-label">最大值</label>
                <input type="number" class="form-input form-input-small" v-model.number="typeConfig.elementConstraints.max" placeholder="不限" />
              </div>
              <div class="form-group">
                <label class="form-label">步长</label>
                <input type="number" class="form-input form-input-small" v-model.number="typeConfig.elementConstraints.step" placeholder="1" />
              </div>
            </div>
          </template>
          
          <!-- 文本类型元素约束 -->
          <template v-if="typeConfig.elementType === 'string'">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">默认值</label>
                <input type="text" class="form-input" v-model="typeConfig.elementConstraints.defaultValue" />
              </div>
              <div class="form-group">
                <label class="form-label">最大长度</label>
                <input type="number" class="form-input form-input-small" v-model.number="typeConfig.elementConstraints.maxLength" placeholder="不限" />
              </div>
            </div>
          </template>
          
          <!-- 布尔类型元素约束 -->
          <template v-if="typeConfig.elementType === 'boolean'">
            <div class="form-row">
              <div class="form-group form-group-checkbox">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="typeConfig.elementConstraints.defaultValue" />
                  <span class="checkbox-text">默认开启</span>
                </label>
              </div>
            </div>
          </template>
          
          <!-- 下拉类型元素约束 -->
          <template v-if="typeConfig.elementType === 'select'">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">值类型</label>
                <select class="form-select form-select-small" v-model="typeConfig.elementConstraints.selectValueType">
                  <option value="string">字符串</option>
                  <option value="number">数字</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">默认值</label>
                <select class="form-select" v-model="typeConfig.elementConstraints.defaultValue">
                  <option v-for="(opt, i) in typeConfig.elementConstraints.options" :key="i" :value="opt.value">
                    {{ opt.label }}
                  </option>
                  <option v-if="typeConfig.elementConstraints.options.length === 0" :value="typeConfig.elementConstraints.selectValueType === 'number' ? undefined : ''" disabled>
                    -- 请先添加选项 --
                  </option>
                </select>
              </div>
            </div>
            <div class="options-list options-list-compact">
              <div class="options-header">
                <span>选项列表 <span v-if="typeConfig.elementConstraints.options.length === 0" class="required">*</span></span>
                <button type="button" class="btn-small btn-add-option" @click="addElementOption">➕ 添加选项</button>
              </div>
              <div v-for="(opt, index) in typeConfig.elementConstraints.options" :key="index" class="option-item">
                <input type="text" class="form-input form-input-small" v-model="opt.label" placeholder="显示文本" />
                <div style="display:flex;align-items:center;gap:6px;width:160px;">
                  <template v-if="typeConfig.elementConstraints.selectValueType === 'number'">
                    <button type="button" class="btn-tiny" @click="changeOptionNumber(typeConfig.elementConstraints.options, Number(index), -1)">-</button>
                  </template>
                  <input 
                    :type="typeConfig.elementConstraints.selectValueType === 'number' ? 'number' : 'text'" 
                    class="form-input form-input-small" 
                    :value="opt.value" 
                    @input="(e: any) => setSelectOptionValue(typeConfig.elementConstraints.options, Number(index), typeConfig.elementConstraints.selectValueType === 'number' ? Number(e.target.value) : e.target.value, typeConfig.elementConstraints.selectValueType)"
                    :placeholder="typeConfig.elementConstraints.selectValueType === 'number' ? '数字' : '实际值'"
                    style="flex:1;min-width:0;"
                  />
                  <template v-if="typeConfig.elementConstraints.selectValueType === 'number'">
                    <button type="button" class="btn-tiny" @click="changeOptionNumber(typeConfig.elementConstraints.options, Number(index), 1)">+</button>
                  </template>
                </div>
                <button type="button" class="btn-icon btn-delete-option" @click="removeElementOption(Number(index))">🗑️</button>
              </div>
              <div v-if="form.type === 'array' && typeConfig.elementType === 'select' && validateSelectOptions(typeConfig.elementConstraints.options, typeConfig.elementConstraints.selectValueType)" class="options-error">
                {{ validateSelectOptions(typeConfig.elementConstraints.options, typeConfig.elementConstraints.selectValueType) }}
              </div>
              <div v-if="typeConfig.elementConstraints.options.length === 0" class="options-empty options-required">
                ⚠️ 必须至少添加一个选项
              </div>
            </div>
          </template>
          
          <!-- 奖励类型元素约束 -->
          <template v-if="typeConfig.elementType === 'reward'">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">默认ID</label>
                <input type="text" class="form-input" v-model="typeConfig.elementConstraints.defaultValue.id" placeholder="奖励ID" />
              </div>
              <div class="form-group">
                <label class="form-label">默认数量</label>
                <input type="number" class="form-input" v-model.number="typeConfig.elementConstraints.defaultValue.count" min="1" />
              </div>
            </div>
          </template>
        </div>
        
        <!-- 嵌套元素配置 -->
        <div v-if="typeConfig.elementType === 'array' || typeConfig.elementType === 'object'" class="nested-config">
          <div class="nested-header">
            <span class="nested-title">📦 元素定义</span>
            <button type="button" class="btn-small btn-edit-nested" @click="openElementEditor">
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
                type="button"
                class="btn-icon btn-edit-nested" 
                @click.stop="openPropertyEditor(Number(index))"
                title="编辑嵌套结构"
              >
                ⚙️
              </button>
              <button class="btn-icon btn-delete-option" @click="removeProperty(Number(index))">🗑️</button>
            </div>
            
            <!-- 嵌套结构预览（点击可打开编辑） -->
            <div 
              v-if="prop.type === 'array' || prop.type === 'object'" 
              class="property-nested-preview property-nested-preview-clickable"
              @click="openPropertyEditor(Number(index))"
              role="button"
              tabindex="0"
              title="点击配置嵌套结构"
            >
              <span v-if="prop.nestedDef">{{ getNestedPreview(prop.nestedDef) }}</span>
              <span v-else class="nested-empty">点击 ⚙️ 配置嵌套结构</span>
            </div>
            
            <!-- 属性约束配置 - 根据类型直接显示 -->
            <div v-if="prop.type === 'number' || prop.type === 'string' || prop.type === 'boolean' || prop.type === 'select' || prop.type === 'reward'" class="property-constraints">
              <div class="constraint-caption">约束</div>
              <div class="constraint-grid">
                <!-- 数字类型约束 -->
                <template v-if="prop.type === 'number'">
                  <div class="constraint-row">
                    <label>默认值</label>
                    <input type="number" class="form-input constraint-input" v-model.number="prop.constraints.defaultValue" placeholder="0" />
                  </div>
                  <div class="constraint-row">
                    <label>最小值</label>
                    <input type="number" class="form-input constraint-input" v-model.number="prop.constraints.min" placeholder="不限" />
                  </div>
                  <div class="constraint-row">
                    <label>最大值</label>
                    <input type="number" class="form-input constraint-input" v-model.number="prop.constraints.max" placeholder="不限" />
                  </div>
                  <div class="constraint-row">
                    <label>步长</label>
                    <input type="number" class="form-input constraint-input" v-model.number="prop.constraints.step" placeholder="1" />
                  </div>
                </template>
                
                <!-- 文本类型约束 -->
                <template v-if="prop.type === 'string'">
                  <div class="constraint-row constraint-row-wide">
                    <label>默认值</label>
                    <input type="text" class="form-input constraint-input" v-model="prop.constraints.defaultValue" placeholder="可选" />
                  </div>
                  <div class="constraint-row">
                    <label>最大长度</label>
                    <input type="number" class="form-input constraint-input" v-model.number="prop.constraints.maxLength" placeholder="不限" />
                  </div>
                </template>
                
                <!-- 布尔类型约束 -->
                <template v-if="prop.type === 'boolean'">
                  <div class="constraint-row constraint-row-full">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="prop.constraints.defaultValue" />
                      <span>默认开启</span>
                    </label>
                  </div>
                </template>
                
                <!-- 下拉类型约束 -->
                <template v-if="prop.type === 'select'">
                  <div class="constraint-row">
                    <label>值类型</label>
                    <select class="form-select constraint-input" v-model="prop.constraints.selectValueType">
                      <option value="string">字符串</option>
                      <option value="number">数字</option>
                    </select>
                  </div>
                  <div class="constraint-row constraint-row-wide">
                    <label>默认值</label>
                    <select class="form-select constraint-input" v-model="prop.constraints.defaultValue">
                      <option v-for="(opt, i) in prop.constraints.options" :key="i" :value="opt.value">
                        {{ opt.label }}
                      </option>
                      <option v-if="!prop.constraints.options || prop.constraints.options.length === 0" :value="prop.constraints.selectValueType === 'number' ? undefined : ''" disabled>
                        -- 请先添加选项 --
                      </option>
                    </select>
                  </div>
                  <div class="constraint-options constraint-options-full">
                    <div class="constraint-options-header">
                      <span>选项列表 <span v-if="!prop.constraints.options || prop.constraints.options.length === 0" class="required">*</span></span>
                      <button type="button" class="btn-tiny" @click="addPropertyOption(Number(index))">➕</button>
                    </div>
                    <div v-for="(opt, optIdx) in prop.constraints.options" :key="optIdx" class="constraint-option-item">
                      <input type="text" class="form-input form-input-tiny" v-model="opt.label" placeholder="显示" />
                      <div style="display:flex;align-items:center;gap:6px;width:220px;">
                        <template v-if="prop.constraints.selectValueType === 'number'">
                          <button type="button" class="btn-tiny" @click="changeOptionNumber(prop.constraints.options, Number(optIdx), -1)">-</button>
                        </template>
                        <input 
                          :type="prop.constraints.selectValueType === 'number' ? 'number' : 'text'" 
                          class="form-input form-input-tiny" 
                          :value="opt.value" 
                          @input="(e: any) => setPropertyOptionValue(Number(index), Number(optIdx), prop.constraints.selectValueType === 'number' ? Number(e.target.value) : e.target.value)"
                          :placeholder="prop.constraints.selectValueType === 'number' ? '数字' : '值'"
                          style="flex:1;min-width:0;"
                        />
                        <template v-if="prop.constraints.selectValueType === 'number'">
                          <button type="button" class="btn-tiny" @click="changeOptionNumber(prop.constraints.options, Number(optIdx), 1)">+</button>
                        </template>
                        <button type="button" class="btn-icon-tiny" @click="removePropertyOption(Number(index), Number(optIdx))">✕</button>
                      </div>
                    </div>
                    <div v-if="prop.constraints.options && validateSelectOptions(prop.constraints.options, prop.constraints.selectValueType || 'string')" class="options-error">
                      {{ validateSelectOptions(prop.constraints.options, prop.constraints.selectValueType || 'string') }}
                    </div>
                    <div v-if="!prop.constraints.options || prop.constraints.options.length === 0" class="options-empty options-required">
                      ⚠️ 必须至少添加一个选项
                    </div>
                  </div>
                </template>
                
                <!-- 奖励类型约束 -->
                <template v-if="prop.type === 'reward'">
                  <div class="constraint-row">
                    <label>默认ID</label>
                    <input type="text" class="form-input constraint-input" v-model="prop.constraints.defaultValue.id" placeholder="奖励ID" />
                  </div>
                  <div class="constraint-row">
                    <label>默认数量</label>
                    <input type="number" class="form-input constraint-input" v-model.number="prop.constraints.defaultValue.count" min="1" placeholder="1" />
                  </div>
                </template>
              </div>
            </div>
          </div>
          <div v-if="typeConfig.properties.length === 0" class="options-empty">
            暂无属性，请添加
          </div>
          <div class="options-list-actions">
            <button class="btn-small btn-add-option" @click="addProperty">➕ 添加属性</button>
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
// 保证下拉选项值类型有默认值（字符串），用于决定解析为字符串还是数字
onMounted(() => {
  if (form.type === 'select' && !typeConfig.selectValueType) {
    typeConfig.selectValueType = 'string';
  }
});

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
  selectValueType: 'string' as 'string' | 'number',
  options: [] as { label: string; value: string | number }[],
  // array
  fixedLength: 0,
  elementType: 'string',
  element: null as IFieldDef | null,  // 嵌套元素定义
  elementConstraints: {  // 基本类型元素的约束
    defaultValue: undefined as any,
    min: undefined,
    max: undefined,
    step: undefined,
    maxLength: undefined,
    selectValueType: 'string' as 'string' | 'number',
    options: [] as { label: string; value: string | number }[],
  },
  // object
  properties: [] as { 
    key: string; 
    name: string; 
    type: FieldType; 
    nestedDef?: IFieldDef;
    constraints?: any;
  }[],
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

/**
 * 校验下拉选项：
 * - 所有显示文本互不相同
 * - 所有实际值互不相同
 * - 若某显示文本等于某实际值，只有在它们属于同一项时允许（即同索引），否则报错
 * 返回错误文案，空表示通过
 */
function validateSelectOptions(options: { label: string; value: string | number }[], valueType: 'string' | 'number'): string {
  if (!options.length) return '';
  const labels = options.map(o => String(o.label).trim());
  const values = options.map(o => String(o.value));

  // 检查显示文本唯一
  for (let i = 0; i < labels.length; i++) {
    const L = labels[i];
    if (!L) return `选项 ${i + 1}：显示文本不能为空`;
    if (labels.indexOf(L) !== i) return `显示文本“${L}”重复，请保证每项显示文本唯一`;
  }

  // 检查实际值唯一
  for (let i = 0; i < values.length; i++) {
    const V = values[i];
    if (V === undefined || V === null || V === '') return `选项 ${i + 1}：实际值不能为空`;
    if (values.indexOf(V) !== i) return `实际值“${V}”重复，请保证每项实际值唯一`;
  }

  // 检查显示文本与其他项实际值冲突（允许与自身项的实际值相等）
  for (let i = 0; i < labels.length; i++) {
    for (let j = 0; j < values.length; j++) {
      if (i === j) continue; // 同一项允许相等
      if (labels[i] === values[j]) {
        return `显示文本“${labels[i]}”与第 ${j + 1} 项的实际值相同，除非在同一项中`;
      }
    }
  }

  return '';
}

const selectOptionsError = computed(() => {
  if (form.type !== 'select') return '';
  return validateSelectOptions(typeConfig.options, typeConfig.selectValueType);
});

/** 设置下拉选项的实际值（根据值类型写回 number 或 string） */
function setSelectOptionValue(
  options: { label: string; value: string | number }[],
  index: number,
  raw: string | number,
  valueType?: 'string' | 'number'
) {
  const vt = valueType ?? typeConfig.selectValueType;
  if (vt === 'number') {
    const num = raw === '' ? ('' as any) : Number(raw);
    options[index].value = num === '' || !Number.isNaN(num) ? num : options[index].value;
  } else {
    options[index].value = typeof raw === 'string' ? raw : String(raw);
  }
}

function setPropertyOptionValue(propIndex: number, optIndex: number, raw: string | number) {
  const prop = typeConfig.properties[propIndex];
  if (!prop?.constraints?.options) return;
  const vt = (prop.constraints.selectValueType || 'string') as 'string' | 'number';
  setSelectOptionValue(prop.constraints.options, optIndex, raw, vt);
}

// 选项排序功能
function moveOptionUp(index: number) {
  if (index > 0) {
    const arr = typeConfig.options;
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
  }
}
function moveOptionDown(index: number) {
  if (index < typeConfig.options.length - 1) {
    const arr = typeConfig.options;
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
  }
}

// 调整选项数值（用于数值类型下的 -/+ 按钮）
function changeOptionNumber(options: { label: string; value: string | number }[], index: number, delta: number) {
  const item = options[index];
  if (!item) return;
  const cur = Number(item.value);
  const num = Number.isNaN(cur) ? 0 : cur;
  item.value = num + delta;
}

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
      typeConfig.selectValueType = 'string';
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
  // 只要是第一个选项，或当前无默认值，自动设置为首项
  if (typeConfig.options.length === 1 || !typeConfig.defaultValue) {
    typeConfig.defaultValue = typeConfig.options[0].value;
  }
}

// 删除选项
function removeOption(index: number) {
  const removedOption = typeConfig.options[index];
  typeConfig.options.splice(index, 1);
  
  // 删除后自动同步默认值为首项
  if (typeConfig.options.length > 0) {
    typeConfig.defaultValue = typeConfig.options[0].value;
  } else {
    typeConfig.defaultValue = '';
  }
}

// 验证奖励数量
function validateRewardCount() {
  if (typeConfig.defaultValue && typeConfig.defaultValue.count <= 0) {
    typeConfig.defaultValue.count = 1;
  }
}

// 添加属性
function addProperty() {
  typeConfig.properties.push({ 
    key: '', 
    name: '', 
    type: 'string', 
    nestedDef: null,
    constraints: { defaultValue: '' },
  });
}

// 删除属性
function removeProperty(index: number) {
  typeConfig.properties.splice(index, 1);
}

// 元素类型改变
function handleElementTypeChange() {
  if (typeConfig.elementType === 'array' || typeConfig.elementType === 'object') {
    typeConfig.element = null; // 重置嵌套定义
  } else {
    // 重置元素约束为默认值
    resetElementConstraints();
  }
}

// 重置元素约束
function resetElementConstraints() {
  switch (typeConfig.elementType) {
    case 'string':
      typeConfig.elementConstraints = {
        defaultValue: '',
        maxLength: undefined,
      };
      break;
    case 'number':
      typeConfig.elementConstraints = {
        defaultValue: 0,
        min: undefined,
        max: undefined,
        step: undefined,
      };
      break;
    case 'boolean':
      typeConfig.elementConstraints = {
        defaultValue: false,
      };
      break;
    case 'select':
      typeConfig.elementConstraints = {
        defaultValue: '',
        selectValueType: 'string',
        options: [],
      };
      break;
    case 'reward':
      typeConfig.elementConstraints = {
        defaultValue: { id: '', count: 0 },
      };
      break;
    default:
      typeConfig.elementConstraints = {};
  }
}

// 添加元素选项（用于数组元素是下拉类型）
function addElementOption() {
  if (!typeConfig.elementConstraints.options) {
    typeConfig.elementConstraints.options = [];
  }
  typeConfig.elementConstraints.options.push({ label: '', value: '' });
  
  // 如果是第一个选项且没有默认值，自动设置为默认值
  if (typeConfig.elementConstraints.options.length === 1 && !typeConfig.elementConstraints.defaultValue) {
    watch(() => typeConfig.elementConstraints.options[0].value, (newValue) => {
      if (!typeConfig.elementConstraints.defaultValue && newValue) {
        typeConfig.elementConstraints.defaultValue = newValue;
      }
    });
  }
}

// 删除元素选项
function removeElementOption(index: number) {
  const removedOption = typeConfig.elementConstraints.options[index];
  typeConfig.elementConstraints.options.splice(index, 1);
  
  // 如果删除的是当前选中的默认值，切换到第一个选项
  if (typeConfig.elementConstraints.defaultValue === removedOption?.value 
      && typeConfig.elementConstraints.options.length > 0) {
    typeConfig.elementConstraints.defaultValue = typeConfig.elementConstraints.options[0].value;
  }
}

// 应用元素约束到字段定义
function applyElementConstraints(elementType: FieldType, constraints: any): any {
  const result: any = {};
  
  switch (elementType) {
    case 'string':
      if (constraints.defaultValue !== undefined && constraints.defaultValue !== '') {
        result.defaultValue = constraints.defaultValue;
      }
      if (constraints.maxLength !== undefined) {
        result.maxLength = constraints.maxLength;
      }
      break;
      
    case 'number':
      if (constraints.defaultValue !== undefined) {
        result.defaultValue = constraints.defaultValue;
      }
      if (constraints.min !== undefined) {
        result.min = constraints.min;
      }
      if (constraints.max !== undefined) {
        result.max = constraints.max;
      }
      if (constraints.step !== undefined) {
        result.step = constraints.step;
      }
      break;
      
    case 'boolean':
      if (constraints.defaultValue !== undefined) {
        result.defaultValue = constraints.defaultValue;
      }
      break;
      
    case 'select': {
      const vt = constraints.selectValueType || 'string';
      if (constraints.options && constraints.options.length > 0) {
        result.valueType = vt;
        result.options = constraints.options.map((o: any) => ({
          label: o.label,
          value: vt === 'number' ? (o.value === '' ? undefined : Number(o.value)) : String(o.value),
        })).filter((o: any) => o.value !== undefined && o.value !== '' && (vt !== 'number' || !Number.isNaN(o.value)));
      }
      if (constraints.defaultValue !== undefined && constraints.defaultValue !== '') {
        result.defaultValue = vt === 'number' ? Number(constraints.defaultValue) : String(constraints.defaultValue);
      }
      break;
    }
      
    case 'reward':
      if (constraints.defaultValue) {
        result.defaultValue = { ...constraints.defaultValue };
      }
      break;
  }
  
  return result;
}

// 属性类型改变
function handlePropertyTypeChange(index: number) {
  const prop = typeConfig.properties[index];
  if (prop.type !== 'array' && prop.type !== 'object') {
    prop.nestedDef = null;
    // 初始化约束配置
    resetPropertyConstraints(prop);
  } else {
    // 重置约束
    prop.constraints = {};
  }
}

// 重置属性约束
function resetPropertyConstraints(prop: any) {
  switch (prop.type) {
    case 'string':
      prop.constraints = {
        defaultValue: '',
        maxLength: undefined,
      };
      break;
    case 'number':
      prop.constraints = {
        defaultValue: 0,
        min: undefined,
        max: undefined,
        step: undefined,
      };
      break;
    case 'boolean':
      prop.constraints = {
        defaultValue: false,
      };
      break;
    case 'select':
      prop.constraints = {
        defaultValue: '',
        selectValueType: 'string',
        options: [],
      };
      break;
    case 'reward':
      prop.constraints = {
        defaultValue: { id: '', count: 1 },
      };
      break;
    default:
      prop.constraints = {};
  }
}

// 判断是否应该显示属性约束
// 添加属性选项（用于对象属性是下拉类型）
function addPropertyOption(propIndex: number) {
  const prop = typeConfig.properties[propIndex];
  if (!prop.constraints) {
    prop.constraints = {};
  }
  if (!prop.constraints.options) {
    prop.constraints.options = [];
  }
  prop.constraints.options.push({ label: '', value: '' });
  
  // 如果是第一个选项且没有默认值，自动设置为默认值
  if (prop.constraints.options.length === 1 && !prop.constraints.defaultValue) {
    watch(() => prop.constraints.options[0].value, (newValue) => {
      if (!prop.constraints.defaultValue && newValue) {
        prop.constraints.defaultValue = newValue;
      }
    });
  }
}

// 删除属性选项
function removePropertyOption(propIndex: number, optionIndex: number) {
  const prop = typeConfig.properties[propIndex];
  const removedOption = prop.constraints.options[optionIndex];
  prop.constraints.options.splice(optionIndex, 1);
  
  // 如果删除的是当前选中的默认值，切换到第一个选项
  if (prop.constraints.defaultValue === removedOption?.value 
      && prop.constraints.options.length > 0) {
    prop.constraints.defaultValue = prop.constraints.options[0].value;
  }
}

// 应用属性约束到字段定义
function applyPropertyConstraints(prop: any): any {
  if (!prop.constraints || Object.keys(prop.constraints).length === 0) {
    return {};
  }
  
  const result: any = {};
  
  switch (prop.type) {
    case 'string':
      if (prop.constraints.defaultValue !== undefined && prop.constraints.defaultValue !== '') {
        result.defaultValue = prop.constraints.defaultValue;
      }
      if (prop.constraints.maxLength !== undefined) {
        result.maxLength = prop.constraints.maxLength;
      }
      break;
      
    case 'number':
      if (prop.constraints.defaultValue !== undefined) {
        result.defaultValue = prop.constraints.defaultValue;
      }
      if (prop.constraints.min !== undefined) {
        result.min = prop.constraints.min;
      }
      if (prop.constraints.max !== undefined) {
        result.max = prop.constraints.max;
      }
      if (prop.constraints.step !== undefined) {
        result.step = prop.constraints.step;
      }
      break;
      
    case 'boolean':
      if (prop.constraints.defaultValue !== undefined) {
        result.defaultValue = prop.constraints.defaultValue;
      }
      break;
      
    case 'select': {
      const vt = prop.constraints.selectValueType || 'string';
      if (prop.constraints.options && prop.constraints.options.length > 0) {
        result.valueType = vt;
        result.options = prop.constraints.options.map((o: any) => ({
          label: o.label,
          value: vt === 'number' ? (o.value === '' ? undefined : Number(o.value)) : String(o.value),
        })).filter((o: any) => o.value !== undefined && o.value !== '' && (vt !== 'number' || !Number.isNaN(o.value)));
      }
      if (prop.constraints.defaultValue !== undefined && prop.constraints.defaultValue !== '') {
        result.defaultValue = vt === 'number' ? Number(prop.constraints.defaultValue) : String(prop.constraints.defaultValue);
      }
      break;
    }
      
    case 'reward':
      if (prop.constraints.defaultValue) {
        result.defaultValue = { ...prop.constraints.defaultValue };
      }
      break;
  }
  
  return result;
}

// 打开元素编辑器（数组的元素类型）
function openElementEditor() {
  nestedDialogTitle.value = '编辑数组元素结构';
  nestedEditingContext.value = { type: 'element' };
  
  if (typeConfig.element) {
    nestedEditingField.value = JSON.parse(JSON.stringify(typeConfig.element));
  } else {
    // 创建默认的嵌套字段，object/array 必须带完整结构，否则子 FieldEditor 会报错
    if (typeConfig.elementType === 'object') {
      nestedEditingField.value = {
        type: 'object',
        key: 'item',
        name: '元素',
        properties: [],
      } as IFieldDef;
    } else if (typeConfig.elementType === 'array') {
      nestedEditingField.value = {
        type: 'array',
        key: 'item',
        name: '元素',
        fixedLength: 0,
        element: { type: 'string', key: 'subitem', name: '子元素' } as IFieldDef,
      } as IFieldDef;
    } else {
      nestedEditingField.value = {
        type: typeConfig.elementType,
        key: 'item',
        name: '元素',
      } as IFieldDef;
    }
  }
  
  showNestedDialog.value = true;
}

// 打开属性编辑器（对象的属性）
function openPropertyEditor(index: number) {
  const prop = typeConfig.properties[index];
  if (!prop) return;
  nestedDialogTitle.value = `编辑属性 "${prop.name || prop.key}" 的结构`;
  nestedEditingContext.value = { type: 'property', index };
  
  if (prop.nestedDef) {
    nestedEditingField.value = JSON.parse(JSON.stringify(prop.nestedDef));
  } else {
    // 必须传入符合 IFieldDef 的完整结构，否则子 FieldEditor 在 onMounted 中会报错
    if (prop.type === 'object') {
      nestedEditingField.value = {
        type: 'object',
        key: prop.key || 'prop',
        name: prop.name || '属性',
        properties: [],
      } as IFieldDef;
    } else if (prop.type === 'array') {
      nestedEditingField.value = {
        type: 'array',
        key: prop.key || 'prop',
        name: prop.name || '属性',
        fixedLength: 0,
        element: { type: 'string', key: 'item', name: '元素' } as IFieldDef,
      } as IFieldDef;
    } else {
      nestedEditingField.value = {
        type: prop.type,
        key: prop.key || 'prop',
        name: prop.name || '属性',
      } as IFieldDef;
    }
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
      case 'select': {
        const selectField = props.field as any;
        typeConfig.selectValueType = selectField.valueType || 'string';
        typeConfig.defaultValue = selectField.defaultValue ?? '';
        typeConfig.options = (selectField.options || []).map((o: any) => ({ label: o.label, value: o.value }));
        break;
      }
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
        } else if (props.field.element) {
          // 加载基本类型元素的约束
          const elem = props.field.element as any;
          typeConfig.elementConstraints = {};
          
          switch (elem.type) {
            case 'string':
              typeConfig.elementConstraints.defaultValue = elem.defaultValue || '';
              typeConfig.elementConstraints.maxLength = elem.maxLength;
              break;
            case 'number':
              typeConfig.elementConstraints.defaultValue = elem.defaultValue ?? 0;
              typeConfig.elementConstraints.min = elem.min;
              typeConfig.elementConstraints.max = elem.max;
              typeConfig.elementConstraints.step = elem.step;
              break;
            case 'boolean':
              typeConfig.elementConstraints.defaultValue = elem.defaultValue || false;
              break;
            case 'select':
              typeConfig.elementConstraints.defaultValue = elem.defaultValue ?? '';
              typeConfig.elementConstraints.selectValueType = elem.valueType || 'string';
              typeConfig.elementConstraints.options = (elem.options || []).map((o: any) => ({ label: o.label, value: o.value }));
              break;
            case 'reward':
              typeConfig.elementConstraints.defaultValue = elem.defaultValue 
                ? { ...elem.defaultValue }
                : { id: '', count: 0 };
              break;
          }
        } else {
          resetElementConstraints();
        }
        break;
      case 'object': {
        const rawProps = (props.field as any).properties;
        typeConfig.properties = (Array.isArray(rawProps) ? rawProps : []).map((p: any) => {
          const prop: any = {
            key: p.key,
            name: p.name,
            type: p.type,
            nestedDef: null,
          };
          if (p.type === 'array' || p.type === 'object') {
            prop.nestedDef = JSON.parse(JSON.stringify(p));
          } else {
            // 基本类型：从字段定义恢复 constraints（含下拉的 valueType/options）
            if (p.type === 'select') {
              prop.constraints = {
                defaultValue: p.defaultValue ?? '',
                selectValueType: p.valueType || 'string',
                options: (p.options || []).map((o: any) => ({ label: o.label, value: o.value })),
              };
            } else if (p.type === 'number') {
              prop.constraints = { defaultValue: p.defaultValue ?? 0, min: p.min, max: p.max, step: p.step };
            } else if (p.type === 'string') {
              prop.constraints = { defaultValue: p.defaultValue ?? '', maxLength: p.maxLength };
            } else if (p.type === 'boolean') {
              prop.constraints = { defaultValue: p.defaultValue ?? false };
            } else if (p.type === 'reward') {
              prop.constraints = { defaultValue: p.defaultValue ? { ...p.defaultValue } : { id: '', count: 1 } };
            }
          }
          return prop;
        });
        break;
      }
    }
  }
});

// 保存
function handleSave() {
  if (!isValid.value) return;

  // 验证下拉类型必须有选项
  if (form.type === 'select' && typeConfig.options.length === 0) {
    alert('下拉类型字段至少需要一个选项');
    return;
  }

  // 验证数组元素类型为下拉时必须有选项
  if (form.type === 'array' && typeConfig.elementType === 'select') {
    if (!typeConfig.elementConstraints.options || typeConfig.elementConstraints.options.length === 0) {
      alert('数组元素类型为下拉时，至少需要一个选项');
      return;
    }
  }

  // 验证对象属性类型为下拉时必须有选项且显示文本与实际值互斥
  if (form.type === 'object') {
    for (const prop of typeConfig.properties) {
      if (prop.type === 'select') {
        if (!prop.constraints?.options || prop.constraints.options.length === 0) {
          alert(`对象属性 "${prop.name || prop.key}" 的类型为下拉时，至少需要一个选项`);
          return;
        }
        const err = validateSelectOptions(prop.constraints.options, prop.constraints.selectValueType || 'string');
        if (err) {
          alert(`对象属性 "${prop.name || prop.key}" 下拉选项：${err}`);
          return;
        }
      }
    }
  }
  // 验证数组元素类型为下拉时选项互斥
  if (form.type === 'array' && typeConfig.elementType === 'select') {
    const err = validateSelectOptions(typeConfig.elementConstraints.options || [], typeConfig.elementConstraints.selectValueType || 'string');
    if (err) {
      alert(`数组元素下拉选项：${err}`);
      return;
    }
  }

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
    case 'select': {
      if (selectOptionsError.value) {
        alert(selectOptionsError.value);
        return;
      }
      const valueType = typeConfig.selectValueType;
      const options = typeConfig.options.map((opt: {label: string; value: string|number}) => ({
        label: opt.label,
        value: valueType === 'number'
          ? (opt.value === '' ? undefined : Number(opt.value))
          : String(opt.value),
      })).filter((opt: {label: string; value: string|number|undefined}) => opt.value !== undefined && opt.value !== '' && (valueType !== 'number' || !Number.isNaN(opt.value as number)));
      field = {
        type: 'select',
        key: form.key,
        name: form.name,
        desc: form.desc || undefined,
        required: form.required || undefined,
        valueType,
        options,
        defaultValue: typeConfig.defaultValue !== '' && typeConfig.defaultValue !== undefined
          ? (valueType === 'number' ? Number(typeConfig.defaultValue) : String(typeConfig.defaultValue))
          : undefined,
      };
      break;
    }
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
        // 基本类型元素，应用约束
        element = {
          type: typeConfig.elementType,
          key: 'item',
          name: '元素',
          ...applyElementConstraints(typeConfig.elementType, typeConfig.elementConstraints)
        } as IFieldDef;
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
          // 基本类型属性，应用约束
          return { 
            type: p.type, 
            key: p.key, 
            name: p.name,
            ...applyPropertyConstraints(p)
          } as IFieldDef;
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
  max-width: 320px;
  min-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.form-select option {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  min-width: 0;
}

.config-title {
  font-size: 13px;
  font-weight: 600;
  color: #4fc3f7;
  margin-bottom: 12px;
}

.config-subtitle {
  font-size: 12px;
  font-weight: 600;
  color: #4caf50;
  margin: 12px 0 8px 0;
}

/* 元素约束配置 */
.element-constraints {
  margin-top: 16px;
  padding: 12px;
  background: rgba(76, 175, 80, 0.05);
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-radius: 6px;
}

.form-input-small {
  font-size: 12px;
  padding: 6px 10px;
}

.options-list-compact {
  margin-top: 8px;
}

.options-list-compact .option-item {
  margin-bottom: 6px;
}

/* 选项列表 */
.options-list {
  margin-top: 12px;
  min-width: 0;
}

.options-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
  color: #999;
}

.options-list-actions {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
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
  min-width: 0;
  overflow: visible;
}

.property-row {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.property-row .form-input {
  flex: 1;
  min-width: 0;
}

.property-row .form-select-small {
  width: 100px;
  flex: 0 0 100px;
}

.property-row .btn-icon {
  flex-shrink: 0;
}

.property-nested-preview {
  margin-top: 8px;
  padding: 6px 10px;
  background: rgba(79, 195, 247, 0.1);
  border-radius: 4px;
  font-size: 12px;
  color: #4fc3f7;
}

.property-nested-preview-clickable {
  cursor: pointer;
  transition: background 0.15s;
}

.property-nested-preview-clickable:hover {
  background: rgba(79, 195, 247, 0.2);
}

/* 属性约束配置 */
.property-constraints {
  margin-top: 10px;
  padding: 12px 14px;
  background: rgba(79, 195, 247, 0.06);
  border: 1px solid rgba(79, 195, 247, 0.25);
  border-radius: 6px;
  min-width: 0;
}

.constraint-caption {
  font-size: 11px;
  font-weight: 600;
  color: rgba(79, 195, 247, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(79, 195, 247, 0.15);
}

.constraint-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  min-width: 0;
}

.constraint-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  min-width: 0;
}

.constraint-row label {
  flex: 0 0 72px;
  font-size: 12px;
  color: #999;
  font-weight: 400;
}

.constraint-row .constraint-input {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  padding: 6px 10px;
  height: 32px;
}

.constraint-row .form-select.constraint-input {
  padding-right: 28px;
}

/* 约束区数字输入：隐藏 spinner，避免“不限”等文字与箭头挤在一起超框 */
.constraint-row input[type="number"].constraint-input::-webkit-inner-spin-button,
.constraint-row input[type="number"].constraint-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}
.constraint-row input[type="number"].constraint-input {
  -moz-appearance: textfield;
  appearance: textfield;
}

.constraint-row-wide {
  grid-column: 1 / -1;
}

.constraint-row-full {
  grid-column: 1 / -1;
}

.constraint-row-full .checkbox-label {
  flex: none;
}

.constraint-options-full {
  grid-column: 1 / -1;
  margin-top: 4px;
}

.constraint-options .constraint-options-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #999;
}

.constraint-option-item {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.constraint-option-item .form-input {
  flex: 1;
  min-width: 0;
}

.form-input-tiny {
  font-size: 11px;
  padding: 4px 8px;
  height: 26px;
}

.btn-tiny {
  padding: 2px 8px;
  font-size: 11px;
  border: none;
  border-radius: 4px;
  background: rgba(79, 195, 247, 0.25);
  color: #4fc3f7;
  cursor: pointer;
}

.btn-tiny:hover {
  background: rgba(79, 195, 247, 0.4);
}

.btn-icon-tiny {
  flex: 0 0 24px;
  width: 24px;
  height: 26px;
  border: none;
  background: transparent;
  color: #999;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
}

.btn-icon-tiny:hover {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
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

/* 上下移动按钮 */
.btn-move-up, .btn-move-down {
  margin: 0 2px;
  background: #222;
  color: #4fc3f7;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
}
.btn-move-up:disabled, .btn-move-down:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.options-empty {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 13px;
}

.options-error {
  margin-top: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 4px;
}

.options-required {
  color: #ff9800;
  font-weight: 500;
  background: rgba(255, 152, 0, 0.1);
  border: 1px dashed #ff9800;
  border-radius: 4px;
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
