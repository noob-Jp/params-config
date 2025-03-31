import axios from 'axios'

const API_URL = '/api'

export async function getFunctionData(caseId, functionName) {
  if (!caseId || !functionName) {
    console.warn('获取功能数据缺少必要参数', { caseId, functionName });
    return [];
  }
  
  try {
    const response = await axios.get(`${API_URL}/cases/${caseId}/functions/${functionName}`)
    return response.data || []
  } catch (error) {
    console.error('获取功能数据失败', error);
    // 当发生错误时，返回空数组而不是抛出异常
    return [];
  }
}

export async function saveFunctionData(caseId, functionName, data) {
  if (!caseId || !functionName) {
    throw new Error('保存功能数据缺少必要参数');
  }
  
  if (!Array.isArray(data)) {
    console.warn('功能数据格式不正确，已转换为数组');
    data = Array.isArray(data) ? data : [];
  }
  
  console.log(`准备保存功能[${functionName}]数据到案例[${caseId}]`, data);
  
  try {
    const response = await axios.post(`${API_URL}/cases/${caseId}/functions/${functionName}`, data)
    console.log(`保存功能数据成功:`, response.data);
    return response.data
  } catch (error) {
    console.error(`保存功能数据失败:`, error);
    throw error;
  }
}

// 添加新功能到全局功能列表
export async function addFunctionToList(funcKey) {
  if (!funcKey) {
    throw new Error('功能键名不能为空');
  }
  
  const response = await axios.post(`${API_URL}/functions`, { funcKey })
  return response.data
}

// 保存整个功能列表
export async function saveAllFunctions(functionList) {
  if (!Array.isArray(functionList)) {
    throw new Error('功能列表必须是数组');
  }
  
  // 简单验证
  for (const func of functionList) {
    if (!func.funcKey) {
      throw new Error('功能键名不能为空');
    }
  }
  
  const response = await axios.post(`${API_URL}/functions/save-all`, functionList);
  return response.data;
}

// 导出功能列表JSON
export async function exportFunctionList() {
  try {
    const response = await axios.get(`${API_URL}/export/functions`, {
      responseType: 'blob'
    })
    
    // 创建Blob URL
    const blob = new Blob([response.data], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    
    // 创建临时链接并触发下载
    const link = document.createElement('a')
    link.href = url
    link.download = 'funcList.json'
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出功能列表失败:', error)
    throw error
  }
}

// 导出单个案例的case.json
export async function exportCaseJson(caseName) {
  if (!caseName) {
    throw new Error('案例名称不能为空')
  }
  try {
    const response = await axios.get(`${API_URL}/export/case/${caseName}/json`, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${caseName}_case.json`
    document.body.appendChild(link)
    link.click()
    
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出案例配置失败:', error)
    throw error
  }
}

// 导出单个功能步骤
export async function exportFunction(caseName, functionName) {
  if (!caseName || !functionName) {
    throw new Error('案例名称和功能步骤名称不能为空')
  }
  try {
    const response = await axios.get(`${API_URL}/export/case/${caseName}/function/${functionName}`, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${functionName}.json`
    document.body.appendChild(link)
    link.click()
    
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出功能步骤失败:', error)
    throw error
  }
}

// 导出整个案例文件夹
export async function exportCase(caseName) {
  if (!caseName) {
    throw new Error('案例名称不能为空')
  }
  try {
    const response = await axios.get(`${API_URL}/export/case/${caseName}`, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], { type: 'application/zip' })
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${caseName}.zip`
    document.body.appendChild(link)
    link.click()
    
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出案例失败:', error)
    throw error
  }
} 