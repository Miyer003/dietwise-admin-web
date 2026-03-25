import request from '@/utils/request'

export interface FoodItem {
  id: string
  name: string
  namePinyin?: string
  category: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  fiberPer100g?: number
  sodiumPer100g?: number
  defaultPortionG?: number
  isVerified?: boolean
  createdAt: string
}

export interface FoodListResult {
  total: number
  page: number
  limit: number
  items: FoodItem[]
}

export const getFoodList = (params?: {
  keyword?: string
  category?: string
  page?: number
  limit?: number
}) => {
  return request.get<FoodListResult>('/admin/foods', { params })
}

export const getFoodCategories = () => {
  return request.get<string[]>('/admin/foods/categories')
}

// 复用移动端的食物搜索接口
export const searchFoods = (keyword: string) => {
  return request.get('/foods/search', { params: { q: keyword, limit: 50 } })
}

export const createFood = (data: Partial<FoodItem>) => {
  return request.post('/admin/foods', data)
}

export const updateFood = (id: string, data: Partial<FoodItem>) => {
  return request.put(`/admin/foods/${id}`, data)
}

export const deleteFood = (id: string) => {
  return request.delete(`/admin/foods/${id}`)
}
