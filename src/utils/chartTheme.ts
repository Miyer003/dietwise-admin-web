/**
 * ECharts 雾中山林主题配置
 * 统一图表配色与样式，方便后续切换风格
 */

// 设计系统核心色（Web端雾中山林）
export const dwColors = {
  bg: '#1C1917',
  card: '#292524',
  interactive: '#44403C',
  accent: '#78716C',
  highlight: '#A8A29E',
  text: '#F5F5F4',
  textMuted: '#78716C',
} as const

// 强制配色顺序
export const chartColors = {
  primary: '#78716C',    // 主数据 60%
  secondary: '#A8A29E',  // 次数据 25%
  tertiary: '#D6D3D1',   // 辅助数据 10%
  light: '#E7E5E4',      // 轻量数据 5%
  highlight: '#8B7355',  // 高亮/预警
  contrast: '#5A7A7A',   // 特殊对比
} as const

// 完整配色序列
export const colorPalette = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.tertiary,
  chartColors.light,
  chartColors.highlight,
  chartColors.contrast,
]

// Web端图表通用基础配置
export const baseChartOption = {
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  },
  tooltip: {
    backgroundColor: dwColors.card,
    borderColor: dwColors.interactive,
    borderWidth: 1,
    textStyle: {
      color: dwColors.text,
    },
    padding: [8, 12],
    borderRadius: 4,
  },
  legend: {
    textStyle: {
      color: dwColors.highlight,
    },
    itemGap: 20,
  },
}

// 坐标轴通用配置
export const axisConfig = {
  axisLabel: {
    color: dwColors.highlight,
  },
  axisLine: {
    lineStyle: {
      color: dwColors.interactive,
    },
  },
  splitLine: {
    lineStyle: {
      color: dwColors.interactive,
      type: 'dashed' as const,
    },
  },
  nameTextStyle: {
    color: dwColors.highlight,
  },
}

// 折线图填充渐变（使用纯色透明度模拟）
export function createAreaStyle(color: string, opacityStart = 0.3, opacityEnd = 0.05) {
  return {
    color: {
      type: 'linear' as const,
      x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: hexToRgba(color, opacityStart) },
        { offset: 1, color: hexToRgba(color, opacityEnd) },
      ],
    },
  }
}

// 工具：hex 转 rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
