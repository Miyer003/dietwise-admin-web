import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import { ElMessage } from 'element-plus'
import { adminLogin, getAdminInfo } from '@/api/auth'

export interface UserInfo {
  id: string
  phone: string
  nickname: string
  avatarEmoji: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string>(localStorage.getItem('admin_token') || '')
  const userInfo = ref<UserInfo | null>(null)
  
  // Getters
  const isLoggedIn = computed(() => !!token.value)
  
  // Actions
  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('admin_token', newToken)
  }
  
  const clearToken = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('admin_token')
  }
  
  const login = async (phone: string, password: string) => {
    try {
      const res = await adminLogin({ phone, password })

      
      // 响应格式: {code: 0, message: 'success', data: {accessToken, refreshToken, user}}
      if ((res as any).code === 0 && res.data) {
        // 后端返回 camelCase: accessToken
        const accessToken = (res.data as any).accessToken
        const user = res.data.user
        if (!accessToken) {
          ElMessage.error('登录失败：未获取到 token')
          return false
        }
        
        // 先设置 token 和用户信息
        setToken(accessToken)
        userInfo.value = user
        
        // 显示成功消息
        ElMessage.success('登录成功')
        
        // 延迟跳转，确保状态已更新
        setTimeout(() => {
          window.location.href = '/'
        }, 100)
        
        return true
      }
      
      ElMessage.error((res as any).message || '登录失败')
      return false
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败')
      return false
    }
  }
  
  const fetchUserInfo = async () => {
    try {
      const res = await getAdminInfo()
      if ((res as any).code === 0 && res.data) {
        userInfo.value = res.data
        return true
      }
      return false
    } catch (error) {
      clearToken()
      return false
    }
  }
  
  const logout = () => {
    clearToken()
    window.location.href = '/login'
    ElMessage.success('已退出登录')
  }
  
  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    logout,
    fetchUserInfo,
    clearToken,
  }
})
