/**
 * Electron 桌面版 API 实现
 */

import type { IEditorApi, Platform } from './index';

export const electronApi: IEditorApi = {
    platform: 'electron' as Platform,

    // TODO: 后期实现
    async getProjectPath() { return null; },
    async readBinaryFile(path: string) { return null; },
    async writeBinaryFile(path: string, data: ArrayBuffer) { return false; },
    async selectFile(options) { return null; },
    async selectSavePath(options) { return null; },
    async exists(path: string) { return false; },
    async createDirectory(path: string) { return false; },
    selectDirectory: function (options?: { title?: string; }): Promise<string | null> {
        throw new Error('Function not implemented.');
    },
    readFile: function (path: string): Promise<string | null> {
        throw new Error('Function not implemented.');
    }
};
