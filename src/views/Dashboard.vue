<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <h2>仪表盘</h2>
        <p class="dashboard-description">参数配置系统概览</p>
      </el-col>
    </el-row>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-title">案例总数</div>
            <div class="stat-value">{{ stats.caseCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon">
            <el-icon><Connection /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-title">功能总数</div>
            <div class="stat-value">{{ stats.functionCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon">
            <el-icon><Link /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-title">钩子总数</div>
            <div class="stat-value">{{ stats.hookCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon">
            <el-icon><DataLine /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-title">参数总数</div>
            <div class="stat-value">{{ stats.paramCount }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近活动 -->
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="recent-activity">
          <template #header>
            <div class="card-header">
              <span>最近活动</span>
              <el-button type="primary" size="small" @click="refreshData">刷新</el-button>
            </div>
          </template>
          <el-table :data="recentActivity" style="width: 100%" v-loading="loading">
            <el-table-column prop="time" label="时间" width="180" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="action" label="操作" width="100" />
            <el-table-column label="查看" width="80">
              <template #default="scope">
                <el-button 
                  size="small" 
                  type="primary" 
                  link 
                  @click="navigateToItem(scope.row)"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <!-- 案例分布 -->
      <el-col :span="8">
        <el-card class="case-distribution">
          <template #header>
            <div class="card-header">
              <span>案例功能分布</span>
            </div>
          </template>
          <div class="chart-container" ref="caseDistributionChart"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 功能参数可视化 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <data-visualization 
          title="功能参数分布" 
          :data="functionParamsData" 
          :loading="loading"
          @refresh="refreshData"
        />
      </el-col>
    </el-row>

    <!-- 快速访问 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="quick-access">
          <template #header>
            <div class="card-header">
              <span>快速访问</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in quickAccessItems" :key="item.path">
              <el-card shadow="hover" class="quick-access-card" @click="navigateTo(item.path)">
                <el-icon :size="24"><component :is="item.icon" /></el-icon>
                <div class="quick-access-title">{{ item.title }}</div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Document, 
  Connection, 
  Link, 
  DataLine, 
  Plus, 
  List, 
  Setting, 
  Management,
  Edit,
  Search,
  Monitor,
  Histogram,
  Refresh,
  View
} from '@element-plus/icons-vue'
import { getCaseList } from '../api/caseApi'
import { getFunctionList } from '../api/functionApi'
import DataVisualization from '../components/DataVisualization.vue'
import { initChart, setChartOption, resizeChart, generatePieChartOption } from '../utils/chartUtils'

export default {
  components: {
    Document,
    Connection,
    Link,
    DataLine,
    Plus,
    List,
    Setting,
    Management,
    Edit,
    Search,
    Monitor,
    Histogram,
    Refresh,
    View,
    DataVisualization
  },
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const stats = ref({
      caseCount: 0,
      functionCount: 0,
      hookCount: 0,
      paramCount: 0
    })
    const recentActivity = ref([])
    const functionParamsData = ref([])
    const caseDistributionChart = ref(null)
    const chart = ref(null)

    // 快速访问项
    const quickAccessItems = [
      { title: '创建新案例', path: '/case/new', icon: 'Plus' },
      { title: '案例列表', path: '/cases', icon: 'List' },
      { title: '功能列表', path: '/functions', icon: 'Connection' }
    ]

    // 加载数据
    const loadData = async () => {
      console.log('开始加载仪表盘数据...');
      loading.value = true
      try {
        // 获取案例列表
        console.log('尝试获取案例列表...');
        const cases = await getCaseList();
        console.log('获取到案例列表数据:', cases);
        stats.value.caseCount = Array.isArray(cases) ? cases.length : 0;
        
        // 获取功能列表
        console.log('尝试获取功能列表...');
        const functions = await getFunctionList();
        console.log('获取到功能列表数据:', functions);
        stats.value.functionCount = Array.isArray(functions) ? functions.length : 0;
        
        // 模拟钩子和参数统计
        stats.value.hookCount = Math.floor(Math.random() * 20) + 5;
        stats.value.paramCount = Math.floor(Math.random() * 100) + 30;
        
        // 生成最近活动数据
        if (Array.isArray(cases) && cases.length > 0) {
          generateRecentActivity(cases);
        } else {
          console.log('没有案例数据，无法生成最近活动');
          recentActivity.value = [];
        }
        
        // 生成功能参数数据
        if (Array.isArray(functions) && functions.length > 0) {
          generateFunctionParamsData(functions);
        } else {
          console.log('没有功能数据，无法生成功能参数图表');
          functionParamsData.value = [];
        }
        
        // 生成案例分布图表
        if (Array.isArray(cases) && cases.length > 0) {
          generateCaseDistributionChart(cases);
        } else {
          console.log('没有案例数据，无法生成案例分布图表');
          if (chart.value) {
            setChartOption(chart.value, generatePieChartOption('案例功能分布', []));
          }
        }
      } catch (error) {
        console.error('加载仪表盘数据失败', error);
        console.error('错误详情:', error?.message || '未知错误', error?.stack || '无堆栈信息');
      } finally {
        loading.value = false;
      }
    }
    
    // 生成最近活动数据
    const generateRecentActivity = (cases) => {
      if (!Array.isArray(cases) || cases.length === 0) {
        console.log('无案例数据，不生成活动');
        recentActivity.value = [];
        return;
      }

      const activities = [];
      
      // 为每个案例生成一个活动
      cases.forEach(caseItem => {
        if (!caseItem) return;
        
        const date = new Date();
        date.setHours(date.getHours() - Math.floor(Math.random() * 48));
        
        activities.push({
          time: date.toLocaleString(),
          type: '案例',
          name: caseItem.caseName || '未命名案例',
          action: '更新',
          path: `/case/${caseItem.caseName || 'unknown'}`
        });
        
        // 如果案例有功能，为部分功能生成活动
        if (caseItem.functionCount > 0 && caseItem.funcStepData && caseItem.funcStepData.length > 0) {
          const date2 = new Date();
          date2.setHours(date2.getHours() - Math.floor(Math.random() * 24));
          
          // 使用实际的功能步骤名称
          const functionStep = caseItem.funcStepData[0].replace('.json', '');
          
          activities.push({
            time: date2.toLocaleString(),
            type: '功能',
            name: `${functionStep}`,
            action: '编辑',
            path: `/case/${caseItem.caseName}/function/${functionStep}`
          });
        }
      });
      
      // 排序活动，最近的在前面
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      
      // 取前10条
      recentActivity.value = activities.slice(0, 10);
    }
    
    // 生成功能参数数据
    const generateFunctionParamsData = (functions) => {
      const data = [];
      
      functions.forEach(func => {
        data.push({
          name: func.funcKey,
          value: Math.floor(Math.random() * 20) + 1 // 模拟参数数量
        });
      });
      
      functionParamsData.value = data;
    }
    
    // 生成案例分布图表
    const generateCaseDistributionChart = (cases) => {
      if (!caseDistributionChart.value) return;
      
      // 初始化图表
      if (!chart.value) {
        chart.value = initChart(caseDistributionChart.value);
        resizeChart(chart.value);
      }
      
      // 准备数据
      const data = [];
      const functionCounts = {};
      
      // 统计不同功能数量的案例数
      cases.forEach(caseItem => {
        const count = caseItem.functionCount || 0;
        functionCounts[count] = (functionCounts[count] || 0) + 1;
      });
      
      // 转换为图表数据
      Object.entries(functionCounts).forEach(([count, num]) => {
        data.push({
          name: `${count}个功能`,
          value: num
        });
      });
      
      // 设置图表选项
      const option = generatePieChartOption('案例功能分布', data);
      setChartOption(chart.value, option);
    }
    
    // 刷新数据
    const refreshData = () => {
      loadData();
    }
    
    // 导航到项目
    const navigateToItem = (item) => {
      if (item.path) {
        router.push(item.path);
      }
    }
    
    // 导航到路径
    const navigateTo = (path) => {
      router.push(path);
    }
    
    onMounted(() => {
      loadData();
    })
    
    onUnmounted(() => {
      if (chart.value) {
        chart.value.dispose();
      }
    })
    
    return {
      loading,
      stats,
      recentActivity,
      functionParamsData,
      caseDistributionChart,
      quickAccessItems,
      refreshData,
      navigateToItem,
      navigateTo
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-description {
  color: #909399;
  margin-bottom: 20px;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 10px;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 24px;
  color: #2D64F0;
  margin-right: 15px;
  background-color: rgba(45, 100, 240, 0.1);
  padding: 15px;
  border-radius: 8px;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-activity, .case-distribution {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
}

.quick-access {
  margin-bottom: 20px;
}

.quick-access-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-access-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.quick-access-title {
  margin-top: 10px;
  font-size: 14px;
}

/* 暗黑模式适配 */
:deep(.dark-mode) .stat-value {
  color: #f0f0f0;
}

:deep(.dark-mode) .stat-icon {
  background-color: rgba(45, 100, 240, 0.2);
}
</style>
