/**
 * 独立运行模式 API 实现
 * 用于开发阶段在浏览器中运行
 */

import type { IEditorApi, Platform } from './index';

// 文件句柄缓存（File System Access API）
const fileHandleCache = new Map<string, FileSystemFileHandle>();

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
                const handle = await (window as any).showDirectoryPicker();
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
