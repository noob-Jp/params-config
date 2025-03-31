<template>
  <div class="import-export-panel">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ title }}</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <!-- 导出选项卡 -->
        <el-tab-pane label="导出" name="export">
          <el-form label-position="top">
            <el-form-item label="选择导出内容">
              <el-radio-group v-model="exportType">
                <el-radio label="current">当前{{ entityName }}</el-radio>
                <el-radio label="selected">选中的{{ entityNamePlural }}</el-radio>
                <el-radio label="all">所有{{ entityNamePlural }}</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item v-if="exportType === 'selected'" label="选择要导出的项目">
              <el-select
                v-model="selectedItems"
                multiple
                filterable
                placeholder="请选择要导出的项目"
                style="width: 100%"
              >
                <el-option
                  v-for="item in itemList"
                  :key="item.id || item.name"
                  :label="item.name || item.caseName || item.funcKey"
                  :value="item.id || item.name || item.caseName || item.funcKey"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="导出选项">
              <el-checkbox v-model="exportOptions.includeMetadata">包含元数据</el-checkbox>
              <el-checkbox v-model="exportOptions.prettyPrint">格式化JSON</el-checkbox>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="handleExport" :loading="exporting">
                导出{{ entityName }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 导入选项卡 -->
        <el-tab-pane label="导入" name="import">
          <el-form label-position="top">
            <el-form-item label="选择导入文件">
              <el-upload
                class="upload-demo"
                drag
                action="#"
                :auto-upload="false"
                :on-change="handleFileChange"
                :limit="1"
                accept=".json"
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  拖拽文件到此处或 <em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    只能上传JSON文件
                  </div>
                </template>
              </el-upload>
            </el-form-item>
            
            <el-form-item label="导入选项">
              <el-checkbox v-model="importOptions.overwrite">覆盖已存在的项目</el-checkbox>
              <el-checkbox v-model="importOptions.validateBeforeImport">导入前验证</el-checkbox>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="handleImport" :loading="importing" :disabled="!selectedFile">
                导入{{ entityName }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { 
  exportToJson, 
  importFromJson, 
  exportCase, 
  exportFunctionList, 
  validateImportData 
} from '../utils/importExport'

export default {
  components: {
    UploadFilled
  },
  props: {
    // 面板标题
    title: {
      type: String,
      default: '导入/导出'
    },
    // 实体名称（单数）
    entityName: {
      type: String,
      default: '数据'
    },
    // 实体名称（复数）
    entityNamePlural: {
      type: String,
      default: '数据'
    },
    // 当前项目
    currentItem: {
      type: Object,
      default: () => ({})
    },
    // 项目列表
    itemList: {
      type: Array,
      default: () => []
    },
    // 导入导出类型 (case, function, full)
    dataType: {
      type: String,
      default: 'case'
    }
  },
  emits: ['import-success', 'export-success'],
  setup(props, { emit }) {
    const activeTab = ref('export')
    const exportType = ref('current')
    const selectedItems = ref([])
    const selectedFile = ref(null)
    const exporting = ref(false)
    const importing = ref(false)
    
    // 导出选项
    const exportOptions = ref({
      includeMetadata: true,
      prettyPrint: true
    })
    
    // 导入选项
    const importOptions = ref({
      overwrite: false,
      validateBeforeImport: true
    })
    
    // 获取要导出的数据
    const getExportData = () => {
      switch (exportType.value) {
        case 'current':
          return props.currentItem
          
        case 'selected':
          if (selectedItems.value.length === 0) {
            ElMessage.warning('请选择要导出的项目')
            return null
          }
          
          // 根据选择的ID/名称筛选项目
          return props.itemList.filter(item => {
            const itemId = item.id || item.name || item.caseName || item.funcKey
            return selectedItems.value.includes(itemId)
          })
          
        case 'all':
          return props.itemList
          
        default:
          return null
      }
    }
    
    // 处理导出
    const handleExport = () => {
      const data = getExportData()
      if (!data) return
      
      exporting.value = true
      
      try {
        let success = false
        
        // 根据数据类型选择不同的导出方法
        switch (props.dataType) {
          case 'case':
            if (Array.isArray(data)) {
              // 导出多个案例
              success = exportToJson(data, `cases_export_${Date.now()}.json`)
            } else {
              // 导出单个案例
              success = exportCase(data, data.caseName)
            }
            break
            
          case 'function':
            success = exportFunctionList(data)
            break
            
          default:
            success = exportToJson(data, `data_export_${Date.now()}.json`)
        }
        
        if (success) {
          emit('export-success', data)
        }
      } catch (error) {
        console.error('导出失败', error)
        ElMessage.error(`导出失败: ${error.message}`)
      } finally {
        exporting.value = false
      }
    }
    
    // 处理文件选择
    const handleFileChange = (file) => {
      selectedFile.value = file.raw
    }
    
    // 处理导入
    const handleImport = async () => {
      if (!selectedFile.value) {
        ElMessage.warning('请选择要导入的文件')
        return
      }
      
      importing.value = true
      
      try {
        // 从文件导入数据
        const data = await importFromJson(selectedFile.value)
        
        // 验证数据
        if (importOptions.value.validateBeforeImport) {
          const isValid = validateImportData(data, props.dataType)
          if (!isValid) {
            ElMessage.error('导入的数据格式不正确')
            importing.value = false
            return
          }
        }
        
        // 导入成功，通知父组件
        emit('import-success', {
          data,
          options: importOptions.value
        })
        
        ElMessage.success('导入成功')
      } catch (error) {
        console.error('导入失败', error)
        ElMessage.error(`导入失败: ${error.message}`)
      } finally {
        importing.value = false
      }
    }
    
    return {
      activeTab,
      exportType,
      selectedItems,
      exportOptions,
      importOptions,
      selectedFile,
      exporting,
      importing,
      handleExport,
      handleFileChange,
      handleImport
    }
  }
}
</script>

<style scoped>
.import-export-panel {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>
