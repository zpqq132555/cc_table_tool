/**
 * TypeScript Interface 生成器
 * 根据表的字段定义自动生成 TypeScript interface 声明文件
 */

import type {
    IArrayField,
    IFieldDef,
    IObjectField,
    ISelectField,
    ITableDef,
} from './types';

/**
 * 将表 key 转为 PascalCase interface 名称
 * 例如: "levelConf" → "ILevelConf", "item_data" → "IItemData"
 */
function toInterfaceName(tableKey: string): string {
    const pascal = tableKey
        .replace(/[_-](\w)/g, (_, c) => c.toUpperCase())
        .replace(/^\w/, (c) => c.toUpperCase());
    return `I${pascal}`;
}

/**
 * 获取字段对应的 TypeScript 类型字符串
 */
function getFieldTsType(field: IFieldDef, indent: number = 0): string {
    switch (field.type) {
        case 'string':
            return 'string';
        case 'number':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'select': {
            const sf = field as ISelectField;
            const vt = sf.valueType || 'string';
            return vt === 'number' ? 'number' : 'string';
        }
        case 'reward':
            return '{ id: string; count: number }';
        case 'array': {
            const af = field as IArrayField;
            const elemType = getFieldTsType(af.element, indent);
            return `Array<${elemType}>`;
        }
        case 'object': {
            const of_ = field as IObjectField;
            return generateInlineObject(of_.properties, indent);
        }
        default:
            return 'any';
    }
}

/**
 * 生成内联对象类型
 */
function generateInlineObject(properties: IFieldDef[], indent: number): string {
    if (!properties || properties.length === 0) {
        return 'Record<string, any>';
    }

    const pad = '    '.repeat(indent + 1);
    const closePad = '    '.repeat(indent);
    const lines: string[] = ['{'];

    for (const prop of properties) {
        const tsType = getFieldTsType(prop, indent + 1);
        // const optional = prop.required ? '' : '?';
        const comment = prop.name ? ` /** ${prop.name} */` : '';
        lines.push(`${pad}${comment}`);
        lines.push(`${pad}${prop.key}: ${tsType};`);
    }

    lines.push(`${closePad}}`);
    return lines.join('\n');
}

/**
 * 为单个表生成 interface 声明
 */
function generateTableInterface(tableKey: string, tableDef: ITableDef): string {
    const interfaceName = toInterfaceName(tableKey);
    const fields = tableDef.fields || [];

    if (fields.length === 0) {
        return `/** ${tableDef.name || tableKey} */\nexport interface ${interfaceName} {\n    [key: string]: any;\n}\n`;
    }

    // 检查实际数据是否为数组类型
    const firstData = Object.values(tableDef.data)[0];
    const isArrayData = firstData && Array.isArray(firstData.info);

    const lines: string[] = [];
    const comment = `${tableDef.name || tableKey}${tableDef.desc ? ' - ' + tableDef.desc : ''}`;

    if (isArrayData) {
        // 数据是数组类型，生成数组元素的 interface 和 type 别名
        lines.push(`/** ${comment} - 数组元素 */`);
        lines.push(`export interface ${interfaceName}Item {`);

        for (const field of fields) {
            const tsType = getFieldTsType(field, 1);
            const commentParts: string[] = [];
            if (field.name) commentParts.push(field.name);
            if (field.desc) commentParts.push(field.desc);
            if (commentParts.length > 0) {
                lines.push(`    /** ${commentParts.join(' - ')} */`);
            }
            lines.push(`    ${field.key}: ${tsType};`);
        }

        lines.push('}');
        lines.push('');
        lines.push(`/** ${comment} */`);
        lines.push(`export type ${interfaceName} = Array<${interfaceName}Item>;`);
    } else {
        // 数据是对象类型，生成普通 interface
        lines.push(`/** ${comment} */`);
        lines.push(`export interface ${interfaceName} {`);

        for (const field of fields) {
            const tsType = getFieldTsType(field, 1);
            const commentParts: string[] = [];
            if (field.name) commentParts.push(field.name);
            if (field.desc) commentParts.push(field.desc);
            if (commentParts.length > 0) {
                lines.push(`    /** ${commentParts.join(' - ')} */`);
            }
            lines.push(`    ${field.key}: ${tsType};`);
        }

        lines.push('}');
    }

    return lines.join('\n');
}

/**
 * 为单个表生成完整的 .ts 声明文件内容
 */
export function generateTableInterfaceFile(tableKey: string, tableDef: ITableDef): string {
    const lines: string[] = [];

    const name = tableDef.name ? tableDef.name : "I" + tableKey.charAt(0).toUpperCase() + tableKey.slice(1);
    lines.push('/**');
    lines.push(` * ${name} - 数据接口声明`);
    lines.push(' * ');
    lines.push(' * ⚠️ 此文件由 Table Tool 自动生成，请勿手动修改');
    lines.push(` * 生成时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(' */');
    lines.push('');
    lines.push(generateTableInterface(tableKey, tableDef));
    lines.push('');

    // 生成数据集合类型
    const interfaceName = toInterfaceName(tableKey);
    lines.push(`/** ${name} 数据集合 */`);
    lines.push(`export type ${interfaceName}Map = Record<string, ${interfaceName}>;`);
    lines.push('');

    return lines.join('\n');
}

/**
 * 为所有表生成统一的索引文件内容
 */
export function generateIndexFile(tables: { key: string; tableDef: ITableDef }[]): string {
    const lines: string[] = [];

    lines.push('/**');
    lines.push(' * Table Tool - 数据接口索引');
    lines.push(' * ');
    lines.push(' * ⚠️ 此文件由 Table Tool 自动生成，请勿手动修改');
    lines.push(` * 生成时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(' */');
    lines.push('');

    for (const { key } of tables) {
        const interfaceName = toInterfaceName(key);
        lines.push(`export type { ${interfaceName}, ${interfaceName}Map } from './${key}';`);
    }

    lines.push('');
    return lines.join('\n');
}

/**
 * 为所有表生成带 exportPath 相对路径的索引文件内容
 * index.ts 位于 tsDir/ 根目录，interface 文件位于 tsDir/exportPath/ITableKey.ts
 */
export function generateIndexFileWithPaths(
    tables: { key: string; exportPath: string; tableDef: ITableDef }[]
): string {
    const lines: string[] = [];

    lines.push('/**');
    lines.push(' * Table Tool - 数据接口索引');
    lines.push(' * ');
    lines.push(' * ⚠️ 此文件由 Table Tool 自动生成，请勿手动修改');
    lines.push(` * 生成时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(' */');
    lines.push('');

    for (const { key, exportPath } of tables) {
        const interfaceName = toInterfaceName(key);
        const fileName = getInterfaceFileName(key).replace(/\.ts$/, '');
        // 构建相对路径：./exportPath/ITableKey 或 ./ITableKey
        const importPath = exportPath
            ? `./${exportPath.replace(/\\/g, '/')}/${fileName}`
            : `./${fileName}`;
        lines.push(`export type { ${interfaceName}, ${interfaceName}Map } from '${importPath}';`);
    }

    lines.push('');
    return lines.join('\n');
}

/**
 * 获取表 interface 的文件名
 */
export function getInterfaceFileName(tableKey: string): string {
    return `I${tableKey.charAt(0).toUpperCase() + tableKey.slice(1)}.ts`;
}

/**
 * 去除生成内容中的时间戳行，用于内容比较
 * 时间戳行格式: " * 生成时间: xxxx"
 */
export function stripTimestamp(content: string): string {
    return content.replace(/^ \* 生成时间:.*$/gm, '').trim();
}
