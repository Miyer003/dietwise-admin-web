import request from '@/utils/request'

export interface FeedbackItem {
  id: string
  type: string
  content: string
  contactInfo?: string
  status: string
  adminReply?: string
  createdAt: string
  resolvedAt?: string
}

export const getFeedbackList = (params?: {
  status?: string
  page?: number
  limit?: number
}) => {
  return request.get<{ total: number; items: FeedbackItem[] }>('/admin/feedbacks', { params })
}

export const getFeedbackDetail = (id: string) => {
  return request.get<FeedbackItem>(`/admin/feedbacks/${id}`)
}

export const replyFeedback = (id: string, adminReply: string) => {
  return request.patch(`/admin/feedbacks/${id}`, { adminReply })
}
