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
 * 优先使用 URL 参数或 __PLATFORM__ 注入，其次通过 Editor 对象检测
 */
function getCocosVersion(): 'v2' | 'v3' | null {
    // 1. 从 URL 参数检测
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const platform = urlParams.get('platform');
        if (platform === 'cocos-v2') return 'v2';
        if (platform === 'cocos-v3') return 'v3';
    }
    
    // 2. 从注入的 __PLATFORM__ 检测
    if (typeof window !== 'undefined' && (window as any).__PLATFORM__) {
        const plat = (window as any).__PLATFORM__;
        if (plat === 'cocos-v2') return 'v2';
        if (plat === 'cocos-v3') return 'v3';
    }
    
    // 3. 通过 Editor 对象检测
    const EditorObj = getEditorObject();
    if (!EditorObj) {
        return null;
    }
    
    if (EditorObj.Message !== undefined) {
        return 'v3';
    } else if (EditorObj.Ipc !== undefined) {
        return 'v2';
    }
    
    return null;
}

// ==================== v2 postMessage 桥接 ====================

/** 请求计数器 */
let requestCounter = 0;

/** 等待响应的回调表 */
const pendingRequests: Map<string, { resolve: Function; reject: Function; timer: any }> = new Map();

/** 初始化 postMessage 监听（v2 专用） */
let v2BridgeInited = false;
function initV2Bridge(): void {
    if (v2BridgeInited) return;
    v2BridgeInited = true;
    
    window.addEventListener('message', (event: MessageEvent) => {
        const data = event.data;
        if (!data || data.type !== 'ipc-response') return;
        
        const { requestId, error, result } = data;
        const pending = pendingRequests.get(requestId);
        if (!pending) return;
        
        clearTimeout(pending.timer);
        pendingRequests.delete(requestId);
        
        if (error) {
            pending.reject(new Error(error));
        } else {
            pending.resolve(result);
        }
    });
    console.log('[Cocos API] v2 postMessage bridge initialized');
}

/** 通过 postMessage 桥接发送 IPC 请求（v2 专用） */
function sendViaPostMessage(method: string, ...args: any[]): Promise<any> {
    initV2Bridge();
    
    const requestId = `req_${++requestCounter}_${Date.now()}`;
    console.log('[Cocos API] v2 bridge request:', method, 'id:', requestId);
    
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            pendingRequests.delete(requestId);
            console.error('[Cocos API] v2 bridge timeout:', method);
            reject(new Error(`IPC timeout: ${method}`));
        }, 10000);
        
        pendingRequests.set(requestId, { resolve, reject, timer });
        
        // 发送到父窗口（面板宿主）
        window.parent.postMessage({
            type: 'ipc-request',
            requestId,
            method,
            args,
        }, '*');
    });
}

// ==================== IPC 发送 ====================

/**
 * 发送 IPC 消息到主进程
 * v3: 直接使用 Editor.Message.request
 * v2: 通过 postMessage 桥接（iframe 无法直接调用 Editor.Ipc）
 */
function sendToMain(method: string, ...args: any[]): Promise<any> {
    const version = getCocosVersion();
    
    console.log('[Cocos API] sendToMain:', method, 'version:', version);
    
    if (version === 'v3') {
        const EditorObj = getEditorObject();
        if (!EditorObj) {
            return Promise.reject(new Error('Editor object not found'));
        }
        return EditorObj.Message.request('table_tool', method, ...args);
    } else if (version === 'v2') {
        // v2: 通过 postMessage 桥接到面板宿主
        return sendViaPostMessage(method, ...args);
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
        if (!path || path.trim() === '') {
            console.warn('[Cocos API] refreshAssets: path 为空，跳过刷新');
            return;
        }
        return sendToMain('refreshAssets', path);
    },

    async listJsonFiles(dirPath: string) {
        return sendToMain('listJsonFiles', dirPath);
    },
};
