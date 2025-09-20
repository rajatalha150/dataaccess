<template>
  <div>
    <AdminLayout>
      <div class="space-y-8">
        <!-- Page Header -->
        <div>
          <h1 class="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p class="text-gray-400 text-lg">System overview and statistics</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="stat-card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-400 text-sm uppercase tracking-wide">Total Users</p>
                <p class="text-3xl font-bold text-white mt-2">{{ stats.totalUsers }}</p>
              </div>
              <div class="p-3 bg-blue-500 bg-opacity-20 rounded-lg">
                <Icon name="mdi:account-group" class="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-400 text-sm uppercase tracking-wide">Media Files</p>
                <p class="text-3xl font-bold text-white mt-2">{{ stats.totalMediaFiles }}</p>
              </div>
              <div class="p-3 bg-green-500 bg-opacity-20 rounded-lg">
                <Icon name="mdi:file-multiple" class="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-400 text-sm uppercase tracking-wide">Total Folders</p>
                <p class="text-3xl font-bold text-white mt-2">{{ stats.totalFolders }}</p>
              </div>
              <div class="p-3 bg-purple-500 bg-opacity-20 rounded-lg">
                <Icon name="mdi:folder" class="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-400 text-sm uppercase tracking-wide">Storage Used</p>
                <p class="text-3xl font-bold text-white mt-2">{{ formatBytes(stats.totalStorage) }}</p>
              </div>
              <div class="p-3 bg-orange-500 bg-opacity-20 rounded-lg">
                <Icon name="mdi:harddisk" class="w-8 h-8 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        <!-- Charts and Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Media Type Distribution -->
          <div class="card">
            <h3 class="text-xl font-semibold text-white mb-6">Media Type Distribution</h3>
            <div class="space-y-4">
              <div v-for="type in mediaTypeStats" :key="type.type" class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-4 h-4 rounded-full" :class="getTypeColor(type.type)"></div>
                  <span class="text-gray-300 capitalize">{{ type.type }}</span>
                </div>
                <div class="text-right">
                  <span class="text-white font-semibold">{{ type.count }}</span>
                  <span class="text-gray-400 text-sm ml-2">({{ type.percentage }}%)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="card">
            <h3 class="text-xl font-semibold text-white mb-6">Recent Activity</h3>
            <div class="space-y-4">
              <div v-for="activity in recentActivity" :key="activity.id" class="flex items-start space-x-3">
                <div class="p-2 bg-gray-700 rounded-lg mt-1">
                  <Icon :name="getActivityIcon(activity.action)" class="w-4 h-4 text-gray-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-gray-300 text-sm">
                    <span class="font-medium text-white">{{ activity.user_name }}</span>
                    {{ getActivityDescription(activity.action) }}
                  </p>
                  <p class="text-gray-500 text-xs mt-1">{{ formatDate(activity.created_at) }}</p>
                </div>
              </div>
            </div>
            <div class="mt-6">
              <NuxtLink to="/admin/activity" class="btn-secondary w-full text-center">
                View All Activity
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- System Information -->
        <div class="card">
          <h3 class="text-xl font-semibold text-white mb-6">System Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p class="text-gray-400 text-sm">Server Uptime</p>
              <p class="text-white font-semibold mt-1">{{ systemInfo.uptime }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-sm">Node.js Version</p>
              <p class="text-white font-semibold mt-1">{{ systemInfo.nodeVersion }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-sm">Database Status</p>
              <p class="text-green-400 font-semibold mt-1">{{ systemInfo.dbStatus }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-sm">Last Backup</p>
              <p class="text-white font-semibold mt-1">{{ systemInfo.lastBackup || 'Never' }}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false,
  middleware: 'admin'
})

const { $api } = useNuxtApp()

// Reactive data
const stats = ref({
  totalUsers: 0,
  totalMediaFiles: 0,
  totalFolders: 0,
  totalStorage: 0
})

const mediaTypeStats = ref([])
const recentActivity = ref([])
const systemInfo = ref({
  uptime: '',
  nodeVersion: '',
  dbStatus: 'Connected',
  lastBackup: null
})

// Load dashboard data
const loadDashboardData = async () => {
  try {
    const [statsResponse, activityResponse, systemResponse] = await Promise.all([
      $api('/admin/dashboard/stats'),
      $api('/admin/activity?limit=10'),
      $api('/admin/system-info')
    ])

    stats.value = statsResponse.stats
    mediaTypeStats.value = statsResponse.mediaTypeStats
    recentActivity.value = activityResponse.activities
    systemInfo.value = systemResponse.systemInfo
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

// Utility functions
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const getTypeColor = (type) => {
  const colors = {
    image: 'bg-blue-500',
    video: 'bg-green-500',
    audio: 'bg-purple-500',
    document: 'bg-orange-500'
  }
  return colors[type] || 'bg-gray-500'
}

const getActivityIcon = (action) => {
  const icons = {
    'user.login': 'mdi:login',
    'user.logout': 'mdi:logout',
    'media.uploaded': 'mdi:upload',
    'media.deleted': 'mdi:delete',
    'folder.created': 'mdi:folder-plus',
    'folder.deleted': 'mdi:folder-remove',
    'user.created': 'mdi:account-plus',
    'user.updated': 'mdi:account-edit',
    'user.deleted': 'mdi:account-remove'
  }
  return icons[action] || 'mdi:information'
}

const getActivityDescription = (action) => {
  const descriptions = {
    'user.login': 'logged in',
    'user.logout': 'logged out',
    'media.uploaded': 'uploaded media',
    'media.deleted': 'deleted media',
    'folder.created': 'created folder',
    'folder.deleted': 'deleted folder',
    'user.created': 'created user',
    'user.updated': 'updated user',
    'user.deleted': 'deleted user'
  }
  return descriptions[action] || 'performed action'
}

// Load data on mount
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.stat-card {
  @apply bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors;
}

.card {
  @apply bg-gray-800 rounded-xl p-6 border border-gray-700;
}
</style>