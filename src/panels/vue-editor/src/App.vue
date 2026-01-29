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
    <div v-if="dataManager.isLoaded" class="data-info">
      <div class="info-left">
        <span class="info-label">📊 表数据管理</span>
        <span class="info-divider">|</span>
        <span class="info-item">表数量：<strong>{{ dataManager.tableList.length }}</strong></span>
        <span class="info-divider">|</span>
        <span class="info-item">数据大小：<strong>{{ dataManager.dataSize }}</strong> 字节</span>
      </div>
      <div class="info-right">
        <span class="info-path" :title="dataManager.filePath">{{ dataManager.filePath }}</span>
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
        <p>当前运行平台：<strong>{{ platform }}</strong></p>
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api, getPlatform } from './api';
import ConfigManage from './components/ConfigManage.vue';
import DataEditor from './components/DataEditor.vue';
import TableEditor from './components/TableEditor.vue';
import { dataManager } from './utils/dataManager';

// 平台信息
const platform = ref<string>(getPlatform());
const isCocos = computed(() => platform.value.startsWith('cocos'));

// 加载状态
const loading = ref(false);
const loadingMessage = ref('');

// 视图状态
const currentView = ref<'main' | 'config' | 'table-editor' | 'data-editor'>('main');

// 正在编辑的表 key
const editingTableKey = ref<string | undefined>(undefined);

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
    
    // 使用数据管理器创建
    await dataManager.create(savePath);
    
    console.log('[App] 数据创建成功:', savePath);
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
    
    // 使用数据管理器加载
    await dataManager.load(filePath);
    
    console.log('[App] 数据读取成功:', filePath);
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
    if (!dataManager.isLoaded) {
      alert('请先加载数据！');
      return;
    }
    
    console.log('[App] 打开配置管理');
    
    // 切换到配置管理页面
    currentView.value = 'config';
  } catch (err) {
    console.error('[App] 配置管理失败:', err);
    alert('配置管理失败: ' + (err as Error).message);
  }
}

// ==================== 返回主页 ====================
function handleBackToMain() {
  currentView.value = 'main';
}

// ==================== 新增表 ====================
function handleAddTable() {
  console.log('[App] 新增数据表');
  editingTableKey.value = undefined;
  currentView.value = 'table-editor';
}

// ==================== 编辑表 ====================
function handleEditTable(table: { key: string }) {
  console.log('[App] 编辑表:', table);
  editingTableKey.value = table.key;
  currentView.value = 'table-editor';
}

// ==================== 表保存成功 ====================
function handleTableSaved() {
  console.log('[App] 表保存成功');
  currentView.value = 'config';
}

// ==================== 删除表 ====================
async function handleDeleteTable(table: { key: string; name: string }) {
  console.log('[App] 删除表:', table);
  // 确认删除
  if (confirm(`确定要删除表 "${table.name}" 吗？\n此操作不可恢复！`)) {
    try {
      await dataManager.deleteTable(table.key);
      console.log('[App] 表已删除:', table.key);
    } catch (err) {
      console.error('[App] 删除表失败:', err);
      alert('删除表失败: ' + (err as Error).message);
    }
  }
}

// ==================== 打开表 ====================
function handleOpenTable(table: any) {
  console.log('[App] 打开表:', table);
  editingTableKey.value = table.key;
  currentView.value = 'data-editor';
}

// ==================== 数据保存成功 ====================
function handleDataSaved() {
  console.log('[App] 数据保存成功');
  // 保持在数据编辑页面
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
      // 使用数据管理器加载
      await dataManager.load(dataFile);
      console.log('[App] 数据加载成功');
    } else {
      // 使用数据管理器创建
      await dataManager.create(dataFile);
      console.log('[App] 数据创建成功');
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
</style>
