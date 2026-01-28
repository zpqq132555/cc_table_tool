/**
 * 统一面板入口 - 跨版本兼容
 * 负责加载 Vue 编辑器并提供通信桥接
 */

import { VersionDetector, getEditor } from '../../core';

// 面板 ID
export const PANEL_NAME = 'table_tool.default';

/**
 * 创建面板 HTML 模板
 */
function createTemplate(): string {
    return `
        <style>
            :host, .panel-container {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                overflow: hidden;
            }
            .vue-editor-frame {
                flex: 1;
                width: 100%;
                height: 100%;
                border: none;
            }
            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                color: #888;
                font-size: 14px;
            }
        </style>
        <div class="panel-container">
            <div id="loading" class="loading">加载中...</div>
            <iframe id="vue-editor" class="vue-editor-frame" style="display: none;"></iframe>
        </div>
    `;
}

/**
 * 获取 Vue 编辑器路径
 */
function getVueEditorPath(): string {
    const editor = getEditor();
    const packagePath = editor.getPackagePath('table_tool');
    const version = VersionDetector.isV2() ? 'v2' : 'v3';
    const platform = VersionDetector.isV2() ? 'cocos-v2' : 'cocos-v3';
    // 通过 URL 参数传递平台信息
    return `file://${packagePath}/dist/${version}/vue-editor/index.html?platform=${platform}`;
}

/**
 * 面板就绪回调
 */
function onPanelReady(panel: any): void {
    const iframe = panel.$ ? panel.$['vue-editor'] : panel.shadowRoot?.querySelector('#vue-editor');
    const loading = panel.$ ? panel.$['loading'] : panel.shadowRoot?.querySelector('#loading');
    
    if (!iframe) {
        console.error('[Panel] Cannot find vue-editor iframe');
        return;
    }

    // 设置 iframe 源
    const editorPath = getVueEditorPath();
    iframe.src = editorPath;

    // iframe 加载完成后隐藏 loading
    iframe.onload = () => {
        if (loading) loading.style.display = 'none';
        iframe.style.display = 'block';
        
        // 向 iframe 注入环境信息（作为备用）
        try {
            const win = iframe.contentWindow;
            if (win) {
                // 传递 Editor 对象引用（用于 Cocos API）
                (win as any).__COCOS_EDITOR__ = (globalThis as any).Editor;
                (win as any).__PLATFORM__ = VersionDetector.isV2() ? 'cocos-v2' : 'cocos-v3';
                
                // 触发重新检测（如果 Vue 应用已经初始化）
                if (win.postMessage) {
                    win.postMessage({ type: 'platform-ready' }, '*');
                }
            }
        } catch (e) {
            console.warn('[Panel] Cannot inject environment to iframe:', e);
        }
    };

    iframe.onerror = () => {
        if (loading) loading.textContent = '加载失败，请检查 Vue 编辑器是否已构建';
    };
}

/**
 * 面板消息处理
 */
const panelMessages = {
    // 可以添加面板消息处理
};

// ==================== V2.x 面板导出格式 ====================
const v2Panel = {
    template: createTemplate(),
    style: '',
    $: {
        'vue-editor': '#vue-editor',
        'loading': '#loading',
    },
    ready() {
        onPanelReady(this);
    },
    messages: panelMessages,
};

// ==================== V3.x 面板导出格式 ====================
const v3Panel = {
    template: createTemplate(),
    $: {
        'vue-editor': '#vue-editor',
        'loading': '#loading',
    },
    ready() {
        onPanelReady(this);
    },
    methods: panelMessages,
    close() {
        // 清理
    },
};

// 根据版本导出不同格式
const panel = VersionDetector.isV2() ? v2Panel : v3Panel;

// CommonJS 导出 (v2.x)
module.exports = panel;

// ES Module 导出 (v3.x)
export default panel;
