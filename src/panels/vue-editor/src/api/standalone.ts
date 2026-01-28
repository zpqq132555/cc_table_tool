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
            // 使用 File System Access API
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
                
                // 缓存文件句柄和路径
                fileHandleCache.set(file.name, handle);
                return file.name;
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
                        // 传统方式无法获取句柄，但可以缓存文件内容
                        resolve(file.name);
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
