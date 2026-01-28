/**
 * API 统一接口层
 * 根据运行环境自动选择对应的实现
 * 
 * 支持四种运行模式：
 * 1. Cocos 2.x 插件面板
 * 2. Cocos 3.x 插件面板
 * 3. Electron 桌面应用
 * 4. 浏览器独立开发（Standalone）
 */

import { cocosApi } from './cocos';
import { standaloneApi } from './standalone';

// 平台类型
export type Platform = 'standalone' | 'cocos-v2' | 'cocos-v3' | 'electron';

// API 接口定义
export interface IEditorApi {
    /** 平台标识 */
    platform: Platform;
    
    /** 获取项目路径（仅 Cocos） */
    getProjectPath?(): Promise<string | null>;
    
    /** 读取二进制文件 */
    readBinaryFile(path: string): Promise<ArrayBuffer | null>;
    
    /** 写入二进制文件 */
    writeBinaryFile(path: string, data: ArrayBuffer): Promise<boolean>;
    
    /** 选择文件 */
    selectFile(options?: { title?: string; extensions?: string[] }): Promise<string | null>;
    
    /** 选择保存路径 */
    selectSavePath(options?: { title?: string; defaultName?: string; extensions?: string[] }): Promise<string | null>;
    
    /** 检查文件/目录是否存在 */
    exists(path: string): Promise<boolean>;
    
    /** 创建目录 */
    createDirectory(path: string): Promise<boolean>;
}

// 当前平台
let currentPlatform: Platform = 'standalone';

// 当前 API 实例
let currentApi: IEditorApi = standaloneApi;

/**
 * 检测当前运行平台
 */
export function detectPlatform(): Platform {
    // 方式1: 从 URL 参数读取（最优先，避免时序问题）
    const urlParams = new URLSearchParams(window.location.search);
    const platformParam = urlParams.get('platform');
    if (platformParam && ['cocos-v2', 'cocos-v3', 'electron', 'standalone'].includes(platformParam)) {
        return platformParam as Platform;
    }
    
    // 方式2: 检测通过 iframe 注入的平台标识
    if (typeof (window as any).__PLATFORM__ !== 'undefined') {
        const platform = (window as any).__PLATFORM__;
        if (['cocos-v2', 'cocos-v3', 'electron', 'standalone'].includes(platform)) {
            return platform as Platform;
        }
    }
    
    // 方式3: 检测是否在 Cocos 编辑器环境（直接访问或 iframe 内）
    const Editor = (window as any).Editor || (window as any).__COCOS_EDITOR__;
    if (Editor) {
        // 检测版本
        if (Editor.App && Editor.App.version) {
            const version = Editor.App.version;
            if (version.startsWith('3.')) {
                return 'cocos-v3';
            }
        }
        
        if (Editor.versions && Editor.versions.creator) {
            const version = Editor.versions.creator;
            if (version.startsWith('2.')) {
                return 'cocos-v2';
            }
        }
        
        return 'cocos-v3'; // 默认 v3
    }
    
    // 方式4: 检测是否在 Electron 环境（通过 preload 暴露的 API）
    if (typeof (window as any).electronAPI !== 'undefined') {
        return 'electron';
    }
    
    // 方式5: 备用检测 Electron require
    if (typeof (window as any).require !== 'undefined') {
        try {
            const electron = (window as any).require('electron');
            if (electron) {
                return 'electron';
            }
        } catch (e) {
            // 非 Electron 环境
        }
    }
    
    return 'standalone';
}

/**
 * 初始化平台适配
 */
export function initPlatform(): void {
    currentPlatform = detectPlatform();
    
    switch (currentPlatform) {
        case 'cocos-v2':
        case 'cocos-v3':
            currentApi = cocosApi;
            break;
        // case 'electron':
        //     currentApi = electronApi;
        //     break;
        default:
            currentApi = standaloneApi;
    }
    
    console.log(`[Table Tool] Platform: ${currentPlatform}`);
}

/**
 * 获取当前平台
 */
export function getPlatform(): Platform {
    return currentPlatform;
}

/**
 * 获取平台名称
 */
export function getPlatformName(): string {
    switch (currentPlatform) {
        case 'cocos-v2':
            return 'Cocos 2.x';
        case 'cocos-v3':
            return 'Cocos 3.x';
        case 'electron':
            return 'Desktop';
        default:
            return 'Standalone';
    }
}

/**
 * 获取当前 API 实例
 */
export const api: IEditorApi = new Proxy({} as IEditorApi, {
    get(target, prop) {
        return (currentApi as any)[prop];
    },
});

export { currentApi, currentPlatform };

