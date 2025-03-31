// 图表工具函数
import * as echarts from 'echarts/core'
import { 
  BarChart,
  LineChart,
  PieChart,
  ScatterChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ToolboxComponent
} from 'echarts/components'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必须的组件
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ToolboxComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer
])

/**
 * 生成柱状图配置
 * @param {string} title 图表标题
 * @param {Array} xAxisData x轴数据
 * @param {Array} seriesData 系列数据
 * @param {string} seriesName 系列名称
 * @returns {Object} 图表配置
 */
export function generateBarChartOption(title, xAxisData, seriesData, seriesName = '数值') {
  return {
    title: {
      text: title,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: seriesName,
        type: 'bar',
        barWidth: '60%',
        data: seriesData
      }
    ]
  }
}

/**
 * 生成折线图配置
 * @param {string} title 图表标题
 * @param {Array} xAxisData x轴数据
 * @param {Array} seriesData 系列数据
 * @param {string} seriesName 系列名称
 * @returns {Object} 图表配置
 */
export function generateLineChartOption(title, xAxisData, seriesData, seriesName = '数值') {
  return {
    title: {
      text: title,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: seriesName,
        type: 'line',
        data: seriesData,
        smooth: true
      }
    ]
  }
}

/**
 * 生成饼图配置
 * @param {string} title 图表标题
 * @param {Array} data 饼图数据，格式为 [{name: '名称', value: 值}, ...]
 * @returns {Object} 图表配置
 */
export function generatePieChartOption(title, data) {
  return {
    title: {
      text: title,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    series: [
      {
        name: title,
        type: 'pie',
        radius: '50%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
}

/**
 * 生成散点图配置
 * @param {string} title 图表标题
 * @param {Array} data 散点图数据，格式为 [[x1, y1], [x2, y2], ...]
 * @param {string} seriesName 系列名称
 * @returns {Object} 图表配置
 */
export function generateScatterChartOption(title, data, seriesName = '数据点') {
  return {
    title: {
      text: title,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        return `${params.seriesName}<br/>
                x: ${params.value[0]}<br/>
                y: ${params.value[1]}`
      }
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      scale: true
    },
    yAxis: {
      type: 'value',
      scale: true
    },
    series: [
      {
        name: seriesName,
        type: 'scatter',
        data: data,
        symbolSize: 10
      }
    ]
  }
}

/**
 * 初始化图表实例
 * @param {HTMLElement} dom 图表容器DOM元素
 * @returns {echarts.ECharts} 图表实例
 */
export function initChart(dom) {
  return echarts.init(dom)
}

/**
 * 设置图表配置并渲染
 * @param {echarts.ECharts} chart 图表实例
 * @param {Object} option 图表配置
 */
export function setChartOption(chart, option) {
  chart.setOption(option)
}

/**
 * 响应窗口大小变化，调整图表大小
 * @param {echarts.ECharts} chart 图表实例
 */
export function resizeChart(chart) {
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

export default {
  generateBarChartOption,
  generateLineChartOption,
  generatePieChartOption,
  generateScatterChartOption,
  initChart,
  setChartOption,
  resizeChart
}
