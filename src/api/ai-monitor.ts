import request from '@/utils/request'

export interface AIStats {
  totalCalls: number
  totalCost: number
  successCalls: number
  failedCalls: number
  successRate: number
}

export interface ProviderStat {
  provider: string
  calls: string
  cost: string
}

export interface FunctionStat {
  functionType: string
  calls: string
  cost: string
}

export interface AILogItem {
  id: string
  userId: string
  functionType: string
  provider: string
  modelName: string
  inputTokens?: number
  outputTokens?: number
  costCents: number
  latencyMs?: number
  success: boolean
  createdAt: string
}

export const getAIStats = (params?: { startDate?: string; endDate?: string }) => {
  return request.get<AIStats>('/admin/ai-monitor/stats', { params })
}

export const getAIStatsByProvider = (params?: { startDate?: string; endDate?: string }) => {
  return request.get<ProviderStat[]>('/admin/ai-monitor/providers', { params })
}

export const getAIStatsByFunction = (params?: { startDate?: string; endDate?: string }) => {
  return request.get<FunctionStat[]>('/admin/ai-monitor/functions', { params })
}

export const getAILogs = (params?: {
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}) => {
  return request.get<{ total: number; items: AILogItem[] }>('/admin/ai-monitor/logs', { params })
}

export interface ModelStat {
  modelName: string
  provider: string
  calls: string
  cost: string
  inputTokens: string
  outputTokens: string
  avgLatency?: string | number
}

export interface AITrendItem {
  date: string
  calls: number
  cost: number
  successCalls: number
  failCalls: number
  successRate: number | null
}

export const getAIStatsByModel = (params?: { startDate?: string; endDate?: string }) => {
  return request.get<ModelStat[]>('/admin/ai-monitor/models', { params })
}

export const getAIUsageTrend = (params?: { startDate?: string; endDate?: string }) => {
  return request.get<AITrendItem[]>('/admin/ai-monitor/trend', { params })
}
