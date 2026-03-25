import request from '@/utils/request'

export interface OverviewData {
  totalUsers: number
  todayActiveUsers: number
  todayNewUsers: number
  todayRecords: number
  todayAICalls: number
  todayAICost: number
  pendingFeedbacks: number
}

export interface TrendData {
  dates: string[]
  newUsers: number[]
  activeUsers: number[]
}

export interface AIUsageTrend {
  dates: string[]
  callCounts: number[]
  costs: number[]
}

export const getOverview = () => {
  return request.get<OverviewData>('/admin/dashboard/overview')
}

export const getUserGrowthTrend = (days?: number) => {
  return request.get<TrendData>('/admin/dashboard/user-growth', { params: { days } })
}

export const getAIUsageTrend = (days?: number) => {
  return request.get<AIUsageTrend>('/admin/dashboard/ai-usage', { params: { days } })
}
