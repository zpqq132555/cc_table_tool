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
        select: '下拉',
        reward: '奖励',
        array: '数组',
        object: '对象',
    };
    return typeNames[type] || type;
}
