/**
 * 操作日志记录器
 * 在 Cocos 模式下记录数据表的操作日志
 * 日志文件存放在数据源文件同目录，保留最近 200 条记录
 */

import { api, getPlatform } from '../api';

/** 最大日志条数 */
const MAX_LOG_ENTRIES = 200;

/** 日志文件名 */
const LOG_FILE_NAME = 'table_tool_operations.log';

/** 操作类型 */
export type OperationType =
    | 'CREATE_TABLE'      // 新建数据表
    | 'DELETE_TABLE'      // 删除数据表
    | 'UPDATE_TABLE'      // 修改表头/表结构
    | 'EXPORT_TABLE'      // 导出单个表
    | 'EXPORT_ALL'        // 导出全部
    | 'IMPORT_TABLE'      // 导入数据表
    | 'ADD_DATA'          // 新增数据条目
    | 'UPDATE_DATA'       // 修改数据条目
    | 'DELETE_DATA'       // 删除数据条目
    | 'SAVE';             // 保存数据源

/** 日志条目 */
export interface ILogEntry {
    /** 时间戳 */
    time: string;
    /** 操作类型 */
    type: OperationType;
    /** 操作描述 */
    desc: string;
    /** 操作目标（如表名/表key） */
    target?: string;
}

/**
 * 格式化当前时间
 */
function formatTime(): string {
    return new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

/**
 * 格式化日志条目为一行文本
 */
function formatLogEntry(entry: ILogEntry): string {
    const target = entry.target ? ` [${entry.target}]` : '';
    return `[${entry.time}] ${entry.type}${target} ${entry.desc}`;
}

/**
 * 解析日志行为条目（用于截断时保留结构）
 */
function parseLogLines(content: string): string[] {
    return content.split('\n').filter(line => line.trim() !== '');
}

/**
 * 操作日志记录器
 */
class OperationLogger {
    private dataSourceDir: string = '';
    private enabled: boolean = false;

    /**
     * 初始化日志记录器
     * @param dataSourceDir 数据源所在目录
     */
    init(dataSourceDir: string): void {
        const platform = getPlatform();
        this.enabled = platform.startsWith('cocos');
        this.dataSourceDir = dataSourceDir;

        if (this.enabled) {
            console.log('[OperationLogger] 已启用，日志目录:', dataSourceDir);
        }
    }

    /**
     * 记录操作日志
     */
    async log(type: OperationType, desc: string, target?: string): Promise<void> {
        if (!this.enabled || !this.dataSourceDir) {
            return;
        }

        try {
            const logPath = `${this.dataSourceDir}\\${LOG_FILE_NAME}`;
            const entry: ILogEntry = {
                time: formatTime(),
                type,
                desc,
                target,
            };

            const newLine = formatLogEntry(entry);

            // 读取已有日志
            let existingLines: string[] = [];
            const exists = await api.exists(logPath);
            if (exists) {
                const content = await api.readFile(logPath);
                if (content) {
                    existingLines = parseLogLines(content);
                }
            }

            // 添加新记录
            existingLines.push(newLine);

            // 保留最近 MAX_LOG_ENTRIES 条
            if (existingLines.length > MAX_LOG_ENTRIES) {
                existingLines = existingLines.slice(existingLines.length - MAX_LOG_ENTRIES);
            }

            // 写入文件
            const finalContent = existingLines.join('\n') + '\n';
            await api.writeFile(logPath, finalContent);
        } catch (err) {
            console.warn('[OperationLogger] 写入日志失败:', err);
        }
    }
}

/** 导出单例 */
export const operationLogger = new OperationLogger();
