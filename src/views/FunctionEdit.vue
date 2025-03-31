<template>
  <div class="function-edit-container">
    <div class="header-actions">
      <h2>编辑执行操作</h2>
      <div class="button-group">
        <el-input
          v-model="searchQuery"
          placeholder="搜索操作ID或名称"
          prefix-icon="Search"
          clearable
          @input="handleSearch"
          style="width: 250px; margin-right: 10px;"
        />
        <el-button @click="goBack" :icon="Back">返回</el-button>
        <el-dropdown @command="handleExport" split-button type="success">
          导出
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="exportFunction">导出执行操作</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" @click="saveFunction" :icon="Check">保存</el-button>
      </div>
    </div>

    <el-card class="function-info-card">
      <el-form label-width="120px">
        <el-form-item label="功能步骤名称">
          <el-input v-model="functionName" disabled></el-input>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="section-header">
      <div class="section-title">
        <el-icon><List /></el-icon>
        <h3>执行操作配置</h3>
        <el-tag type="info" class="operation-count">{{ functionData.length }}个操作</el-tag>
      </div>
      <el-button type="primary" @click="addOperation" :icon="Plus">添加操作</el-button>
    </div>

    <el-table 
      :data="filteredOperations" 
      style="width: 100%; margin-top: 15px;"
      border
      stripe
      highlight-current-row>
      <el-table-column type="index" label="序号" width="80" align="center" />
      <el-table-column label="操作ID" min-width="180">
        <template #default="scope">
          <el-input 
            v-model="scope.row.operationId" 
            placeholder="请输入操作ID"
            :class="{'is-warning': !scope.row.operationId}">
          </el-input>
        </template>
      </el-table-column>
      <el-table-column label="操作名称" min-width="180">
        <template #default="scope">
          <el-input 
            v-model="scope.row.operationName" 
            placeholder="请输入操作名称"
            :class="{'is-warning': !scope.row.operationName}">
          </el-input>
        </template>
      </el-table-column>
      <el-table-column label="操作类型" min-width="150">
        <template #default="scope">
          <el-select 
            v-model="scope.row.operationType" 
            placeholder="请选择操作类型"
            style="width: 100%">
            <el-option label="点击" value="click" />
            <el-option label="输入" value="input" />
            <el-option label="选择" value="select" />
            <el-option label="验证" value="verify" />
            <el-option label="等待" value="wait" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="目标元素" min-width="180">
        <template #default="scope">
          <el-input 
            v-model="scope.row.targetElement" 
            placeholder="请输入目标元素"
            :class="{'is-warning': !scope.row.targetElement}">
          </el-input>
        </template>
      </el-table-column>
      <el-table-column label="操作值" min-width="180">
        <template #default="scope">
          <el-input 
            v-model="scope.row.operationValue" 
            placeholder="请输入操作值">
          </el-input>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-button 
            type="danger" 
            :plain="true"
            size="small" 
            @click="confirmRemoveOperation(scope.$index)" 
            :icon="Delete">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="functionData.length === 0" description="暂无执行操作配置，请添加">
      <el-button type="primary" @click="addOperation" :icon="Plus">添加第一个操作</el-button>
    </el-empty>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFunctionData, saveFunctionData, exportFunction } from '../api/functionApi'
import { 
  ArrowLeft as Back, 
  Check, 
  Plus, 
  Delete,
  Search,
  List
} from '@element-plus/icons-vue'

export default {
  components: {
    Back,
    Check,
    Plus,
    Delete,
    Search,
    List
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const caseName = computed(() => route.params.caseId)
    const functionName = computed(() => route.params.functionName)
    const searchQuery = ref('')
    
    const functionData = ref([])

    const filteredOperations = computed(() => {
      if (!searchQuery.value) return functionData.value;
      const query = searchQuery.value.toLowerCase();
      return functionData.value.filter(item => 
        (item.operationId?.toLowerCase().includes(query) || 
         item.operationName?.toLowerCase().includes(query))
      );
    });

    const handleSearch = () => {
      // 搜索功能已通过计算属性实现
      console.log('Searching for:', searchQuery.value);
    };

    onMounted(async () => {
      try {
        console.log(`加载功能[${functionName.value}]数据，案例名称: ${caseName.value}`)
        const data = await getFunctionData(caseName.value, functionName.value)
        functionData.value = data || []
        console.log(`加载到${functionData.value.length}条功能数据:`, functionData.value)
      } catch (error) {
        ElMessage.error('获取数据失败')
        console.error('获取功能数据失败:', error)
      }
    })

    const goBack = () => {
      router.push(`/case/${caseName.value}`)
    }

    const saveFunction = async () => {
      try {
        // 简单验证
        for (const operation of functionData.value) {
          if (!operation.operationId) {
            ElMessage.warning('操作ID不能为空')
            return
          }
          if (!operation.operationName) {
            ElMessage.warning('操作名称不能为空')
            return
          }
          if (!operation.targetElement) {
            ElMessage.warning('目标元素不能为空')
            return
          }
        }
        
        console.log(`准备保存功能[${functionName.value}]数据，共${functionData.value.length}条`)
        await saveFunctionData(caseName.value, functionName.value, functionData.value)
        ElMessage.success('保存成功')
      } catch (error) {
        console.error('保存功能数据失败:', error)
        ElMessage.error('保存失败: ' + (error.response?.data?.error || error.message || '未知错误'))
      }
    }

    const addOperation = () => {
      functionData.value.push({
        operationId: '',
        operationName: '',
        operationType: 'click',
        targetElement: '',
        operationValue: ''
      })
    }

    const confirmRemoveOperation = (index) => {
      ElMessageBox.confirm('确定要删除此操作吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        removeOperation(index)
      }).catch(() => {})
    }

    const removeOperation = (index) => {
      functionData.value.splice(index, 1)
      ElMessage.success('删除成功')
    }

    // 处理导出操作
    const handleExport = (command) => {
      switch (command) {
        case 'exportFunction':
          exportFunction(caseName.value, functionName.value)
          ElMessage.success('功能步骤导出中...')
          break
      }
    }

    return {
      caseName,
      functionName,
      functionData,
      searchQuery,
      filteredOperations,
      handleSearch,
      goBack,
      saveFunction,
      addOperation,
      confirmRemoveOperation,
      handleExport
    }
  }
}
</script>

<style scoped>
.function-edit-container {
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

.button-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.function-info-card {
  margin-bottom: 32px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 24px 0 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.operation-count {
  margin-left: 8px;
}

:deep(.el-input__wrapper) {
  padding: 0 12px;
}

:deep(.el-input__wrapper.is-warning) {
  box-shadow: 0 0 0 1px #e6a23c inset;
}
</style> 