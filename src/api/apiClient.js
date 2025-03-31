import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建一个axios实例
const apiClient = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 可以在这里添加认证信息等
    // 添加请求日志
    console.log(`发送${config.method.toUpperCase()}请求到: ${config.baseURL}${config.url}`, 
      config.params || config.data || {});
    return config
  },
  error => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    // 添加响应日志
    console.log(`收到来自${response.config.url}的响应:`, response.status, response.data);
    return response
  },
  error => {
    // 详细记录错误
    console.error('API响应错误:', error);
    
    // 统一处理错误
    const { response } = error
    if (response) {
      // 服务器返回了错误信息
      switch (response.status) {
        case 400:
          ElMessage.error('请求参数错误')
          break
        case 401:
          ElMessage.error('未授权，请重新登录')
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(`请求失败: ${response.data.error || '未知错误'}`)
      }
    } else {
      // 网络错误或请求被取消
      if (error.message.includes('timeout')) {
        ElMessage.error('请求超时，请稍后再试')
      } else {
        ElMessage.error('网络错误，请检查您的网络连接')
      }
    }
    return Promise.reject(error)
  }
)

// 封装GET请求
export const get = async (url, params = {}) => {
  try {
    const response = await apiClient.get(url, { params })
    return response.data
  } catch (error) {
    console.error(`GET请求错误: ${url}`, error)
    return Promise.reject(error)
  }
}

// 封装POST请求
export const post = async (url, data = {}) => {
  try {
    const response = await apiClient.post(url, data)
    return response.data
  } catch (error) {
    console.error(`POST请求错误: ${url}`, error)
    return Promise.reject(error)
  }
}

// 封装PUT请求
export const put = async (url, data = {}) => {
  try {
    const response = await apiClient.put(url, data)
    return response.data
  } catch (error) {
    console.error(`PUT请求错误: ${url}`, error)
    return Promise.reject(error)
  }
}

// 封装DELETE请求
export const del = async (url, params = {}) => {
  try {
    const response = await apiClient.delete(url, { params })
    return response.data
  } catch (error) {
    console.error(`DELETE请求错误: ${url}`, error)
    return Promise.reject(error)
  }
}

export default apiClient
