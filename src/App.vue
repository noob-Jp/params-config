<template>
  <div class="app-container">
    <el-container>
      <el-header>
        <h1>参数可视化配置工具</h1>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<style>
.app-container {
  height: 100vh;
  width: 100%;
}
.el-header {
  background-color: #2D64F0;
  color: white;
  display: flex;
  align-items: center;
}
</style> 