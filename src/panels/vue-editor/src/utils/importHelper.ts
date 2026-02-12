/**
 * JSON 数据导入工具
 */

import type { FieldType, IFieldDef, ITableDef } from './types';

/**
 * 从 JSON 数据智能导入表
 * 
 * 导入策略：
 * 1. 如果是数组 → 创建单表，数组每个元素作为一条数据
 * 2. 如果是对象 → 创建单表，对象的每个 key 作为一条数据的 key
 */
export async function importTableFromJson(
    key: string,
    jsonData: any,
    nextIndex: number
): Promise<ITableDef> {
    if (Array.isArray(jsonData)) {
        // 数组形式：每个元素是一条数据
        return createTableFromArray(key, jsonData, nextIndex);
    } else if (typeof jsonData === 'object' && jsonData !== null) {
        // 对象形式：每个 key 是数据的 key
        return createTableFromObject(key, jsonData, nextIndex);
    } else {
        throw new Error('不支持的 JSON 格式，仅支持数组或对象');
    }
}

/**
 * 从数组创建表
 * 例如：[{id:1, name:"A"}, {id:2, name:"B"}]
 */
function createTableFromArray(key: string, data: any[], nextIndex: number): ITableDef {
    if (data.length === 0) {
        throw new Error('数组为空，无法创建表');
    }

    // 从第一条数据分析字段
    const fields = analyzeFields(data[0]);

    // 创建表定义
    const tableDef: ITableDef = {
        index: nextIndex,
        name: key,
        exportPath: '',
        desc: `从 JSON 数组导入`,
        separateExport: false,
        listDisplayField: fields[0]?.key || '',
        fields,
        data: {},
    };

    // 导入每条数据
    data.forEach((item, idx) => {
        const dataKey = item.id?.toString() || item.key?.toString() || `item_${idx}`;
        tableDef.data[dataKey] = {
            index: idx,
            info: item,
        };
    });

    return tableDef;
}

/**
 * 从对象创建表
 * 例如：{item1: {name:"A", value:100}, item2: {name:"B", value:200}}
 * 或者：{level_1: [{...}], level_2: [{...}]}
 * 
 * 导入策略：
 * - 对象的每个 key 作为数据的 key
 * - 对象的每个 value 作为一条数据的 info
 * - 如果 value 是数组，则从数组的第一个元素分析字段结构
 */
function createTableFromObject(key: string, data: Record<string, any>, nextIndex: number): ITableDef {
    const entries = Object.entries(data);
    
    if (entries.length === 0) {
        throw new Error('对象为空，无法创建表');
    }

    // 从第一条数据分析字段
    const firstValue = entries[0][1];
    
    // 如果值是数组，从数组第一个元素分析字段（避免包装 items）
    // 否则直接分析值本身
    let fields: IFieldDef[];
    if (Array.isArray(firstValue)) {
        if (firstValue.length === 0) {
            throw new Error('数组为空，无法创建表');
        }
        fields = analyzeFields(firstValue[0]);
    } else {
        fields = analyzeFields(firstValue);
    }

    // 创建表定义
    const tableDef: ITableDef = {
        index: nextIndex,
        name: key,
        exportPath: '',
        desc: `从 JSON 对象导入`,
        separateExport: false,
        listDisplayField: fields[0]?.key || '',
        fields,
        data: {},
    };

    // 导入每条数据
    entries.forEach(([dataKey, value], idx) => {
        tableDef.data[dataKey] = {
            index: idx,
            info: value,
        };
    });

    return tableDef;
}

/**
 * 分析数据字段类型
 * 支持递归解析 array 和 object 的子字段结构
 */
function analyzeFields(sampleData: any): IFieldDef[] {
    if (Array.isArray(sampleData)) {
        // 数据本身是数组时，生成一个 array 类型字段
        const elementFields = sampleData.length > 0
            ? analyzeArrayElement(sampleData[0])
            : { type: 'string' as FieldType, key: 'item', name: 'item' } as IFieldDef;

        return [{
            type: 'array',
            key: 'items',
            name: 'items',
            element: elementFields,
            defaultValue: [],
        } as IFieldDef];
    }

    if (typeof sampleData !== 'object' || sampleData === null) {
        throw new Error('数据格式错误，期望对象类型');
    }

    const fields: IFieldDef[] = [];

    for (const [key, value] of Object.entries(sampleData)) {
        fields.push(buildFieldDef(key, value));
    }

    return fields;
}

/**
 * 根据值构建字段定义（支持递归）
 */
function buildFieldDef(key: string, value: any): IFieldDef {
    const fieldType = detectFieldType(value);

    switch (fieldType) {
        case 'array': {
            const arr = value as any[];
            const element = arr.length > 0
                ? analyzeArrayElement(arr[0])
                : { type: 'string', key: 'item', name: 'item' } as IFieldDef;
            return {
                type: 'array',
                key,
                name: key,
                element,
                defaultValue: [],
            } as IFieldDef;
        }
        case 'object': {
            const properties = analyzeFields(value);
            return {
                type: 'object',
                key,
                name: key,
                properties,
                defaultValue: {},
            } as IFieldDef;
        }
        default:
            return {
                type: fieldType,
                key,
                name: key,
                defaultValue: getDefaultValue(fieldType, value),
            } as IFieldDef;
    }
}

/**
 * 分析数组元素类型，返回元素的字段定义
 */
function analyzeArrayElement(sample: any): IFieldDef {
    const elemType = detectFieldType(sample);

    switch (elemType) {
        case 'object': {
            // 数组元素是对象 → 对象字段，递归子属性
            const properties = analyzeFields(sample);
            return {
                type: 'object',
                key: 'item',
                name: 'item',
                properties,
                defaultValue: {},
            } as IFieldDef;
        }
        case 'array': {
            // 数组元素还是数组 → 嵌套数组
            const inner = (sample as any[]).length > 0
                ? analyzeArrayElement((sample as any[])[0])
                : { type: 'string', key: 'item', name: 'item' } as IFieldDef;
            return {
                type: 'array',
                key: 'item',
                name: 'item',
                element: inner,
                defaultValue: [],
            } as IFieldDef;
        }
        default:
            return {
                type: elemType,
                key: 'item',
                name: 'item',
                defaultValue: getDefaultValue(elemType, sample),
            } as IFieldDef;
    }
}

/**
 * 检测字段类型
 */
function detectFieldType(value: any): FieldType {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') return 'string';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    return 'string';
}

/**
 * 获取默认值
 */
function getDefaultValue(fieldType: FieldType, sampleValue: any): any {
    switch (fieldType) {
        case 'number':
            return 0;
        case 'boolean':
            return false;
        case 'string':
            return '';
        case 'array':
            return [];
        case 'object':
            return {};
        default:
            return '';
    }
}
