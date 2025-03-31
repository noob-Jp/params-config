<template>
  <div class="settings-container">
    <h2>系统设置</h2>
    <p class="settings-description">自定义参数配置工具的设置</p>

    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>界面设置</span>
        </div>
      </template>
      
      <el-form :model="uiSettings" label-width="120px">
        <el-form-item label="主色调">
          <div class="color-picker-container">
            <el-color-picker 
              v-model="uiSettings.primaryColor" 
              show-alpha
              :predefine="predefineColors"
              @change="applyColorTheme"
            />
            <div class="color-preview" :style="{ backgroundColor: uiSettings.primaryColor }"></div>
            <span class="color-value">{{ uiSettings.primaryColor }}</span>
          </div>
          <div class="color-presets">
            <div 
              v-for="(color, index) in predefineColors" 
              :key="index"
              class="color-preset-item"
              :style="{ backgroundColor: color }"
              @click="selectPresetColor(color)"
            ></div>
          </div>
        </el-form-item>
        
        <el-form-item label="表格密度">
          <el-select v-model="uiSettings.tableDensity">
            <el-option label="默认" value="default" />
            <el-option label="紧凑" value="compact" />
            <el-option label="宽松" value="loose" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="字体大小">
          <el-slider v-model="uiSettings.fontSize" :min="12" :max="20" :step="1" show-stops />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>数据设置</span>
        </div>
      </template>
      
      <el-form :model="dataSettings" label-width="120px">
        <el-form-item label="数据存储路径">
          <el-input v-model="dataSettings.storagePath" placeholder="参数数据存储路径">
            <template #append>
              <el-button @click="selectStoragePath">浏览</el-button>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="自动保存">
          <el-switch v-model="dataSettings.autoSave" />
        </el-form-item>
        
        <el-form-item label="自动保存间隔" v-if="dataSettings.autoSave">
          <el-input-number v-model="dataSettings.autoSaveInterval" :min="1" :max="30" :step="1" />
          <span class="input-suffix">分钟</span>
        </el-form-item>
        
        <el-form-item label="备份设置">
          <el-checkbox v-model="dataSettings.enableBackup">启用自动备份</el-checkbox>
        </el-form-item>
        
        <el-form-item label="备份频率" v-if="dataSettings.enableBackup">
          <el-select v-model="dataSettings.backupFrequency">
            <el-option label="每天" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="保留备份数量" v-if="dataSettings.enableBackup">
          <el-input-number v-model="dataSettings.backupCount" :min="1" :max="20" :step="1" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>高级设置</span>
        </div>
      </template>
      
      <el-form :model="advancedSettings" label-width="120px">
        <el-form-item label="启用日志">
          <el-switch v-model="advancedSettings.enableLogging" />
        </el-form-item>
        
        <el-form-item label="日志级别" v-if="advancedSettings.enableLogging">
          <el-select v-model="advancedSettings.logLevel">
            <el-option label="错误" value="error" />
            <el-option label="警告" value="warn" />
            <el-option label="信息" value="info" />
            <el-option label="调试" value="debug" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="启用性能监控">
          <el-switch v-model="advancedSettings.enablePerformanceMonitoring" />
        </el-form-item>
        
        <el-form-item label="API端口">
          <el-input-number v-model="advancedSettings.apiPort" :min="1024" :max="65535" :step="1" />
          <el-button type="primary" size="small" style="margin-left: 10px" @click="restartServer">
            应用并重启服务
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="settings-actions">
      <el-button type="primary" @click="saveSettings">保存设置</el-button>
      <el-button @click="resetSettings">重置设置</el-button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

// 颜色处理类
class Color {
  constructor(color) {
    this.color = color
    this.el = document.createElement('div')
    this.el.style.color = color
    document.body.appendChild(this.el)
    this.rgb = window.getComputedStyle(this.el).color
    document.body.removeChild(this.el)
    
    // 解析RGB值
    const rgbMatch = this.rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) || 
                     this.rgb.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/)
    
    if (rgbMatch) {
      this.r = parseInt(rgbMatch[1])
      this.g = parseInt(rgbMatch[2])
      this.b = parseInt(rgbMatch[3])
    } else {
      // 如果无法解析，使用默认颜色
      this.r = 45
      this.g = 100
      this.b = 240
    }
  }
  
  lighten(amount) {
    return new Color(`rgb(${Math.min(255, Math.floor(this.r + (255 - this.r) * amount))}, 
                        ${Math.min(255, Math.floor(this.g + (255 - this.g) * amount))}, 
                        ${Math.min(255, Math.floor(this.b + (255 - this.b) * amount))})`)
  }
  
  darken(amount) {
    return new Color(`rgb(${Math.max(0, Math.floor(this.r * (1 - amount)))}, 
                        ${Math.max(0, Math.floor(this.g * (1 - amount)))}, 
                        ${Math.max(0, Math.floor(this.b * (1 - amount)))})`)
  }
  
  toHexString() {
    return `#${this.componentToHex(this.r)}${this.componentToHex(this.g)}${this.componentToHex(this.b)}`
  }
  
  componentToHex(c) {
    const hex = c.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
}

export default {
  setup() {
    // 预定义颜色
    const predefineColors = ref([
      '#2D64F0',  // 默认蓝色
      '#67C23A',  // 成功绿色
      '#E6A23C',  // 警告黄色
      '#F56C6C',  // 错误红色
      '#909399',  // 信息灰色
      '#409EFF',  // Element Plus默认蓝色
      '#304156',  // 暗色主题色
      '#5D81F9',  // 紫蓝色
      '#02A7F0',  // 鲜蓝色
      '#8E24AA'   // 紫色
    ])
    
    // UI设置
    const uiSettings = reactive({
      primaryColor: '#2D64F0',
      tableDensity: 'default',
      fontSize: 14
    })
    
    // 数据设置
    const dataSettings = reactive({
      storagePath: 'params',
      autoSave: true,
      autoSaveInterval: 5,
      enableBackup: false,
      backupFrequency: 'daily',
      backupCount: 5
    })
    
    // 高级设置
    const advancedSettings = reactive({
      enableLogging: false,
      logLevel: 'error',
      enablePerformanceMonitoring: false,
      apiPort: 3001 // 默认设置为当前的API端口
    })

    // 保存定时器
    const autoSaveTimer = ref(null)
    // 备份定时器
    const backupTimer = ref(null)
    // 性能监控定时器
    const performanceMonitorTimer = ref(null)
    // 是否初始化完成
    const initialized = ref(false)
    
    // 加载设置
    const loadSettings = () => {
      try {
        // 尝试从本地存储加载设置
        const savedSettings = localStorage.getItem('app_settings')
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)
          
          // 合并UI设置
          if (settings.uiSettings) {
            Object.assign(uiSettings, settings.uiSettings)
          }
          
          // 合并数据设置
          if (settings.dataSettings) {
            Object.assign(dataSettings, settings.dataSettings)
          }
          
          // 合并高级设置
          if (settings.advancedSettings) {
            Object.assign(advancedSettings, settings.advancedSettings)
          }
        }

        // 首次加载时，也从服务器获取一些设置
        fetchServerSettings()
      } catch (error) {
        console.error('加载设置失败', error)
        ElMessage.error('加载设置失败')
      }
    }
    
    // 获取服务器设置
    const fetchServerSettings = async () => {
      try {
        const response = await axios.get('/api/settings')
        if (response.data) {
          // 从服务器更新一些设置
          if (response.data.storagePath) {
            dataSettings.storagePath = response.data.storagePath
          }
          if (response.data.apiPort) {
            advancedSettings.apiPort = response.data.apiPort
          }
        }
      } catch (error) {
        console.log('获取服务器设置失败，将使用本地设置', error)
      }
    }

    // 保存设置
    const saveSettings = async () => {
      try {
        // 保存设置到本地存储
        const settings = {
          uiSettings,
          dataSettings,
          advancedSettings
        }
        localStorage.setItem('app_settings', JSON.stringify(settings))
        
        // 应用设置
        applySettings()

        // 将设置同步到服务器
        try {
          await axios.post('/api/settings', {
            storagePath: dataSettings.storagePath,
            apiPort: advancedSettings.apiPort,
            logLevel: advancedSettings.logLevel,
            enableLogging: advancedSettings.enableLogging,
            enablePerformanceMonitoring: advancedSettings.enablePerformanceMonitoring
          })
          ElMessage.success('设置保存成功并同步到服务器')
        } catch (error) {
          console.error('设置同步到服务器失败', error)
          ElMessage.warning('设置已保存到本地，但同步到服务器失败')
        }
      } catch (error) {
        console.error('保存设置失败', error)
        ElMessage.error('保存设置失败')
      }
    }
    
    // 重置设置
    const resetSettings = () => {
      ElMessageBox.confirm('确定要重置所有设置吗？这将恢复默认设置。', '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 清除所有定时器
        clearAutoSaveTimer()
        clearBackupTimer()
        clearPerformanceMonitorTimer()

        // 重置UI设置
        Object.assign(uiSettings, {
          primaryColor: '#2D64F0',
          tableDensity: 'default',
          fontSize: 14
        })
        
        // 重置数据设置
        Object.assign(dataSettings, {
          storagePath: 'params',
          autoSave: true,
          autoSaveInterval: 5,
          enableBackup: false,
          backupFrequency: 'daily',
          backupCount: 5
        })
        
        // 重置高级设置
        Object.assign(advancedSettings, {
          enableLogging: false,
          logLevel: 'error',
          enablePerformanceMonitoring: false,
          apiPort: 3001
        })
        
        // 保存重置后的设置
        saveSettings()
        
        ElMessage.success('设置已重置为默认值')
      }).catch(() => {
        // 取消重置
      })
    }
    
    // 选择存储路径
    const selectStoragePath = async () => {
      try {
        // 调用后端API来获取存储路径
        const response = await axios.get('/api/settings/select-path')
        if (response.data && response.data.path) {
          dataSettings.storagePath = response.data.path
          ElMessage.success('已选择新的存储路径')
        }
      } catch (error) {
        console.error('选择存储路径失败', error)
        ElMessage.error('选择存储路径失败')
      }
    }
    
    // 重启服务器
    const restartServer = async () => {
      ElMessageBox.confirm('确定要应用新的API端口并重启服务器吗？', '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 调用后端API来重启服务器
          const response = await axios.post('/api/settings/restart-server', {
            apiPort: advancedSettings.apiPort
          })
          
          if (response.data && response.data.success) {
            ElMessage.success(`API端口已更新为${advancedSettings.apiPort}，服务器正在重启`)
            
            // 延迟几秒后尝试连接新端口
            setTimeout(() => {
              window.location.port = advancedSettings.apiPort
              window.location.reload()
            }, 5000)
          } else {
            ElMessage.error('服务器重启失败')
          }
        } catch (error) {
          console.error('重启服务器失败', error)
          ElMessage.error('重启服务器失败')
        }
      }).catch(() => {
        // 取消重启
      })
    }
    
    // 应用设置
    const applySettings = () => {
      // 应用UI设置
      applyColorTheme(uiSettings.primaryColor)
      document.documentElement.style.setProperty('--app-font-size', `${uiSettings.fontSize}px`)
      
      // 应用表格密度
      const tableDensityClass = `table-density-${uiSettings.tableDensity}`
      document.body.classList.remove('table-density-default', 'table-density-compact', 'table-density-loose')
      document.body.classList.add(tableDensityClass)
      
      // 设置自动保存
      setupAutoSave()
      
      // 设置备份
      setupBackup()
      
      // 设置性能监控
      setupPerformanceMonitor()
      
      // 设置日志级别
      setupLogging()
      
      console.log('应用设置', {uiSettings, dataSettings, advancedSettings})
    }

    // 设置自动保存
    const setupAutoSave = () => {
      // 清除旧的自动保存定时器
      clearAutoSaveTimer()
      
      // 如果启用了自动保存，设置新的定时器
      if (dataSettings.autoSave) {
        autoSaveTimer.value = setInterval(() => {
          saveDataToServer()
        }, dataSettings.autoSaveInterval * 60 * 1000) // 转换为毫秒
        
        console.log(`已启用自动保存，间隔${dataSettings.autoSaveInterval}分钟`)
      }
    }
    
    // 清除自动保存定时器
    const clearAutoSaveTimer = () => {
      if (autoSaveTimer.value) {
        clearInterval(autoSaveTimer.value)
        autoSaveTimer.value = null
      }
    }
    
    // 保存数据到服务器
    const saveDataToServer = async () => {
      try {
        // 触发自动保存事件
        document.dispatchEvent(new CustomEvent('auto-save'))
        
        // 这里实际上应该调用API进行保存，或者由各个组件自己处理
        console.log('自动保存触发', new Date().toLocaleTimeString())
        
        // 模拟调用API
        await axios.post('/api/auto-save', { timestamp: Date.now() })
          .catch(err => console.log('自动保存API调用失败', err))
      } catch (error) {
        console.error('自动保存失败', error)
      }
    }
    
    // 设置备份
    const setupBackup = () => {
      // 清除旧的备份定时器
      clearBackupTimer()
      
      // 如果启用了备份，设置新的定时器
      if (dataSettings.enableBackup) {
        // 根据频率设置不同的时间间隔
        let interval
        switch (dataSettings.backupFrequency) {
          case 'daily':
            interval = 24 * 60 * 60 * 1000 // 每天
            break
          case 'weekly':
            interval = 7 * 24 * 60 * 60 * 1000 // 每周
            break
          case 'monthly':
            interval = 30 * 24 * 60 * 60 * 1000 // 每月
            break
          default:
            interval = 24 * 60 * 60 * 1000 // 默认每天
        }
        
        // 设置定时器
        backupTimer.value = setInterval(() => {
          createBackup()
        }, interval)
        
        // 立即创建一次备份
        createBackup()
        
        console.log(`已启用自动备份，频率为${dataSettings.backupFrequency}`)
      }
    }
    
    // 清除备份定时器
    const clearBackupTimer = () => {
      if (backupTimer.value) {
        clearInterval(backupTimer.value)
        backupTimer.value = null
      }
    }
    
    // 创建备份
    const createBackup = async () => {
      try {
        // 调用API创建备份
        const response = await axios.post('/api/backup', {
          backupCount: dataSettings.backupCount
        })
        
        if (response.data && response.data.success) {
          console.log('备份创建成功', response.data)
        } else {
          console.error('备份创建失败', response.data)
        }
      } catch (error) {
        console.error('备份创建失败', error)
      }
    }
    
    // 设置性能监控
    const setupPerformanceMonitor = () => {
      // 清除旧的性能监控定时器
      clearPerformanceMonitorTimer()
      
      // 如果启用了性能监控，设置新的定时器
      if (advancedSettings.enablePerformanceMonitoring) {
        // 设置定时器，每秒检查一次性能
        performanceMonitorTimer.value = setInterval(() => {
          monitorPerformance()
        }, 1000)
        
        console.log('已启用性能监控')
      }
    }
    
    // 清除性能监控定时器
    const clearPerformanceMonitorTimer = () => {
      if (performanceMonitorTimer.value) {
        clearInterval(performanceMonitorTimer.value)
        performanceMonitorTimer.value = null
      }
    }
    
    // 监控性能
    const monitorPerformance = () => {
      try {
        // 获取性能数据
        const perfData = {
          memory: window.performance.memory ? {
            jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit,
            totalJSHeapSize: window.performance.memory.totalJSHeapSize,
            usedJSHeapSize: window.performance.memory.usedJSHeapSize
          } : null,
          navigation: window.performance.getEntriesByType('navigation'),
          resources: window.performance.getEntriesByType('resource'),
          timing: window.performance.timing
        }
        
        // 将性能数据发送到服务器
        axios.post('/api/performance', perfData)
          .catch(err => console.log('性能数据发送失败', err))
        
        // 检查内存使用情况
        if (perfData.memory && perfData.memory.usedJSHeapSize > 0.8 * perfData.memory.jsHeapSizeLimit) {
          // 内存使用过高警告
          console.warn('内存使用过高：', (perfData.memory.usedJSHeapSize / perfData.memory.jsHeapSizeLimit * 100).toFixed(2) + '%')
        }
      } catch (error) {
        console.error('性能监控错误', error)
      }
    }
    
    // 设置日志级别
    const setupLogging = () => {
      // 根据日志级别设置控制台日志方法
      const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug
      }
      
      // 如果禁用了日志
      if (!advancedSettings.enableLogging) {
        // 静默所有非错误日志
        console.log = () => {}
        console.info = () => {}
        console.warn = () => {}
        console.debug = () => {}
        return
      }
      
      // 恢复所有原始日志方法
      console.log = originalConsole.log
      console.info = originalConsole.info
      console.warn = originalConsole.warn
      console.error = originalConsole.error
      console.debug = originalConsole.debug
      
      // 根据日志级别禁用一些方法
      switch (advancedSettings.logLevel) {
        case 'error':
          console.log = () => {}
          console.info = () => {}
          console.warn = () => {}
          console.debug = () => {}
          break
        case 'warn':
          console.log = () => {}
          console.info = () => {}
          console.debug = () => {}
          break
        case 'info':
          console.debug = () => {}
          break
        case 'debug':
          // 保留所有日志
          break
      }
      
      console.log(`日志级别设置为${advancedSettings.logLevel}`)
    }

    // 监听设置变化以实时应用
    watch(() => dataSettings.autoSave, (newValue) => {
      if (initialized.value) {
        setupAutoSave()
      }
    })
    
    watch(() => dataSettings.autoSaveInterval, (newValue) => {
      if (initialized.value && dataSettings.autoSave) {
        setupAutoSave()
      }
    })
    
    watch(() => dataSettings.enableBackup, (newValue) => {
      if (initialized.value) {
        setupBackup()
      }
    })
    
    watch(() => dataSettings.backupFrequency, (newValue) => {
      if (initialized.value && dataSettings.enableBackup) {
        setupBackup()
      }
    })
    
    watch(() => advancedSettings.enablePerformanceMonitoring, (newValue) => {
      if (initialized.value) {
        setupPerformanceMonitor()
      }
    })
    
    watch(() => advancedSettings.enableLogging, (newValue) => {
      if (initialized.value) {
        setupLogging()
      }
    })
    
    watch(() => advancedSettings.logLevel, (newValue) => {
      if (initialized.value && advancedSettings.enableLogging) {
        setupLogging()
      }
    })
    
    // 应用颜色主题
    const applyColorTheme = (color) => {
      if (!color) return
      
      // 设置主色调变量
      document.documentElement.style.setProperty('--el-color-primary', color)
      
      // 生成不同深浅的主色调
      const colorObj = new Color(color)
      
      // 设置主色调的不同深浅
      for (let i = 1; i <= 9; i++) {
        let lightColor
        if (i === 2) {
          lightColor = colorObj.lighten(0.2)
        } else if (i === 3) {
          lightColor = colorObj.lighten(0.3)
        } else if (i === 4) {
          lightColor = colorObj.lighten(0.4)
        } else if (i === 5) {
          lightColor = colorObj.lighten(0.5)
        } else if (i === 6) {
          lightColor = colorObj.lighten(0.6)
        } else if (i === 7) {
          lightColor = colorObj.lighten(0.7)
        } else if (i === 8) {
          lightColor = colorObj.lighten(0.8)
        } else if (i === 9) {
          lightColor = colorObj.lighten(0.9)
        } else {
          lightColor = colorObj.lighten(0.1)
        }
        document.documentElement.style.setProperty(`--el-color-primary-light-${i}`, lightColor.toHexString())
      }
      
      // 设置主色调的暗色
      const darkColor = colorObj.darken(0.1)
      document.documentElement.style.setProperty('--el-color-primary-dark-2', darkColor.toHexString())
    }
    
    // 选择预设颜色
    const selectPresetColor = (color) => {
      uiSettings.primaryColor = color
      applyColorTheme(color)
    }
    
    // 组件卸载时的清理工作
    const cleanup = () => {
      clearAutoSaveTimer()
      clearBackupTimer()
      clearPerformanceMonitorTimer()
    }
    
    onMounted(() => {
      loadSettings()
      applySettings()
      initialized.value = true
      
      // 组件卸载时进行清理
      return cleanup
    })
    
    return {
      uiSettings,
      dataSettings,
      advancedSettings,
      predefineColors,
      saveSettings,
      resetSettings,
      selectStoragePath,
      restartServer,
      selectPresetColor,
      applyColorTheme
    }
  }
}
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.settings-description {
  color: #909399;
  margin-bottom: 20px;
}

.settings-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-suffix {
  margin-left: 10px;
  color: #909399;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* 颜色选择器样式 */
.color-picker-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-preview {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.color-value {
  font-size: 14px;
  color: #606266;
}

.color-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.color-preset-item {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  transition: transform 0.2s;
}

.color-preset-item:hover {
  transform: scale(1.1);
}

/* 自定义CSS变量 */
:root {
  --app-font-size: 14px;
}

/* 表格密度样式 */
:deep(.table-density-compact .el-table td),
:deep(.table-density-compact .el-table th) {
  padding: 4px 0;
}

:deep(.table-density-loose .el-table td),
:deep(.table-density-loose .el-table th) {
  padding: 12px 0;
}
</style>
