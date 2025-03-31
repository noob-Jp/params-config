<template>
  <div class="hook-edit-container">
    <div class="header-actions">
      <h2>编辑钩子函数</h2>
      <div class="button-group">
        <el-button @click="goBack" :icon="Back">返回</el-button>
        <el-button type="primary" @click="saveHook" :icon="Check" :disabled="hasErrors">保存</el-button>
        <el-button type="info" @click="formatCode" :icon="MagicStick">格式化</el-button>
      </div>
    </div>

    <el-card class="hook-info-card">
      <el-form label-width="120px">
        <el-form-item label="钩子名称">
          <el-input v-model="hookName" disabled></el-input>
        </el-form-item>
        <el-form-item label="钩子类型">
          <el-radio-group v-model="hookType" @change="handleTypeChange">
            <el-radio label="before">前置钩子</el-radio>
            <el-radio label="after">后置钩子</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="editor-container">
      <div class="editor-header">
        <div class="error-indicator" v-if="hasErrors">
          <el-tag type="danger">存在语法错误</el-tag>
        </div>
      </div>
      <div ref="editorContainer" class="monaco-editor"></div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getHookCode, saveHookCode } from '../api/hookApi'
import { 
  ArrowLeft as Back,
  Check,
  MagicStick
} from '@element-plus/icons-vue'
import monaco from '../monaco-setup'

export default {
  components: {
    Back,
    Check,
    MagicStick
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const caseName = ref(route.params.caseId)
    const hookName = ref(route.params.hookName)
    const hookType = ref(route.params.type || 'before')
    const code = ref('')
    const hasErrors = ref(false)
    const syntaxError = ref('')
    const editorContainer = ref(null)
    let editor = null

    // 获取默认的钩子代码模板
    const getDefaultHookCode = (type) => {
      if (type === 'before') {
        return `/**
 * 前置钩子函数
 * @param {Object} params - 钩子参数
 * @returns {boolean} - 返回true继续执行，返回false中断执行
 */
function beforeHook({ page, preFuncData, next, break: breakLoop }) {
  // 记录日志
  console.log('执行前置处理...');
  
  try {
    // 在这里编写前置处理逻辑
    const processedData = { ...preFuncData };
    
    // 使用next函数传递数据
    if (next) next(processedData);
    
    return true; // 继续执行
  } catch (error) {
    console.error('前置钩子执行错误:', error.message);
    return false; // 出错时终止执行
  }
}`
      } else {
        return `/**
 * 后置钩子函数
 * @param {Object} params - 钩子参数
 * @returns {Object} - 返回处理后的数据
 */
function afterHook({ page, responseData, postData }) {
  // 记录日志
  console.log('执行后置处理...');
  
  try {
    // 在这里编写后置处理逻辑
    return responseData;
  } catch (error) {
    console.error('后置钩子执行错误:', error.message);
    return responseData;
  }
}`
      }
    }

    // 初始化编辑器
    const initEditor = () => {
      if (editor) {
        editor.dispose()
      }

      editor = monaco.editor.create(editorContainer.value, {
        value: code.value,
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        roundedSelection: false,
        readOnly: false,
        cursorStyle: 'line',
        selectOnLineNumbers: true,
        contextmenu: true,
        scrollbar: {
          useShadows: false,
          verticalHasArrows: true,
          horizontalHasArrows: true,
          vertical: 'visible',
          horizontal: 'visible',
          verticalScrollbarSize: 12,
          horizontalScrollbarSize: 12,
        }
      })

      // 监听编辑器内容变化
      editor.onDidChangeModelContent(() => {
        code.value = editor.getValue()
        validateCode()
      })
    }

    // 代码验证函数
    const validateCode = () => {
      try {
        // 简单的语法检查
        new Function(code.value)
        hasErrors.value = false
        syntaxError.value = ''
        
        // 清除编辑器的错误标记
        monaco.editor.setModelMarkers(editor.getModel(), 'javascript', [])
      } catch (error) {
        hasErrors.value = true
        syntaxError.value = error.message
        console.error('代码验证错误:', error.message)
        
        // 在编辑器中标记错误
        const model = editor.getModel()
        const markers = [{
          severity: monaco.MarkerSeverity.Error,
          message: error.message,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: model.getLineCount(),
          endColumn: model.getLineMaxColumn(model.getLineCount())
        }]
        monaco.editor.setModelMarkers(model, 'javascript', markers)
      }
    }

    // 加载钩子代码
    const loadHookCode = async () => {
      try {
        const result = await getHookCode(caseName.value, hookName.value, hookType.value)
        code.value = result || getDefaultHookCode(hookType.value)
        if (editor) {
          editor.setValue(code.value)
        }
        validateCode()
      } catch (error) {
        ElMessage.error('获取钩子代码失败')
        console.error(error)
        code.value = getDefaultHookCode(hookType.value)
        if (editor) {
          editor.setValue(code.value)
        }
      }
    }

    // 处理钩子类型变化
    const handleTypeChange = () => {
      code.value = getDefaultHookCode(hookType.value)
      if (editor) {
        editor.setValue(code.value)
      }
      validateCode()
    }

    // 格式化代码
    const formatCode = () => {
      if (editor) {
        editor.getAction('editor.action.formatDocument').run()
        ElMessage.success('代码格式化完成')
      }
    }

    // 保存钩子代码
    const saveHook = async () => {
      validateCode()

      if (hasErrors.value) {
        ElMessage.warning(`代码存在语法错误: ${syntaxError.value}`)
        return
      }

      try {
        await saveHookCode(caseName.value, hookName.value, hookType.value, code.value)
        ElMessage.success('保存成功')
      } catch (error) {
        ElMessage.error('保存失败')
        console.error(error)
      }
    }

    const goBack = () => {
      router.push(`/case/${caseName.value}`)
    }

    onMounted(() => {
      initEditor()
      loadHookCode()
    })

    onBeforeUnmount(() => {
      if (editor) {
        editor.dispose()
      }
    })

    return {
      caseName,
      hookName,
      hookType,
      code,
      hasErrors,
      editorContainer,
      handleTypeChange,
      formatCode,
      saveHook,
      goBack
    }
  }
}
</script>

<style scoped>
.hook-edit-container {
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
}

.hook-info-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.editor-container {
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  padding: 16px;
  margin-bottom: 24px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.error-indicator {
  display: flex;
  align-items: center;
}

.monaco-editor {
  width: 100%;
  height: 500px;
  border-radius: 4px;
  overflow: hidden;
}
</style> 