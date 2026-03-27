<template>
  <div class="dashboard">
    <!-- 核心指标卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="item in statCards" :key="item.key">
        <el-card 
          class="stat-card" 
          shadow="hover" 
          :class="{ 'clickable': item.route }"
          @click="handleCardClick(item)"
        >
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
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>AI模型使用分布</span>
          </template>
          <v-chart class="chart" :option="modelPieOption" autoresize />
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>AI调用分布（按服务商）</span>
          </template>
          <v-chart class="chart" :option="providerPieOption" autoresize />
        </el-card>
      </el-col>
      
      <el-col :span="8">
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
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
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
import { getOverview, getUserGrowthTrend, getAIUsageTrend } from '@/api/dashboard'
import { getAIStatsByProvider, getAIStatsByFunction, getAIStatsByModel } from '@/api/ai-monitor'
import type { OverviewData } from '@/api/dashboard'

const router = useRouter()

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
  { key: 'users', label: '总用户数', value: overview.value?.totalUsers || 0, icon: 'User', color: '#409EFF', route: '/users' },
  { key: 'active', label: '今日活跃', value: overview.value?.todayActiveUsers || 0, icon: 'TrendCharts', color: '#67C23A', route: '/users/today-active' },
  { key: 'records', label: '今日记录', value: overview.value?.todayRecords || 0, icon: 'Food', color: '#E6A23C', route: '/records' },
  { key: 'ai', label: '今日AI调用', value: overview.value?.todayAICalls || 0, icon: 'Cpu', color: '#F56C6C', route: '/ai-monitor' },
])

// 处理卡片点击
const handleCardClick = (item: any) => {
  if (item.key === 'active') {
    // 今日活跃跳转到用户管理并打开今日活跃弹窗
    const today = dayjs().format('YYYY-MM-DD')
    router.push({
      path: '/users',
      query: { activeDate: today }
    })
  } else if (item.route) {
    router.push(item.route)
  }
}

// 用户趋势图配置
const userTrendOption = ref({
  tooltip: { 
    trigger: 'axis',
    formatter: function(params: any[]) {
      let result = `<strong>${params[0].axisValue}</strong><br/>`
      params.forEach(item => {
        result += `${item.marker} <strong>${item.seriesName}</strong>: ${item.value} 人<br/>`
      })
      return result
    }
  },
  legend: { 
    data: ['新增用户', '活跃用户'],
    top: '5%',
    itemGap: 20,
    textStyle: {
      fontSize: 12,
      color: '#606266'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '15%',
    containLabel: true
  },
  xAxis: { 
    type: 'category', 
    data: [] as string[],
    axisLabel: {
      color: '#909399',
      formatter: (value: string) => dayjs(value).format('MM-DD')
    }
  },
  yAxis: { 
    type: 'value',
    name: '用户数（人）',
    nameTextStyle: {
      color: '#909399',
      padding: [0, 0, 0, 40]
    },
    axisLabel: {
      color: '#909399'
    },
    splitLine: {
      lineStyle: {
        color: '#E4E7ED',
        type: 'dashed'
      }
    }
  },
  color: ['#409EFF', '#67C23A'],
  series: [
    { 
      name: '新增用户', 
      type: 'line', 
      data: [] as number[], 
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ]
        }
      }
    },
    { 
      name: '活跃用户', 
      type: 'line', 
      data: [] as number[], 
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ]
        }
      }
    },
  ],
})

// AI趋势图配置
const aiTrendOption = ref({
  tooltip: { 
    trigger: 'axis',
    formatter: function(params: any[]) {
      let result = `<strong>${params[0].axisValue}</strong><br/>`
      params.forEach(item => {
        const unit = item.seriesName === '调用次数' ? '次' : '元'
        result += `${item.marker} <strong>${item.seriesName}</strong>: ${item.value} ${unit}<br/>`
      })
      return result
    }
  },
  legend: { 
    data: ['调用次数', '费用(元)'],
    top: '5%',
    itemGap: 20,
    textStyle: {
      fontSize: 12,
      color: '#606266'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '15%',
    containLabel: true
  },
  xAxis: { 
    type: 'category', 
    data: [] as string[],
    axisLabel: {
      color: '#909399',
      formatter: (value: string) => dayjs(value).format('MM-DD')
    }
  },
  yAxis: [
    { 
      type: 'value', 
      name: '调用次数（次）',
      position: 'left',
      nameTextStyle: {
        color: '#909399',
        padding: [0, 0, 0, 20]
      },
      axisLabel: {
        color: '#909399'
      },
      splitLine: {
        lineStyle: {
          color: '#E4E7ED',
          type: 'dashed'
        }
      }
    }, 
    { 
      type: 'value', 
      name: '费用（元）',
      position: 'right',
      nameTextStyle: {
        color: '#909399',
        padding: [0, 20, 0, 0]
      },
      axisLabel: {
        color: '#909399',
        formatter: '¥{value}'
      },
      splitLine: {
        show: false
      }
    }
  ],
  color: ['#E6A23C', '#F56C6C'],
  series: [
    { 
      name: '调用次数', 
      type: 'bar', 
      data: [] as number[],
      itemStyle: {
        borderRadius: [4, 4, 0, 0]
      }
    },
    { 
      name: '费用(元)', 
      type: 'line', 
      yAxisIndex: 1, 
      data: [] as number[], 
      smooth: true,
      lineStyle: {
        width: 3
      },
      symbol: 'circle',
      symbolSize: 8
    },
  ],
})

// 服务商分布
const providerPieOption = ref({
  tooltip: { 
    trigger: 'item',
    formatter: function(params: any) {
      const nameMap: Record<string, string> = {
        'dashscope': '阿里灵积',
        'moonshot': 'Moonshot'
      }
      const name = nameMap[params.name] || params.name
      return `<strong>${name}</strong><br/>` +
             `${params.marker} 调用次数: <strong>${params.value}</strong> 次<br/>` +
             `占比: <strong>${params.percent}%</strong>`
    }
  },
  legend: { 
    orient: 'horizontal',
    bottom: '5%',
    left: 'center',
    itemGap: 20,
    textStyle: {
      fontSize: 13,
      color: '#606266'
    },
    formatter: function(name: string) {
      const nameMap: Record<string, string> = {
        'dashscope': '阿里灵积',
        'moonshot': 'Moonshot'
      }
      return nameMap[name] || name
    }
  },
  color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C'],
  series: [{
    type: 'pie',
    radius: ['40%', '65%'],
    center: ['50%', '45%'],
    avoidLabelOverlap: false,
    itemStyle: {
      borderRadius: 6,
      borderColor: '#fff',
      borderWidth: 2
    },
    label: {
      show: false
    },
    emphasis: {
      label: {
        show: true,
        fontSize: 14,
        fontWeight: 'bold',
        formatter: '{b}\n{c}次\n({d}%)'
      },
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    },
    data: [] as { name: string; value: number }[],
  }],
})

// 模型使用分布
const modelPieOption = ref({
  tooltip: { 
    trigger: 'item',
    formatter: function(params: any) {
      return `<strong>${params.name}</strong><br/>` +
             `${params.marker} 调用次数: <strong>${params.value}</strong> 次<br/>` +
             `占比: <strong>${params.percent}%</strong>`
    }
  },
  legend: { 
    type: 'scroll',
    orient: 'horizontal',
    bottom: '5%',
    left: 'center',
    itemGap: 15,
    textStyle: {
      fontSize: 11,
      color: '#606266'
    },
    formatter: function(name: string) {
      // 截断过长的模型名
      return name.length > 12 ? name.slice(0, 12) + '...' : name
    }
  },
  color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#8E44AD', '#1ABC9C', '#34495E'],
  series: [{
    type: 'pie',
    radius: ['35%', '60%'],
    center: ['50%', '42%'],
    avoidLabelOverlap: false,
    itemStyle: {
      borderRadius: 6,
      borderColor: '#fff',
      borderWidth: 2
    },
    label: {
      show: false
    },
    emphasis: {
      label: {
        show: true,
        fontSize: 12,
        fontWeight: 'bold',
        formatter: '{b}\n{c}次\n({d}%)'
      },
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    },
    data: [] as { name: string; value: number }[],
  }],
})

// 功能分布
const functionPieOption = ref({
  tooltip: { 
    trigger: 'item',
    formatter: function(params: any) {
      const nameMap: Record<string, string> = {
        'NUTRITION_ANALYSIS': '营养分析',
        'VOICE_ANALYSIS': '语音分析',
        'CHAT': 'AI对话',
        'MEAL_PLAN_GENERATION': '食谱生成',
        'TIP_GENERATION': '健康建议'
      }
      const name = nameMap[params.name] || params.name
      return `<strong>${name}</strong><br/>` +
             `${params.marker} 调用次数: <strong>${params.value}</strong> 次<br/>` +
             `占比: <strong>${params.percent}%</strong>`
    }
  },
  legend: { 
    orient: 'horizontal',
    bottom: '5%',
    left: 'center',
    itemGap: 15,
    textStyle: {
      fontSize: 12,
      color: '#606266'
    },
    formatter: function(name: string) {
      const nameMap: Record<string, string> = {
        'NUTRITION_ANALYSIS': '营养分析',
        'VOICE_ANALYSIS': '语音分析',
        'CHAT': 'AI对话',
        'MEAL_PLAN_GENERATION': '食谱生成',
        'TIP_GENERATION': '健康建议'
      }
      return nameMap[name] || name
    }
  },
  color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'],
  series: [{
    type: 'pie',
    radius: ['40%', '65%'],
    center: ['50%', '45%'],
    avoidLabelOverlap: false,
    itemStyle: {
      borderRadius: 6,
      borderColor: '#fff',
      borderWidth: 2
    },
    label: {
      show: false
    },
    emphasis: {
      label: {
        show: true,
        fontSize: 13,
        fontWeight: 'bold',
        formatter: function(params: any) {
          const nameMap: Record<string, string> = {
            'NUTRITION_ANALYSIS': '营养分析',
            'VOICE_ANALYSIS': '语音分析',
            'CHAT': 'AI对话',
            'MEAL_PLAN_GENERATION': '食谱生成',
            'TIP_GENERATION': '健康建议'
          }
          const name = nameMap[params.name] || params.name
          return name + '\n' + params.value + '次\n(' + params.percent + '%)'
        }
      },
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    },
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
  const data = (res as any).data || res
  if (Array.isArray(data)) {
    // 按调用次数排序
    const sortedData = data.sort((a: any, b: any) => parseInt(b.calls) - parseInt(a.calls))
    functionPieOption.value.series[0].data = sortedData.map((item: any) => ({
      name: item.functionType,  // 使用原始 functionType，tooltip 会转换
      value: parseInt(item.calls),
    }))
  }
}

const loadModelStats = async () => {
  const res = await getAIStatsByModel()
  const data = (res as any).data || res
  if (Array.isArray(data)) {
    // 按调用次数排序，取前7个
    const sortedData = data
      .sort((a: any, b: any) => parseInt(b.calls) - parseInt(a.calls))
      .slice(0, 7)
    modelPieOption.value.series[0].data = sortedData.map((item: any) => ({
      name: item.modelName,
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
  loadModelStats()
})
</script>

<style scoped>
.dashboard {
  padding-bottom: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-card.clickable {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card.clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
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
