<template>
  <div class="dashboard">
    <!-- 核心指标卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="item in statCards" :key="item.key">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: item.color }">
              <el-icon size="24" color="#fff">
                <component :is="item.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ item.value }}</div>
              <div class="stat-label">{{ item.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图表 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户增长趋势</span>
              <el-radio-group v-model="userTrendDays" size="small" @change="loadUserTrend">
                <el-radio-button :label="7">近7天</el-radio-button>
                <el-radio-button :label="30">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart class="chart" :option="userTrendOption" autoresize />
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>AI调用趋势</span>
              <el-radio-group v-model="aiTrendDays" size="small" @change="loadAITrend">
                <el-radio-button :label="7">近7天</el-radio-button>
                <el-radio-button :label="30">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart class="chart" :option="aiTrendOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- AI统计 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>AI调用分布（按服务商）</span>
          </template>
          <v-chart class="chart" :option="providerPieOption" autoresize />
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>AI调用分布（按功能）</span>
          </template>
          <v-chart class="chart" :option="functionPieOption" autoresize />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { User, TrendCharts, Food, Cpu } from '@element-plus/icons-vue'
import { getOverview, getUserGrowthTrend, getAIUsageTrend } from '@/api/dashboard'
import { getAIStatsByProvider, getAIStatsByFunction } from '@/api/ai-monitor'
import type { OverviewData } from '@/api/dashboard'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
])

const overview = ref<OverviewData | null>(null)
const userTrendDays = ref(30)
const aiTrendDays = ref(30)

const statCards = computed(() => [
  { key: 'users', label: '总用户数', value: overview.value?.totalUsers || 0, icon: 'User', color: '#409EFF' },
  { key: 'active', label: '今日活跃', value: overview.value?.todayActiveUsers || 0, icon: 'TrendCharts', color: '#67C23A' },
  { key: 'records', label: '今日记录', value: overview.value?.todayRecords || 0, icon: 'Food', color: '#E6A23C' },
  { key: 'ai', label: '今日AI调用', value: overview.value?.todayAICalls || 0, icon: 'Cpu', color: '#F56C6C' },
])

// 用户趋势图配置
const userTrendOption = ref({
  tooltip: { trigger: 'axis' },
  legend: { data: ['新增用户', '活跃用户'] },
  xAxis: { type: 'category', data: [] as string[] },
  yAxis: { type: 'value' },
  series: [
    { name: '新增用户', type: 'line', data: [] as number[], smooth: true },
    { name: '活跃用户', type: 'line', data: [] as number[], smooth: true },
  ],
})

// AI趋势图配置
const aiTrendOption = ref({
  tooltip: { trigger: 'axis' },
  legend: { data: ['调用次数', '费用(元)'] },
  xAxis: { type: 'category', data: [] as string[] },
  yAxis: [{ type: 'value', name: '次数' }, { type: 'value', name: '费用' }],
  series: [
    { name: '调用次数', type: 'bar', data: [] as number[] },
    { name: '费用(元)', type: 'line', yAxisIndex: 1, data: [] as number[], smooth: true },
  ],
})

// 服务商分布
const providerPieOption = ref({
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    data: [] as { name: string; value: number }[],
  }],
})

// 功能分布
const functionPieOption = ref({
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    data: [] as { name: string; value: number }[],
  }],
})

const loadOverview = async () => {
  const res = await getOverview()
  overview.value = res.data
}

const loadUserTrend = async () => {
  const res = await getUserGrowthTrend(userTrendDays.value)
  userTrendOption.value.xAxis.data = res.data.dates
  userTrendOption.value.series[0].data = res.data.newUsers
  userTrendOption.value.series[1].data = res.data.activeUsers
}

const loadAITrend = async () => {
  const res = await getAIUsageTrend(aiTrendDays.value)
  aiTrendOption.value.xAxis.data = res.data.dates
  aiTrendOption.value.series[0].data = res.data.callCounts
  aiTrendOption.value.series[1].data = res.data.costs
}

const loadProviderStats = async () => {
  const res = await getAIStatsByProvider()
  providerPieOption.value.series[0].data = res.data.map((item: any) => ({
    name: item.provider,
    value: parseInt(item.calls),
  }))
}

const loadFunctionStats = async () => {
  const res = await getAIStatsByFunction()
  if (res.code === 0) {
    functionPieOption.value.series[0].data = res.data.map((item: any) => ({
      name: item.functionType,
      value: parseInt(item.calls),
    }))
  }
}

onMounted(() => {
  loadOverview()
  loadUserTrend()
  loadAITrend()
  loadProviderStats()
  loadFunctionStats()
})
</script>

<style scoped>
.dashboard {
  padding-bottom: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.chart-row {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart {
  height: 300px;
}
</style>
