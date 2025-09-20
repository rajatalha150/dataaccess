<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Admin Header -->
    <header class="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold text-primary-400">Media Admin</h1>
          <div class="text-sm text-gray-400">
            Welcome, {{ user?.firstName }} {{ user?.lastName }}
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <button
            @click="logout"
            class="btn-secondary focus:ring-4 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar Navigation -->
      <nav class="w-80 bg-gray-800 min-h-screen border-r border-gray-700">
        <div class="p-6">
          <ul class="space-y-3">
            <li>
              <NuxtLink
                to="/admin"
                class="nav-link"
                :class="{ 'nav-link-active': $route.path === '/admin' }"
              >
                <Icon name="mdi:view-dashboard" class="w-6 h-6" />
                Dashboard
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/admin/users"
                class="nav-link"
                :class="{ 'nav-link-active': $route.path.startsWith('/admin/users') }"
              >
                <Icon name="mdi:account-group" class="w-6 h-6" />
                User Management
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/admin/media"
                class="nav-link"
                :class="{ 'nav-link-active': $route.path.startsWith('/admin/media') }"
              >
                <Icon name="mdi:folder-multiple-image" class="w-6 h-6" />
                Media Management
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/admin/folders"
                class="nav-link"
                :class="{ 'nav-link-active': $route.path.startsWith('/admin/folders') }"
              >
                <Icon name="mdi:folder" class="w-6 h-6" />
                Folder Management
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/admin/settings"
                class="nav-link"
                :class="{ 'nav-link-active': $route.path.startsWith('/admin/settings') }"
              >
                <Icon name="mdi:cog" class="w-6 h-6" />
                System Settings
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/admin/activity"
                class="nav-link"
                :class="{ 'nav-link-active': $route.path.startsWith('/admin/activity') }"
              >
                <Icon name="mdi:history" class="w-6 h-6" />
                Activity Logs
              </NuxtLink>
            </li>
            <li class="pt-4 border-t border-gray-700">
              <NuxtLink
                to="/"
                class="nav-link text-primary-400 hover:text-primary-300"
              >
                <Icon name="mdi:arrow-left" class="w-6 h-6" />
                Back to App
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-1 p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const user = computed(() => authStore.user)

// Check admin access
onMounted(() => {
  if (!authStore.isAuthenticated || authStore.user?.role !== 'admin') {
    router.push('/login')
  }
})

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.nav-link {
  @apply flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-500;
}

.nav-link-active {
  @apply bg-primary-600 text-white;
}
</style>