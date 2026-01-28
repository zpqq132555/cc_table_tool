/**
 * 跨版本通用插件系统 - 统一导出
 */

// 核心接口
export * from './core/interfaces';

// 版本检测
export {
    detectVersion,
    isV2,
    isV3, VersionDetector
} from './core/version-detector';

// 工厂模式
export {
    AdapterFactory,
    getAdapter, getAsset, getEditor, getIPC, getPanel, getScene
} from './core/factory';

// 基础插件类
export {
    BasePlugin, createPluginMain, MessageMethod
} from './core/base-plugin';


