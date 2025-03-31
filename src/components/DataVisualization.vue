<template>
  <div class="visualization-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ title }}</span>
          <div class="chart-controls">
            <el-select v-model="chartType" placeholder="选择图表类型" @change="updateChart">
              <el-option v-for="item in chartTypes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button type="primary" size="small" @click="refreshData">刷新数据</el-button>
          </div>
        </div>
      </template>
      <div class="chart-container" ref="chartContainer"></div>
      <div v-if="loading" class="loading-overlay">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-if="!loading && noData" class="no-data">
        <el-empty description="暂无数据" />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { 
  initChart, 
  setChartOption, 
  resizeChart,
  generateBarChartOption,
  generateLineChartOption,
  generatePieChartOption,
  generateScatterChartOption
} from '../utils/chartUtils'

export default {
  components: {
    Loading
  },
  props: {
    title: {
      type: String,
      default: '数据可视化'
    },
    data: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const chartContainer = ref(null)
    const chartType = ref('bar')
    const chart = ref(null)
    const noData = ref(false)
    
    const chartTypes = [
      { label: '柱状图', value: 'bar' },
      { label: '折线图', value: 'line' },
      { label: '饼图', value: 'pie' },
      { label: '散点图', value: 'scatter' }
    ]

    // 初始化图表
    const initializeChart = () => {
      if (chartContainer.value) {
        chart.value = initChart(chartContainer.value)
        resizeChart(chart.value)
      }
    }

    // 更新图表
    const updateChart = () => {
      if (!chart.value || !props.data || props.data.length === 0) {
        noData.value = true
        return
      }

      noData.value = false
      let option

      // 根据数据结构和图表类型生成不同的图表配置
      const processedData = processData(props.data)
      
      switch (chartType.value) {
        case 'bar':
          option = generateBarChartOption(
            props.title,
            processedData.labels,
            processedData.values,
            '参数值'
          )
          break
        case 'line':
          option = generateLineChartOption(
            props.title,
            processedData.labels,
            processedData.values,
            '参数值'
          )
          break
        case 'pie':
          option = generatePieChartOption(
            props.title,
            processedData.pieData
          )
          break
        case 'scatter':
          option = generateScatterChartOption(
            props.title,
            processedData.scatterData,
            '参数分布'
          )
          break
        default:
          option = generateBarChartOption(
            props.title,
            processedData.labels,
            processedData.values,
            '参数值'
          )
      }

      setChartOption(chart.value, option)
    }

    // 处理数据以适应不同图表类型
    const processData = (data) => {
      const result = {
        labels: [],
        values: [],
        pieData: [],
        scatterData: []
      }

      // 尝试自动检测数据结构
      if (data.length > 0) {
        // 如果数据是对象数组，尝试提取键值对
        if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
          // 检查是否有name和value字段，适合饼图
          if ('name' in data[0] && 'value' in data[0]) {
            result.pieData = data
            
            // 同时为其他图表类型准备数据
            data.forEach(item => {
              result.labels.push(item.name)
              result.values.push(item.value)
              result.scatterData.push([result.labels.length, item.value])
            })
          } else {
            // 使用对象的键作为标签，值作为数据值
            Object.entries(data[0]).forEach(([key, value], index) => {
              if (typeof value === 'number') {
                result.labels.push(key)
                result.values.push(value)
                result.pieData.push({ name: key, value: value })
                result.scatterData.push([index, value])
              }
            })
          }
        } 
        // 如果数据是数组的数组，假设是散点图数据 [x, y]
        else if (Array.isArray(data[0])) {
          result.scatterData = data
          
          // 为其他图表类型准备数据
          data.forEach((item, index) => {
            result.labels.push(`点${index + 1}`)
            result.values.push(item[1])
            result.pieData.push({ name: `点${index + 1}`, value: item[1] })
          })
        }
        // 如果数据是简单数组，使用索引作为标签
        else {
          data.forEach((value, index) => {
            if (typeof value === 'number') {
              result.labels.push(`项${index + 1}`)
              result.values.push(value)
              result.pieData.push({ name: `项${index + 1}`, value: value })
              result.scatterData.push([index, value])
            }
          })
        }
      }

      return result
    }

    // 刷新数据
    const refreshData = () => {
      emit('refresh')
    }

    // 监听数据变化
    watch(() => props.data, () => {
      updateChart()
    }, { deep: true })

    // 监听加载状态变化
    watch(() => props.loading, (newVal) => {
      if (!newVal) {
        updateChart()
      }
    })

    onMounted(() => {
      initializeChart()
      updateChart()
    })

    onUnmounted(() => {
      if (chart.value) {
        chart.value.dispose()
      }
    })

    return {
      chartContainer,
      chartType,
      chartTypes,
      noData,
      updateChart,
      refreshData
    }
  }
}
</script>

<style scoped>
.visualization-container {
  width: 100%;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-controls {
  display: flex;
  gap: 10px;
}

.chart-container {
  width: 100%;
  height: 400px;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 10;
}

.no-data {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dark-mode .loading-overlay {
  background-color: rgba(0, 0, 0, 0.7);
}
</style>
