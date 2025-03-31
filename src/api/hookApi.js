import axios from 'axios'

const API_URL = '/api'

export async function getHookCode(caseId, hookName, type) {
  if (!caseId || !hookName || !type) {
    console.warn('获取钩子代码缺少必要参数', { caseId, hookName, type });
    return '';
  }
  
  try {
    const response = await axios.get(`${API_URL}/cases/${caseId}/hooks/${hookName}/${type}`)
    return response.data || ''
  } catch (error) {
    console.error('获取钩子代码失败', error);
    // 当发生错误时，返回空字符串而不是抛出异常
    return '';
  }
}

export async function saveHookCode(caseId, hookName, type, code) {
  if (!caseId || !hookName || !type) {
    throw new Error('保存钩子代码缺少必要参数');
  }
  
  // 确保code是字符串
  const safeCode = typeof code === 'string' ? code : (code ? String(code) : '');
  
  try {
    const response = await axios.post(`${API_URL}/cases/${caseId}/hooks/${hookName}/${type}`, { code: safeCode })
    return response.data
  } catch (error) {
    console.error('保存钩子代码失败', error);
    throw error;
  }
} 