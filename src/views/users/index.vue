<template>
  <div class="users-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <div class="header-right">
            <el-date-picker
              v-model="activeDate"
              type="date"
              placeholder="选择日期查活跃用户"
              value-format="YYYY-MM-DD"
              style="width: 180px"
              clearable
              @change="handleActiveDateChange"
            />
            <el-button 
              type="primary" 
              @click="showActiveUsers"
              :disabled="!activeDate"
            >
              查询活跃用户
            </el-button>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索手机号/昵称"
              style="width: 250px"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button @click="handleSearch">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>
        </div>
      </template>

      <el-table :data="userList" v-loading="loading" stripe>
        <el-table-column type="index" width="50" />
        <el-table-column label="用户" min-width="150">
          <template #default="{ row }">
            <div class="user-cell">
              <span class="user-avatar">{{ row.avatarEmoji }}</span>
              <div class="user-info">
                <div class="nickname">{{ row.nickname }}</div>
                <div class="phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.role === 'admin'" type="danger">管理员</el-tag>
            <el-tag v-else type="info">普通用户</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'active'" type="success">正常</el-tag>
            <el-tag v-else-if="row.status === 'banned'" type="danger">封禁</el-tag>
            <el-tag v-else type="info">已删除</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">详情</el-button>
            <el-button 
              v-if="row.status === 'active'" 
              link 
              type="danger" 
              @click="handleBan(row)"
            >
              封禁
            </el-button>
            <el-button 
              v-else-if="row.status === 'banned'" 
              link 
              type="success" 
              @click="handleUnban(row)"
            >
              解封
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="loadData"
        />
      </div>
    </el-card>

    <!-- 用户详情弹窗 -->
    <el-dialog v-model="detailVisible" title="用户详情" width="600px">
      <el-descriptions :column="2" border v-if="userDetail">
        <el-descriptions-item label="头像">
          <span style="font-size: 32px">{{ userDetail.avatarEmoji }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="昵称">{{ userDetail.nickname }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ userDetail.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ userDetail.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="userDetail.status === 'active'" type="success">正常</el-tag>
          <el-tag v-else-if="userDetail.status === 'banned'" type="danger">封禁</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag v-if="userDetail.role === 'admin'" type="danger">管理员</el-tag>
          <el-tag v-else>普通用户</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="饮食记录">{{ userDetail.stats?.totalRecords }} 条</el-descriptions-item>
        <el-descriptions-item label="成就徽章">{{ userDetail.stats?.totalAchievements }} 个</el-descriptions-item>
        <el-descriptions-item label="AI使用">{{ userDetail.stats?.aiUsage }} 次</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatDate(userDetail.createdAt) }}</el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 活跃用户弹窗 -->
    <el-dialog v-model="activeUsersVisible" :title="activeDate ? activeDate + ' 活跃用户' : '活跃用户'" width="800px">
      <div v-if="activeDate" class="active-users-header">
        <el-tag type="success" size="large">共 {{ activeUsersTotal }} 位活跃用户</el-tag>
        <el-button text @click="loadActiveUsers">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <el-table :data="activeUsersList" v-loading="activeUsersLoading" stripe>
        <el-table-column type="index" label="#" width="60" />
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <span class="user-avatar">{{ row.avatarEmoji || '😊' }}</span>
              <div class="user-info">
                <div class="nickname">{{ row.nickname || '未设置昵称' }}</div>
                <div class="phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="todayRecords" label="该日记录数" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.todayRecords || 0 }} 条</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="160">
          <template #default="{ row }">
            {{ formatDate(row.lastLoginAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="activeUsersPage"
          v-model:page-size="activeUsersPageSize"
          :total="activeUsersTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="loadActiveUsers"
        />
      </div>
      <template #footer>
        <el-button @click="activeUsersVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getUserList, getUserDetail, updateUserStatus, getActiveUsersByDate, type UserItem, type UserDetail, type ActiveUserItem } from '@/api/users'
import dayjs from 'dayjs'

const route = useRoute()

const loading = ref(false)
const userList = ref<UserItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')

const detailVisible = ref(false)
const userDetail = ref<UserDetail | null>(null)

// 活跃用户相关
const activeDate = ref('')
const activeUsersVisible = ref(false)
const activeUsersList = ref<ActiveUserItem[]>([])
const activeUsersTotal = ref(0)
const activeUsersPage = ref(1)
const activeUsersPageSize = ref(20)
const activeUsersLoading = ref(false)

// 格式化日期（后端已返回北京时间字符串，直接截取显示）
const formatDate = (date: string) => {
  if (!date || date === '-') return '-'
  // 后端返回的已经是北京时间格式：'2026-03-26 01:34:22'
  // 直接截取前16位显示：'2026-03-26 01:34'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(date)) {
    return date.slice(0, 16)
  }
  // 兼容其他格式
  const d = dayjs(date)
  if (!d.isValid()) return '-'
  return d.format('YYYY-MM-DD HH:mm')
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      keyword: searchKeyword.value || undefined,
      page: currentPage.value,
      limit: pageSize.value,
    })
    userList.value = res.data.items
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const showDetail = async (row: UserItem) => {
  const res = await getUserDetail(row.id)
  userDetail.value = res.data
  detailVisible.value = true
}

const handleBan = async (row: UserItem) => {
  try {
    await ElMessageBox.confirm('确定要封禁该用户吗？', '提示', { type: 'warning' })
    await updateUserStatus(row.id, 'banned')
    ElMessage.success('封禁成功')
    loadData()
  } catch {
    // 取消
  }
}

const handleUnban = async (row: UserItem) => {
  try {
    await ElMessageBox.confirm('确定要解封该用户吗？', '提示', { type: 'warning' })
    await updateUserStatus(row.id, 'active')
    ElMessage.success('解封成功')
    loadData()
  } catch {
    // 取消
  }
}

const handleActiveDateChange = (val: string) => {
  if (val) {
    activeDate.value = val
  }
}

const showActiveUsers = () => {
  if (!activeDate.value) {
    ElMessage.warning('请先选择日期')
    return
  }
  activeUsersPage.value = 1
  activeUsersVisible.value = true
  loadActiveUsers()
}

const loadActiveUsers = async () => {
  activeUsersLoading.value = true
  try {
    const res = await getActiveUsersByDate(activeDate.value, {
      page: activeUsersPage.value,
      limit: activeUsersPageSize.value,
    })
    activeUsersList.value = res.data.items
    activeUsersTotal.value = res.data.total
  } catch (error: any) {
    ElMessage.error('加载活跃用户失败')
  } finally {
    activeUsersLoading.value = false
  }
}

onMounted(() => {
  loadData()
  
  // 检查路由参数，如果有 activeDate 则自动打开活跃用户弹窗
  const queryDate = route.query.activeDate as string
  if (queryDate) {
    activeDate.value = queryDate
    setTimeout(() => {
      activeUsersVisible.value = true
      loadActiveUsers()
    }, 100)
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.active-users-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.user-cell {
  display: flex;
  align-items: center;
}

.user-avatar {
  font-size: 32px;
  margin-right: 12px;
}

.user-info .nickname {
  font-weight: 500;
}

.user-info .phone {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
