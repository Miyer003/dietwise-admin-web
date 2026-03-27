import request from '@/utils/request'

export interface UserItem {
  id: string
  phone: string
  nickname: string
  avatarEmoji: string
  role: string
  status: string
  createdAt: string
  lastLoginAt: string
}

export interface UserListResult {
  total: number
  page: number
  limit: number
  items: UserItem[]
}

export interface UserDetail {
  id: string
  phone: string
  email: string
  nickname: string
  avatarEmoji: string
  role: string
  status: string
  createdAt: string
  lastLoginAt: string
  profile: any
  stats: {
    totalRecords: number
    totalAchievements: number
    aiUsage: number
  }
}

export const getUserList = (params?: {
  keyword?: string
  status?: string
  page?: number
  limit?: number
}) => {
  return request.get<UserListResult>('/admin/users', { params })
}

export const getUserDetail = (id: string) => {
  return request.get<UserDetail>(`/admin/users/${id}`)
}

export const getUserRecords = (id: string, params?: { page?: number; limit?: number }) => {
  return request.get(`/admin/users/${id}/records`, { params })
}

export const getUserAchievements = (id: string) => {
  return request.get(`/admin/users/${id}/achievements`)
}

export const updateUserStatus = (id: string, status: string) => {
  return request.patch(`/admin/users/${id}/status`, { status })
}

export interface ActiveUserItem {
  id: string
  phone: string
  nickname: string
  avatarEmoji: string
  createdAt: string
  lastLoginAt: string
  todayRecords: number
}

export interface ActiveUsersResult {
  total: number
  page: number
  limit: number
  items: ActiveUserItem[]
}

export const getActiveUsersByDate = (
  date: string,
  params?: { page?: number; limit?: number }
) => {
  return request.get<ActiveUsersResult>('/admin/users/active-by-date', {
    params: { date, ...params },
  })
}
