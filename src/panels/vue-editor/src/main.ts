/**
 * Vue 编辑器入口
 */
import { createApp } from 'vue';
import App from './App.vue';
import { initPlatform } from './api';

// 初始化平台适配
initPlatform();

// 创建 Vue 应用
const app = createApp(App);
app.mount('#app');
