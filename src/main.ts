/**
 * 插件主入口文件
 * 这是一个兼容 v2.x 和 v3.x 的入口
 * 
 * 开发者只需关注 Vue 数据编辑器的开发（src/panels/vue-editor/）
 * 所有适配性工作由框架自动处理
 */

import * as fs from 'fs';
import { BasePlugin, createPluginMain, MessageMethod } from './index';

// 声明全局 Editor 对象
declare const Editor: any;

/**
 * 主插件类
 */
class ExtensionsToolsPlugin extends BasePlugin {
    private pluginName: string = 'table_tool';

    load(): void {
        this.log(`${this.pluginName} loaded successfully!`);
        this.log(`Running in ${this.isV2 ? 'Cocos 2.x' : 'Cocos 3.x'} mode`);
    }

    unload(): void {
        this.log(`${this.pluginName} unloaded.`);
    }

    // ==================== 业务方法 ====================

    /** 打开数据编辑器面板 */
    @MessageMethod
    openDataEditor(): void {
        // V2.x 使用插件名，V3.x 使用 插件名.面板名
        // const panelName = this.isV2 ? this.pluginName : `${this.pluginName}.default`;
        this.openPanel(this.pluginName);
    }

    // ==================== 文件操作 IPC 方法 ====================

    /** 获取项目路径 */
    @MessageMethod
    async getProjectPath(): Promise<string | null> {
        try {
            // v2 和 v3 都使用 Editor.Project.path
            const projectPath = this.editor.getProjectPath();
            if (projectPath) {
                this.log('项目路径:', projectPath);
                return projectPath;
            }

            this.warn('无法获取项目路径');
            return null;
        } catch (err) {
            this.error('获取项目路径失败', err);
            return null;
        }
    }

    /** 读取文本文件 */
    @MessageMethod
    async readFile(filePath: string): Promise<string | null> {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (err) {
            this.error(`读取文件失败: ${filePath}`, err);
            return null;
        }
    }

    /** 读取二进制文件 */
    @MessageMethod
    async readBinaryFile(filePath: string): Promise<number[] | null> {
        try {
            const buffer = fs.readFileSync(filePath);
            // 转换为普通数组，以便 IPC 序列化
            return Array.from(buffer);
        } catch (err) {
            this.error(`读取文件失败: ${filePath}`, err);
            return null;
        }
    }

    /** 写入二进制文件 */
    @MessageMethod
    async writeBinaryFile(filePath: string, data: number[] | ArrayBuffer): Promise<boolean> {
        try {
            // 支持普通数组和 ArrayBuffer
            const buffer = Array.isArray(data) ? Buffer.from(data) : Buffer.from(data);
            fs.writeFileSync(filePath, buffer);
            return true;
        } catch (err) {
            this.error(`写入文件失败: ${filePath}`, err);
            return false;
        }
    }

    /** 选择文件 */
    @MessageMethod
    async selectFile(options?: { title?: string; extensions?: string[] }): Promise<string | null> {
        try {
            const result = await (Editor as any).Dialog.select({
                title: options?.title || '选择文件',
                type: 'file',
                filters: options?.extensions ? options.extensions.map(ext => `*.${ext}`) : undefined,
            });

            if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
                return null;
            }

            return result.filePaths[0];
        } catch (err) {
            this.error('选择文件失败', err);
            return null;
        }
    }

    /** 选择目录 */
    @MessageMethod
    async selectDirectory(options?: { title?: string }): Promise<string | null> {
        try {
            const result = await (Editor as any).Dialog.select({
                title: options?.title || '选择目录',
                type: 'directory',
            });

            if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
                return null;
            }

            return result.filePaths[0];
        } catch (err) {
            this.error('选择目录失败', err);
            return null;
        }
    }

    /** 选择保存路径 */
    @MessageMethod
    async selectSavePath(options?: { title?: string; defaultName?: string; extensions?: string[] }): Promise<string | null> {
        try {
            const result = await (Editor as any).Dialog.save({
                title: options?.title || '保存文件',
                defaultPath: options?.defaultName || 'data.table',
                filters: options?.extensions ? options.extensions.map(ext => `*.${ext}`) : undefined,
            });

            if (result.canceled || !result.filePath) {
                return null;
            }

            return result.filePath;
        } catch (err) {
            this.error('选择保存路径失败', err);
            return null;
        }
    }

    /** 检查文件/目录是否存在 */
    @MessageMethod
    async exists(filePath: string): Promise<boolean> {
        try {
            return fs.existsSync(filePath);
        } catch {
            return false;
        }
    }

    /** 创建目录 */
    @MessageMethod
    async createDirectory(dirPath: string): Promise<boolean> {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            return true;
        } catch (err) {
            this.error(`创建目录失败: ${dirPath}`, err);
            return false;
        }
    }
}

// 创建插件实例并导出
const plugin = new ExtensionsToolsPlugin();
const exportedModule = createPluginMain(plugin);

module.exports = exportedModule;                  // CommonJS (v2.x)
export const load = exportedModule.load;          // ES Module (v3.x)
export const unload = exportedModule.unload;
export const methods = exportedModule.methods;
