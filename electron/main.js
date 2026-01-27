/**
 * Electron 主进程
 */
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 保持对窗口对象的全局引用
let mainWindow = null;

// 是否为开发模式
const isDev = process.argv.includes('--dev');

/**
 * 创建主窗口
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'Table Tool - 数据编辑器',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        // 隐藏菜单栏
        autoHideMenuBar: true,
    });

    // 加载页面
    if (isDev) {
        // 开发模式：加载 Vite 开发服务器
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // 生产模式：加载打包后的文件
        const indexPath = path.join(__dirname, '../dist/vue-editor/index.html');
        if (fs.existsSync(indexPath)) {
            mainWindow.loadFile(indexPath);
        } else {
            // 从 resources 加载
            const resourcePath = path.join(process.resourcesPath, 'app/index.html');
            mainWindow.loadFile(resourcePath);
        }
    }

    // 窗口关闭时清理引用
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 应用准备就绪
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ==================== IPC 通信处理 ====================

// 选择文件
ipcMain.handle('select-file', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: '选择文件',
        filters: options?.filters || [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
    });
    
    return result.canceled ? null : result.filePaths[0];
});

// 选择保存路径
ipcMain.handle('select-save-path', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: '保存文件',
        defaultPath: options?.defaultName || 'data.json',
        filters: options?.filters || [
            { name: 'JSON Files', extensions: ['json'] },
        ],
    });
    
    return result.canceled ? null : result.filePath;
});

// 读取文件
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        console.error('Read file error:', err);
        return null;
    }
});

// 写入文件
ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return true;
    } catch (err) {
        console.error('Write file error:', err);
        return false;
    }
});

// 显示消息框
ipcMain.handle('show-message', async (event, message, type) => {
    const options = {
        type: type || 'info',
        title: type === 'error' ? '错误' : type === 'warning' ? '警告' : '提示',
        message: message,
    };
    
    await dialog.showMessageBox(mainWindow, options);
});

// 确认对话框
ipcMain.handle('confirm', async (event, message) => {
    const result = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        title: '确认',
        message: message,
        buttons: ['确定', '取消'],
    });
    
    return result.response === 0;
});
