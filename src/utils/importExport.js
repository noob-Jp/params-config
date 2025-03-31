/**
 * 导入导出工具函数
 */
import { ElMessage } from 'element-plus'

/**
 * 导出数据为JSON文件
 * @param {Object} data 要导出的数据
 * @param {string} fileName 导出的文件名
 */
export function exportToJson(data, fileName = 'export.json') {
  try {
    // 将数据转换为JSON字符串
    const jsonString = JSON.stringify(data, null, 2)
    
    // 创建Blob对象
    const blob = new Blob([jsonString], { type: 'application/json' })
    
    // 创建下载链接
    const url = URL.createObjectURL(blob)
    
    // 创建a标签并模拟点击下载
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    
    // 清理
    URL.revokeObjectURL(url)
    document.body.removeChild(link)
    
    ElMessage.success('导出成功')
    return true
  } catch (error) {
    console.error('导出失败', error)
    ElMessage.error(`导出失败: ${error.message}`)
    return false
  }
}

/**
 * 从JSON文件导入数据
 * @param {File} file 导入的文件对象
 * @returns {Promise<Object>} 解析后的数据
 */
export function importFromJson(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('未选择文件'))
      return
    }
    
    // 检查文件类型
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      reject(new Error('只支持导入JSON文件'))
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        resolve(data)
      } catch (error) {
        console.error('解析JSON失败', error)
        reject(new Error('解析JSON失败，请检查文件格式'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * 导出案例数据
 * @param {Object} caseData 案例数据
 * @param {string} caseName 案例名称
 */
export function exportCase(caseData, caseName) {
  const fileName = `case_${caseName}_${formatDate(new Date())}.json`
  return exportToJson(caseData, fileName)
}

/**
 * 导出功能列表
 * @param {Array} functionList 功能列表
 */
export function exportFunctionList(functionList) {
  const fileName = `functions_${formatDate(new Date())}.json`
  return exportToJson(functionList, fileName)
}

/**
 * 导出所有数据
 * @param {Object} data 包含所有数据的对象
 */
export function exportAllData(data) {
  const fileName = `params_config_backup_${formatDate(new Date())}.json`
  
  // 添加元数据
  const exportData = {
    metadata: {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      type: 'full_backup'
    },
    ...data
  }
  
  return exportToJson(exportData, fileName)
}

/**
 * 格式化日期为文件名友好的格式
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}${month}${day}_${hours}${minutes}`
}

/**
 * 验证导入的数据
 * @param {Object} data 导入的数据
 * @param {string} type 数据类型 (case, function, full)
 * @returns {boolean} 验证结果
 */
export function validateImportData(data, type) {
  if (!data) return false
  
  switch (type) {
    case 'case':
      // 验证案例数据
      return data.caseName && Array.isArray(data.functions)
      
    case 'function':
      // 验证功能数据
      return Array.isArray(data) && data.every(item => item.funcKey)
      
    case 'full':
      // 验证完整备份
      return data.metadata && 
             data.metadata.version && 
             data.metadata.type === 'full_backup' &&
             data.cases && 
             data.functions
      
    default:
      return false
  }
}

export default {
  exportToJson,
  importFromJson,
  exportCase,
  exportFunctionList,
  exportAllData,
  validateImportData
}
