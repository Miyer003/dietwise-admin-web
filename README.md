# 膳智 DietWise 管理后台

基于 Vue 3 + Element Plus 的后台管理系统。

## 功能模块

- 📊 **数据看板**: 核心指标统计、用户增长趋势、AI调用监控
- 👥 **用户管理**: 用户列表、详情查看、状态管理（封禁/解封）
- 🍎 **食物库**: 食物数据管理、增删改查
- 🏅 **成就徽章**: 徽章定义管理、启用/禁用、获得统计
- 🤖 **AI监控**: 调用量统计、费用分析、日志查询
- 💬 **用户反馈**: 反馈列表、处理回复

## 技术栈

- Vue 3 + TypeScript
- Element Plus (UI组件库)
- Pinia (状态管理)
- Vue Router (路由)
- Axios (HTTP请求)
- ECharts (图表)

## 开发环境配置

复制 `.env.development` 为 `.env.local`（如果需要本地覆盖）：

```bash
# API 后端地址
VITE_API_BASE_URL=http://localhost:3000/v1
```

## 启动开发服务器

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

或者使用根目录的启动脚本（同时启动后端、移动端、后台管理）：

```bash
cd ../
./start-dev.sh
```

## 构建生产版本

```bash
npm run build
```

构建后的文件在 `dist/` 目录下。

## 登录说明

使用移动端的管理员账号登录（`role=admin` 的用户）。

## 接口规范

与移动端共用后端 API，响应格式统一为：

```json
{
  "code": 0,
  "data": {},
  "message": "success"
}
```

- `code`: 0 表示成功，非 0 表示失败
- `data`: 业务数据
- `message`: 提示信息
