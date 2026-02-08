/**
 * 独立运行模式 API 实现
 * 用于开发阶段在浏览器中运行
 */

import type { IEditorApi, Platform } from './index';

// 文件句柄缓存（File System Access API）
const fileHandleCache = new Map<string, FileSystemFileHandle>();

// 目录句柄缓存（用于批量导出）
let lastDirHandle: FileSystemDirectoryHandle | null = null;

/**
 * 选择目录并批量写入文件（浏览器 File System Access API）
 * @param files 文件名与内容的数组
 * @returns 成功写入的数量
 */
export async function selectDirAndWriteFiles(
    files: { name: string; data: ArrayBuffer }[],
): Promise<{ success: number; fail: number }> {
    if (!('showDirectoryPicker' in window)) {
        console.warn('[Standalone] 浏览器不支持 showDirectoryPicker');
        return { success: 0, fail: files.length };
    }
    try {
        const dirHandle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        lastDirHandle = dirHandle;
        let success = 0;
        let fail = 0;
        for (const f of files) {
            try {
                const fileHandle = await dirHandle.getFileHandle(f.name, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(f.data);
                await writable.close();
                success++;
            } catch (err) {
                console.error(`[Standalone] 写入文件 ${f.name} 失败:`, err);
                fail++;
            }
        }
        return { success, fail };
    } catch (err) {
        console.error('[Standalone] 选择目录失败:', err);
        return { success: 0, fail: files.length };
    }
}

/**
 * 递归创建目录结构并写入文件
 * @param dirHandle 根目录句柄
 * @param path 相对路径（支持 / 分隔符）
 * @param fileName 文件名
 * @param data 文件内容
 */
async function createNestedFileInDir(
    dirHandle: FileSystemDirectoryHandle,
    path: string,
    fileName: string,
    data: ArrayBuffer,
): Promise<void> {
    const parts = path.split('/').filter(p => p.trim());
    let currentDir = dirHandle;

    // 递归创建目录
    for (const part of parts) {
        currentDir = await currentDir.getDirectoryHandle(part, { create: true });
    }

    // 在最终目录创建文件
    const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
}

/**
 * 导出单个表到指定目录（内部函数）
 * 结构：dataSourceName/json/exportPath/tableKey.json 和 dataSourceName/ts/exportPath/ITableKey.ts
 * @param rootHandle 根目录句柄
 * @param dataSourceName 数据源名称
 * @param exportPath 表的导出路径
 * @param tableKey 表的 key
 * @param jsonData JSON 数据
 * @param tsData TypeScript 声明文件数据（可选）
 * @returns 导入路径（用于生成 index.ts）
 */
async function exportSingleTable(
    rootHandle: FileSystemDirectoryHandle,
    dataSourceName: string,
    exportPath: string,
    tableKey: string,
    jsonData: ArrayBuffer,
    tsData?: ArrayBuffer,
): Promise<string> {
    // 标准化路径：移除首尾斜杠，统一使用 /
    const normalizedPath = exportPath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

    // 导出 JSON：根目录/数据源名/json/导出路径/表名.json
    const jsonPath = `${dataSourceName}/json${normalizedPath ? '/' + normalizedPath : ''}`;
    const jsonFileName = `${tableKey}.json`;
    await createNestedFileInDir(rootHandle, jsonPath, jsonFileName, jsonData);
    console.log(`[Standalone] JSON 导出成功: ${jsonPath}/${jsonFileName}`);

    // 导出 TS（如果提供）
    const tsName = `I${tableKey.charAt(0).toUpperCase() + tableKey.slice(1)}`;
    if (tsData) {
        const tsPath = `${dataSourceName}/ts${normalizedPath ? '/' + normalizedPath : ''}`;
        await createNestedFileInDir(rootHandle, tsPath, `${tsName}.ts`, tsData);
        console.log(`[Standalone] TS 声明文件导出成功: ${tsPath}/${tsName}.ts`);
    }

    // 返回导入路径（用于生成 index.ts）
    return normalizedPath ? `./${normalizedPath}/${tsName}` : `./${tsName}`;
}

/**
 * 选择根目录，按结构化路径导出单个表
 * 导出结构：选择的目录/dataSourceName/json/exportPath/tableKey.json（+ ts/...）
 * @param dataSourceName 数据源名称（.table 文件名，不含扩展名）
 * @param exportPath 表的导出路径（如 'config/item'）
 * @param tableKey 表的 key
 * @param jsonData JSON 数据（ArrayBuffer）
 * @param tsData TypeScript 声明文件数据（ArrayBuffer），可选
 * @returns 是否成功
 */
export async function exportTableWithStructure(
    dataSourceName: string,
    exportPath: string,
    tableKey: string,
    jsonData: ArrayBuffer,
    tsData?: ArrayBuffer,
): Promise<boolean> {
    if (!('showDirectoryPicker' in window)) {
        console.warn('[Standalone] 浏览器不支持 showDirectoryPicker');
        return false;
    }

    try {
        const rootHandle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        await exportSingleTable(rootHandle, dataSourceName, exportPath, tableKey, jsonData, tsData);
        return true;
    } catch (err) {
        console.error('[Standalone] 结构化导出失败:', err);
        return false;
    }
}

/**
 * 批量导出所有表（含 index.ts）
 * 导出结构：选择的目录/dataSourceName/json|ts/exportPath/...
 * @param dataSourceName 数据源名称（.table 文件名，不含扩展名）
 * @param tables 表信息数组 { tableKey, exportPath, jsonData, tsData }
 * @param syncInterface 是否同步生成 interface
 * @returns 是否成功
 */
export async function exportAllTablesWithStructure(
    dataSourceName: string,
    tables: Array<{ tableKey: string; exportPath: string; jsonData: ArrayBuffer; tsData?: ArrayBuffer }>,
    syncInterface: boolean,
): Promise<boolean> {
    if (!('showDirectoryPicker' in window)) {
        console.warn('[Standalone] 浏览器不支持 showDirectoryPicker');
        return false;
    }

    try {
        const rootHandle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });

        const imports: string[] = [];

        for (const table of tables) {
            const importPath = await exportSingleTable(
                rootHandle,
                dataSourceName,
                table.exportPath,
                table.tableKey,
                table.jsonData,
                table.tsData,
            );
            imports.push(importPath);
        }

        if (syncInterface && imports.length > 0) {
            // 生成 index.ts：根目录/dataSourceName/ts/index.ts
            const indexContent = imports.map(path => `export * from '${path}';`).join('\n') + '\n';
            const indexBuffer = new TextEncoder().encode(indexContent).buffer;
            const dataSourceDir = await rootHandle.getDirectoryHandle(dataSourceName, { create: true });
            const tsDir = await dataSourceDir.getDirectoryHandle('ts', { create: true });
            const indexHandle = await tsDir.getFileHandle('index.ts', { create: true });
            const writable = await indexHandle.createWritable();
            await writable.write(indexBuffer);
            await writable.close();
            console.log('[Standalone] 批量导出完成，已生成 index.ts');
        }

        return true;
    } catch (err) {
        console.error('[Standalone] 批量结构化导出失败:', err);
        return false;
    }
}

export const standaloneApi: IEditorApi = {
    platform: 'standalone' as Platform,

    async getProjectPath() {
        // 浏览器环境无项目路径概念
        return null;
    },

    async readBinaryFile(path: string) {
        const handle = fileHandleCache.get(path);
        if (!handle) {
            console.warn('[Standalone] 文件未缓存，请先选择文件');
            return null;
        }

        try {
            const file = await handle.getFile();
            return await file.arrayBuffer();
        } catch (err) {
            console.error('[Standalone] 读取文件失败:', err);
            return null;
        }
    },

    async writeBinaryFile(path: string, data: ArrayBuffer) {
        try {
            // 优先使用缓存的文件句柄（避免重复弹出保存对话框）
            const cachedHandle = fileHandleCache.get(path);
            if (cachedHandle) {
                try {
                    const writable = await cachedHandle.createWritable();
                    await writable.write(data);
                    await writable.close();
                    console.log('[Standalone] 使用缓存句柄保存成功:', path);
                    return true;
                } catch (err) {
                    console.warn('[Standalone] 缓存句柄失效，尝试重新选择:', err);
                    fileHandleCache.delete(path);
                }
            }

            // 使用 File System Access API（首次保存或缓存失效时）
            if ('showSaveFilePicker' in window) {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: path.split(/[\\/]/).pop() || 'data.table',
                    types: [{
                        description: 'Table Data',
                        accept: { 'application/octet-stream': ['.table'] }
                    }]
                });

                const writable = await handle.createWritable();
                await writable.write(data);
                await writable.close();

                // 缓存文件句柄
                fileHandleCache.set(path, handle);
                return true;
            }

            // 回退：下载方式
            const blob = new Blob([data], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = path.split(/[\\/]/).pop() || 'data.table';
            a.click();
            URL.revokeObjectURL(url);
            return true;
        } catch (err) {
            console.error('[Standalone] 写入文件失败:', err);
            return false;
        }
    },

    async selectFile(options) {
        try {
            if ('showOpenFilePicker' in window) {
                const types = options?.extensions ? [{
                    description: options.title || 'Files',
                    accept: { 'application/octet-stream': options.extensions.map(e => `.${e}`) }
                }] : undefined;

                const [handle] = await (window as any).showOpenFilePicker({ types });
                const file = await handle.getFile();

                // 缓存文件句柄（使用完整路径作为 key）
                const filePath = file.name;
                fileHandleCache.set(filePath, handle);

                // 对于 JSON 文件，额外缓存文件对象用于读取
                if (filePath.endsWith('.json')) {
                    (fileHandleCache as any).set(`${filePath}:file`, file);
                }

                return filePath;
            }

            // 回退：传统文件选择
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                if (options?.extensions) {
                    input.accept = options.extensions.map(e => `.${e}`).join(',');
                }

                input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                        // 传统方式：直接缓存文件对象
                        const filePath = file.name;
                        (fileHandleCache as any).set(`${filePath}:file`, file);
                        resolve(filePath);
                    } else {
                        resolve(null);
                    }
                };

                input.click();
            });
        } catch (err) {
            console.error('[Standalone] 选择文件失败:', err);
            return null;
        }
    },

    async selectDirectory(options) {
        try {
            if ('showDirectoryPicker' in window) {
                const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
                lastDirHandle = handle;
                return handle.name;
            }

            console.warn('[Standalone] 浏览器不支持目录选择');
            return null;
        } catch (err) {
            console.error('[Standalone] 选择目录失败:', err);
            return null;
        }
    },

    async readFile(path: string) {
        // 先尝试从缓存获取 File 对象
        const cachedFile = (fileHandleCache as any).get(`${path}:file`);
        if (cachedFile) {
            try {
                return await cachedFile.text();
            } catch (err) {
                console.error('[Standalone] 读取缓存文件失败:', err);
            }
        }

        // 尝试从句柄读取
        const handle = fileHandleCache.get(path);
        if (!handle) {
            console.warn('[Standalone] 文件未缓存，请先选择文件');
            return null;
        }

        try {
            const file = await handle.getFile();
            return await file.text();
        } catch (err) {
            console.error('[Standalone] 读取文件失败:', err);
            return null;
        }
    },

    async selectSavePath(options) {
        // 浏览器环境直接返回默认名称
        return options?.defaultName || 'data.table';
    },

    async exists(path: string) {
        // 浏览器环境通过缓存判断
        return fileHandleCache.has(path);
    },

    async createDirectory(path: string) {
        // 浏览器环境不支持创建目录
        console.warn('[Standalone] 浏览器环境不支持创建目录');
        return false;
    },
};
