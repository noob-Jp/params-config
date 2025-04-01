<template>
  <div class="navigation-container">
    <el-menu
      :default-active="activeRoute"
      class="app-menu"
      :collapse="isCollapsed"
      :router="true"
      :collapse-transition="false"
      :class="{ 'is-collapsed': isCollapsed }"
    >
      <div class="menu-header">
        <div v-if="!isCollapsed" class="logo-text">参数配置</div>
        <el-icon class="collapse-icon" @click="toggleCollapse">
          <component :is="isCollapsed ? 'Expand' : 'Fold'" />
        </el-icon>
      </div>
      
      <el-menu-item index="/">
        <el-icon><DataBoard /></el-icon>
        <template #title>仪表盘</template>
      </el-menu-item>
      
      <el-menu-item index="/cases">
        <el-icon><Files /></el-icon>
        <template #title>案例列表</template>
      </el-menu-item>
      
      <el-menu-item index="/functions">
        <el-icon><Connection /></el-icon>
        <template #title>功能列表</template>
      </el-menu-item>
      
      <el-sub-menu index="create">
        <template #title>
          <el-icon><Plus /></el-icon>
          <span>创建</span>
        </template>
        <el-menu-item index="/case/new">
          <el-icon><Document /></el-icon>
          <span>新建案例</span>
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <template #title>系统设置</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 
  DataBoard, 
  Files, 
  Connection, 
  Plus, 
  Document, 
  Setting,
  Fold,
  Expand
} from '@element-plus/icons-vue'

export default {
  components: {
    DataBoard,
    Files,
    Connection,
    Plus,
    Document,
    Setting,
    Fold,
    Expand
  },
  setup() {
    const route = useRoute()
    const isCollapsed = ref(false)
    
    // 计算当前活动路由
    const activeRoute = computed(() => {
      // 处理特殊情况
      if (route.path.startsWith('/case/') && route.path !== '/case/new') {
        return '/cases'
      }
      return route.path
    })
    
    // 切换菜单折叠状态
    const toggleCollapse = () => {
      isCollapsed.value = !isCollapsed.value
      // 保存状态到本地存储
      localStorage.setItem('menu_collapsed', isCollapsed.value ? 'true' : 'false')
    }
    
    // 从本地存储加载菜单状态
    onMounted(() => {
      const savedState = localStorage.getItem('menu_collapsed')
      if (savedState !== null) {
        isCollapsed.value = savedState === 'true'
      }
    })
    
    return {
      isCollapsed,
      activeRoute,
      toggleCollapse
    }
  }
}
</script>

<style scoped>
.navigation-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-menu {
  height: 100%;
  border-right: none;
}

.app-menu.is-collapsed {
  width: 64px;
}

.menu-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.collapse-icon {
  cursor: pointer;
  font-size: 20px;
  color: var(--el-text-color-secondary);
}

.collapse-icon:hover {
  color: var(--el-color-primary);
}

/* 暗黑模式适配 */
:deep(.dark-mode) .app-menu {
  background-color: #1e1e1e;
  border-right: 1px solid #333;
}

:deep(.dark-mode) .menu-header {
  border-bottom: 1px solid #333;
}
</style>
