<template>
    <div class="app-container">
        <header class="app-header">
            <h1>Table Tool</h1>
            <span class="version-badge">{{ platform }}</span>
        </header>

        <main class="app-main">
            <div class="toolbar">
                <button class="btn btn-primary" @click="handleImport">导入数据</button>
                <button class="btn btn-primary" @click="handleExport">导出数据</button>
                <button class="btn" @click="handleAddRow">添加行</button>
                <button class="btn btn-danger" @click="handleClear">清空</button>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 60px">#</th>
                            <th v-for="col in columns" :key="col.key">
                                {{ col.title }}
                            </th>
                            <th style="width: 100px">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, index) in tableData" :key="index">
                            <td class="row-index">{{ index + 1 }}</td>
                            <td v-for="col in columns" :key="col.key">
                                <input 
                                    class="cell-input"
                                    :type="col.type || 'text'"
                                    v-model="row[col.key]"
                                    @change="handleCellChange(index, col.key, row[col.key])"
                                />
                            </td>
                            <td class="row-actions">
                                <button class="btn-icon" @click="handleDeleteRow(index)" title="删除">🗑️</button>
                                <button class="btn-icon" @click="handleDuplicateRow(index)" title="复制">📋</button>
                            </td>
                        </tr>
                        <tr v-if="tableData.length === 0">
                            <td :colspan="columns.length + 2" class="empty-tip">
                                暂无数据，点击"添加行"开始编辑
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <footer class="app-footer">
                <span>共 {{ tableData.length }} 条数据</span>
                <span v-if="isDirty" class="dirty-tip">* 有未保存的更改</span>
            </footer>
        </main>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { api, getPlatformName } from './api';

interface Column {
    key: string;
    title: string;
    type?: string;
}

interface RowData {
    [key: string]: any;
}

export default Vue.extend({
    name: 'App',
    
    data() {
        return {
            platform: getPlatformName(),
            isDirty: false,
            columns: [
                { key: 'id', title: 'ID', type: 'number' },
                { key: 'name', title: '名称', type: 'text' },
                { key: 'value', title: '数值', type: 'number' },
                { key: 'description', title: '描述', type: 'text' },
            ] as Column[],
            tableData: [] as RowData[],
        };
    },

    methods: {
        handleImport() {
            api.importData().then((data: RowData[] | null) => {
                if (data) {
                    this.tableData = data;
                    this.isDirty = false;
                }
            });
        },

        handleExport() {
            api.exportData(this.tableData).then(() => {
                this.isDirty = false;
            });
        },

        handleAddRow() {
            const newRow: RowData = {};
            this.columns.forEach(col => {
                newRow[col.key] = col.type === 'number' ? 0 : '';
            });
            // 自动填充 ID
            if (newRow.id !== undefined) {
                newRow.id = this.tableData.length + 1;
            }
            this.tableData.push(newRow);
            this.isDirty = true;
        },

        handleDeleteRow(index: number) {
            this.tableData.splice(index, 1);
            this.isDirty = true;
        },

        handleDuplicateRow(index: number) {
            const copy = { ...this.tableData[index] };
            if (copy.id !== undefined) {
                copy.id = this.tableData.length + 1;
            }
            this.tableData.splice(index + 1, 0, copy);
            this.isDirty = true;
        },

        handleClear() {
            if (this.tableData.length > 0) {
                if (confirm('确定要清空所有数据吗？')) {
                    this.tableData = [];
                    this.isDirty = true;
                }
            }
        },

        handleCellChange(rowIndex: number, colKey: string, value: any) {
            this.isDirty = true;
        },
    },

    mounted() {
        console.log(`[Table Tool] Running on ${this.platform}`);
    },
});
</script>

<style>
.app-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #1e1e1e;
    color: #d4d4d4;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #252526;
    border-bottom: 1px solid #3c3c3c;
}

.app-header h1 {
    font-size: 18px;
    font-weight: 500;
    color: #f90;
    margin: 0;
}

.version-badge {
    font-size: 12px;
    padding: 2px 8px;
    background: #0e639c;
    border-radius: 4px;
    color: #fff;
}

.app-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px;
    overflow: hidden;
}

.toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}

.btn {
    padding: 6px 12px;
    border: 1px solid #3c3c3c;
    border-radius: 4px;
    background: #3c3c3c;
    color: #d4d4d4;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
}

.btn:hover {
    background: #4c4c4c;
}

.btn-primary {
    background: #0e639c;
    border-color: #0e639c;
}

.btn-primary:hover {
    background: #1177bb;
}

.btn-danger {
    background: #c42b1c;
    border-color: #c42b1c;
}

.btn-danger:hover {
    background: #d63a2a;
}

.btn-icon {
    padding: 4px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
    opacity: 0.7;
    transition: opacity 0.2s;
}

.btn-icon:hover {
    opacity: 1;
}

.table-container {
    flex: 1;
    overflow: auto;
    border: 1px solid #3c3c3c;
    border-radius: 4px;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.data-table th,
.data-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #3c3c3c;
    text-align: left;
}

.data-table th {
    background: #2d2d2d;
    font-weight: 500;
    position: sticky;
    top: 0;
    z-index: 1;
}

.data-table tr:hover {
    background: #2a2a2a;
}

.row-index {
    color: #888;
    text-align: center;
}

.row-actions {
    text-align: center;
}

.cell-input {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid transparent;
    border-radius: 3px;
    background: transparent;
    color: #d4d4d4;
    font-size: 13px;
}

.cell-input:focus {
    border-color: #0e639c;
    background: #1e1e1e;
    outline: none;
}

.empty-tip {
    text-align: center;
    color: #888;
    padding: 40px !important;
}

.app-footer {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 12px;
    color: #888;
}

.dirty-tip {
    color: #f90;
}
</style>
