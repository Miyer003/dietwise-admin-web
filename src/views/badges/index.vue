<template>
  <div class="badges-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>成就徽章管理</span>
          <div>
            <el-radio-group v-model="filterCategory" @change="loadData" style="margin-right: 12px">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="continuous">连续记录</el-radio-button>
              <el-radio-button label="balanced">营养均衡</el-radio-button>
              <el-radio-button label="habit">使用习惯</el-radio-button>
            </el-radio-group>
            <el-button type="primary" @click="showAddDialog">+ 新增徽章</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="8" v-for="badge in badgeList" :key="badge.id">
          <el-card class="badge-card" :class="{ disabled: !badge.isActive }">
            <div class="badge-content">
              <div 
                class="badge-icon" 
                :style="{ backgroundColor: badge.iconColor + '20', color: badge.iconColor }"
              >
                <span style="font-size: 40px">{{ badge.iconEmoji }}</span>
              </div>
              <div class="badge-info">
                <h3>{{ badge.badgeName }}</h3>
                <p class="desc">{{ badge.badgeDesc }}</p>
                <p class="condition">条件: {{ formatCondition(badge) }}</p>
                <div class="stats">
                  <span>获得人数: {{ getStats(badge.badgeCode)?.totalUnlocked || 0 }}</span>
                  <span style="margin-left: 12px">本月: {{ getStats(badge.badgeCode)?.unlockedThisMonth || 0 }}</span>
                </div>
              </div>
            </div>
            <div class="badge-actions">
              <el-switch
                v-model="badge.isActive"
                @change="handleToggle(badge)"
                active-text="启用"
                inactive-text="禁用"
              />
              <el-button link type="primary" @click="showEditDialog(badge)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(badge)">删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div class="pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @change="loadData"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑徽章' : '新增徽章'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="徽章编码">
          <el-input v-model="form.badgeCode" :disabled="isEdit" placeholder="如: streak_7" />
        </el-form-item>
        <el-form-item label="徽章名称">
          <el-input v-model="form.badgeName" placeholder="如: 连续7天" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.badgeDesc" type="textarea" placeholder="徽章描述" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="icon-select">
            <el-input v-model="form.iconEmoji" style="width: 80px" maxlength="2" />
            <el-color-picker v-model="form.iconColor" />
          </div>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="连续记录" value="continuous" />
            <el-option label="营养均衡" value="balanced" />
            <el-option label="使用习惯" value="habit" />
          </el-select>
        </el-form-item>
        <el-form-item label="条件类型">
          <el-input v-model="form.conditionType" placeholder="如: streak_days" />
        </el-form-item>
        <el-form-item label="条件值">
          <el-input-number v-model="form.conditionValue" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBadgeList, getBadgeStats, createBadge, updateBadge, deleteBadge, toggleBadgeStatus, type BadgeItem, type BadgeStats } from '@/api/badges'

const loading = ref(false)
const badgeList = ref<BadgeItem[]>([])
const statsList = ref<BadgeStats[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const filterCategory = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref<Partial<BadgeItem>>({
  badgeCode: '',
  badgeName: '',
  badgeDesc: '',
  iconEmoji: '🏆',
  iconColor: '#F59E0B',
  category: 'continuous',
  conditionType: '',
  conditionValue: 1,
})

const formatCondition = (badge: BadgeItem) => {
  const typeMap: Record<string, string> = {
    streak_days: '连续记录',
    balanced_days: '营养均衡',
    calorie_perfect_days: '热量达标',
    photo_count: '拍照识别',
    chat_count: 'AI咨询',
    record_count: '记录次数',
  }
  return `${typeMap[badge.conditionType] || badge.conditionType} ${badge.conditionValue}`
}

const getStats = (badgeCode: string) => {
  return statsList.value.find(s => s.badgeCode === badgeCode)
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getBadgeList({
      category: filterCategory.value || undefined,
      page: currentPage.value,
      limit: pageSize.value,
    })
    badgeList.value = res.data.items
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  const res = await getBadgeStats()
  statsList.value = res.data
}

const showAddDialog = () => {
  isEdit.value = false
  form.value = {
    badgeCode: '',
    badgeName: '',
    badgeDesc: '',
    iconEmoji: '🏆',
    iconColor: '#F59E0B',
    category: 'continuous',
    conditionType: '',
    conditionValue: 1,
  }
  dialogVisible.value = true
}

const showEditDialog = (badge: BadgeItem) => {
  isEdit.value = true
  form.value = { ...badge }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.badgeCode || !form.value.badgeName) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  const api = isEdit.value ? updateBadge : createBadge
  await api(isEdit.value ? form.value.id! : form.value as any, form.value as any)
  ElMessage.success(isEdit.value ? '修改成功' : '创建成功')
  dialogVisible.value = false
  loadData()
}

const handleToggle = async (badge: BadgeItem) => {
  await toggleBadgeStatus(badge.id)
  ElMessage.success(badge.isActive ? '已启用' : '已禁用')
}

const handleDelete = async (badge: BadgeItem) => {
  try {
    await ElMessageBox.confirm('确定要删除该徽章吗？', '提示', { type: 'warning' })
    await deleteBadge(badge.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // 取消
  }
}

onMounted(() => {
  loadData()
  loadStats()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.badge-card.disabled {
  opacity: 0.6;
}

.badge-content {
  display: flex;
  margin-bottom: 16px;
}

.badge-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.badge-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.badge-info .desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.badge-info .condition {
  color: #409EFF;
  font-size: 13px;
  margin-bottom: 8px;
}

.badge-info .stats {
  font-size: 12px;
  color: #999;
}

.badge-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.icon-select {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
