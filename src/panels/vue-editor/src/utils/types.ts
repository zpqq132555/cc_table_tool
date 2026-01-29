/**
 * 数据类型定义
 */

// ==================== 字段类型定义 ====================

/** 基础字段类型 */
export type FieldType = 'string' | 'number' | 'boolean' | 'select' | 'reward' | 'array' | 'object';

/** 字段基础定义 */
interface IFieldBase {
    /** 字段键名 */
    key: string;
    /** 显示名称 */
    name: string;
    /** 字段描述 */
    desc?: string;
    /** 是否必填 */
    required?: boolean;
}

/** 文本字段 */
export interface IStringField extends IFieldBase {
    type: 'string';
    /** 默认值 */
    defaultValue?: string;
    /** 最大长度 */
    maxLength?: number;
    /** 是否多行 */
    multiline?: boolean;
}

/** 数字字段 */
export interface INumberField extends IFieldBase {
    type: 'number';
    /** 默认值 */
    defaultValue?: number;
    /** 最小值 */
    min?: number;
    /** 最大值 */
    max?: number;
    /** 步长 */
    step?: number;
}

/** 布尔字段 */
export interface IBooleanField extends IFieldBase {
    type: 'boolean';
    /** 默认值 */
    defaultValue?: boolean;
}

/** 下拉选项 */
export interface ISelectOption {
    /** 显示文本 */
    label: string;
    /** 实际值 */
    value: string | number;
}

/** 下拉字段 */
export interface ISelectField extends IFieldBase {
    type: 'select';
    /** 选项列表 */
    options: ISelectOption[];
    /** 默认值 */
    defaultValue?: string | number;
}

/** 奖励字段 (固定结构: {id: string, count: number}) */
export interface IRewardField extends IFieldBase {
    type: 'reward';
    /** 默认值 */
    defaultValue?: { id: string; count: number };
}

/** 数组字段 */
export interface IArrayField extends IFieldBase {
    type: 'array';
    /** 元素类型定义 */
    element: IFieldDef;
    /** 固定长度 (0 表示不定长) */
    fixedLength?: number;
    /** 默认值 */
    defaultValue?: any[];
}

/** 对象字段 */
export interface IObjectField extends IFieldBase {
    type: 'object';
    /** 子字段定义 */
    properties: IFieldDef[];
    /** 默认值 */
    defaultValue?: Record<string, any>;
}

/** 字段定义联合类型 */
export type IFieldDef = 
    | IStringField
    | INumberField
    | IBooleanField
    | ISelectField
    | IRewardField
    | IArrayField
    | IObjectField;

// ==================== 表数据结构 ====================

/** 表定义 */
export interface ITableDef {
    /** 排序索引 */
    index: number;
    /** 表名称 */
    name: string;
    /** 导出路径 */
    exportPath: string;
    /** 表描述 */
    desc: string;
    /** 是否分离导出 */
    separateExport: boolean;
    /** 列表显示字段 */
    listDisplayField: string;
    /** 字段定义列表 */
    fields: IFieldDef[];
    /** 数据集合 */
    data: Record<string, ITableDataItem>;
}

/** 表数据项 */
export interface ITableDataItem {
    /** 排序索引 */
    index: number;
    /** 实际数据 */
    info: Record<string, any>;
}

/** 创建表参数 */
export interface ICreateTableParams {
    /** 表名称 */
    name: string;
    /** 导出路径 */
    exportPath?: string;
    /** 表描述 */
    desc?: string;
    /** 是否分离导出 */
    separateExport?: boolean;
    /** 列表显示字段 */
    listDisplayField?: string;
    /** 字段定义列表 */
    fields?: IFieldDef[];
}

// ==================== 数据源结构 ====================

/** 数据源结构 */
export interface IDataSource {
    /** 创建时间 */
    createdAt: number;
    /** 更新时间 */
    updatedAt: number;
    /** 版本号 */
    version: number;
    /** 表集合 (key -> 表定义) */
    data: Record<string, ITableDef>;
}
