/**
 * Electron 桌面版 API 实现
 */

import type { IEditorApi, Platform } from './index';

// Electron API 接口
interface ElectronAPI {
    platform: string;
    selectFile: (options?: any) => Promise<string | null>;
    selectSavePath: (options?: any) => Promise<string | null>;
    readFile: (filePath: string) => Promise<string | null>;
    writeFile: (filePath: string, content: string) => Promise<boolean>;
    showMessage: (message: string, type?: string) => Promise<void>;
    confirm: (message: string) => Promise<boolean>;
}

// 获取 Electron API
function getElectronAPI(): ElectronAPI | null {
    return (window as any).electronAPI || null;
}

export const electronApi: IEditorApi = {
    platform: 'electron' as Platform,

    async importData(): Promise<any[] | null> {
        const api = getElectronAPI();
        if (!api) {
            console.error('[Electron API] Not in Electron environment');
            return null;
        }
        
        try {
            const filePath = await api.selectFile({
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                ],
            });
            
            if (!filePath) {
                return null;
            }
            
            const content = await api.readFile(filePath);
            if (!content) {
                return null;
            }
            
            const data = JSON.parse(content);
            
            if (Array.isArray(data)) {
                return data;
            } else if (data.data && Array.isArray(data.data)) {
                return data.data;
            }
            
            await api.showMessage('无效的数据格式', 'error');
            return null;
        } catch (err) {
            await api.showMessage(`导入失败: ${(err as Error).message}`, 'error');
            return null;
        }
    },

    async exportData(data: any[]): Promise<boolean> {
        const api = getElectronAPI();
        if (!api) {
            console.error('[Electron API] Not in Electron environment');
            return false;
        }
        
        try {
            const filePath = await api.selectSavePath({
                defaultName: `table_data_${Date.now()}.json`,
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                ],
            });
            
            if (!filePath) {
                return false;
            }
            
            const json = JSON.stringify(data, null, 2);
            const success = await api.writeFile(filePath, json);
            
            if (success) {
                await api.showMessage('导出成功！', 'info');
            }
            
            return success;
        } catch (err) {
            await api.showMessage(`导出失败: ${(err as Error).message}`, 'error');
            return false;
        }
    },

    async readFile(path: string): Promise<string | null> {
        const api = getElectronAPI();
        if (!api) return null;
        return api.readFile(path);
    },

    async writeFile(path: string, content: string): Promise<boolean> {
        const api = getElectronAPI();
        if (!api) return false;
        return api.writeFile(path, content);
    },

    async selectFile(options?: { extensions?: string[] }): Promise<string | null> {
        const api = getElectronAPI();
        if (!api) return null;
        
        return api.selectFile({
            filters: options?.extensions 
                ? [{ name: 'Files', extensions: options.extensions }]
                : undefined,
        });
    },

    async selectSavePath(options?: { defaultName?: string; extensions?: string[] }): Promise<string | null> {
        const api = getElectronAPI();
        if (!api) return null;
        
        return api.selectSavePath({
            defaultName: options?.defaultName,
            filters: options?.extensions 
                ? [{ name: 'Files', extensions: options.extensions }]
                : undefined,
        });
    },

    showMessage(message: string, type?: 'info' | 'warning' | 'error'): void {
        const api = getElectronAPI();
        if (api) {
            api.showMessage(message, type);
        } else {
            alert(message);
        }
    },

    async confirm(message: string): Promise<boolean> {
        const api = getElectronAPI();
        if (api) {
            return api.confirm(message);
        }
        return window.confirm(message);
    },
};
