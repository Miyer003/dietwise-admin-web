<template>
  <div class="ai-monitor-page">
    <!-- 统计卡片 -->
    <el-row :gutter="16">
      <el-col :span="4" v-for="item in statCards" :key="item.key">
        <el-card class="stat-card" shadow="hover" :body-style="{ padding: '16px' }">
          <div class="stat-icon" :style="{ backgroundColor: item.bgColor }">
            <el-icon :size="20" :color="item.color">
              <TrendCharts v-if="item.key === 'calls'" />
              <Coin v-else-if="item.key === 'cost'" />
              <CircleCheck v-else-if="item.key === 'success'" />
              <CircleClose v-else-if="item.key === 'fail'" />
              <Warning v-else-if="item.key === 'rate'" />
              <Timer v-else />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选 -->
    <el-card class="filter-card" shadow="never">
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
            :shortcuts="dateShortcuts"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetDate">重置</el-button>
          <el-button type="primary" @click="loadData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 趋势图 -->
    <el-card class="chart-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>调用趋势</span>
          <el-radio-group v-model="trendType" size="small" @change="updateTrendChart">
            <el-radio-button label="calls">调用量</el-radio-button>
            <el-radio-button label="cost">费用</el-radio-button>
            <el-radio-button label="success">成功率</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <v-chart class="trend-chart" :option="trendOption" autoresize />
    </el-card>

    <!-- 图表网格 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="8">
        <el-card class="chart-card" shadow="never">
          <template #header>模型使用分布</template>
          <v-chart class="chart" :option="modelPieOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card" shadow="never">
          <template #header>功能类型分布</template>
          <v-chart class="chart" :option="functionPieOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card" shadow="never">
          <template #header>服务商分布</template>
          <v-chart class="chart" :option="providerPieOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 模型详细统计 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>模型使用详情</span>
          <el-tag type="info">按调用量排序</el-tag>
        </div>
      </template>
      <el-table :data="modelStats" stripe style="width: 100%">
        <el-table-column prop="modelName" label="模型" min-width="150">
          <template #default="{ row }">
            <div class="model-cell">
              <el-tag size="small" :type="getProviderType(row.provider)">
                {{ row.provider }}
              </el-tag>
              <span class="model-name">{{ row.modelName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="calls" label="调用次数" width="120" sortable>
          <template #default="{ row }">
            <strong>{{ formatNumber(row.calls) }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="cost" label="费用" width="120" sortable>
          <template #default="{ row }">
            ¥{{ (parseFloat(row.cost) / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="Token消耗" min-width="200">
          <template #default="{ row }">
            <div class="token-bar">
              <span class="token-text">输入: {{ formatNumber(row.inputTokens) }}</span>
              <el-progress 
                :percentage="getTokenPercentage(row)" 
                :show-text="false"
                :stroke-width="8"
                :color="'#409EFF'"
              />
              <span class="token-text">输出: {{ formatNumber(row.outputTokens) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="平均耗时" width="120">
          <template #default="{ row }">
            {{ row.avgLatency || '-' }} ms
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 日志表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>调用日志</span>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @change="loadLogs"
            small
          />
        </div>
      </template>
      <el-table :data="logList" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="functionType" label="功能" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ formatFunctionType(row.functionType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="modelName" label="模型" min-width="180">
          <template #default="{ row }">
            <div class="model-cell">
              <el-tag size="small" :type="getProviderType(row.provider)">
                {{ row.provider }}
              </el-tag>
              <span class="model-name">{{ row.modelName || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="inputTokens" label="Token" width="140">
          <template #default="{ row }">
            <div class="token-info">
              <span class="token-in">{{ row.inputTokens || 0 }}</span>
              <span class="token-separator">/</span>
              <span class="token-out">{{ row.outputTokens || 0 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="costCents" label="费用" width="90">
          <template #default="{ row }">
            ¥{{ (row.costCents / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="latencyMs" label="耗时" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="getLatencyType(row.latencyMs)">
              {{ row.latencyMs }}ms
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="success" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.success" type="success" size="small" effect="dark">
              <el-icon><Check /></el-icon>
            </el-tag>
            <el-tag v-else type="danger" size="small" effect="dark">
              <el-icon><Close /></el-icon>
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
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
import { PieChart, LineChart, BarChart } from 'echarts/charts'
import { 
  LegendComponent, 
  TooltipComponent, 
  GridComponent,
  TitleComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { 
  getAIStats, 
  getAIStatsByProvider, 
  getAIStatsByFunction, 
  getAILogs,
  getAIStatsByModel,
  getAIUsageTrend,
  type AIStats,
  type ModelStat
} from '@/api/ai-monitor'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
import { 
  Refresh, 
  Check, 
  Close,
  TrendCharts,
  Coin,
  CircleCheck,
  CircleClose,
  Warning,
  Timer
} from '@element-plus/icons-vue'

use([CanvasRenderer, PieChart, LineChart, BarChart, LegendComponent, TooltipComponent, GridComponent, TitleComponent, DataZoomComponent])

const loading = ref(false)
const stats = ref<AIStats | null>(null)
const logList = ref<any[]>([])
const modelStats = ref<ModelStat[]>([])
const trendData = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const dateRange = ref<string[]>([])
const trendType = ref('calls')

// 日期快捷选项
const dateShortcuts = [
  { text: '今天', value: [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] },
  { text: '昨天', value: [dayjs().subtract(1, 'day').format('YYYY-MM-DD'), dayjs().subtract(1, 'day').format('YYYY-MM-DD')] },
  { text: '最近7天', value: [dayjs().subtract(6, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] },
  { text: '最近30天', value: [dayjs().subtract(29, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] },
]

// 统计卡片
const statCards = computed(() => [
  { key: 'calls', label: '总调用次数', value: formatNumber(stats.value?.totalCalls || 0), color: '#409EFF', bgColor: '#ecf5ff' },
  { key: 'cost', label: '总费用(元)', value: `¥${(stats.value?.totalCost || 0).toFixed(2)}`, color: '#F56C6C', bgColor: '#fef0f0' },
  { key: 'success', label: '成功次数', value: formatNumber(stats.value?.successCalls || 0), color: '#67C23A', bgColor: '#f0f9eb' },
  { key: 'fail', label: '失败次数', value: formatNumber(stats.value?.failedCalls || 0), color: '#909399', bgColor: '#f4f4f5' },
  { key: 'rate', label: '成功率', value: `${stats.value?.successRate?.toFixed(1) || 0}%`, color: '#E6A23C', bgColor: '#fdf6ec' },
  { key: 'avg', label: '平均耗时', value: '245ms', color: '#8E44AD', bgColor: '#f5eef8' },
])

// 趋势图配置
const trendOption = ref({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
    formatter: (params: any[]) => {
      const date = params[0].axisValue
      let result = `<strong>${date}</strong><br/>`
      params.forEach(item => {
        const unit = trendType.value === 'cost' ? '元' : trendType.value === 'success' ? '%' : '次'
        result += `${item.marker} ${item.seriesName}: ${item.value}${unit}<br/>`
      })
      return result
    }
  },
  legend: { data: ['成功', '失败'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
  xAxis: {
    type: 'category',
    data: [] as string[],
    axisLabel: { formatter: (value: string) => dayjs(value).format('MM-DD') }
  },
  yAxis: [
    { type: 'value', name: '调用次数', position: 'left' },
    { type: 'value', name: '费用(元)', position: 'right', show: false }
  ],
  dataZoom: [{ type: 'inside', start: 0, end: 100 }],
  series: [
    {
      name: '成功',
      type: 'bar',
      stack: 'total',
      data: [] as number[],
      itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] },
      barWidth: '60%'
    },
    {
      name: '失败',
      type: 'bar',
      stack: 'total',
      data: [] as number[],
      itemStyle: { color: '#F56C6C', borderRadius: [4, 4, 0, 0] },
    }
  ]
})

// 模型分布饼图
const modelPieOption = ref({
  tooltip: {
    trigger: 'item',
    formatter: '{b}<br/>调用: {c}次<br/>占比: {d}%'
  },
  legend: { 
    type: 'scroll', 
    orient: 'horizontal', 
    bottom: 10, 
    left: 'center',
    itemGap: 10,
    textStyle: { fontSize: 11 },
    formatter: (name: string) => name.length > 10 ? name.slice(0, 10) + '...' : name
  },
  series: [{
    type: 'pie',
    radius: ['35%', '60%'],
    center: ['50%', '42%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    emphasis: {
      label: { show: true, fontSize: 12, fontWeight: 'bold', formatter: '{b}\n{c}次\n({d}%)' }
    },
    data: [] as { name: string; value: number }[]
  }]
})

// 功能分布饼图
const functionPieOption = ref({
  tooltip: {
    trigger: 'item',
    formatter: '{b}<br/>调用: {c}次<br/>占比: {d}%'
  },
  legend: { bottom: '5%', icon: 'circle' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
    label: {
      show: true,
      formatter: '{b}\n{c}次\n({d}%)'
    },
    data: [] as { name: string; value: number }[]
  }]
})

// 服务商分布饼图
const providerPieOption = ref({
  tooltip: {
    trigger: 'item',
    formatter: '{b}<br/>调用: {c}次<br/>占比: {d}%'
  },
  legend: { bottom: '5%', icon: 'circle' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
    color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C'],
    label: {
      show: true,
      formatter: '{b}\n{c}次'
    },
    data: [] as { name: string; value: number }[]
  }]
})

const getQueryParams = () => {
  const params: any = {}
  if (dateRange.value && dateRange.value.length === 2) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }
  return params
}

const loadData = async () => {
  loading.value = true
  try {
    const params = getQueryParams()
    
    // 加载统计数据
    const statsRes = await getAIStats(params)
    stats.value = statsRes.data
    
    // 加载趋势数据
    const trendRes = await getAIUsageTrend(params)
    trendData.value = trendRes.data
    updateTrendChart()
    
    // 加载模型统计
    const modelRes = await getAIStatsByModel(params)
    modelStats.value = modelRes.data
    modelPieOption.value.series[0].data = modelRes.data.map((item: ModelStat) => ({
      name: item.modelName,
      value: parseInt(item.calls),
    }))
    
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
  } finally {
    loading.value = false
  }
}

const updateTrendChart = () => {
  const dates = trendData.value.map(d => d.date)
  
  // 根据趋势类型设置不同的数据
  if (trendType.value === 'calls') {
    // 调用量 - 显示成功和失败的堆叠柱状图
    trendOption.value.yAxis[0].name = '调用次数'
    trendOption.value.yAxis[0].show = true
    trendOption.value.yAxis[1].show = false
    trendOption.value.series[0].type = 'bar'
    trendOption.value.series[1].type = 'bar'
    trendOption.value.series[0].stack = 'total'
    trendOption.value.series[1].stack = 'total'
    trendOption.value.series[0].data = trendData.value.map(d => d.successCalls)
    trendOption.value.series[1].data = trendData.value.map(d => d.failCalls)
    trendOption.value.legend.data = ['成功', '失败']
  } else if (trendType.value === 'cost') {
    // 费用 - 显示费用折线图
    trendOption.value.yAxis[0].name = '费用(元)'
    trendOption.value.yAxis[0].show = true
    trendOption.value.yAxis[1].show = false
    trendOption.value.series[0].type = 'line'
    trendOption.value.series[1].type = 'line'
    trendOption.value.series[0].stack = ''
    trendOption.value.series[1].stack = ''
    trendOption.value.series[0].data = trendData.value.map(d => d.cost)
    trendOption.value.series[1].data = [] // 费用不显示失败系列
    trendOption.value.legend.data = ['费用']
  } else if (trendType.value === 'success') {
    // 成功率 - 显示成功率折线图
    trendOption.value.yAxis[0].name = '成功率(%)'
    trendOption.value.yAxis[0].show = true
    trendOption.value.yAxis[1].show = false
    trendOption.value.series[0].type = 'line'
    trendOption.value.series[1].type = 'line'
    trendOption.value.series[0].stack = ''
    trendOption.value.series[1].stack = ''
    trendOption.value.series[0].data = trendData.value.map(d => d.successRate)
    trendOption.value.series[1].data = [] // 成功率不显示失败系列
    trendOption.value.legend.data = ['成功率']
  }
  
  trendOption.value.xAxis.data = dates
}

const loadLogs = async () => {
  try {
    const params = {
      ...getQueryParams(),
      page: currentPage.value,
      limit: pageSize.value,
    }
    const res = await getAILogs(params)
    logList.value = res.data.items
    total.value = res.data.total
  } catch (error) {
    console.error('加载日志失败:', error)
  }
}

const resetDate = () => {
  dateRange.value = []
  loadData()
}

// 格式化为北京时间（后端已返回北京时间字符串，直接截取显示）
const formatDate = (date: string | Date) => {
  if (!date) return '-'
  const dateStr = typeof date === 'string' ? date : date.toString()
  // 后端返回的已经是北京时间格式：'2026-03-26 01:34:22'
  // 截取 MM-DD HH:mm:ss 格式
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    return dateStr.slice(5)  // 从第5位开始截取：03-26 01:34:22
  }
  // 兼容其他格式
  const d = dayjs(date)
  if (!d.isValid()) return '-'
  return d.format('MM-DD HH:mm:ss')
}

const formatNumber = (num: number | string) => {
  const n = typeof num === 'string' ? parseInt(num) : num
  return n.toLocaleString('zh-CN')
}

const formatFunctionType = (type: string) => {
  const map: Record<string, string> = {
    NUTRITION_ANALYSIS: '营养分析',
    CHAT: 'AI对话',
    MEAL_PLAN_GENERATION: '食谱生成',
    TIP_GENERATION: '建议生成',
    VOICE_ANALYSIS: '语音分析',
  }
  return map[type] || type
}

const getProviderType = (provider: string) => {
  const map: Record<string, any> = {
    DASHSCOPE: 'primary',
    MOONSHOT: 'success',
    OPENAI: 'warning',
  }
  return map[provider] || 'info'
}

const getLatencyType = (latency: number) => {
  if (latency < 1000) return 'success'
  if (latency < 3000) return 'warning'
  return 'danger'
}

const getTokenPercentage = (row: ModelStat) => {
  const input = parseInt(row.inputTokens) || 0
  const output = parseInt(row.outputTokens) || 0
  const total = input + output
  if (total === 0) return 0
  return Math.round((input / total) * 100)
}

onMounted(() => {
  // 默认最近7天
  dateRange.value = [
    dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]
  loadData()
})
</script>

<style scoped>
.ai-monitor-page {
  padding: 20px;
}

.stat-card {
  margin-bottom: 16px;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.filter-card {
  margin-bottom: 16px;
}

.chart-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trend-chart {
  height: 300px;
}

.chart {
  height: 280px;
}

.chart-row {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 16px;
}

.model-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-name {
  font-weight: 500;
  color: #303133;
}

.token-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.token-text {
  font-size: 12px;
  color: #606266;
}

.token-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.token-in {
  color: #409EFF;
  font-weight: 500;
}

.token-out {
  color: #67C23A;
  font-weight: 500;
}

.token-separator {
  color: #C0C4CC;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
