<template>
  <div class="app-container">
    <el-container>
      <el-aside width="auto">
        <app-navigation />
      </el-aside>
      <el-container>
        <el-header>
          <div class="header-content">
            <h1>参数可视化配置工具</h1>
            <div class="header-actions">
              <div class="header-version">v1.0.0</div>
            </div>
          </div>
        </el-header>
        <el-main>
          <router-view />
        </el-main>
        <el-footer>
          <div class="footer-content">
            <span> 2025 </span>
            <span></span>
          </div>
        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import AppNavigation from './components/AppNavigation.vue'

export default {
  components: {
    AppNavigation
  },
  setup() {
    return {}
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Helvetica Neue', Helvetica, 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
}

.app-container {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.el-container {
  height: 100%;
}

.el-aside {
  transition: width 0.3s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.el-header {
  background-color: #2D64F0;
  color: white;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  height: 60px !important;
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-actions {
  display: flex;
  align-items: center;
}

.header-version {
  font-size: 14px;
  opacity: 0.8;
}

.el-main {
  padding: 20px;
  overflow-x: hidden;
  background-color: #f5f7fa;
}

.el-footer {
  height: 40px !important;
  background-color: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  padding: 0 20px;
}

/* 全局样式覆盖 */
.el-button {
  border-radius: 4px;
}

.el-table {
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.el-card {
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>