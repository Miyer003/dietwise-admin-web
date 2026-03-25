<template>
  <div class="ai-monitor-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="item in statCards" :key="item.key">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选 -->
    <el-card style="margin-top: 20px">
      <el-form :inline="true">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="loadData"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetDate">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 图表 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>服务商分布</template>
          <v-chart class="chart" :option="providerPieOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>功能类型分布</template>
          <v-chart class="chart" :option="functionPieOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 日志表格 -->
    <el-card style="margin-top: 20px">
      <template #header>调用日志</template>
      <el-table :data="logList" v-loading="loading" stripe>
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="functionType" label="功能" width="150">
          <template #default="{ row }">
            <el-tag>{{ formatFunctionType(row.functionType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="provider" label="服务商" width="120" />
        <el-table-column prop="modelName" label="模型" width="150" />
        <el-table-column prop="inputTokens" label="输入Token" width="120" />
        <el-table-column prop="outputTokens" label="输出Token" width="120" />
        <el-table-column prop="costCents" label="费用" width="100">
          <template #default="{ row }">
            ¥{{ (row.costCents / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="latencyMs" label="耗时" width="100">
          <template #default="{ row }">
            {{ row.latencyMs }}ms
          </template>
        </el-table-column>
        <el-table-column prop="success" label="状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.success" type="success">成功</el-tag>
            <el-tag v-else type="danger">失败</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @change="loadLogs"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getAIStats, getAIStatsByProvider, getAIStatsByFunction, getAILogs, type AIStats } from '@/api/ai-monitor'
import dayjs from 'dayjs'

use([CanvasRenderer, PieChart, LegendComponent, TooltipComponent])

const loading = ref(false)
const stats = ref<AIStats | null>(null)
const logList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const dateRange = ref<string[]>([])

const statCards = computed(() => [
  { key: 'calls', label: '总调用次数', value: stats.value?.totalCalls || 0, color: '#409EFF' },
  { key: 'cost', label: '总费用(元)', value: stats.value ? `¥${stats.value.totalCost.toFixed(2)}` : '¥0.00', color: '#F56C6C' },
  { key: 'success', label: '成功次数', value: stats.value?.successCalls || 0, color: '#67C23A' },
  { key: 'rate', label: '成功率', value: stats.value ? `${stats.value.successRate}%` : '0%', color: '#E6A23C' },
])

const providerPieOption = ref({
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    data: [] as { name: string; value: number }[],
  }],
})

const functionPieOption = ref({
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    data: [] as { name: string; value: number }[],
  }],
})

const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD HH:mm:ss')
}

const formatFunctionType = (type: string) => {
  const map: Record<string, string> = {
    NUTRITION_ANALYSIS: '营养分析',
    CHAT: 'AI对话',
    MEAL_PLAN_GENERATION: '食谱生成',
    TIP_GENERATION: '建议生成',
  }
  return map[type] || type
}

const getQueryParams = () => {
  const params: any = {}
  if (dateRange.value && dateRange.value.length === 2) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }
  return params
}

const loadData = async () => {
  const params = getQueryParams()
  
  // 加载统计
  const statsRes = await getAIStats(params)
  stats.value = statsRes.data
  
  // 加载服务商统计
  const providerRes = await getAIStatsByProvider(params)
  providerPieOption.value.series[0].data = providerRes.data.map((item: any) => ({
    name: item.provider,
    value: parseInt(item.calls),
  }))
  
  // 加载功能统计
  const functionRes = await getAIStatsByFunction(params)
  functionPieOption.value.series[0].data = functionRes.data.map((item: any) => ({
    name: formatFunctionType(item.functionType),
    value: parseInt(item.calls),
  }))
  
  loadLogs()
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params = {
      ...getQueryParams(),
      page: currentPage.value,
      limit: pageSize.value,
    }
    const res = await getAILogs(params)
    logList.value = res.data.items
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const resetDate = () => {
  dateRange.value = []
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.chart {
  height: 250px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
