/**
 * Cocos Creator 插件 API 实现
 * 通过 IPC 调用主进程的适配器功能
 */

import type { IEditorApi, Platform } from './index';

// 声明全局 Editor 对象
declare const Editor: any;

/**
 * 检测 Cocos 版本
 */
function getCocosVersion(): 'v2' | 'v3' | null {
    if (typeof Editor === 'undefined') return null;
    
    // v3 使用 Editor.Message，v2 使用 Editor.Ipc
    if ((Editor as any).Message) {
        return 'v3';
    } else if ((Editor as any).Ipc) {
        return 'v2';
    }
    
    return null;
}

/**
 * 发送 IPC 消息到主进程
 * 自动适配 v2/v3 的不同 IPC 方式
 */
function sendToMain(method: string, ...args: any[]): Promise<any> {
    const version = getCocosVersion();
    
    if (version === 'v3') {
        // Cocos 3.x 使用 Editor.Message.request
        return (Editor as any).Message.request('table_tool', method, ...args);
    } else if (version === 'v2') {
        // Cocos 2.x 使用 Editor.Ipc.sendToMain
        return new Promise((resolve, reject) => {
            (Editor as any).Ipc.sendToMain('table_tool:' + method, ...args, (error: any, result: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }
    
    return Promise.reject(new Error('Not in Cocos environment'));
}

export const cocosApi: IEditorApi = {
    platform: (getCocosVersion() === 'v3' ? 'cocos-v3' : 'cocos-v2') as Platform,
    
    async getProjectPath() {
        return sendToMain('getProjectPath');
    },
    
    async readBinaryFile(path: string) {
        return sendToMain('readBinaryFile', path);
    },
    
    async writeBinaryFile(path: string, data: ArrayBuffer) {
        return sendToMain('writeBinaryFile', path, data);
    },
    
    async selectFile(options) {
        return sendToMain('selectFile', options);
    },
    
    async selectDirectory(options) {
        return sendToMain('selectDirectory', options);
    },
    
    async selectSavePath(options) {
        return sendToMain('selectSavePath', options);
    },
    
    async readFile(path: string) {
        return sendToMain('readFile', path);
    },
    
    async exists(path: string) {
        return sendToMain('exists', path);
    },
    
    async createDirectory(path: string) {
        return sendToMain('createDirectory', path);
    },
};
