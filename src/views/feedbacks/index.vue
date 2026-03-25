<template>
  <div class="feedbacks-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户反馈管理</span>
          <div>
            <el-radio-group v-model="filterStatus" @change="loadData">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="pending">待处理</el-radio-button>
              <el-radio-button label="resolved">已处理</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table :data="feedbackList" v-loading="loading" stripe>
        <el-table-column type="index" width="50" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="反馈内容" min-width="300" show-overflow-tooltip />
        <el-table-column prop="contactInfo" label="联系方式" width="150">
          <template #default="{ row }">
            {{ row.contactInfo || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'pending'" type="warning">待处理</el-tag>
            <el-tag v-else type="success">已处理</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">查看</el-button>
            <el-button v-if="row.status === 'pending'" link type="success" @click="showReply(row)">
              回复
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @change="loadData"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="反馈详情" width="600px">
      <el-descriptions :column="1" border v-if="currentFeedback">
        <el-descriptions-item label="反馈类型">
          <el-tag :type="getTypeColor(currentFeedback.type)">
            {{ getTypeLabel(currentFeedback.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="联系方式">
          {{ currentFeedback.contactInfo || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">
          {{ formatDate(currentFeedback.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="反馈内容">
          <div style="white-space: pre-wrap">{{ currentFeedback.content }}</div>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentFeedback.adminReply" label="处理回复">
          <div style="white-space: pre-wrap">{{ currentFeedback.adminReply }}</div>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button 
          v-if="currentFeedback?.status === 'pending'" 
          type="primary" 
          @click="showReply(currentFeedback)"
        >
          去回复
        </el-button>
      </template>
    </el-dialog>

    <!-- 回复弹窗 -->
    <el-dialog v-model="replyVisible" title="回复反馈" width="500px">
      <el-form>
        <el-form-item label="反馈内容">
          <el-input 
            v-model="currentFeedback!.content" 
            type="textarea" 
            :rows="3" 
            disabled 
          />
        </el-form-item>
        <el-form-item label="回复内容" required>
          <el-input 
            v-model="replyContent" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入回复内容..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitReply" :loading="submitting">
          提交回复
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getFeedbackList, getFeedbackDetail, replyFeedback, type FeedbackItem } from '@/api/feedbacks'
import dayjs from 'dayjs'

const loading = ref(false)
const feedbackList = ref<FeedbackItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const filterStatus = ref('')

const detailVisible = ref(false)
const replyVisible = ref(false)
const currentFeedback = ref<FeedbackItem | null>(null)
const replyContent = ref('')
const submitting = ref(false)

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    bug: '问题反馈',
    feature: '功能建议',
    data_error: '数据错误',
    other: '其他',
  }
  return map[type] || type
}

const getTypeColor = (type: string) => {
  const map: Record<string, string> = {
    bug: 'danger',
    feature: 'primary',
    data_error: 'warning',
    other: 'info',
  }
  return map[type] || 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getFeedbackList({
      status: filterStatus.value || undefined,
      page: currentPage.value,
      limit: pageSize.value,
    })
    feedbackList.value = res.data.items
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const showDetail = async (row: FeedbackItem) => {
  const res = await getFeedbackDetail(row.id)
  currentFeedback.value = res.data
  detailVisible.value = true
}

const showReply = (row: FeedbackItem) => {
  currentFeedback.value = row
  replyContent.value = ''
  replyVisible.value = true
}

const handleSubmitReply = async () => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  submitting.value = true
  try {
    await replyFeedback(currentFeedback.value!.id, replyContent.value)
    ElMessage.success('回复成功')
    replyVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
