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
 * 
 * 导入策略：
 * - 对象的每个 key 作为数据的 key
 * - 对象的每个 value 作为一条数据的 info
 */
function createTableFromObject(key: string, data: Record<string, any>, nextIndex: number): ITableDef {
    const entries = Object.entries(data);
    
    if (entries.length === 0) {
        throw new Error('对象为空，无法创建表');
    }

    // 从第一条数据分析字段
    const firstValue = entries[0][1];
    const fields = analyzeFields(firstValue);

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
 */
function analyzeFields(sampleData: any): IFieldDef[] {
    if (typeof sampleData !== 'object' || sampleData === null) {
        throw new Error('数据格式错误，期望对象类型');
    }

    const fields: IFieldDef[] = [];

    for (const [key, value] of Object.entries(sampleData)) {
        const fieldType = detectFieldType(value);
        
        fields.push({
            type: fieldType,
            key,
            name: key,
            defaultValue: getDefaultValue(fieldType, value),
        } as any);
    }

    return fields;
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
