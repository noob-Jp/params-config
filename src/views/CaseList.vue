<template>
  <div class="case-list-container">
    <div class="header-actions">
      <h2>案例列表</h2>
      <div class="button-group">
        <el-input
          v-model="searchQuery"
          placeholder="搜索案例名称"
          prefix-icon="Search"
          clearable
          @input="handleSearch"
          style="width: 250px; margin-right: 10px;"
        />
        <el-button @click="goToFunctionList" type="success">功能列表管理</el-button>
        <el-button type="primary" @click="createNewCase" :icon="Plus">创建新案例</el-button>
      </div>
    </div>
    
    <el-table 
      :data="filteredCaseList" 
      style="width: 100%"
      border
      stripe
      highlight-current-row
      v-loading="loading">
      <el-table-column prop="caseName" label="案例名称" min-width="200" />
      <el-table-column prop="functionCount" label="功能数量" width="100" align="center" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="editCase(scope.row.caseName)" :icon="Edit">编辑</el-button>
          <el-button size="small" type="danger" @click="confirmDeleteCase(scope.row.caseName)" :icon="Delete">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="caseList.length === 0 && !loading" description="暂无案例，请创建">
      <el-button type="primary" @click="createNewCase">创建第一个案例</el-button>
    </el-empty>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCaseList, deleteCase as deleteCaseApi } from '../api/caseApi'
import { saveAllFunctions, exportFunctionList } from '../api/functionApi'
import { 
  Plus,
  Edit,
  Delete,
  Search
} from '@element-plus/icons-vue'

export default {
  components: {
    Plus,
    Edit,
    Delete,
    Search
  },
  setup() {
    const router = useRouter()
    const caseList = ref([])
    const loading = ref(false)
    const searchQuery = ref('')

    const filteredCaseList = computed(() => {
      if (!searchQuery.value) return caseList.value;
      const query = searchQuery.value.toLowerCase();
      return caseList.value.filter(item => 
        item.caseName.toLowerCase().includes(query)
      );
    });

    const handleSearch = () => {
      // 搜索功能已通过计算属性实现
      console.log('Searching for:', searchQuery.value);
    };

    const loadCaseList = async () => {
      loading.value = true
      try {
        caseList.value = await getCaseList()
      } catch (error) {
        ElMessage.error('获取案例列表失败')
        console.error(error)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadCaseList()
    })

    const createNewCase = () => {
      router.push('/case/NewCaseName')
    }

    const editCase = (caseName) => {
      router.push(`/case/${caseName}`)
    }

    const confirmDeleteCase = (caseName) => {
      ElMessageBox.confirm('确定要删除此案例吗？删除后不可恢复！', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteCase(caseName)
      }).catch(() => {})
    }

    const deleteCase = async (caseName) => {
      try {
        await deleteCaseApi(caseName)
        ElMessage.success('删除成功')
        loadCaseList() // 重新加载列表
      } catch (error) {
        ElMessage.error('删除失败')
        console.error(error)
      }
    }
    
    const goToFunctionList = () => {
      router.push('/functions')
    }

    return {
      caseList,
      loading,
      searchQuery,
      filteredCaseList,
      handleSearch,
      createNewCase,
      editCase,
      confirmDeleteCase,
      goToFunctionList,
      Plus,
      Edit,
      Delete,
      Search
    }
  }
}
</script>

<style scoped>
.case-list-container {
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
</style> 