<template>
  <div class="function-list-container">
    <div class="header-actions">
      <h2>功能列表</h2>
      <div class="button-group">
        <el-button @click="goToHome" :icon="Back">返回首页</el-button>
        <el-dropdown @command="handleExport" split-button type="success">
          导出
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="exportFunctionList">导出功能列表</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" @click="showAddFunctionDialog" :icon="Plus">添加功能</el-button>
      </div>
    </div>
    
    <el-table 
      :data="functionList" 
      style="width: 100%"
      border
      stripe
      highlight-current-row
      v-loading="loading">
      <el-table-column prop="funcKey" label="功能键名" min-width="180" />
      <el-table-column prop="entryPath" label="入口路径" min-width="180" />
      <el-table-column prop="funcType" label="功能类型" min-width="120" />
      <el-table-column prop="catelogId" label="分类ID" min-width="100" />
      <el-table-column prop="catelogMappingKey" label="映射键" min-width="120" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button size="small" type="primary" @click="editFunction(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="confirmDeleteFunction(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="functionList.length === 0 && !loading" description="暂无功能配置，请添加">
      <el-button type="primary" @click="showAddFunctionDialog">添加第一个功能</el-button>
    </el-empty>

    <!-- 添加/编辑功能对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditing ? '编辑功能' : '添加功能'"
      width="50%"
      destroy-on-close>
      <el-form :model="functionForm" label-width="120px" ref="formRef" :rules="rules">
        <el-form-item label="功能键名" prop="funcKey">
          <el-input v-model="functionForm.funcKey" placeholder="请输入功能键名"></el-input>
        </el-form-item>
        <el-form-item label="入口路径" prop="entryPath">
          <el-input v-model="functionForm.entryPath" placeholder="请输入入口路径"></el-input>
        </el-form-item>
        <el-form-item label="功能类型" prop="funcType">
          <el-select v-model="functionForm.funcType" placeholder="请选择功能类型" style="width: 100%">
            <el-option label="TSP_PM" value="TSP_PM" />
            <el-option label="TSP_RE" value="TSP_RE" />
            <el-option label="PC_PM" value="PC_PM" />
            <el-option label="PC_RE" value="PC_RE" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类ID" prop="catelogId">
          <el-input v-model="functionForm.catelogId" placeholder="请输入分类ID"></el-input>
        </el-form-item>
        <el-form-item label="映射键" prop="catelogMappingKey">
          <el-input v-model="functionForm.catelogMappingKey" placeholder="请输入映射键"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveFunction">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFunctionList } from '../api/caseApi'
import { saveAllFunctions, exportFunctionList } from '../api/functionApi'
import { Plus, ArrowLeft as Back } from '@element-plus/icons-vue'

export default {
  components: {
    Plus,
    Back
  },
  setup() {
    const router = useRouter()
    const functionList = ref([])
    const loading = ref(false)
    const dialogVisible = ref(false)
    const isEditing = ref(false)
    const editingIndex = ref(-1)
    const formRef = ref(null)
    
    const functionForm = ref({
      funcKey: '',
      entryPath: '',
      funcType: '',
      catelogId: '',
      catelogMappingKey: ''
    })
    
    const rules = {
      funcKey: [
        { required: true, message: '请输入功能键名', trigger: 'blur' }
      ]
    }

    // 加载功能列表
    const loadFunctionList = async () => {
      loading.value = true
      try {
        functionList.value = await getFunctionList()
      } catch (error) {
        ElMessage.error('获取功能列表失败')
        console.error('获取功能列表失败:', error)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadFunctionList()
    })

    // 显示添加功能对话框
    const showAddFunctionDialog = () => {
      isEditing.value = false
      editingIndex.value = -1
      functionForm.value = {
        funcKey: '',
        entryPath: '',
        funcType: '',
        catelogId: '',
        catelogMappingKey: ''
      }
      dialogVisible.value = true
    }

    // 显示编辑功能对话框
    const editFunction = (row) => {
      isEditing.value = true
      editingIndex.value = functionList.value.findIndex(item => item.funcKey === row.funcKey)
      functionForm.value = { ...row }
      dialogVisible.value = true
    }

    // 保存功能
    const saveFunction = async () => {
      try {
        await formRef.value.validate()
        
        if (isEditing.value) {
          // 编辑现有功能
          functionList.value[editingIndex.value] = { ...functionForm.value }
        } else {
          // 添加新功能
          // 检查是否已存在
          const exists = functionList.value.some(item => item.funcKey === functionForm.value.funcKey)
          if (exists) {
            ElMessage.warning(`功能键名 "${functionForm.value.funcKey}" 已存在`)
            return
          }
          
          functionList.value.push({ ...functionForm.value })
        }
        
        // 保存到服务器
        await saveToServer()
        
        dialogVisible.value = false
        ElMessage.success(isEditing.value ? '编辑成功' : '添加成功')
      } catch (error) {
        if (error === false) {
          ElMessage.warning('请完善表单信息')
        } else {
          console.error('保存功能失败:', error)
          ElMessage.error('保存失败: ' + (error.response?.data?.error || error.message || '未知错误'))
        }
      }
    }

    // 确认删除功能
    const confirmDeleteFunction = (row) => {
      ElMessageBox.confirm(`确定要删除功能 "${row.funcKey}" 吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteFunction(row)
      }).catch(() => {})
    }

    // 删除功能
    const deleteFunction = async (row) => {
      const index = functionList.value.findIndex(item => item.funcKey === row.funcKey)
      if (index > -1) {
        functionList.value.splice(index, 1)
        // 保存到服务器
        await saveToServer()
        ElMessage.success('删除成功')
      }
    }

    // 保存功能列表到服务器
    const saveToServer = async () => {
      try {
        // 使用API方法保存整个功能列表
        await saveAllFunctions(functionList.value)
      } catch (error) {
        console.error('保存功能列表到服务器失败:', error)
        throw error
      }
    }
    
    // 返回首页
    const goToHome = () => {
      router.push('/')
    }
    
    // 处理导出操作
    const handleExport = (command) => {
      switch (command) {
        case 'exportFunctionList':
          exportFunctionList()
          ElMessage.success('功能列表导出中...')
          break
      }
    }

    return {
      functionList,
      loading,
      dialogVisible,
      isEditing,
      functionForm,
      formRef,
      rules,
      showAddFunctionDialog,
      editFunction,
      saveFunction,
      confirmDeleteFunction,
      goToHome,
      handleExport,
      Plus,
      Back
    }
  }
}
</script>

<style scoped>
.function-list-container {
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 