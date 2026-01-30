/**
 * 字段创建工具函数
 */

import type {
    IArrayField,
    IBooleanField,
    IFieldDef,
    INumberField,
    IObjectField,
    IRewardField,
    ISelectField,
    ISelectOption,
    IStringField,
} from './types';

/**
 * 创建字符串字段
 */
export function createStringField(
    key: string,
    name: string,
    options?: Partial<Omit<IStringField, 'type' | 'key' | 'name'>>
): IStringField {
    return { type: 'string', key, name, defaultValue: '', ...options };
}

/**
 * 创建数字字段
 */
export function createNumberField(
    key: string,
    name: string,
    options?: Partial<Omit<INumberField, 'type' | 'key' | 'name'>>
): INumberField {
    return { type: 'number', key, name, defaultValue: 0, ...options };
}

/**
 * 创建布尔字段
 */
export function createBooleanField(
    key: string,
    name: string,
    options?: Partial<Omit<IBooleanField, 'type' | 'key' | 'name'>>
): IBooleanField {
    return { type: 'boolean', key, name, defaultValue: false, ...options };
}

/**
 * 创建下拉选择字段
 */
export function createSelectField(
    key: string,
    name: string,
    options: ISelectOption[],
    fieldOptions?: Partial<Omit<ISelectField, 'type' | 'key' | 'name' | 'options'>>
): ISelectField {
    return { type: 'select', key, name, options, ...fieldOptions };
}

/**
 * 创建奖励字段
 */
export function createRewardField(
    key: string,
    name: string,
    options?: Partial<Omit<IRewardField, 'type' | 'key' | 'name'>>
): IRewardField {
    return { type: 'reward', key, name, defaultValue: { id: '', count: 0 }, ...options };
}

/**
 * 创建数组字段
 */
export function createArrayField(
    key: string,
    name: string,
    element: IFieldDef,
    options?: Partial<Omit<IArrayField, 'type' | 'key' | 'name' | 'element'>>
): IArrayField {
    return { type: 'array', key, name, element, defaultValue: [], ...options };
}

/**
 * 创建对象字段
 */
export function createObjectField(
    key: string,
    name: string,
    properties: IFieldDef[],
    options?: Partial<Omit<IObjectField, 'type' | 'key' | 'name' | 'properties'>>
): IObjectField {
    return { type: 'object', key, name, properties, defaultValue: {}, ...options };
}

/**
 * 获取字段类型的显示名称
 */
export function getFieldTypeName(type: string): string {
    const typeNames: Record<string, string> = {
        string: '文本',
        number: '数字',
        boolean: '布尔',
        select: '下拉列表',
        reward: '奖励',
        array: '数组',
        object: '对象',
    };
    return typeNames[type] || type;
}

/**
 * 获取字段的默认值
 * 
 * 默认值规则：
 * - string: 空字符串（如果字段有 defaultValue 则使用该值）
 * - number: 字段指定的 defaultValue，如果没有则为 0
 * - boolean: 字段指定的 defaultValue，如果没有则为 false
 * - select: 字段指定的 defaultValue，如果没有则为空字符串
 * - reward: 字段指定的 defaultValue，如果没有则为 { id: '', count: 0 }
 * - array: 
 *   - 如果是定长数组（fixedLength > 0），则根据元素类型初始化指定长度的数组
 *   - 如果是不定长数组，则为空数组 []
 * - object: 根据 properties 定义初始化对象
 * 
 * @param field 字段定义
 * @returns 字段的默认值
 */
export function getDefaultValue(field: IFieldDef): any {
    switch (field.type) {
        case 'string': {
            const stringField = field as IStringField;
            return stringField.defaultValue !== undefined ? stringField.defaultValue : '';
        }
        
        case 'number': {
            const numberField = field as INumberField;
            return numberField.defaultValue !== undefined ? numberField.defaultValue : 0;
        }
        
        case 'boolean': {
            const booleanField = field as IBooleanField;
            return booleanField.defaultValue !== undefined ? booleanField.defaultValue : false;
        }
        
        case 'select': {
            const selectField = field as ISelectField;
            if (selectField.defaultValue !== undefined) {
                return selectField.defaultValue;
            }
            // 如果没有设置默认值，使用第一个选项的值
            if (selectField.options && selectField.options.length > 0) {
                return selectField.options[0].value;
            }
            return '';
        }
        
        case 'reward': {
            const rewardField = field as IRewardField;
            if (rewardField.defaultValue !== undefined) {
                // 深拷贝默认值
                return { ...rewardField.defaultValue };
            }
            return { id: '', count: 0 };
        }
        
        case 'array': {
            const arrayField = field as IArrayField;
            const fixedLength = arrayField.fixedLength || 0;
            
            // 如果是定长数组，根据元素类型初始化
            if (fixedLength > 0) {
                return Array.from({ length: fixedLength }, () => {
                    return getDefaultValue(arrayField.element);
                });
            }
            
            // 不定长数组返回空数组
            return [];
        }
        
        case 'object': {
            const objectField = field as IObjectField;
            const obj: Record<string, any> = {};
            
            // 根据 properties 初始化对象
            if (objectField.properties && objectField.properties.length > 0) {
                objectField.properties.forEach(prop => {
                    obj[prop.key] = getDefaultValue(prop);
                });
            }
            
            return obj;
        }
        
        default:
            return null;
    }
}
