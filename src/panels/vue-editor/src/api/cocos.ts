/**
 * Cocos Creator 插件 API 实现
 * 通过 IPC 调用主进程的适配器功能
 */

import type { IEditorApi, Platform } from './index';

// 声明全局对象
declare const Editor: any;
declare global {
    interface Window {
        __COCOS_EDITOR__?: any;
        __PLATFORM__?: string;
    }
}

/**
 * 获取 Editor 对象
 * 优先使用面板注入的 __COCOS_EDITOR__
 */
function getEditorObject(): any {
    console.log('[Cocos API] getEditorObject called');
    console.log('[Cocos API] typeof window:', typeof window);
    console.log('[Cocos API] window.__COCOS_EDITOR__:', (typeof window !== 'undefined') ? (window as any).__COCOS_EDITOR__ : 'window undefined');
    console.log('[Cocos API] typeof Editor:', typeof Editor);
    console.log('[Cocos API] window.parent:', typeof window !== 'undefined' ? window.parent : 'no window');
    
    // 1. 优先使用面板注入的 Editor（通过 window.__COCOS_EDITOR__）
    if (typeof window !== 'undefined' && (window as any).__COCOS_EDITOR__) {
        console.log('[Cocos API] Using window.__COCOS_EDITOR__');
        return (window as any).__COCOS_EDITOR__;
    }
    
    // 2. 其次尝试全局 Editor
    if (typeof Editor !== 'undefined') {
        console.log('[Cocos API] Using global Editor');
        return Editor;
    }
    
    // 3. 尝试从 parent window 获取（iframe 场景）
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        try {
            const parentEditor = (window.parent as any).Editor;
            if (parentEditor) {
                console.log('[Cocos API] Using parent.Editor');
                return parentEditor;
            }
        } catch (e) {
            console.warn('[Cocos API] Cannot access parent.Editor:', e);
        }
    }
    
    console.error('[Cocos API] Editor object not found anywhere');
    return undefined;
}

/**
 * 检测 Cocos 版本
 */
function getCocosVersion(): 'v2' | 'v3' | null {
    const EditorObj = getEditorObject();
    
    if (!EditorObj) {
        console.log('[Cocos API] Editor is undefined');
        return null;
    }
    
    console.log('[Cocos API] Editor object:', EditorObj);
    console.log('[Cocos API] Editor.Message:', EditorObj.Message);
    console.log('[Cocos API] Editor.Ipc:', EditorObj.Ipc);
    
    // v3 使用 Editor.Message，v2 使用 Editor.Ipc
    if (EditorObj.Message !== undefined) {
        console.log('[Cocos API] Detected Cocos v3');
        return 'v3';
    } else if (EditorObj.Ipc !== undefined) {
        console.log('[Cocos API] Detected Cocos v2');
        return 'v2';
    }
    
    console.warn('[Cocos API] Cannot detect Cocos version, Editor object does not have Message or Ipc');
    return null;
}

/**
 * 发送 IPC 消息到主进程
 * 自动适配 v2/v3 的不同 IPC 方式
 */
function sendToMain(method: string, ...args: any[]): Promise<any> {
    const version = getCocosVersion();
    const EditorObj = getEditorObject();
    
    console.log('[Cocos API] sendToMain:', method, 'version:', version);
    
    if (!EditorObj) {
        return Promise.reject(new Error('Editor object not found'));
    }
    
    if (version === 'v3') {
        // Cocos 3.x 使用 Editor.Message.request
        console.log('[Cocos API] Using v3 IPC: Editor.Message.request');
        return EditorObj.Message.request('table_tool', method, ...args);
    } else if (version === 'v2') {
        // Cocos 2.x 使用 Editor.Ipc.sendToMain
        console.log('[Cocos API] Using v2 IPC: Editor.Ipc.sendToMain');
        return new Promise((resolve, reject) => {
            EditorObj.Ipc.sendToMain('table_tool:' + method, ...args, (error: any, result: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }
    
    return Promise.reject(new Error('Not in Cocos environment, version: ' + version));
}

export const cocosApi: IEditorApi = {
    get platform(): Platform {
        const version = getCocosVersion();
        return (version === 'v3' ? 'cocos-v3' : 'cocos-v2') as Platform;
    },
    
    async getProjectPath() {
        return sendToMain('getProjectPath');
    },
    
    async readBinaryFile(path: string) {
        const result = await sendToMain('readBinaryFile', path);
        if (!result) return null;
        // IPC 传输时 ArrayBuffer 被序列化为普通数组，需要转回
        return new Uint8Array(result).buffer;
    },
    
    async writeBinaryFile(path: string, data: ArrayBuffer) {
        // 将 ArrayBuffer 转换为普通数组以便 IPC 传输
        const array = Array.from(new Uint8Array(data));
        return sendToMain('writeBinaryFile', path, array);
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

    async refreshAssets(path: string) {
        return sendToMain('refreshAssets', path);
    },

    async listJsonFiles(dirPath: string) {
        return sendToMain('listJsonFiles', dirPath);
    },
};
