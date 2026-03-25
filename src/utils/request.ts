import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
})

// 请求拦截器 - 直接从 localStorage 读取 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 与移动端保持一致，直接返回 response.data
request.interceptors.response.use(
  (response) => {
    const { data } = response
    
    // code 不为 0 表示业务错误
    if (data.code !== 0) {
      ElMessage.error(data.message || '请求失败')
      
      // Token 过期
      if (data.code === 40101) {
        localStorage.removeItem('admin_token')
        window.location.href = '/login'
      }
      
      return Promise.reject({
        message: data.message,
        code: data.code,
        error: data.error,
      })
    }
    
    // 返回完整的响应数据，让调用方处理
    return data
  },
  (error) => {
    const message = error.response?.data?.message || '网络错误'
    ElMessage.error(message)
    return Promise.reject({
      message,
      code: error.response?.status || 500,
      error: 'NETWORK_ERROR',
    })
  }
)

export default request
