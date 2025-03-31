import { get, post, del } from './apiClient'
import { ElMessage } from 'element-plus'

const API_URL = '/api'

export async function getCaseList() {
  try {
    console.log('开始请求案例列表...');
    const result = await get(`${API_URL}/cases`) || [];
    console.log('获取案例列表成功:', result);
    return result;
  } catch (error) {
    console.error('获取案例列表失败', error);
    return [];
  }
}

export async function getCase(caseId) {
  if (!caseId) {
    console.warn('获取案例缺少必要参数caseId');
    return {};
  }
  
  try {
    console.log(`开始请求案例详情: ${caseId}`);
    const result = await get(`${API_URL}/cases/${caseId}`) || {};
    console.log(`获取案例[${caseId}]详情成功:`, result);
    return result;
  } catch (error) {
    console.error(`获取案例[${caseId}]失败`, error);
    return {};
  }
}

export async function saveCase(caseData) {
  if (!caseData || !caseData.caseName) {
    ElMessage.error('案例名称不能为空')
    throw new Error('案例名称不能为空')
  }
  
  console.log('保存案例数据:', JSON.stringify(caseData, null, 2))
  
  try {
    console.log('开始请求保存案例...');
    const response = await post(`${API_URL}/cases`, {
      caseName: caseData.caseName,
      functions: caseData.functions || []
    })
    console.log('保存案例成功:', response);
    ElMessage.success('案例保存成功')
    return response
  } catch (error) {
    console.error('保存案例失败', error)
    throw error
  }
}

export async function deleteCase(caseId) {
  if (!caseId) {
    ElMessage.error('删除案例缺少必要参数caseId')
    throw new Error('删除案例缺少必要参数caseId')
  }
  
  try {
    console.log(`开始请求删除案例: ${caseId}`);
    const response = await del(`${API_URL}/cases/${caseId}`)
    console.log(`删除案例[${caseId}]成功:`, response);
    ElMessage.success('案例删除成功')
    return response
  } catch (error) {
    console.error(`删除案例[${caseId}]失败`, error)
    throw error
  }
}

export async function getFunctionList() {
  try {
    console.log('开始请求功能列表...');
    const result = await get(`${API_URL}/functions`) || [];
    console.log('获取功能列表成功:', result);
    return result;
  } catch (error) {
    console.error('获取功能列表失败', error);
    return [];
  }
}