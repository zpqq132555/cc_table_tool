/**
 * Vue 编辑器入口
 */
import Vue from 'vue';
import App from './App.vue';
import { initPlatform } from './api';

// 禁用生产提示
Vue.config.productionTip = false;

// 初始化平台适配
initPlatform();

// 创建 Vue 实例
new Vue({
    render: h => h(App),
}).$mount('#app');
