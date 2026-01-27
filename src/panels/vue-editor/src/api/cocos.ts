/**
 * Cocos 编辑器模式 API 实现
 * 用于在 Cocos Creator 2.x/3.x 插件中运行
 */

import type { IEditorApi, Platform } from './index';

// Cocos Editor 类型声明
declare const Editor: any;

/**
 * 检测是否为 Cocos 3.x
 */
function isV3(): boolean {
    return typeof Editor !== 'undefined' && Editor.App && Editor.App.version;
}

export const cocosApi: IEditorApi = {
    platform: 'cocos-v3' as Platform,

    async importData(): Promise<any[] | null> {
        try {
            let filePath: string | null = null;
            
            if (isV3()) {
                // Cocos 3.x
                const result = await Editor.Dialog.select({
                    title: '选择数据文件',
                    type: 'file',
                    multi: false,
                    filters: [
                        { name: 'JSON Files', extensions: ['json'] },
                        { name: 'All Files', extensions: ['*'] },
                    ],
                });
                filePath = result?.filePaths?.[0] || null;
            } else {
                // Cocos 2.x
                const result = Editor.Dialog.openFile({
                    title: '选择数据文件',
                    filters: [
                        { name: 'JSON Files', extensions: ['json'] },
                    ],
                    properties: ['openFile'],
                });
                filePath = result?.[0] || null;
            }
            
            if (!filePath) {
                return null;
            }
            
            // 读取文件内容
            const fs = require('fs');
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            
            if (Array.isArray(data)) {
                return data;
            } else if (data.data && Array.isArray(data.data)) {
                return data.data;
            }
            
            this.showMessage('无效的数据格式', 'error');
            return null;
        } catch (err) {
            this.showMessage(`导入失败: ${(err as Error).message}`, 'error');
            return null;
        }
    },

    async exportData(data: any[]): Promise<boolean> {
        try {
            let filePath: string | null = null;
            
            if (isV3()) {
                // Cocos 3.x
                const result = await Editor.Dialog.save({
                    title: '保存数据文件',
                    filters: [
                        { name: 'JSON Files', extensions: ['json'] },
                    ],
                    default: `table_data_${Date.now()}.json`,
                });
                filePath = result?.filePath || null;
            } else {
                // Cocos 2.x
                filePath = Editor.Dialog.saveFile({
                    title: '保存数据文件',
                    filters: [
                        { name: 'JSON Files', extensions: ['json'] },
                    ],
                    defaultPath: `table_data_${Date.now()}.json`,
                });
            }
            
            if (!filePath) {
                return false;
            }
            
            // 写入文件
            const fs = require('fs');
            const json = JSON.stringify(data, null, 2);
            fs.writeFileSync(filePath, json, 'utf-8');
            
            this.showMessage('导出成功！', 'info');
            return true;
        } catch (err) {
            this.showMessage(`导出失败: ${(err as Error).message}`, 'error');
            return false;
        }
    },

    async readFile(path: string): Promise<string | null> {
        try {
            const fs = require('fs');
            return fs.readFileSync(path, 'utf-8');
        } catch (err) {
            console.error('[Cocos API] readFile error:', err);
            return null;
        }
    },

    async writeFile(path: string, content: string): Promise<boolean> {
        try {
            const fs = require('fs');
            fs.writeFileSync(path, content, 'utf-8');
            return true;
        } catch (err) {
            console.error('[Cocos API] writeFile error:', err);
            return false;
        }
    },

    async selectFile(options?: { extensions?: string[] }): Promise<string | null> {
        try {
            if (isV3()) {
                const result = await Editor.Dialog.select({
                    type: 'file',
                    multi: false,
                    filters: options?.extensions 
                        ? [{ name: 'Files', extensions: options.extensions }]
                        : undefined,
                });
                return result?.filePaths?.[0] || null;
            } else {
                const result = Editor.Dialog.openFile({
                    filters: options?.extensions 
                        ? [{ name: 'Files', extensions: options.extensions }]
                        : undefined,
                    properties: ['openFile'],
                });
                return result?.[0] || null;
            }
        } catch (err) {
            console.error('[Cocos API] selectFile error:', err);
            return null;
        }
    },

    async selectSavePath(options?: { defaultName?: string; extensions?: string[] }): Promise<string | null> {
        try {
            if (isV3()) {
                const result = await Editor.Dialog.save({
                    filters: options?.extensions 
                        ? [{ name: 'Files', extensions: options.extensions }]
                        : undefined,
                    default: options?.defaultName,
                });
                return result?.filePath || null;
            } else {
                return Editor.Dialog.saveFile({
                    filters: options?.extensions 
                        ? [{ name: 'Files', extensions: options.extensions }]
                        : undefined,
                    defaultPath: options?.defaultName,
                });
            }
        } catch (err) {
            console.error('[Cocos API] selectSavePath error:', err);
            return null;
        }
    },

    showMessage(message: string, type?: 'info' | 'warning' | 'error'): void {
        if (isV3()) {
            switch (type) {
                case 'error':
                    Editor.Dialog.error('错误', { detail: message });
                    break;
                case 'warning':
                    Editor.Dialog.warn('警告', { detail: message });
                    break;
                default:
                    Editor.Dialog.info('提示', { detail: message });
            }
        } else {
            // Cocos 2.x
            switch (type) {
                case 'error':
                    Editor.error(message);
                    break;
                case 'warning':
                    Editor.warn(message);
                    break;
                default:
                    Editor.log(message);
            }
        }
    },

    async confirm(message: string): Promise<boolean> {
        if (isV3()) {
            const result = await Editor.Dialog.info('确认', {
                detail: message,
                buttons: ['确定', '取消'],
            });
            return result.response === 0;
        } else {
            return Editor.Dialog.messageBox({
                type: 'question',
                buttons: ['确定', '取消'],
                message: message,
            }) === 0;
        }
    },
};
