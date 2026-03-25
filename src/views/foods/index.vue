<template>
  <div class="foods-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>食物库管理</span>
          <div class="header-actions">
            <el-select 
              v-model="selectedCategory" 
              placeholder="全部分类" 
              clearable 
              style="width: 150px; margin-right: 12px"
              @change="handleCategoryChange"
            >
              <el-option 
                v-for="cat in categories" 
                :key="cat" 
                :label="cat" 
                :value="cat" 
              />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索食物名称"
              style="width: 250px; margin-right: 12px"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button @click="handleSearch">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
            <el-button type="primary" @click="showAddDialog">+ 新增食物</el-button>
          </div>
        </div>
      </template>

      <el-table :data="foodList" v-loading="loading" stripe>
        <el-table-column type="index" width="50" />
        <el-table-column prop="name" label="食物名称" min-width="150" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="caloriesPer100g" label="热量(100g)" width="120">
          <template #default="{ row }">
            {{ row.caloriesPer100g }} kcal
          </template>
        </el-table-column>
        <el-table-column prop="proteinPer100g" label="蛋白质" width="100">
          <template #default="{ row }">
            {{ row.proteinPer100g }}g
          </template>
        </el-table-column>
        <el-table-column prop="carbsPer100g" label="碳水" width="100">
          <template #default="{ row }">
            {{ row.carbsPer100g }}g
          </template>
        </el-table-column>
        <el-table-column prop="fatPer100g" label="脂肪" width="100">
          <template #default="{ row }">
            {{ row.fatPer100g }}g
          </template>
        </el-table-column>
        <el-table-column prop="isVerified" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isVerified" type="success">已核验</el-tag>
            <el-tag v-else type="warning">未核验</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑食物' : '新增食物'" width="600px">
      <el-form :model="form" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="食物名称" required>
              <el-input v-model="form.name" placeholder="如: 糙米饭" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" required>
              <el-select v-model="form.category" style="width: 100%">
                <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="热量(100g)" required>
              <el-input-number v-model="form.caloriesPer100g" :min="0" :precision="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="蛋白质(100g)" required>
              <el-input-number v-model="form.proteinPer100g" :min="0" :precision="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="碳水(100g)" required>
              <el-input-number v-model="form.carbsPer100g" :min="0" :precision="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="脂肪(100g)" required>
              <el-input-number v-model="form.fatPer100g" :min="0" :precision="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="膳食纤维(100g)">
              <el-input-number v-model="form.fiberPer100g" :min="0" :precision="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="钠(100g)">
              <el-input-number v-model="form.sodiumPer100g" :min="0" :precision="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="默认份量(g)">
          <el-input-number v-model="form.defaultPortionG" :min="1" :max="1000" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="已核验">
          <el-switch v-model="form.isVerified" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getFoodList, getFoodCategories, createFood, updateFood, deleteFood, type FoodItem } from '@/api/foods'

const loading = ref(false)
const foodList = ref<FoodItem[]>([])
const categories = ref<string[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')
const selectedCategory = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const form = ref<Partial<FoodItem>>({
  name: '',
  category: '',
  caloriesPer100g: 0,
  proteinPer100g: 0,
  carbsPer100g: 0,
  fatPer100g: 0,
  fiberPer100g: 0,
  sodiumPer100g: 0,
  defaultPortionG: 100,
  isVerified: false,
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getFoodList({
      keyword: searchKeyword.value || undefined,
      category: selectedCategory.value || undefined,
      page: currentPage.value,
      limit: pageSize.value,
    })
    foodList.value = res.data.items
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  const res = await getFoodCategories()
  categories.value = res.data
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handleCategoryChange = () => {
  currentPage.value = 1
  loadData()
}

const showAddDialog = () => {
  isEdit.value = false
  form.value = {
    name: '',
    category: categories.value[0] || '',
    caloriesPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
    fiberPer100g: 0,
    sodiumPer100g: 0,
    defaultPortionG: 100,
    isVerified: false,
  }
  dialogVisible.value = true
}

const showEditDialog = (row: FoodItem) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.name || !form.value.category) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateFood(form.value.id!, form.value)
      ElMessage.success('修改成功')
    } else {
      await createFood(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row: FoodItem) => {
  try {
    await ElMessageBox.confirm('确定要删除该食物吗？', '提示', { type: 'warning' })
    await deleteFood(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // 取消
  }
}

onMounted(() => {
  loadData()
  loadCategories()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
