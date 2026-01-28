/**
 * 独立运行模式 API 实现
 * 用于开发阶段在浏览器中运行
 */

import type { IEditorApi, Platform } from './index';

export const standaloneApi: IEditorApi = {
    platform: 'standalone' as Platform,

    async importData(): Promise<any[] | null> {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) {
                    resolve(null);
                    return;
                }
                
                try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    
                    if (Array.isArray(data)) {
                        resolve(data);
                    } else if (data.data && Array.isArray(data.data)) {
                        resolve(data.data);
                    } else {
                        alert('无效的数据格式，请导入数组格式的 JSON 文件');
                        resolve(null);
                    }
                } catch (err) {
                    alert('解析文件失败: ' + (err as Error).message);
                    resolve(null);
                }
            };
            
            input.click();
        });
    },

    async exportData(data: any[]): Promise<boolean> {
        try {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `table_data_${Date.now()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            return true;
        } catch (err) {
            alert('导出失败: ' + (err as Error).message);
            return false;
        }
    },

    async readFile(path: string): Promise<string | null> {
        // 浏览器环境无法直接读取本地文件
        console.warn('[Standalone] readFile not supported, use importData instead');
        return null;
    },

    async writeFile(path: string, content: string): Promise<boolean> {
        // 浏览器环境无法直接写入本地文件
        console.warn('[Standalone] writeFile not supported, use exportData instead');
        return false;
    },

    async selectFile(options?: { extensions?: string[] }): Promise<string | null> {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            
            if (options?.extensions) {
                input.accept = options.extensions.map(ext => `.${ext}`).join(',');
            }
            
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                resolve(file ? file.name : null);
            };
            
            input.click();
        });
    },

    async selectSavePath(options?: { defaultName?: string; extensions?: string[] }): Promise<string | null> {
        // 浏览器环境无法选择保存路径，直接返回默认名称
        return options?.defaultName || `data_${Date.now()}.json`;
    },

    showMessage(message: string, type?: 'info' | 'warning' | 'error'): void {
        switch (type) {
            case 'error':
                console.error(`[Error] ${message}`);
                alert(`❌ ${message}`);
                break;
            case 'warning':
                console.warn(`[Warning] ${message}`);
                alert(`⚠️ ${message}`);
                break;
            default:
                console.log(`[Info] ${message}`);
                alert(`ℹ️ ${message}`);
        }
    },

    async confirm(message: string): Promise<boolean> {
        return window.confirm(message);
    },
    
    // ========== 扩展功能（浏览器受限） ==========
    
    async selectFolder(): Promise<string | null> {
        console.warn('[Standalone] selectFolder not fully supported in browser');
        // 使用目录选择（需要现代浏览器支持）
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            (input as any).webkitdirectory = true;
            
            input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files && files.length > 0) {
                    // 返回第一个文件的相对路径前缀
                    const path = files[0].webkitRelativePath;
                    resolve(path ? path.split('/')[0] : null);
                } else {
                    resolve(null);
                }
            };
            
            input.click();
        });
    },
    
    async loadProjectData(relativePath: string): Promise<any | null> {
        console.warn('[Standalone] loadProjectData not supported, use importData instead');
        // 浏览器模式可以使用 localStorage 模拟
        const key = `table_tool:${relativePath}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },
    
    async saveProjectData(relativePath: string, data: any): Promise<boolean> {
        console.warn('[Standalone] saveProjectData not supported, use exportData instead');
        // 浏览器模式可以使用 localStorage 模拟
        const key = `table_tool:${relativePath}`;
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    },
    
    getProjectPath(): string | null {
        // 浏览器环境无项目路径概念
        return null;
    },
    
    getPluginPath(): string | null {
        // 浏览器环境无插件路径概念
        return null;
    },
};
