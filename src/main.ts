/**
 * 插件主入口文件
 * 这是一个兼容 v2.x 和 v3.x 的入口
 * 
 * 开发者只需关注 Vue 数据编辑器的开发（src/panels/vue-editor/）
 * 所有适配性工作由框架自动处理
 */

import { BasePlugin, createPluginMain, MessageMethod } from './index';

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
}

// 创建插件实例并导出
const plugin = new ExtensionsToolsPlugin();
const exportedModule = createPluginMain(plugin);

module.exports = exportedModule;                  // CommonJS (v2.x)
export const load = exportedModule.load;          // ES Module (v3.x)
export const unload = exportedModule.unload;
export const methods = exportedModule.methods;
