/**
 * 数据管理类
 * 统一管理所有数据操作
 */

import { reactive, ref } from 'vue';
import { api } from '../api';
import { importTableFromJson } from './importHelper';
import { createDefaultDataSource, deserializeDataSource, serializeDataSource } from './serializer';
import type { ICreateTableParams, IDataSource, ITableDef } from './types';

// 导出类型和工具函数
export * from './fieldFactory';
export { createDefaultDataSource, deserializeDataSource, serializeDataSource } from './serializer';
export * from './types';

/**
 * 数据管理器类
 */
export class DataManager {
    // 状态
    private state = reactive({
        loaded: false,
        filePath: '',
        dataSource: null as IDataSource | null,
        rawData: null as ArrayBuffer | null,
    });
    
    // 刷新计数器（用于强制触发响应式更新）
    private refreshCounter = ref(0);

    /**
     * 是否已加载数据
     */
    get isLoaded() {
        return this.state.loaded;
    }

    /**
     * 文件路径
     */
    get filePath() {
        return this.state.filePath;
    }

    /**
     * 数据源
     */
    get dataSource() {
        return this.state.dataSource;
    }

    /**
     * 数据大小
     */
    get dataSize() {
        return this.state.rawData?.byteLength || 0;
    }

    /**
     * 表列表（按 index 排序）
     * 依赖 refreshCounter 强制刷新
     */
    get tableList() {
        // 读取 refreshCounter 以建立依赖
        this.refreshCounter.value;
        
        if (!this.state.dataSource?.data) return [];

        const tables = Object.entries(this.state.dataSource.data).map(([key, value]) => ({
            key,
            index: value.index,
            name: value.name,
            desc: value.desc,
            exportPath: value.exportPath,
        }));

        return tables.sort((a, b) => a.index - b.index);
    }

    /**
     * 强制刷新 tableList
     */
    private forceRefresh() {
        this.refreshCounter.value++;
    }

    // ==================== 文件操作 ====================

    /**
     * 创建新数据文件
     */
    async create(filePath: string): Promise<void> {
        try {
            const dataSource = createDefaultDataSource();
            const buffer = serializeDataSource(dataSource);
            
            const success = await api.writeBinaryFile(filePath, buffer);
            if (!success) {
                throw new Error('写入文件失败');
            }

            this.state.filePath = filePath;
            this.state.dataSource = dataSource;
            this.state.rawData = buffer;
            this.state.loaded = true;
            
            this.forceRefresh();
            console.log('[DataManager] 数据创建成功:', filePath);
        } catch (err) {
            console.error('[DataManager] 创建失败:', err);
            throw err;
        }
    }

    /**
     * 加载数据文件
     */
    async load(filePath: string): Promise<void> {
        try {
            const buffer = await api.readBinaryFile(filePath);
            if (!buffer) {
                throw new Error('读取文件失败');
            }

            const dataSource = deserializeDataSource(buffer);
            
            this.state.filePath = filePath;
            this.state.dataSource = dataSource;
            this.state.rawData = buffer;
            this.state.loaded = true;
            
            this.forceRefresh();
            console.log('[DataManager] 数据加载成功:', filePath);
        } catch (err) {
            console.error('[DataManager] 加载失败:', err);
            throw err;
        }
    }

    /**
     * 保存数据
     */
    async save(): Promise<void> {
        if (!this.state.loaded || !this.state.dataSource) {
            throw new Error('数据未加载');
        }

        try {
            const buffer = serializeDataSource(this.state.dataSource);
            const success = await api.writeBinaryFile(this.state.filePath, buffer);
            
            if (!success) {
                throw new Error('写入文件失败');
            }

            this.state.rawData = buffer;
            console.log('[DataManager] 数据保存成功');
        } catch (err) {
            console.error('[DataManager] 保存失败:', err);
            throw err;
        }
    }

    /**
     * 清空数据
     */
    clear(): void {
        this.state.loaded = false;
        this.state.filePath = '';
        this.state.dataSource = null;
        this.state.rawData = null;
        this.forceRefresh();
        console.log('[DataManager] 数据已清空');
    }

    // ==================== 表操作 ====================

    /**
     * 获取表
     */
    getTable(key: string): ITableDef | undefined {
        return this.state.dataSource?.data[key];
    }

    /**
     * 检查表 key 是否存在
     */
    isTableKeyExists(key: string): boolean {
        return !!this.state.dataSource?.data[key];
    }

    /**
     * 获取下一个表索引
     */
    private getNextTableIndex(): number {
        if (!this.state.dataSource?.data) return 0;
        
        const indices = Object.values(this.state.dataSource.data).map(t => t.index);
        return indices.length > 0 ? Math.max(...indices) + 1 : 0;
    }

    /**
     * 添加表
     */
    async addTable(key: string, params: ICreateTableParams): Promise<void>;
    async addTable(params: ICreateTableParams & { key: string }): Promise<void>;
    async addTable(keyOrParams: string | (ICreateTableParams & { key: string }), params?: ICreateTableParams): Promise<void> {
        if (!this.state.dataSource) {
            throw new Error('数据未加载');
        }

        let key: string;
        let tableParams: ICreateTableParams;

        if (typeof keyOrParams === 'string') {
            key = keyOrParams;
            tableParams = params!;
        } else {
            key = keyOrParams.key;
            tableParams = keyOrParams;
        }

        if (this.state.dataSource.data[key]) {
            throw new Error(`表 "${key}" 已存在`);
        }

        const tableDef: ITableDef = {
            index: this.getNextTableIndex(),
            name: tableParams.name,
            exportPath: tableParams.exportPath || '',
            desc: tableParams.desc || '',
            separateExport: tableParams.separateExport || false,
            listDisplayField: tableParams.listDisplayField || '',
            fields: tableParams.fields || [],
            data: {},
        };

        this.state.dataSource.data[key] = tableDef;
        await this.save();
        this.forceRefresh();
        
        console.log('[DataManager] 表已添加:', key);
    }

    /**
     * 更新表
     */
    async updateTable(key: string, params: Partial<ICreateTableParams>): Promise<void> {
        if (!this.state.dataSource) {
            throw new Error('数据未加载');
        }

        const table = this.state.dataSource.data[key];
        if (!table) {
            throw new Error(`表 "${key}" 不存在`);
        }

        if (params.name !== undefined) table.name = params.name;
        if (params.exportPath !== undefined) table.exportPath = params.exportPath;
        if (params.desc !== undefined) table.desc = params.desc;
        if (params.separateExport !== undefined) table.separateExport = params.separateExport;
        if (params.listDisplayField !== undefined) table.listDisplayField = params.listDisplayField;
        if (params.fields !== undefined) table.fields = params.fields;

        await this.save();
        this.forceRefresh();
        
        console.log('[DataManager] 表已更新:', key);
    }

    /**
     * 删除表
     */
    async deleteTable(key: string): Promise<void> {
        if (!this.state.dataSource) {
            throw new Error('数据未加载');
        }

        if (!this.state.dataSource.data[key]) {
            throw new Error(`表 "${key}" 不存在`);
        }

        delete this.state.dataSource.data[key];
        await this.save();
        this.forceRefresh();
        
        console.log('[DataManager] 表已删除:', key);
    }

    /**
     * 交换两个表的顺序
     */
    async swapTableOrder(key1: string, key2: string): Promise<void> {
        if (!this.state.dataSource) {
            throw new Error('数据未加载');
        }

        const table1 = this.state.dataSource.data[key1];
        const table2 = this.state.dataSource.data[key2];

        if (!table1 || !table2) {
            throw new Error('表不存在');
        }

        const tempIndex = table1.index;
        table1.index = table2.index;
        table2.index = tempIndex;

        await this.save();
        this.forceRefresh();
        
        console.log('[DataManager] 交换表顺序:', key1, key2);
    }

    // ==================== 导入功能 ====================

    /**
     * 从 JSON 文件导入数据表
     */
    async importTableFromJson(): Promise<number> {
        if (!this.state.dataSource) {
            throw new Error('数据未加载');
        }

        try {
            const filePath = await api.selectFile({
                title: '选择 JSON 数据表文件',
                extensions: ['json']
            });

            if (!filePath) {
                return 0;
            }

            const content = await api.readFile(filePath);
            if (!content) {
                throw new Error('读取文件失败');
            }

            const jsonData = JSON.parse(content);
            
            // 生成表 key
            const fileName = filePath.split(/[\\/]/).pop() || 'imported_table';
            const key = fileName.replace(/\.json$/i, '').replace(/[^a-zA-Z0-9_]/g, '_');
            
            // 检查是否已存在
            if (this.state.dataSource.data[key]) {
                throw new Error(`表 "${key}" 已存在，请先删除或重命名`);
            }

            // 导入表
            const tableDef = await importTableFromJson(key, jsonData, this.getNextTableIndex());
            this.state.dataSource.data[key] = tableDef;
            
            await this.save();
            this.forceRefresh();
            
            console.log('[DataManager] 导入成功:', key);
            return 1;
        } catch (err) {
            console.error('[DataManager] 导入 JSON 失败:', err);
            throw err;
        }
    }

    /**
     * 从文件夹批量导入 JSON 数据表
     */
    async importTablesFromFolder(): Promise<number> {
        throw new Error('批量导入功能需要进一步开发');
    }
}

// 导出单例
export const dataManager = new DataManager();
