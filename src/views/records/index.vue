<template>
  <div class="records-page">
    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="用户">
          <el-input
            v-model="filterForm.userKeyword"
            placeholder="手机号/昵称"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="餐次">
          <el-select v-model="filterForm.mealType" placeholder="全部餐次" clearable style="width: 120px">
            <el-option label="早餐" value="breakfast" />
            <el-option label="午餐" value="lunch" />
            <el-option label="晚餐" value="dinner" />
            <el-option label="加餐" value="snack" />
          </el-select>
        </el-form-item>
        <el-form-item label="录入方式">
          <el-select v-model="filterForm.inputMethod" placeholder="全部方式" clearable style="width: 120px">
            <el-option label="拍照识别" value="photo" />
            <el-option label="语音输入" value="voice" />
            <el-option label="手动输入" value="manual" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>



    <!-- 数据表格 -->
    <el-card>
      <template #header>
        <div class="table-header">
          <span>饮食记录列表</span>
          <el-button type="primary" text @click="loadData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-table :data="recordList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" show-overflow-tooltip />
        <el-table-column label="用户信息" min-width="180">
          <template #default="{ row }">
            <div class="user-info">
              <span class="user-avatar">{{ row.userAvatar || '😊' }}</span>
              <div class="user-detail">
                <div class="user-nickname">{{ row.userNickname || '未设置' }}</div>
                <div class="user-phone">{{ row.userPhone || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="recordDate" label="日期" width="120" />
        <el-table-column prop="mealType" label="餐次" width="100">
          <template #default="{ row }">
            <el-tag :type="getMealTypeType(row.mealType)" size="small">
              {{ getMealTypeLabel(row.mealType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inputMethod" label="录入方式" width="100">
          <template #default="{ row }">
            <el-tag :type="getInputMethodType(row.inputMethod)" size="small" effect="plain">
              {{ getInputMethodLabel(row.inputMethod) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalCalories" label="总热量" width="100" align="right">
          <template #default="{ row }">
            <span class="calorie">{{ row.totalCalories }} kcal</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalProtein" label="蛋白质" width="90" align="right">
          <template #default="{ row }">
            {{ row.totalProtein }}g
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="记录时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">详情</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="本餐详情" width="700px">
      <div v-if="currentRecord" class="detail-content">
        <div class="detail-info">
          <div class="info-item">
            <span class="info-label">用户：</span>
            <span class="info-value">{{ currentRecord.userNickname || '未设置' }} ({{ currentRecord.userPhone || '-' }})</span>
          </div>
          <div class="info-item">
            <span class="info-label">日期：</span>
            <span class="info-value">{{ currentRecord.recordDate }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">餐次：</span>
            <el-tag :type="getMealTypeType(currentRecord.mealType)" size="small">
              {{ getMealTypeLabel(currentRecord.mealType) }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">录入方式：</span>
            <el-tag :type="getInputMethodType(currentRecord.inputMethod)" size="small" effect="plain">
              {{ getInputMethodLabel(currentRecord.inputMethod) }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">总热量：</span>
            <span class="info-value calorie">{{ currentRecord.totalCalories }} kcal</span>
          </div>
        </div>
        <div class="section-title">食物明细</div>
        <el-table :data="currentRecord.items" :border="true" size="small">
          <el-table-column prop="foodName" label="食物名称" min-width="150" />
          <el-table-column prop="quantityG" label="份量(g)" width="100" align="right" />
          <el-table-column prop="calories" label="热量(kcal)" width="100" align="right" />
          <el-table-column prop="proteinG" label="蛋白质(g)" width="100" align="right" />
          <el-table-column prop="carbsG" label="碳水(g)" width="100" align="right" />
          <el-table-column prop="fatG" label="脂肪(g)" width="100" align="right" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const router = useRouter()

// 筛选表单
const filterForm = reactive({
  userKeyword: '',
  dateRange: [] as string[],
  mealType: '',
  inputMethod: '',
})

const loading = ref(false)
const recordList = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const detailVisible = ref(false)
const currentRecord = ref<any>(null)

// 餐次标签
const getMealTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  }
  return map[type] || type
}

const getMealTypeType = (type: string) => {
  const map: Record<string, any> = {
    breakfast: 'warning',
    lunch: 'success',
    dinner: 'primary',
    snack: 'info',
  }
  return map[type] || ''
}

// 录入方式标签
const getInputMethodLabel = (method: string) => {
  const map: Record<string, string> = {
    photo: '拍照',
    voice: '语音',
    manual: '手动',
  }
  return map[method] || method
}

const getInputMethodType = (method: string) => {
  const map: Record<string, any> = {
    photo: 'success',
    voice: 'primary',
    manual: 'info',
  }
  return map[method] || ''
}

const formatDateTime = (date: string) => {
  if (!date) return '-'
  return dayjs(date).add(8, 'hour').format('MM-DD HH:mm')
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
    }
    if (filterForm.userKeyword) {
      params.userKeyword = filterForm.userKeyword
    }
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startDate = filterForm.dateRange[0]
      params.endDate = filterForm.dateRange[1]
    }
    if (filterForm.mealType) {
      params.mealType = filterForm.mealType
    }
    if (filterForm.inputMethod) {
      params.inputMethod = filterForm.inputMethod
    }

    const res: any = await request.get('/admin/records', { params })
    const data = res.data || res
    recordList.value = data.items || []
    total.value = data.total || 0
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handleReset = () => {
  filterForm.userKeyword = ''
  filterForm.dateRange = []
  filterForm.mealType = ''
  filterForm.inputMethod = ''
  currentPage.value = 1
  loadData()
}

const showDetail = (row: any) => {
  currentRecord.value = row
  detailVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await request.delete(`/admin/records/${row.id}`)
      ElMessage.success('删除成功')
      loadData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.records-page {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  font-size: 20px;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-nickname {
  font-size: 14px;
  color: #303133;
}

.user-phone {
  font-size: 12px;
  color: #909399;
}

.calorie {
  color: #f56c6c;
  font-weight: 500;
}

.detail-content {
  .detail-info {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
  }
  
  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .info-label {
    color: #909399;
    font-size: 13px;
  }
  
  .info-value {
    color: #303133;
    font-size: 14px;
    font-weight: 500;
  }
  
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #606266;
    margin-bottom: 12px;
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
