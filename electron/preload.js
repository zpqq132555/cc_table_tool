/**
 * Electron 预加载脚本
 * 在渲染进程中暴露安全的 API
 */
const { contextBridge, ipcRenderer } = require('electron');

// 暴露 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 平台标识
    platform: 'electron',
    
    // 选择文件
    selectFile: (options) => ipcRenderer.invoke('select-file', options),
    
    // 选择保存路径
    selectSavePath: (options) => ipcRenderer.invoke('select-save-path', options),
    
    // 选择文件夹
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    
    // 读取文件（文本）
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    
    // 写入文件（文本）
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
    
    // 读取二进制文件
    readBinaryFile: (filePath) => ipcRenderer.invoke('read-binary-file', filePath),
    
    // 写入二进制文件
    writeBinaryFile: (filePath, data) => ipcRenderer.invoke('write-binary-file', filePath, data),
    
    // 显示消息
    showMessage: (message, type) => ipcRenderer.invoke('show-message', message, type),
    
    // 确认对话框
    confirm: (message) => ipcRenderer.invoke('confirm', message),
    
    // 获取工作目录
    getWorkingDirectory: () => ipcRenderer.invoke('get-working-directory'),
    
    // 设置工作目录
    setWorkingDirectory: (dir) => ipcRenderer.invoke('set-working-directory', dir),
});

// 标记为 Electron 环境
window.addEventListener('DOMContentLoaded', () => {
    console.log('[Preload] Electron environment ready');
});
