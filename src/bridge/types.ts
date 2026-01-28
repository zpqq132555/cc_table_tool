/**
 * 通信桥接层 - 连接 Vue 编辑器与 Cocos 插件核心
 * 
 * 这个模块提供统一的 API，让 Vue 编辑器能够在四种模式下工作：
 * 1. Cocos 2.x 插件面板
 * 2. Cocos 3.x 插件面板
 * 3. Electron 桌面应用
 * 4. 浏览器独立开发
 */

// ==================== 桥接 API 类型定义 ====================

export interface IBridgeApi {
    /** 平台标识 */
    platform: 'cocos-v2' | 'cocos-v3' | 'electron' | 'standalone';
    
    // ========== 文件操作 ==========
    /** 读取文件内容 */
    readFile(path: string): Promise<string | null>;
    
    /** 写入文件内容 */
    writeFile(path: string, content: string): Promise<boolean>;
    
    /** 选择文件 */
    selectFile(options?: ISelectFileOptions): Promise<string | null>;
    
    /** 选择保存路径 */
    selectSavePath(options?: ISavePathOptions): Promise<string | null>;
    
    /** 选择文件夹 */
    selectFolder(): Promise<string | null>;
    
    // ========== 数据操作 ==========
    /** 导入数据 */
    importData<T = any>(): Promise<T[] | null>;
    
    /** 导出数据 */
    exportData<T = any>(data: T[]): Promise<boolean>;
    
    /** 加载项目数据文件 */
    loadProjectData(relativePath: string): Promise<any | null>;
    
    /** 保存项目数据文件 */
    saveProjectData(relativePath: string, data: any): Promise<boolean>;
    
    // ========== UI 交互 ==========
    /** 显示消息 */
    showMessage(message: string, type?: 'info' | 'warning' | 'error'): void;
    
    /** 确认对话框 */
    confirm(message: string): Promise<boolean>;
    
    /** 显示进度 */
    showProgress?(title: string, progress: number): void;
    
    // ========== 项目信息 ==========
    /** 获取项目路径 */
    getProjectPath(): string | null;
    
    /** 获取插件路径 */
    getPluginPath(): string | null;
    
    /** 刷新资源数据库 */
    refreshAssets?(path: string): Promise<void>;
}

export interface ISelectFileOptions {
    /** 文件扩展名过滤 */
    extensions?: string[];
    /** 是否多选 */
    multi?: boolean;
    /** 对话框标题 */
    title?: string;
}

export interface ISavePathOptions {
    /** 默认文件名 */
    defaultName?: string;
    /** 文件扩展名过滤 */
    extensions?: string[];
    /** 对话框标题 */
    title?: string;
}

// ==================== 消息通道定义 ====================

export const BridgeChannels = {
    // 文件操作
    READ_FILE: 'bridge:read-file',
    WRITE_FILE: 'bridge:write-file',
    SELECT_FILE: 'bridge:select-file',
    SELECT_SAVE_PATH: 'bridge:select-save-path',
    SELECT_FOLDER: 'bridge:select-folder',
    
    // 数据操作
    IMPORT_DATA: 'bridge:import-data',
    EXPORT_DATA: 'bridge:export-data',
    LOAD_PROJECT_DATA: 'bridge:load-project-data',
    SAVE_PROJECT_DATA: 'bridge:save-project-data',
    
    // UI 交互
    SHOW_MESSAGE: 'bridge:show-message',
    CONFIRM: 'bridge:confirm',
    
    // 项目信息
    GET_PROJECT_PATH: 'bridge:get-project-path',
    GET_PLUGIN_PATH: 'bridge:get-plugin-path',
    REFRESH_ASSETS: 'bridge:refresh-assets',
} as const;

// ==================== 导出类型 ====================

export type BridgeChannel = typeof BridgeChannels[keyof typeof BridgeChannels];
