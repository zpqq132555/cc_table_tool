/**
 * 数据序列化和加密工具
 */

import type { IDataSource } from './types';

// 魔数和密钥
const MAGIC_NUMBER = 0x5442_4C45; // "TBLE"
const ENCRYPT_KEY = 'table_tool_2024';

/**
 * 序列化并加密数据源
 */
export function serializeDataSource(dataSource: IDataSource): ArrayBuffer {
    // 更新时间戳
    dataSource.updatedAt = Date.now();

    // 转换为 JSON 字符串
    const jsonStr = JSON.stringify(dataSource);
    const jsonBytes = new TextEncoder().encode(jsonStr);

    // 简单 XOR 加密
    const keyBytes = new TextEncoder().encode(ENCRYPT_KEY);
    const encryptedBytes = new Uint8Array(jsonBytes.length);
    for (let i = 0; i < jsonBytes.length; i++) {
        encryptedBytes[i] = jsonBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // 组装二进制数据：[魔数(4字节) + 版本(4字节) + 长度(4字节) + 加密数据]
    const header = new ArrayBuffer(12);
    const headerView = new DataView(header);
    headerView.setUint32(0, MAGIC_NUMBER, true);
    headerView.setUint32(4, dataSource.version, true);
    headerView.setUint32(8, encryptedBytes.length, true);

    // 合并 header 和加密数据
    const result = new Uint8Array(header.byteLength + encryptedBytes.length);
    result.set(new Uint8Array(header), 0);
    result.set(encryptedBytes, header.byteLength);

    return result.buffer;
}

/**
 * 反序列化并解密数据源
 */
export function deserializeDataSource(buffer: ArrayBuffer): IDataSource {
    // 检查最小长度
    if (buffer.byteLength < 12) {
        throw new Error('数据格式错误：文件过小');
    }

    // 解析 header
    const headerView = new DataView(buffer, 0, 12);
    const magic = headerView.getUint32(0, true);
    const version = headerView.getUint32(4, true);
    const dataLength = headerView.getUint32(8, true);

    // 验证魔数
    if (magic !== MAGIC_NUMBER) {
        throw new Error('数据格式错误：无效的文件标识');
    }

    // 验证数据长度
    if (buffer.byteLength !== 12 + dataLength) {
        throw new Error('数据格式错误：文件长度不匹配');
    }

    // 提取加密数据
    const encryptedBytes = new Uint8Array(buffer, 12, dataLength);

    // XOR 解密
    const keyBytes = new TextEncoder().encode(ENCRYPT_KEY);
    const decryptedBytes = new Uint8Array(dataLength);
    for (let i = 0; i < dataLength; i++) {
        decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // 解析 JSON
    const jsonStr = new TextDecoder().decode(decryptedBytes);
    const dataSource = JSON.parse(jsonStr) as IDataSource;

    return dataSource;
}

/**
 * 创建默认数据源
 */
export function createDefaultDataSource(name: string = 'default'): IDataSource {
    const now = Date.now();
    return {
        createdAt: now,
        updatedAt: now,
        version: 1,
        data: {},
    };
}
