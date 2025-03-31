import axios from 'axios'

const API_URL = '/api'

export async function getCaseList() {
  try {
    const response = await axios.get(`${API_URL}/cases`)
    return response.data || []
  } catch (error) {
    console.error('获取案例列表失败', error)
    return []
  }
}

export async function getCase(caseId) {
  if (!caseId) {
    console.warn('获取案例缺少必要参数caseId')
    return []
  }
  
  try {
    const response = await axios.get(`${API_URL}/cases/${caseId}`)
    return response.data || []
  } catch (error) {
    console.error(`获取案例[${caseId}]失败`, error)
    return []
  }
}

export async function saveCase(caseData) {
  if (!caseData || !caseData.caseName) {
    throw new Error('案例名称不能为空')
  }
  
  console.log('保存案例数据:', JSON.stringify(caseData, null, 2))
  
  try {
    const response = await axios.post(`${API_URL}/cases`, {
      caseName: caseData.caseName,
      functions: caseData.functions || []
    })
    console.log('保存案例响应:', response.data)
    return response.data
  } catch (error) {
    console.error('保存案例失败', error)
    throw error
  }
}

export async function deleteCase(caseId) {
  if (!caseId) {
    throw new Error('删除案例缺少必要参数caseId')
  }
  
  try {
    const response = await axios.delete(`${API_URL}/cases/${caseId}`)
    return response.data
  } catch (error) {
    console.error(`删除案例[${caseId}]失败`, error)
    throw error
  }
}

export async function getFunctionList() {
  try {
    const response = await axios.get(`${API_URL}/functions`)
    return response.data || []
  } catch (error) {
    console.error('获取功能列表失败', error)
    return []
  }
} 