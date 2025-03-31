<template>
  <div class="case-edit-container">
    <div class="header-actions">
      <h2>{{ isNew ? '创建案例' : '编辑案例' }}</h2>
      <div class="header-buttons">
        <el-button @click="goBack" :icon="Back">返回</el-button>
        <el-dropdown v-if="!isNew" @command="handleExport" split-button type="success">
          导出
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="exportCase">导出整个案例</el-dropdown-item>
              <el-dropdown-item command="exportCaseJson">导出案例配置</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" @click="saveCase" :icon="Check">保存</el-button>
      </div>
    </div>

    <el-card class="case-info-card" shadow="hover">
      <el-form :model="caseData" label-width="120px" :rules="rules" ref="caseForm">
        <el-form-item label="案例名称" prop="caseName">
          <el-input 
            v-model="caseData.caseName" 
            placeholder="请输入案例名称（仅限英文、数字和下划线）"
            :maxlength="50"
            show-word-limit
            clearable
          >
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
          </el-input>
          <div class="form-item-tip">提示：案例名称只能包含英文字母、数字和下划线</div>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="section-header">
      <div class="section-title">
        <el-icon><List /></el-icon>
        <h3>功能步骤</h3>
        <el-tag type="info" class="step-count">{{ caseData.functions.length }}个步骤</el-tag>
      </div>
      <el-button type="primary" size="small" @click="addFunction" :icon="Plus">添加功能</el-button>
    </div>
    
    <el-table 
      ref="functionTable"
      :data="caseData.functions" 
      style="width: 100%; margin-top: 15px;"
      border
      stripe
      highlight-current-row
      row-key="functionStep"
      :row-class-name="tableRowClassName"
      >
      <el-table-column type="index" label="序号" width="80" align="center">
        <template #default="scope">
          <div class="drag-handle">
            <el-icon class="drag-icon"><Rank /></el-icon>
            <span>{{ scope.$index + 1 }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="功能键名" min-width="200">
        <template #default="scope">
          <div class="drag-handle">
            <el-select
              v-model="scope.row.funcKey"
              filterable
              clearable
              placeholder="请选择功能键名"
              :class="{'is-warning': !scope.row.funcKey}"
            >
              <el-option
                v-for="option in functionOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              >
                <span style="float: left">{{ option.value }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">
                  {{ option.entryPath }}
                </span>
              </el-option>
            </el-select>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="功能步骤名称" min-width="200">
        <template #default="scope">
          <el-input 
            v-model="scope.row.functionStep" 
            placeholder="步骤名称"
            size="small"
            clearable
            :class="{'is-warning': !scope.row.functionStep}"
          >
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
          </el-input>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="360" fixed="right" align="center">
        <template #default="scope">
            <el-tooltip content="编辑参数" placement="top">
              <el-button 
                type="primary" 
                :plain="true"
                size="small" 
                @click="editFunction(scope.row, scope.$index)" 
                :icon="Edit"
              >
                编辑参数
              </el-button>
            </el-tooltip>
            <el-tooltip content="编辑钩子" placement="top">
              <el-button 
                type="success" 
                :plain="true"
                size="small" 
                @click="editHooks(scope.row, scope.$index)" 
                :icon="Setting"
              >
                编辑钩子
              </el-button>
            </el-tooltip>
            <el-tooltip content="删除步骤" placement="top">
              <el-button 
                type="danger" 
                :plain="true"
                size="small" 
                @click="confirmRemoveFunction(scope.$index)" 
                :icon="Delete"
              >
                删除
              </el-button>
            </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <el-empty 
      v-if="caseData.functions.length === 0" 
      :image-size="200"
      description="暂无功能步骤">
      <template #description>
        <div class="empty-description">
          <p>暂无功能步骤</p>
          <p class="empty-sub-text">点击下方按钮添加第一个功能步骤</p>
        </div>
      </template>
      <el-button type="primary" @click="addFunction" :icon="Plus">添加第一个功能</el-button>
    </el-empty>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCase, saveCase as saveCaseApi, getFunctionList } from '../api/caseApi'
import { addFunctionToList, exportCase, exportCaseJson, exportFunction } from '../api/functionApi'
import { 
  ArrowLeft as Back,
  Check,
  Document,
  Key,
  List,
  Edit,
  Setting,
  Delete,
  Plus,
  Rank
} from '@element-plus/icons-vue'
import Sortable from 'sortablejs'

export default {
  components: {
    Back,
    Check,
    Document,
    Key,
    List,
    Edit,
    Setting,
    Delete,
    Plus,
    Rank
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const caseName = computed(() => route.params.caseId)
    const isNew = computed(() => caseName.value === 'NewCaseName')
    const caseForm = ref(null)
    const functionTable = ref(null)
    
    const caseData = ref({
      caseName: isNew.value ? `NEW_CASE_NAME_${new Date().getTime()}` : '',
      functions: []
    })
    
    // 添加功能键选项列表
    const functionOptions = ref([])
    
    const rules = {
      caseName: [
        { required: true, message: '请输入案例名称', trigger: 'blur' },
        { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' },
        { pattern: /^[A-Za-z0-9_]+$/, message: '只能使用英文、数字和下划线', trigger: 'blur' }
      ]
    }
    
    const availableFunctions = ref([])

    onMounted(async () => {
      try {
        // 获取功能列表
        const funcList = await getFunctionList()
        functionOptions.value = funcList.map(func => ({
          value: func.funcKey,
          label: `${func.funcKey} (${func.entryPath})`,
          entryPath: func.entryPath
        }))
        
        availableFunctions.value = funcList
        
        if (!isNew.value) {
          const data = await getCase(caseName.value)
          
          caseData.value = {
            caseName: caseName.value || 'NewCaseName',
            functions: Array.isArray(data) ? data : []
          }
        }

        // 初始化拖拽排序
        nextTick(() => {
          const tbody = functionTable.value.$el.querySelector('.el-table__body-wrapper tbody')
          new Sortable(tbody, {
            handle: '.drag-handle',
            animation: 150,
            onEnd({ newIndex, oldIndex }) {
              const currRow = caseData.value.functions.splice(oldIndex, 1)[0]
              caseData.value.functions.splice(newIndex, 0, currRow)
              
              // 更新步骤名称（仅当未自定义名称时）
              caseData.value.functions.forEach((func, index) => {
                if (!func.functionStep) {
                  func.functionStep = `步骤${index + 1}`
                }
              })
              
              ElMessage.success('功能步骤顺序已更新')
            }
          })
        })
      } catch (error) {
        ElMessage.error('获取数据失败')
        console.error('获取案例数据出错:', error)
      }
    })

    const goBack = () => {
      router.push('/')
    }

    const saveCase = async () => {
      try {
        // 验证表单
        await caseForm.value.validate()

        // 验证功能键名
        for (const func of caseData.value.functions) {
          if (!func.funcKey) {
            ElMessage.warning('请填写所有功能键名')
            return
          }
          if (!func.functionStep) {
            ElMessage.warning('请填写所有功能步骤名称')
            return
          }
        }
        
        console.log('准备保存案例:', { 
          isNew: isNew.value, 
          caseName: caseData.value.caseName,
          functionCount: caseData.value.functions.length
        })
        
        // 发送保存请求
        const result = await saveCaseApi({
          caseName: caseData.value.caseName,
          functions: caseData.value.functions
        })
        
        console.log('保存案例成功，结果:', result)
        
        // 如果有新的功能键名，添加到功能列表
        if (caseData.value.functions && caseData.value.functions.length > 0) {
          try {
            for (const func of caseData.value.functions) {
              if (func.funcKey) {
                // 尝试添加到功能列表，但不阻塞主流程
                await addFunctionToList(func.funcKey).catch(e => console.warn('添加功能到列表失败', e))
              }
            }
          } catch (error) {
            console.warn('更新功能列表失败', error)
          }
        }
        
        ElMessage.success('保存成功')
        
        if (isNew.value) {
          // 重定向到新创建的案例
          console.log('重定向到新案例:', caseData.value.caseName)
          router.push(`/case/${caseData.value.caseName}`)
        }
      } catch (error) {
        if (error === false) {
          ElMessage.warning('请完善表单信息')
        } else {
          console.error('保存失败', error)
          ElMessage.error('保存失败: ' + (error.response?.data?.error || error.message || '未知错误'))
        }
      }
    }

    const addFunction = () => {
      caseData.value.functions.push({
        funcKey: '',
        functionStep: `步骤${caseData.value.functions.length + 1}`,
        preFuncDataMapping: {}
      })
    }

    const editFunction = (func, index) => {
      if (!func.functionStep) {
        ElMessage.warning('请先填写步骤名称')
        return
      }
      const targetCaseName = isNew.value ? caseData.value.caseName : caseName.value
      router.push(`/case/${targetCaseName}/function/${func.functionStep}`)
    }

    const editHooks = (func, index) => {
      if (!func.functionStep) {
        ElMessage.warning('请先填写步骤名称')
        return
      }
      const targetCaseName = isNew.value ? caseData.value.caseName : caseName.value
      router.push(`/case/${targetCaseName}/hooks/${func.functionStep}`)
    }

    const confirmRemoveFunction = (index) => {
      ElMessageBox.confirm('确定要删除此功能步骤吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        removeFunction(index)
      }).catch(() => {})
    }

    const removeFunction = (index) => {
      caseData.value.functions.splice(index, 1)
      ElMessage.success('删除成功')
    }
    
    // 处理导出操作
    const handleExport = (command) => {
      if (isNew.value) {
        ElMessage.warning('请先保存案例')
        return
      }
      
      switch (command) {
        case 'exportCase':
          exportCase(caseName.value)
          ElMessage.success('案例导出中...')
          break
        case 'exportCaseJson':
          exportCaseJson(caseName.value)
          ElMessage.success('案例配置导出中...')
          break
      }
    }

    const tableRowClassName = ({ row }) => {
      if (row.functionStep === '步骤1') {
        return 'first-row';
      }
      return '';
    };

    return {
      caseName,
      isNew,
      caseData,
      availableFunctions,
      functionOptions,
      caseForm,
      rules,
      Back,
      Check,
      Document,
      Key,
      List,
      Edit,
      Setting,
      Delete,
      Plus,
      Rank,
      goBack,
      saveCase,
      addFunction,
      editFunction,
      editHooks,
      confirmRemoveFunction,
      handleExport,
      tableRowClassName,
      functionTable
    }
  }
}
</script>

<style scoped>
.case-edit-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 48px);
  max-width: 1200px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background-color: white;
  padding: 20px 24px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.header-actions h2 {
  margin: 0;
  color: #303133;
  font-size: 22px;
  font-weight: 600;
}

.header-buttons {
  display: flex;
  gap: 12px;
}

.case-info-card {
  margin-bottom: 32px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.case-info-card :deep(.el-card__body) {
  padding: 24px;
}

.case-info-card :deep(.el-form-item) {
  margin-bottom: 24px;
}

.case-info-card :deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

.case-info-card :deep(.el-input__wrapper) {
  padding: 0 16px;
  height: 40px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

.case-info-card :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

.case-info-card :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #2D64F0 inset;
}

.form-item-tip {
  font-size: 13px;
  color: #909399;
  margin-top: 6px;
  line-height: 1.4;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 32px 0 24px;
  background-color: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 500;
}

.step-count {
  margin-left: 8px;
  font-size: 13px;
  height: 24px;
  line-height: 24px;
  padding: 0 10px;
}

:deep(.el-table) {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  margin-bottom: 24px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 500;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-table td) {
  padding: 16px 0;
}

:deep(.el-table .el-input.is-warning .el-input__wrapper) {
  box-shadow: 0 0 0 1px #e6a23c inset;
}

:deep(.el-button-group) {
  display: flex;
  border-right-color: none;
}

:deep(.el-empty) {
  background-color: white;
  padding: 48px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  margin-top: 24px;
}

.empty-description {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 16px 0;
}

.empty-description p {
  margin: 0;
  color: #606266;
}

.empty-sub-text {
  color: #909399;
  font-size: 13px;
}

:deep(.el-table__row) {
  transition: all 0.3s ease;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

:deep(.el-input__inner) {
  height: 32px;
  line-height: 32px;
}

:deep(.el-button--small) {
  padding: 8px 16px;
  font-size: 13px;
}

:deep(.el-button-group .el-button--small) {
  padding: 8px 12px;
}

/* 添加下拉框样式 */
:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  padding: 0 8px;
}

:deep(.el-select-dropdown__item) {
  padding: 0 12px;
  height: 34px;
  line-height: 34px;
}

.drag-handle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: move;
  padding: 0 4px;
}

.drag-icon {
  font-size: 16px;
  color: #909399;
}

.drag-handle:hover .drag-icon {
  color: #409EFF;
}

.first-row {
  background-color: #f0f0f0;
}
</style>