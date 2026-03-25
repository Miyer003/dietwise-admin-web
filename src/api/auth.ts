import request from '@/utils/request'

export interface LoginParams {
  phone: string
  password: string
}

export interface LoginResult {
  access_token: string
  refresh_token: string
  user: {
    id: string
    phone: string
    nickname: string
    avatarEmoji: string
    role: string
  }
}

export const adminLogin = (data: LoginParams) => {
  return request.post<LoginResult>('/auth/login', data)
}

export const getAdminInfo = () => {
  return request.get('/users/me')
}
