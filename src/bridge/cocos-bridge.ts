/**
 * 桥接层 - 插件端处理器
 * 在 Cocos 插件主进程中处理来自 Vue 编辑器的请求
 */

import * as fs from 'fs';
import * as path from 'path';
import { getAsset, getEditor, VersionDetector } from '../core';
import { IBridgeApi, ISavePathOptions, ISelectFileOptions } from './types';

declare const Editor: any;

/**
 * 桥接 API 实现 - Cocos 插件端
 */
export class CocosBridge implements IBridgeApi {
    readonly platform: 'cocos-v2' | 'cocos-v3';
    
    constructor() {
        this.platform = VersionDetector.isV2() ? 'cocos-v2' : 'cocos-v3';
    }
    
    // ========== 文件操作 ==========
    
    async readFile(filePath: string): Promise<string | null> {
        try {
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf-8');
            }
            return null;
        } catch (err) {
            console.error('[Bridge] readFile error:', err);
            return null;
        }
    }
    
    async writeFile(filePath: string, content: string): Promise<boolean> {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, content, 'utf-8');
            return true;
        } catch (err) {
            console.error('[Bridge] writeFile error:', err);
            return false;
        }
    }
    
    async selectFile(options?: ISelectFileOptions): Promise<string | null> {
        try {
            const filters = options?.extensions?.length 
                ? [{ name: 'Files', extensions: options.extensions }]
                : [{ name: 'All Files', extensions: ['*'] }];
            
            if (VersionDetector.isV3()) {
                const result = await Editor.Dialog.select({
                    title: options?.title || '选择文件',
                    type: 'file',
                    multi: options?.multi || false,
                    filters,
                });
                return result?.filePaths?.[0] || null;
            } else {
                const result = Editor.Dialog.openFile({
                    title: options?.title || '选择文件',
                    filters,
                    properties: options?.multi ? ['openFile', 'multiSelections'] : ['openFile'],
                });
                return result?.[0] || null;
            }
        } catch (err) {
            console.error('[Bridge] selectFile error:', err);
            return null;
        }
    }
    
    async selectSavePath(options?: ISavePathOptions): Promise<string | null> {
        try {
            const filters = options?.extensions?.length
                ? [{ name: 'Files', extensions: options.extensions }]
                : [{ name: 'All Files', extensions: ['*'] }];
            
            if (VersionDetector.isV3()) {
                const result = await Editor.Dialog.save({
                    title: options?.title || '保存文件',
                    filters,
                    default: options?.defaultName,
                });
                return result?.filePath || null;
            } else {
                return Editor.Dialog.saveFile({
                    title: options?.title || '保存文件',
                    filters,
                    defaultPath: options?.defaultName,
                });
            }
        } catch (err) {
            console.error('[Bridge] selectSavePath error:', err);
            return null;
        }
    }
    
    async selectFolder(): Promise<string | null> {
        try {
            if (VersionDetector.isV3()) {
                const result = await Editor.Dialog.select({
                    title: '选择文件夹',
                    type: 'directory',
                });
                return result?.filePaths?.[0] || null;
            } else {
                const result = Editor.Dialog.openFile({
                    title: '选择文件夹',
                    properties: ['openDirectory'],
                });
                return result?.[0] || null;
            }
        } catch (err) {
            console.error('[Bridge] selectFolder error:', err);
            return null;
        }
    }
    
    // ========== 数据操作 ==========
    
    async importData<T = any>(): Promise<T[] | null> {
        const filePath = await this.selectFile({ extensions: ['json'] });
        if (!filePath) return null;
        
        const content = await this.readFile(filePath);
        if (!content) return null;
        
        try {
            const data = JSON.parse(content);
            if (Array.isArray(data)) return data;
            if (data.data && Array.isArray(data.data)) return data.data;
            this.showMessage('无效的数据格式', 'error');
            return null;
        } catch (err) {
            this.showMessage(`解析 JSON 失败: ${(err as Error).message}`, 'error');
            return null;
        }
    }
    
    async exportData<T = any>(data: T[]): Promise<boolean> {
        const filePath = await this.selectSavePath({
            defaultName: `table_data_${Date.now()}.json`,
            extensions: ['json'],
        });
        if (!filePath) return false;
        
        const content = JSON.stringify(data, null, 2);
        const success = await this.writeFile(filePath, content);
        if (success) {
            this.showMessage('导出成功！', 'info');
        }
        return success;
    }
    
    async loadProjectData(relativePath: string): Promise<any | null> {
        const projectPath = this.getProjectPath();
        if (!projectPath) return null;
        
        const fullPath = path.join(projectPath, relativePath);
        const content = await this.readFile(fullPath);
        if (!content) return null;
        
        try {
            return JSON.parse(content);
        } catch {
            return null;
        }
    }
    
    async saveProjectData(relativePath: string, data: any): Promise<boolean> {
        const projectPath = this.getProjectPath();
        if (!projectPath) return false;
        
        const fullPath = path.join(projectPath, relativePath);
        const content = JSON.stringify(data, null, 2);
        const success = await this.writeFile(fullPath, content);
        
        if (success) {
            // 刷新资源数据库
            await this.refreshAssets(relativePath);
        }
        
        return success;
    }
    
    // ========== UI 交互 ==========
    
    showMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
        const editor = getEditor();
        switch (type) {
            case 'warning':
                editor.warn(message);
                break;
            case 'error':
                editor.error(message);
                break;
            default:
                editor.log(message);
        }
    }
    
    async confirm(message: string): Promise<boolean> {
        try {
            if (VersionDetector.isV3()) {
                const result = await Editor.Dialog.info(message, {
                    title: '确认',
                    buttons: ['取消', '确定'],
                    default: 1,
                    cancel: 0,
                });
                return result.response === 1;
            } else {
                return Editor.Dialog.messageBox({
                    type: 'question',
                    title: '确认',
                    message,
                    buttons: ['取消', '确定'],
                    defaultId: 1,
                }) === 1;
            }
        } catch {
            return false;
        }
    }
    
    // ========== 项目信息 ==========
    
    getProjectPath(): string | null {
        return getEditor().getProjectPath() || null;
    }
    
    getPluginPath(): string | null {
        return getEditor().getPackagePath('table_tool') || null;
    }
    
    async refreshAssets(relativePath: string): Promise<void> {
        try {
            const asset = getAsset();
            const dbPath = relativePath.startsWith('db://') 
                ? relativePath 
                : `db://assets/${relativePath}`;
            await asset.refresh(dbPath);
        } catch (err) {
            console.warn('[Bridge] refreshAssets error:', err);
        }
    }
}

// 导出单例
export const cocosBridge = new CocosBridge();
