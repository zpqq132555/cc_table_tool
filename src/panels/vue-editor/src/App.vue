<template>
  <div class="app-container">
    <header class="app-header">
      <h1>🗂️ Table Tool</h1>
      <span class="version-badge">{{ platform }}</span>
      
      <!-- Cocos 渠道显示配置管理按钮 -->
      <template v-if="dataLoaded">
        <div class="header-spacer"></div>
        <button class="btn btn-secondary" @click="handleConfigManage">
          ⚙️ 配置管理
        </button>
      </template>
      
      <!-- 非 Cocos 渠道显示按钮 -->
      <template v-if="!isCocos">
        <div class="header-spacer"></div>
        <button class="btn btn-primary" @click="handleCreateData">
          📄 创建数据
        </button>
        <button class="btn" @click="handleLoadData">
          📂 读取数据
        </button>
      </template>
    </header>

    <!-- 数据信息栏 -->
    <div v-if="dataLoaded" class="data-info">
      <div class="info-left">
        <span class="info-label">📊 表数据管理</span>
        <span class="info-divider">|</span>
        <span class="info-item">表数量：<strong>{{ tableList.length }}</strong></span>
        <span class="info-divider">|</span>
        <span class="info-item">数据大小：<strong>{{ dataSize }}</strong> 字节</span>
      </div>
      <div class="info-right">
        <span class="info-path" :title="currentFilePath">{{ currentFilePath }}</span>
      </div>
    </div>

    <main class="app-main">
      <!-- 加载中 -->
      <div v-if="loading" class="loading-panel">
        <div class="loading-spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
      
      <!-- 欢迎页面 -->
      <div v-else-if="!dataLoaded" class="welcome-panel">
        <h2>欢迎使用表格工具</h2>
        <p>当前运行平台：<strong>{{ platform }}</strong></p>
        <p v-if="isCocos" class="tip">Cocos 模式下自动加载项目数据...</p>
        <p v-else class="tip">点击右上角按钮开始创建或读取数据</p>
      </div>
      
      <!-- 数据已加载 -->
      <div v-else class="data-panel">
        <!-- 表按钮网格 -->
        <div v-if="tableList.length > 0" class="table-grid">
          <button
            v-for="table in tableList"
            :key="table.key"
            class="table-btn"
            @click="handleOpenTable(table)"
            :title="table.desc || table.name"
          >
            <div class="table-btn-index">{{ table.index }}</div>
            <div class="table-btn-name">{{ table.name }}</div>
            <div class="table-btn-path" v-if="table.exportPath">{{ table.exportPath }}</div>
          </button>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="empty-state">
          <p>📭 暂无表数据</p>
          <p class="tip">点击"配置管理"按钮创建新表</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api, getPlatform } from './api';

// 平台信息
const platform = ref<string>(getPlatform());
const isCocos = computed(() => platform.value.startsWith('cocos'));

// 加载状态
const loading = ref(false);
const loadingMessage = ref('');

// 数据状态
const dataLoaded = ref(false);
const currentFilePath = ref('');
const currentData = ref<ArrayBuffer | null>(null);
const parsedDataSource = ref<any>(null);

const dataSize = computed(() => currentData.value?.byteLength || 0);

// 表列表（按 index 排序）
const tableList = computed(() => {
  if (!parsedDataSource.value?.data) return [];
  
  const tables = Object.entries(parsedDataSource.value.data).map(([key, value]: [string, any]) => ({
    key,
    index: value.index,
    name: value.name,
    desc: value.desc,
    exportPath: value.exportPath,
  }));
  
  // 按 index 排序
  return tables.sort((a, b) => a.index - b.index);
});

// ==================== 创建空数据 ====================
function createEmptyData(): ArrayBuffer {
  // 导入数据源工具
  const dataSource = {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    data: {},
  };
  
  // 序列化为加密二进制格式
  return serializeDataSource(dataSource);
}

// 简单的序列化函数
function serializeDataSource(dataSource: any): ArrayBuffer {
  const MAGIC_NUMBER = 0x5442_4C45;
  const ENCRYPT_KEY = 'table_tool_2024';
  
  // 更新时间戳
  dataSource.updatedAt = Date.now();
  
  // 转换为 JSON 字符串
  const jsonStr = JSON.stringify(dataSource);
  const jsonBytes = new TextEncoder().encode(jsonStr);
  
  // 简单 XOR 加密
  const keyBytes = new TextEncoder().encode(ENCRYPT_KEY);
  const encryptedBytes = new Uint8Array(jsonBytes.length);
  for (let i = 0; i < jsonBytes.length; i++) {
    encryptedBytes[i] = jsonBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  // 构建文件头：魔数(4) + 版本(4) + 数据长度(4) + 加密数据
  const header = new ArrayBuffer(12);
  const headerView = new DataView(header);
  headerView.setUint32(0, MAGIC_NUMBER, false);
  headerView.setUint32(4, 1, false);
  headerView.setUint32(8, encryptedBytes.length, false);
  
  // 合并头部和数据
  const result = new Uint8Array(12 + encryptedBytes.length);
  result.set(new Uint8Array(header), 0);
  result.set(encryptedBytes, 12);
  
  return result.buffer;
}

// 简单的反序列化函数
function deserializeDataSource(buffer: ArrayBuffer): any {
  const MAGIC_NUMBER = 0x5442_4C45;
  const ENCRYPT_KEY = 'table_tool_2024';
  
  const view = new DataView(buffer);
  
  // 验证魔数
  const magic = view.getUint32(0, false);
  if (magic !== MAGIC_NUMBER) {
    throw new Error('无效的 .table 文件格式');
  }
  
  // 读取数据长度
  const dataLength = view.getUint32(8, false);
  
  // 提取加密数据
  const encryptedBytes = new Uint8Array(buffer, 12, dataLength);
  
  // XOR 解密
  const keyBytes = new TextEncoder().encode(ENCRYPT_KEY);
  const decryptedBytes = new Uint8Array(encryptedBytes.length);
  for (let i = 0; i < encryptedBytes.length; i++) {
    decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  // 解析 JSON
  const jsonStr = new TextDecoder().decode(decryptedBytes);
  return JSON.parse(jsonStr);
}

// ==================== 创建数据 ====================
async function handleCreateData() {
  try {
    loading.value = true;
    loadingMessage.value = '正在创建数据文件...';
    
    // 选择保存路径
    const savePath = await api.selectSavePath({
      title: '创建数据文件',
      defaultName: 'data.table',
      extensions: ['table']
    });
    
    if (!savePath) {
      loading.value = false;
      return;
    }
    
    // 创建空数据
    const emptyData = createEmptyData();
    
    // 写入文件
    const success = await api.writeBinaryFile(savePath, emptyData);
    
    if (success) {
      // 解析初始数据
      parsedDataSource.value = deserializeDataSource(emptyData);
      
      currentFilePath.value = savePath;
      currentData.value = emptyData;
      dataLoaded.value = true;
      console.log('[App] 数据创建成功:', savePath);
    } else {
      alert('创建数据失败！');
    }
  } catch (err) {
    console.error('[App] 创建数据失败:', err);
    alert('创建数据失败: ' + (err as Error).message);
  } finally {
    loading.value = false;
  }
}

// ==================== 读取数据 ====================
async function handleLoadData() {
  try {
    loading.value = true;
    loadingMessage.value = '正在读取数据文件...';
    
    // 选择文件
    const filePath = await api.selectFile({
      title: '选择数据文件',
      extensions: ['table']
    });
    
    if (!filePath) {
      loading.value = false;
      return;
    }
    
    // 读取文件
    const data = await api.readBinaryFile(filePath);
    
    if (data) {
      // 解析数据为 object
      try {
        const parsedData = deserializeDataSource(data);
        parsedDataSource.value = parsedData;
        console.log('[App] 解析后的数据:', parsedData);
        console.log('[App] 表列表:', tableList.value);
      } catch (parseErr) {
        console.error('[App] 解析数据失败:', parseErr);
      }
      
      currentFilePath.value = filePath;
      currentData.value = data;
      dataLoaded.value = true;
      console.log('[App] 数据读取成功:', filePath);
    } else {
      alert('读取数据失败！');
    }
  } catch (err) {
    console.error('[App] 读取数据失败:', err);
    alert('读取数据失败: ' + (err as Error).message);
  } finally {
    loading.value = false;
  }
}

// ==================== 配置管理 ====================
async function handleConfigManage() {
  try {
    if (!currentData.value) {
      alert('请先加载数据！');
      return;
    }
    
    console.log('[App] 配置管理 - 当前数据:', parsedDataSource.value);
    
    // TODO: 打开配置管理界面
    alert('配置管理功能开发中...');
  } catch (err) {
    console.error('[App] 配置管理失败:', err);
    alert('配置管理失败: ' + (err as Error).message);
  }
}

// ==================== 打开表 ====================
function handleOpenTable(table: any) {
  console.log('[App] 打开表:', table);
  // TODO: 打开表编辑界面
  alert(`打开表: ${table.name}\n索引: ${table.index}\n导出路径: ${table.exportPath}`);
}

// ==================== Cocos 自动加载 ====================
async function autoLoadCocosData() {
  try {
    loading.value = true;
    loadingMessage.value = '正在加载项目数据...';
    
    // 获取项目路径
    const projectPath = await api.getProjectPath?.();
    if (!projectPath) {
      throw new Error('无法获取项目路径');
    }
    
    // 构建数据文件路径
    const dataDir = projectPath + '/data';
    const dataFile = dataDir + '/data.table';
    
    console.log('[App] 项目路径:', projectPath);
    console.log('[App] 数据文件:', dataFile);
    
    // 检查目录是否存在
    const dirExists = await api.exists(dataDir);
    if (!dirExists) {
      console.log('[App] 数据目录不存在，创建中...');
      await api.createDirectory(dataDir);
    }
    
    // 检查文件是否存在
    const fileExists = await api.exists(dataFile);
    
    if (fileExists) {
      // 读取现有文件
      console.log('[App] 读取现有数据文件...');
      const data = await api.readBinaryFile(dataFile);
      if (data) {
        // 解析数据为 object
        try {
          const parsedData = deserializeDataSource(data);
          parsedDataSource.value = parsedData;
          console.log('[App] 解析后的数据:', parsedData);
          console.log('[App] 表列表:', tableList.value);
        } catch (parseErr) {
          console.error('[App] 解析数据失败:', parseErr);
        }
        
        currentFilePath.value = dataFile;
        currentData.value = data;
        dataLoaded.value = true;
        console.log('[App] 数据加载成功');
      } else {
        throw new Error('读取数据文件失败');
      }
    } else {
      // 创建新文件
      console.log('[App] 数据文件不存在，创建新文件...');
      const emptyData = createEmptyData();
      const success = await api.writeBinaryFile(dataFile, emptyData);
      
      if (success) {
        // 解析初始数据
        parsedDataSource.value = deserializeDataSource(emptyData);
        
        currentFilePath.value = dataFile;
        currentData.value = emptyData;
        dataLoaded.value = true;
        console.log('[App] 数据创建成功');
      } else {
        throw new Error('创建数据文件失败');
      }
    }
  } catch (err) {
    console.error('[App] 自动加载失败:', err);
    alert('自动加载数据失败: ' + (err as Error).message);
  } finally {
    loading.value = false;
  }
}

// ==================== 初始化 ====================
onMounted(() => {
  console.log('[App] 当前平台:', platform.value);
  
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

.app-main {
  flex: 1;
  overflow: auto;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  to { transform: rotate(360deg); }
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
  font-family: 'Consolas', 'Monaco', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 500px;
}

.data-panel {
  width: 100%;
  max-width: 1200px;
  padding: 40px;
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
  padding: 20px 16px;
  background: #2d2d30;
  border: 2px solid #3e3e42;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-btn:hover {
  background: #3e3e42;
  border-color: #4fc3f7;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(79, 195, 247, 0.3);
}

.table-btn-index {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: rgba(79, 195, 247, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #4fc3f7;
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
</style>
