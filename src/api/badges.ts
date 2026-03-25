import request from '@/utils/request'

export interface BadgeItem {
  id: string
  badgeCode: string
  badgeName: string
  badgeDesc?: string
  iconEmoji: string
  iconColor: string
  category: string
  conditionType: string
  conditionValue: number
  isActive: boolean
  sortOrder: number
  createdAt: string
}

export interface BadgeStats {
  badgeCode: string
  badgeName: string
  totalUnlocked: number
  unlockedThisMonth: number
}

export const getBadgeList = (params?: {
  category?: string
  isActive?: string
  page?: number
  limit?: number
}) => {
  return request.get<{ total: number; items: BadgeItem[] }>('/admin/badges', { params })
}

export const getAllBadges = () => {
  return request.get<BadgeItem[]>('/admin/badges/all')
}

export const getBadgeStats = () => {
  return request.get<BadgeStats[]>('/admin/badges/stats')
}

export const createBadge = (data: Partial<BadgeItem>) => {
  return request.post('/admin/badges', data)
}

export const updateBadge = (id: string, data: Partial<BadgeItem>) => {
  return request.put(`/admin/badges/${id}`, data)
}

export const deleteBadge = (id: string) => {
  return request.delete(`/admin/badges/${id}`)
}

export const toggleBadgeStatus = (id: string) => {
  return request.patch(`/admin/badges/${id}/toggle`)
}
