/**
 * 数据源管理模块
 * 负责 .table 文件的加密存储和读取
 */

// 表数据项定义
export interface ITableDataItem {
    /** 数据索引 */
    index: number;
    /** 数据信息 */
    info: any;
}

// 表定义
export interface ITableDef {
    /** 表索引 */
    index: number;
    /** 表名称 */
    name: string;
    /** 导出路径 */
    exportPath: string;
    /** 描述 */
    desc: string;
    /** 表数据 */
    data: Record<string, ITableDataItem>;
}

// 数据源结构（object 格式）
export interface ITableDataSource {
    /** 创建时间 */
    createdAt: number;
    /** 更新时间 */
    updatedAt: number;
    /** 版本号 */
    version: number;
    /** 表数据集合 */
    data: Record<string, ITableDef>;
}

// 文件魔数（用于验证文件格式）
const MAGIC_NUMBER = 0x5442_4C45; // "TBLE" in hex
const FILE_VERSION = 1;

// 简单的加密密钥（实际项目中应使用更安全的方式）
const ENCRYPT_KEY = 'table_tool_2024';

/**
 * 简单的异或加密/解密
 */
function xorCrypt(data: Uint8Array, key: string): Uint8Array {
    const keyBytes = new TextEncoder().encode(key);
    const result = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
        result[i] = data[i] ^ keyBytes[i % keyBytes.length];
    }
    return result;
}

/**
 * 创建默认数据源
 */
export function createDefaultDataSource(): ITableDataSource {
    return {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: FILE_VERSION,
        data: {},
    };
}

/**
 * 序列化数据源为加密的二进制格式
 */
export function serializeDataSource(dataSource: ITableDataSource): Uint8Array {
    // 更新时间戳
    dataSource.updatedAt = Date.now();
    
    // 转换为 JSON 字符串
    const jsonStr = JSON.stringify(dataSource);
    const jsonBytes = new TextEncoder().encode(jsonStr);
    
    // 加密数据
    const encryptedBytes = xorCrypt(jsonBytes, ENCRYPT_KEY);
    
    // 构建文件头：魔数(4) + 版本(4) + 数据长度(4) + 加密数据
    const header = new ArrayBuffer(12);
    const headerView = new DataView(header);
    headerView.setUint32(0, MAGIC_NUMBER, false); // 大端序
    headerView.setUint32(4, FILE_VERSION, false);
    headerView.setUint32(8, encryptedBytes.length, false);
    
    // 合并头部和数据
    const result = new Uint8Array(12 + encryptedBytes.length);
    result.set(new Uint8Array(header), 0);
    result.set(encryptedBytes, 12);
    
    return result;
}

/**
 * 反序列化加密的二进制数据
 */
export function deserializeDataSource(buffer: ArrayBuffer): ITableDataSource {
    const view = new DataView(buffer);
    
    // 验证魔数
    const magic = view.getUint32(0, false);
    if (magic !== MAGIC_NUMBER) {
        throw new Error('无效的 .table 文件格式');
    }
    
    // 读取版本
    const version = view.getUint32(4, false);
    if (version > FILE_VERSION) {
        throw new Error(`不支持的文件版本: ${version}`);
    }
    
    // 读取数据长度
    const dataLength = view.getUint32(8, false);
    
    // 提取加密数据
    const encryptedBytes = new Uint8Array(buffer, 12, dataLength);
    
    // 解密数据
    const decryptedBytes = xorCrypt(encryptedBytes, ENCRYPT_KEY);
    
    // 解析 JSON
    const jsonStr = new TextDecoder().decode(decryptedBytes);
    const dataSource = JSON.parse(jsonStr) as ITableDataSource;
    
    return dataSource;
}

/**
 * 将 Uint8Array 转换为 Base64 字符串（用于存储）
 */
export function arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
}

/**
 * 将 Base64 字符串转换为 ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
