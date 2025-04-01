<template>
  <div class="settings-container">
    <h2>系统设置</h2>
    <p class="settings-description">自定义参数配置工具的设置</p>

    <div class="settings-actions">
      <el-button type="primary" @click="saveSettings">保存设置</el-button>
      <el-button @click="resetSettings">重置设置</el-button>
    </div>

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
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload, Warning } from '@element-plus/icons-vue'
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
    }
  } catch (error) {
    console.error('加载设置失败', error)
    ElMessage.error('加载设置失败')
  }
}

// 保存设置
const saveSettings = () => {
  try {
    // 保存设置到本地存储
    const settings = {
      uiSettings
    }
    localStorage.setItem('app_settings', JSON.stringify(settings))
    
    // 应用设置
    applySettings()
    
    ElMessage.success('设置保存成功')
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
    // 重置UI设置
    Object.assign(uiSettings, {
      primaryColor: '#2D64F0',
      tableDensity: 'default',
      fontSize: 14
    })
    
    // 保存重置后的设置
    saveSettings()
    
    ElMessage.success('设置已重置为默认值')
  }).catch(() => {
    // 取消重置
  })
}

// 应用设置
const applySettings = () => {
  // 应用UI设置
  applyColorTheme(uiSettings.primaryColor)
}

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

onMounted(() => {
  loadSettings()
  applySettings()
})
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
