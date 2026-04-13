<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <span class="logo-icon">🥗</span>
        <span class="logo-text">膳智后台</span>
      </div>
      
      <el-menu
        :default-active="route.path"
        router
        class="menu"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <span class="user-name">{{ authStore.userInfo?.nickname || '管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const menuItems = computed(() => [
  { path: '/dashboard', title: '数据看板', icon: 'Odometer' },
  { path: '/users', title: '用户管理', icon: 'User' },
  { path: '/records', title: '饮食记录', icon: 'Document' },
  { path: '/foods', title: '食物库', icon: 'Food' },
  { path: '/badges', title: '成就徽章', icon: 'Medal' },
  { path: '/ai-monitor', title: 'AI监控', icon: 'Cpu' },
  { path: '/feedbacks', title: '用户反馈', icon: 'ChatDotRound' },
])

const handleCommand = (command: string) => {
  if (command === 'logout') {
    authStore.logout()
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: var(--dw-bg);
  border-right: 1px solid var(--dw-border);
}

.logo {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dw-text);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 2px;
  border-bottom: 1px solid var(--dw-border);
}

.logo-icon {
  font-size: 24px;
  margin-right: 8px;
}

.menu {
  border-right: none;
  background-color: transparent;
}

/* 导航项悬停动效：微微右移 + 上下线条变色，底色不变 */
.menu .el-menu-item {
  transition: all 0.3s ease;
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
}

.menu .el-menu-item:hover {
  padding-left: 30px !important;
  border-top-color: var(--dw-accent);
  border-bottom-color: var(--dw-accent);
  background-color: transparent !important;
}

.menu .el-menu-item.is-active {
  border-top-color: transparent;
  border-bottom-color: transparent;
  background-color: transparent !important;
}

.header {
  height: 70px;
  background-color: var(--dw-bg);
  border-bottom: 1px solid var(--dw-border);
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--dw-text-secondary);
  transition: var(--dw-transition);
}

.user-info:hover {
  color: var(--dw-text);
}

.user-name {
  margin-right: 4px;
}

.main {
  background-color: var(--dw-bg);
  padding: 30px;
  overflow-y: auto;
}
</style>
