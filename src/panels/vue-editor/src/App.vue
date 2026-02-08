<template>
  <div class="app-container">
    <!-- 配置管理页面（完全独立） -->
    <template v-if="currentView === 'config'">
      <ConfigManage
        @back="currentView = 'main'"
        @add="handleAddTable"
        @edit="handleEditTable"
        @delete="handleDeleteTable"
      />
    </template>

    <!-- 表格编辑器页面 -->
    <template v-else-if="currentView === 'table-editor'">
      <TableEditor
        :tableKey="editingTableKey"
        @back="currentView = 'config'"
        @saved="handleTableSaved"
      />
    </template>

    <!-- 数据编辑页面 -->
    <template v-else-if="currentView === 'data-editor'">
      <DataEditor
        :tableKey="editingTableKey"
        @back="currentView = 'main'"
        @saved="handleDataSaved"
      />
    </template>

    <!-- 主页面 -->
    <template v-else>
      <header class="app-header">
        <h1>🗂️ Table Tool</h1>
        <span class="version-badge">{{ platform }}</span>

        <!-- Cocos 渠道显示配置管理按钮 -->
        <template v-if="dataManager.isLoaded">
          <div class="header-spacer"></div>
          <button class="btn btn-secondary" @click="handleConfigManage">
            ⚙️ 配置管理
          </button>
        </template>

        <!-- 导出全部按钮（数据加载后显示） -->
        <template v-if="dataManager.isLoaded">
          <label
            class="sync-toggle"
            title="导出时同步生成 TypeScript Interface 声明文件"
          >
            <input type="checkbox" v-model="syncInterface" />
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
            <span class="toggle-label">同步脚本</span>
          </label>
          <button
            class="btn btn-outline-light"
            @click="handleExportAll"
            title="导出所有数据表"
          >
            📤 导出全部
          </button>
        </template>

        <!-- 非 Cocos 渠道显示按钮 -->
        <template v-if="!isCocos">
          <div class="header-spacer"></div>
          <button class="btn btn-primary" @click="handleCreateData">
            📄 创建数据
          </button>
          <button class="btn" @click="handleLoadData">📂 读取数据</button>
        </template>
      </header>

      <!-- 数据信息栏 -->
      <div v-if="dataManager.isLoaded" class="data-info">
        <div class="info-left">
          <span class="info-label">📊 表数据管理</span>
          <span class="info-divider">|</span>
          <span class="info-item"
            >表数量：<strong>{{ dataManager.tableList.length }}</strong></span
          >
          <span class="info-divider">|</span>
          <span class="info-item"
            >数据大小：<strong>{{ dataManager.dataSize }}</strong> 字节</span
          >
        </div>
        <div class="info-right">
          <button
            v-if="isCocos"
            class="btn-export-settings"
            @click="openExportSettings"
            title="导出路径设置"
          >
            📁 <span>导出路径</span>
            <span
              v-if="dataManager.hasExportSettings"
              class="settings-dot settings-dot--active"
            ></span>
            <span v-else class="settings-dot settings-dot--default"></span>
          </button>
          <span class="info-path" :title="normalizedPath">
            数据源:{{ normalizedPath }}
          </span>
        </div>
      </div>

      <main class="app-main">
        <!-- 加载中 -->
        <div v-if="loading" class="loading-panel">
          <div class="loading-spinner"></div>
          <p>{{ loadingMessage }}</p>
        </div>

        <!-- 欢迎页面 -->
        <div v-else-if="!dataManager.isLoaded" class="welcome-panel">
          <h2>欢迎使用表格工具</h2>
          <p>
            当前运行平台：<strong>{{ platform }}</strong>
          </p>
          <p v-if="isCocos" class="tip">Cocos 模式下自动加载项目数据...</p>
          <p v-else class="tip">点击右上角按钮开始创建或读取数据</p>
        </div>

        <!-- 数据已加载 -->
        <div v-else class="data-panel">
          <!-- 表按钮网格 -->
          <div v-if="dataManager.tableList.length > 0" class="table-grid">
            <button
              v-for="table in dataManager.tableList"
              :key="table.key"
              class="table-btn"
              @click="handleOpenTable(table)"
              :title="table.desc || table.name"
            >
              <div class="table-btn-name">📋{{ table.name }}</div>
              <div class="table-btn-path" v-if="table.exportPath">
                {{ table.exportPath }}
              </div>
            </button>
          </div>

          <!-- 空状态 -->
          <div v-else class="empty-state">
            <p>📭 暂无表数据</p>
            <p class="tip">点击"配置管理"按钮创建新表</p>
          </div>
        </div>
      </main>
    </template>

    <!-- 导出路径设置对话框 -->
    <div
      v-if="showExportSettings"
      class="dialog-overlay"
      @click.self="showExportSettings = false"
    >
      <div class="dialog-container">
        <div class="dialog-header">
          <h2>📁 导出路径设置</h2>
          <button class="dialog-btn-close" @click="showExportSettings = false">
            ✕
          </button>
        </div>
        <div class="dialog-content">
          <p class="settings-tip">
            设置数据导出的根路径。未设置时默认为数据源所在目录。<br />
            导出结构：<code>导出路径/表的 exportPath/文件名</code>
          </p>

          <div class="form-group">
            <label class="form-label">JSON 导出路径</label>
            <div class="path-input-row">
              <input
                v-model="editJsonDir"
                type="text"
                class="form-input"
                :placeholder="defaultJsonDir"
              />
              <button class="btn btn-sm" @click="handleSelectJsonDir">
                📂
              </button>
              <button
                class="btn btn-sm btn-clear"
                @click="editJsonDir = ''"
                title="清除（使用默认路径）"
              >
                ✕
              </button>
            </div>
            <p class="path-hint">
              默认路径：<code>{{ defaultJsonDir }}</code>
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">TypeScript 导出路径</label>
            <div class="path-input-row">
              <input
                v-model="editTsDir"
                type="text"
                class="form-input"
                :placeholder="defaultTsDir"
              />
              <button class="btn btn-sm" @click="handleSelectTsDir">📂</button>
              <button
                class="btn btn-sm btn-clear"
                @click="editTsDir = ''"
                title="清除（使用默认路径）"
              >
                ✕
              </button>
            </div>
            <p class="path-hint">
              默认路径：<code>{{ defaultTsDir }}</code>
            </p>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="showExportSettings = false">取消</button>
          <button class="btn btn-primary" @click="handleSaveExportSettings">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, getPlatform } from "./api";
import ConfigManage from "./components/ConfigManage.vue";
import DataEditor from "./components/DataEditor.vue";
import TableEditor from "./components/TableEditor.vue";
import { dataManager } from "./utils/dataManager";
import {
    generateIndexFile,
    generateIndexFileWithPaths,
    generateTableInterfaceFile,
    getInterfaceFileName,
} from "./utils/InterfaceGenerator";

// 平台信息
const platform = ref<string>(getPlatform());
const isCocos = computed(() => platform.value.startsWith("cocos"));

// 同步脚本开关（跟随数据源持久化）
const syncInterface = computed({
  get: () => dataManager.syncInterface,
  set: (value: boolean) => {
    dataManager.syncInterface = value;
    dataManager
      .save()
      .catch((err) => console.error("[App] 保存 syncInterface 失败:", err));
  },
});

// 路径标准化（统一使用反斜杠）
const normalizedPath = computed(() => {
  return dataManager.filePath.replace(/\//g, "\\");
});

// 加载状态
const loading = ref(false);
const loadingMessage = ref("");

// 视图状态
const currentView = ref<"main" | "config" | "table-editor" | "data-editor">(
  "main",
);

// 正在编辑的表 key
const editingTableKey = ref<string | undefined>(undefined);

// 导出路径设置对话框
const showExportSettings = ref(false);
const editJsonDir = ref("");
const editTsDir = ref("");

// 默认导出路径（数据源目录/数据源名.json 或 .ts）
const defaultJsonDir = computed(() => {
  if (!dataManager.isLoaded) return "";
  return `${dataManager.dataSourceDir}\\json`;
});

const defaultTsDir = computed(() => {
  if (!dataManager.isLoaded) return "";
  return `${dataManager.dataSourceDir}\\ts`;
});

// 打开设置时加载当前值
function openExportSettings() {
  const settings = dataManager.exportSettings;
  editJsonDir.value = settings.jsonExportDir || "";
  editTsDir.value = settings.tsExportDir || "";
  showExportSettings.value = true;
}

// 选择 JSON 导出目录
async function handleSelectJsonDir() {
  const dir = await api.selectDirectory({ title: "选择 JSON 导出目录" });
  if (dir) editJsonDir.value = dir;
}

// 选择 TS 导出目录
async function handleSelectTsDir() {
  const dir = await api.selectDirectory({ title: "选择 TypeScript 导出目录" });
  if (dir) editTsDir.value = dir;
}

// 保存导出路径设置
async function handleSaveExportSettings() {
  dataManager.exportSettings = {
    jsonExportDir: editJsonDir.value.trim() || undefined,
    tsExportDir: editTsDir.value.trim() || undefined,
  };
  await dataManager.save();
  showExportSettings.value = false;
  console.log("[App] 导出路径设置已保存:", dataManager.exportSettings);
}

// ==================== 创建数据 ====================
async function handleCreateData() {
  try {
    loading.value = true;
    loadingMessage.value = "正在创建数据文件...";

    // 选择保存路径
    const savePath = await api.selectSavePath({
      title: "创建数据文件",
      defaultName: "data.table",
      extensions: ["table"],
    });

    if (!savePath) {
      loading.value = false;
      return;
    }

    // 使用数据管理器创建
    await dataManager.create(savePath);

    console.log("[App] 数据创建成功:", savePath);
  } catch (err) {
    console.error("[App] 创建数据失败:", err);
    alert("创建数据失败: " + (err as Error).message);
  } finally {
    loading.value = false;
  }
}

// ==================== 读取数据 ====================
async function handleLoadData() {
  try {
    loading.value = true;
    loadingMessage.value = "正在读取数据文件...";

    // 选择文件
    const filePath = await api.selectFile({
      title: "选择数据文件",
      extensions: ["table"],
    });

    if (!filePath) {
      loading.value = false;
      return;
    }

    // 使用数据管理器加载
    await dataManager.load(filePath);

    console.log("[App] 数据读取成功:", filePath);
  } catch (err) {
    console.error("[App] 读取数据失败:", err);
    alert("读取数据失败: " + (err as Error).message);
  } finally {
    loading.value = false;
  }
}

// ==================== 导出全部数据表 ====================
/** 导出时按下拉 valueType 将对应字段转为 string 或 number */
function coerceInfoForExport(
  info: Record<string, any>,
  fields: import("./utils/types").IFieldDef[],
): Record<string, any> {
  const out = JSON.parse(JSON.stringify(info));
  for (const f of fields) {
    if (f.type === "select" && f.key in out) {
      const vt = (f as any).valueType || "string";
      const v = out[f.key];
      if (v === null || v === undefined) continue;
      out[f.key] = vt === "number" ? Number(v) : String(v);
    }
  }
  return out;
}

/** 构建单个表的导出数据（与 DataEditor 导出格式一致） */
function getTableExportPayload(tableKey: string): Record<string, any> | null {
  const tableDef = dataManager.getTable(tableKey);
  if (!tableDef) return null;
  const fields = tableDef.fields || [];
  const data: Record<string, Record<string, any>> = {};
  const sortedItems = Object.entries(tableDef.data)
    .map(([key, value]) => ({ key, index: value.index, info: value.info }))
    .sort((a, b) => a.index - b.index);
  for (const item of sortedItems) {
    data[item.key] = coerceInfoForExport(item.info, fields);
  }
  return data;
}

async function handleExportAll() {
  try {
    const tables = dataManager.tableList;
    if (tables.length === 0) {
      alert("没有可导出的数据表");
      return;
    }

    const plat = getPlatform();

    if (plat === "cocos-v2" || plat === "cocos-v3" || plat === "electron") {
      // Cocos / Electron：使用设置的路径导出
      if (!dataManager.hasExportSettings) {
        const useDefault = confirm(
          "尚未配置导出路径，将使用默认路径：\n" +
            `  JSON: ${defaultJsonDir.value}\n` +
            `  TS:   ${defaultTsDir.value}\n\n` +
            "点击「确定」使用默认路径导出，\n" +
            "点击「取消」打开设置页面。",
        );
        if (!useDefault) {
          openExportSettings();
          return;
        }
      }

      const jsonDir = dataManager.getJsonExportDir();
      const tsDir = dataManager.getTsExportDir();

      // 确保目录存在
      await api.createDirectory(jsonDir);
      if (syncInterface.value) {
        await api.createDirectory(tsDir);
      }

      let successCount = 0;
      let failCount = 0;
      const tsItems: {
        key: string;
        exportPath: string;
        tableDef: import("./utils/types").ITableDef;
      }[] = [];

      for (const t of tables) {
        const tableDef = dataManager.getTable(t.key);
        if (!tableDef) {
          failCount++;
          continue;
        }

        const payload = getTableExportPayload(t.key);
        if (!payload) {
          failCount++;
          continue;
        }

        // JSON: jsonDir/exportPath/tableKey.json
        const exportPath = tableDef.exportPath || "";
        const jsonSubDir = exportPath ? `${jsonDir}\\${exportPath}` : jsonDir;
        await api.createDirectory(jsonSubDir);

        const jsonStr = JSON.stringify(payload);
        const buffer = new TextEncoder().encode(jsonStr).buffer;
        const jsonFilePath = `${jsonSubDir}\\${t.key}.json`;
        const ok = await api.writeBinaryFile(jsonFilePath, buffer);
        if (ok) successCount++;
        else failCount++;

        if (syncInterface.value) {
          tsItems.push({ key: t.key, exportPath, tableDef });
        }
      }

      // 同步脚本：生成 interface 文件
      if (syncInterface.value && tsItems.length > 0) {
        await generateInterfaceFilesStructured(tsDir, tsItems);
      }

      // 刷新 Cocos 资源数据库
      if (isCocos.value) {
        try {
          await api.refreshAssets?.(jsonDir);
          if (syncInterface.value) {
            await api.refreshAssets?.(tsDir);
          }
        } catch (e) {
          console.warn("[App] 刷新资源失败:", e);
        }
      }

      alert(
        `导出完成！成功 ${successCount} 个${failCount > 0 ? `，失败 ${failCount} 个` : ""}` +
          `${syncInterface.value ? "\n已同步生成 Interface 声明文件" : ""}` +
          `\n\nJSON: ${jsonDir}` +
          `${syncInterface.value ? `\nTS:   ${tsDir}` : ""}`,
      );
      return;
    }

    if (plat === "standalone") {
      // 浏览器：使用结构化导出
      const exportTables: Array<{
        tableKey: string;
        exportPath: string;
        jsonData: ArrayBuffer;
        tsData?: ArrayBuffer;
      }> = [];

      for (const t of tables) {
        const tableDef = dataManager.getTable(t.key);
        if (!tableDef) continue;

        const payload = getTableExportPayload(t.key);
        if (!payload) continue;
        const jsonStr = JSON.stringify(payload);
        const jsonData = new TextEncoder().encode(jsonStr).buffer;

        const data: {
          tableKey: string;
          exportPath: string;
          jsonData: ArrayBuffer;
          tsData?: ArrayBuffer;
        } = {
          tableKey: t.key,
          exportPath: tableDef.exportPath || "",
          jsonData,
        };
        if (syncInterface.value) {
          const tsContent = generateTableInterfaceFile(t.key, tableDef);
          data.tsData = new TextEncoder().encode(tsContent).buffer;
        }

        exportTables.push(data);
      }

      if (exportTables.length === 0) {
        alert("没有可导出的数据表");
        return;
      }

      const { exportAllTablesWithStructure } = await import("./api/standalone");
      const ok = await exportAllTablesWithStructure(
        dataManager.dataSourceName,
        exportTables,
        syncInterface.value,
      );

      if (ok) {
        let msg = `导出完成！共导出 ${exportTables.length} 个表`;
        if (syncInterface.value) {
          msg += `\n已同步生成 Interface 声明文件和 index.ts`;
        }
        alert(msg);
      } else {
        alert("导出失败");
      }
      return;
    }

    alert("当前环境暂不支持导出");
  } catch (err) {
    console.error("[App] 导出全部失败:", err);
    alert("导出全部失败: " + (err as Error).message);
  }
}

// ==================== 生成 Interface 文件 ====================
/**
 * 在 tsDir 下按 exportPath 子目录结构生成 interface 声明文件（Cocos / Electron 平台）
 * 文件路径：tsDir/exportPath/ITableKey.ts
 * 索引文件：tsDir/index.ts（带相对路径导入）
 */
async function generateInterfaceFilesStructured(
  tsDir: string,
  tsItems: {
    key: string;
    exportPath: string;
    tableDef: import("./utils/types").ITableDef;
  }[],
) {
  const indexEntries: {
    key: string;
    exportPath: string;
    tableDef: import("./utils/types").ITableDef;
  }[] = [];

  for (const item of tsItems) {
    const content = generateTableInterfaceFile(item.key, item.tableDef);
    const fileName = getInterfaceFileName(item.key);
    const subDir = item.exportPath ? `${tsDir}\\${item.exportPath}` : tsDir;
    await api.createDirectory(subDir);

    const filePath = `${subDir}\\${fileName}`;
    const buffer = new TextEncoder().encode(content).buffer;
    await api.writeBinaryFile(filePath, buffer);

    indexEntries.push(item);
  }

  // 生成 index.ts，使用带 exportPath 的相对路径
  if (indexEntries.length > 0) {
    const indexContent = generateIndexFileWithPaths(indexEntries);
    const indexPath = `${tsDir}\\index.ts`;
    const indexBuffer = new TextEncoder().encode(indexContent).buffer;
    await api.writeBinaryFile(indexPath, indexBuffer);
  }
}

/**
 * 构建 interface 文件列表（Standalone 平台）
 */
function buildInterfaceFileList(
  tables: { key: string; name: string }[],
): { name: string; data: ArrayBuffer }[] {
  const files: { name: string; data: ArrayBuffer }[] = [];
  const items: { key: string; tableDef: import("./utils/types").ITableDef }[] =
    [];

  for (const t of tables) {
    const tableDef = dataManager.getTable(t.key);
    if (!tableDef) continue;

    const content = generateTableInterfaceFile(t.key, tableDef);
    const fileName = getInterfaceFileName(t.key);
    const buffer = new TextEncoder().encode(content).buffer;
    files.push({ name: fileName, data: buffer });

    items.push({ key: t.key, tableDef });
  }

  // 生成 index.ts
  if (items.length > 0) {
    const indexContent = generateIndexFile(items);
    const indexBuffer = new TextEncoder().encode(indexContent).buffer;
    files.push({ name: "index.ts", data: indexBuffer });
  }

  return files;
}

// ==================== 配置管理 ====================
async function handleConfigManage() {
  try {
    if (!dataManager.isLoaded) {
      alert("请先加载数据！");
      return;
    }

    console.log("[App] 打开配置管理");

    // 切换到配置管理页面
    currentView.value = "config";
  } catch (err) {
    console.error("[App] 配置管理失败:", err);
    alert("配置管理失败: " + (err as Error).message);
  }
}

// ==================== 返回主页 ====================
function handleBackToMain() {
  currentView.value = "main";
}

// ==================== 新增表 ====================
function handleAddTable() {
  console.log("[App] 新增数据表");
  editingTableKey.value = undefined;
  currentView.value = "table-editor";
}

// ==================== 编辑表 ====================
function handleEditTable(table: { key: string }) {
  console.log("[App] 编辑表:", table);
  editingTableKey.value = table.key;
  currentView.value = "table-editor";
}

// ==================== 表保存成功 ====================
function handleTableSaved() {
  console.log("[App] 表保存成功");
  currentView.value = "config";
}

// ==================== 删除表 ====================
async function handleDeleteTable(table: { key: string; name: string }) {
  console.log("[App] 删除表:", table);
  // 确认删除
  if (confirm(`确定要删除表 "${table.name}" 吗？\n此操作不可恢复！`)) {
    try {
      await dataManager.deleteTable(table.key);
      console.log("[App] 表已删除:", table.key);
    } catch (err) {
      console.error("[App] 删除表失败:", err);
      alert("删除表失败: " + (err as Error).message);
    }
  }
}

// ==================== 打开表 ====================
function handleOpenTable(table: any) {
  console.log("[App] 打开表:", table);
  editingTableKey.value = table.key;
  currentView.value = "data-editor";
}

// ==================== 数据保存成功 ====================
function handleDataSaved() {
  console.log("[App] 数据保存成功");
  // 保持在数据编辑页面
}

// ==================== Cocos 自动加载 ====================
async function autoLoadCocosData() {
  try {
    loading.value = true;
    loadingMessage.value = "正在加载项目数据...";

    // 等待 Editor 对象注入（最多等待 3 秒）
    let retries = 30;
    while (retries > 0) {
      try {
        const projectPath = await api.getProjectPath?.();
        if (projectPath) {
          console.log("[App] Editor 对象已就绪，项目路径:", projectPath);

          // 构建数据文件路径
          const dataDir = projectPath + "\\data";
          const dataFile = dataDir + "\\data.table";

          console.log("[App] 数据文件:", dataFile);

          // 检查目录是否存在
          const dirExists = await api.exists(dataDir);
          if (!dirExists) {
            console.log("[App] 数据目录不存在，创建中...");
            await api.createDirectory(dataDir);
          }

          // 检查文件是否存在
          const fileExists = await api.exists(dataFile);

          if (fileExists) {
            // 使用数据管理器加载
            await dataManager.load(dataFile);
            console.log("[App] 数据加载成功");
          } else {
            // 使用数据管理器创建
            await dataManager.create(dataFile);
            console.log("[App] 数据创建成功");
          }

          break; // 成功后退出循环
        }
      } catch (err: any) {
        if (err.message.includes("Editor object not found")) {
          console.log(`[App] 等待 Editor 对象注入... (${retries} 次剩余)`);
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries--;
          continue;
        }
        throw err;
      }
    }

    if (retries === 0) {
      throw new Error("等待 Editor 对象超时，请刷新面板重试");
    }
  } catch (err) {
    console.error("[App] 自动加载失败:", err);
    alert("自动加载数据失败: " + (err as Error).message);
  } finally {
    loading.value = false;
  }
}

// ==================== 初始化 ====================
onMounted(() => {
  console.log("[App] 当前平台:", platform.value);

  // Cocos 渠道自动加载
  if (isCocos.value) {
    autoLoadCocosData();
  }
});
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.app-header {
  flex-shrink: 0;
  padding: 16px 24px;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
}

.version-badge {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #ffffff;
  text-transform: uppercase;
}

.header-spacer {
  flex: 1;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.btn-primary {
  background: #4caf50;
  color: #ffffff;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-secondary {
  background: #2196f3;
  color: #ffffff;
}

.btn-secondary:hover {
  background: #1976d2;
}

.btn-outline-light {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #ffffff;
}

.btn-outline-light:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.6);
}

/* 同步脚本开关 */
.sync-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  padding: 4px 10px;
  border-radius: 6px;
  transition: background 0.2s;
}

.sync-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
}

.sync-toggle input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.toggle-track {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  transition: background 0.25s ease;
  flex-shrink: 0;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 0.25s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.sync-toggle input:checked + .toggle-track {
  background: #4caf50;
}

.sync-toggle input:checked + .toggle-track .toggle-thumb {
  transform: translateX(16px);
}

.toggle-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1;
  white-space: nowrap;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 40px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 0;
}

.welcome-panel {
  text-align: center;
  max-width: 600px;
  padding: 60px 40px;
  background: #252526;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.welcome-panel h2 {
  margin: 0 0 24px;
  font-size: 32px;
  color: #ffffff;
}

.welcome-panel p {
  margin: 16px 0;
  font-size: 16px;
  line-height: 1.6;
  color: #cccccc;
}

.welcome-panel strong {
  color: #4fc3f7;
  font-weight: 600;
}

.welcome-panel .tip {
  margin-top: 32px;
  padding: 16px;
  background: rgba(76, 175, 80, 0.1);
  border-left: 3px solid #4caf50;
  border-radius: 4px;
  font-size: 14px;
  color: #a5d6a7;
  text-align: left;
}

.loading-panel {
  text-align: center;
  padding: 60px 40px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #4fc3f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-panel p {
  font-size: 16px;
  color: #cccccc;
}

.data-info {
  flex-shrink: 0;
  padding: 12px 24px;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.info-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.info-label {
  font-size: 16px;
  font-weight: 600;
  color: #4caf50;
}

.info-divider {
  color: #3e3e42;
  font-weight: 300;
}

.info-item {
  font-size: 14px;
  color: #999;
}

.info-item strong {
  color: #4fc3f7;
  font-weight: 600;
}

.info-right {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  justify-content: flex-end;
}

.info-path {
  font-size: 12px;
  color: #666;
  font-family: "Consolas", "Monaco", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 500px;
}

.data-panel {
  width: 100%;
  max-width: 1200px;
  padding: 20px 40px;
}

/* 表格网格 */
.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 20px;
}

.table-btn {
  position: relative;
  padding: 24px 20px;
  background: linear-gradient(135deg, #2d2d30 0%, #252526 100%);
  border: 2px solid #3e3e42;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.table-btn:hover {
  background: linear-gradient(135deg, #3e3e42 0%, #2d2d30 100%);
  border-color: #4fc3f7;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(79, 195, 247, 0.4);
}

.table-btn:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);
}

.table-btn-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-btn-path {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: auto;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 40px;
  background: #252526;
  border-radius: 12px;
  border: 2px dashed #3e3e42;
}

.empty-state p {
  margin: 16px 0;
  font-size: 18px;
  color: #999;
}

.empty-state .tip {
  font-size: 14px;
  color: #666;
}

/* ==================== 对话框 ==================== */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-container {
  background: #2d2d30;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  width: 560px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #3e3e42;
}

.dialog-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.dialog-btn-close {
  background: transparent;
  border: none;
  color: #999;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.dialog-btn-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.dialog-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #3e3e42;
}

.settings-tip {
  margin: 0 0 16px;
  font-size: 13px;
  color: #999;
  line-height: 1.6;
}

.settings-tip code {
  background: rgba(79, 195, 247, 0.1);
  color: #4fc3f7;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #d4d4d4;
  margin-bottom: 6px;
}

.form-input {
  flex: 1;
  padding: 8px 12px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  color: #d4d4d4;
  font-size: 13px;
  font-family: "Consolas", "Monaco", monospace;
  outline: none;
  transition: border-color 0.2s;
  min-width: 0;
}

.form-input:focus {
  border-color: #4fc3f7;
}

.form-input::placeholder {
  color: #666;
}

.path-input-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.path-hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: #666;
}

.path-hint code {
  background: rgba(255, 255, 255, 0.05);
  color: #888;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 11px;
  word-break: break-all;
}

.btn-sm {
  padding: 6px 10px !important;
  font-size: 13px !important;
  min-width: auto;
}

.btn-clear {
  color: #e57373 !important;
}

.btn-clear:hover {
  background: rgba(229, 115, 115, 0.15) !important;
}

.btn-icon {
  background: transparent;
  border: none;
  color: #999;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-icon:hover {
  color: #4fc3f7;
  background: rgba(79, 195, 247, 0.1);
}

/* 导出路径设置按钮（醒目样式） */
.btn-export-settings {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  margin-right: 10px;
  background: rgba(79, 195, 247, 0.08);
  border: 1px solid rgba(79, 195, 247, 0.25);
  border-radius: 6px;
  color: #8ac4e0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-export-settings:hover {
  background: rgba(79, 195, 247, 0.18);
  border-color: rgba(79, 195, 247, 0.5);
  color: #4fc3f7;
}

.btn-export-settings span {
  font-size: 12px;
}

.settings-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-left: 2px;
  flex-shrink: 0;
}

.settings-dot--active {
  background: #4caf50;
  box-shadow: 0 0 4px rgba(76, 175, 80, 0.6);
}

.settings-dot--default {
  background: #ff9800;
  box-shadow: 0 0 4px rgba(255, 152, 0, 0.5);
}
</style>
