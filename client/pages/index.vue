<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo and Title -->
          <div class="flex items-center space-x-4">
            <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Icon name="mdi:play-circle" class="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-white">Media Library</h1>
              <p class="text-gray-400 text-sm">{{ currentPath || 'Home' }}</p>
            </div>
          </div>

          <!-- View Controls -->
          <div class="flex items-center space-x-4">
            <!-- View Mode Toggle -->
            <div class="flex bg-gray-700 rounded-lg p-1">
              <button
                @click="viewMode = 'grid'"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors focus:ring-2 focus:ring-primary-500',
                  viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-300 hover:text-white'
                ]"
              >
                <Icon name="mdi:view-grid" class="w-5 h-5" />
              </button>
              <button
                @click="viewMode = 'list'"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors focus:ring-2 focus:ring-primary-500',
                  viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-300 hover:text-white'
                ]"
              >
                <Icon name="mdi:view-list" class="w-5 h-5" />
              </button>
            </div>

            <!-- Slideshow Button -->
            <button
              @click="startSlideshow"
              :disabled="!hasMedia"
              class="btn-primary focus:ring-2 focus:ring-primary-500"
            >
              <Icon name="mdi:slideshow" class="w-5 h-5 mr-2" />
              Slideshow
            </button>

            <!-- User Menu -->
            <div class="relative">
              <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center space-x-2 text-gray-300 hover:text-white focus:ring-2 focus:ring-primary-500 rounded-lg p-2"
              >
                <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span class="text-sm font-medium text-white">{{ userInitials }}</span>
                </div>
                <Icon name="mdi:chevron-down" class="w-4 h-4" />
              </button>

              <!-- User Dropdown -->
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50"
              >
                <div class="py-2">
                  <div class="px-4 py-2 border-b border-gray-700">
                    <p class="text-sm font-medium text-white">{{ authStore.user?.name }}</p>
                    <p class="text-xs text-gray-400">{{ authStore.user?.email }}</p>
                  </div>
                  <NuxtLink
                    v-if="authStore.isAdmin"
                    to="/admin"
                    class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                  >
                    <Icon name="mdi:cog" class="w-4 h-4 mr-2 inline" />
                    Admin Panel
                  </NuxtLink>
                  <NuxtLink
                    to="/movies"
                    class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                  >
                    <Icon name="mdi:movie" class="w-4 h-4 mr-2 inline" />
                    Movies
                  </NuxtLink>
                  <button
                    @click="handleLogout"
                    class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                  >
                    <Icon name="mdi:logout" class="w-4 h-4 mr-2 inline" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
      <!-- Breadcrumb -->
      <nav v-if="breadcrumbs.length > 0" class="mb-6">
        <ol class="flex items-center space-x-2 text-sm">
          <li>
            <button
              @click="navigateToFolder(null)"
              class="text-gray-400 hover:text-white focus:text-white focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
            >
              Home
            </button>
          </li>
          <li v-for="(folder, index) in breadcrumbs" :key="folder.id" class="flex items-center">
            <Icon name="mdi:chevron-right" class="w-4 h-4 text-gray-500 mx-2" />
            <button
              @click="navigateToFolder(folder.id)"
              :class="[
                'px-2 py-1 rounded focus:ring-2 focus:ring-primary-500',
                index === breadcrumbs.length - 1 
                  ? 'text-white font-medium' 
                  : 'text-gray-400 hover:text-white focus:text-white'
              ]"
            >
              {{ folder.name }}
            </button>
          </li>
        </ol>
      </nav>

      <!-- Filters and Search -->
      <div class="mb-8 flex flex-wrap items-center gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-64">
          <div class="relative">
            <Icon name="mdi:magnify" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search media files..."
              class="input-field pl-10"
            />
          </div>
        </div>

        <!-- Media Type Filter -->
        <select v-model="mediaTypeFilter" class="input-field min-w-32">
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>

        <!-- Upload Button -->
        <button
          @click="showUploadModal = true"
          class="btn-primary focus:ring-2 focus:ring-primary-500"
        >
          <Icon name="mdi:upload" class="w-5 h-5 mr-2" />
          Upload
        </button>

        <!-- Create Folder Button -->
        <button
          @click="showCreateFolderModal = true"
          class="btn-secondary focus:ring-2 focus:ring-primary-500"
        >
          <Icon name="mdi:folder-plus" class="w-5 h-5 mr-2" />
          New Folder
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Icon name="mdi:loading" class="w-8 h-8 text-primary-500 animate-spin" />
        <span class="ml-3 text-gray-400">Loading media...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasContent" class="text-center py-12">
        <Icon name="mdi:folder-open" class="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-400 mb-2">No media found</h3>
        <p class="text-gray-500 mb-6">Upload some photos or videos to get started</p>
        <button
          @click="showUploadModal = true"
          class="btn-primary focus:ring-2 focus:ring-primary-500"
        >
          <Icon name="mdi:upload" class="w-5 h-5 mr-2" />
          Upload Media
        </button>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Folders -->
        <div v-if="filteredFolders.length > 0" class="mb-8">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Icon name="mdi:folder" class="w-5 h-5 mr-2 text-primary-400" />
            Folders
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            <div
              v-for="folder in filteredFolders"
              :key="folder.id"
              @click="navigateToFolder(folder.id)"
              class="folder-card group cursor-pointer focus:ring-2 focus:ring-primary-500 rounded-lg"
              tabindex="0"
              @keydown.enter="navigateToFolder(folder.id)"
            >
              <div class="aspect-square bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center group-hover:border-primary-500 transition-colors">
                <Icon name="mdi:folder" class="w-12 h-12 text-primary-400" />
              </div>
              <p class="mt-2 text-sm font-medium text-white truncate">{{ folder.name }}</p>
              <p class="text-xs text-gray-400">{{ folder.media_count || 0 }} items</p>
            </div>
          </div>
        </div>

        <!-- Media Files -->
        <div v-if="filteredMedia.length > 0">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Icon name="mdi:image-multiple" class="w-5 h-5 mr-2 text-primary-400" />
            Media Files
          </h2>

          <!-- Grid View -->
          <div
            v-if="viewMode === 'grid'"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
          >
            <div
              v-for="(media, index) in filteredMedia"
              :key="media.id"
              @click="openMediaViewer(index)"
              class="media-card group cursor-pointer focus:ring-2 focus:ring-primary-500 rounded-lg"
              tabindex="0"
              @keydown.enter="openMediaViewer(index)"
            >
              <div class="aspect-square bg-gray-800 rounded-lg border border-gray-700 overflow-hidden group-hover:border-primary-500 transition-colors">
                <img
                  v-if="media.type === 'image'"
                  :src="getMediaThumbnail(media)"
                  :alt="media.filename"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div
                  v-else
                  class="w-full h-full bg-gray-700 flex items-center justify-center relative"
                >
                  <Icon name="mdi:play-circle" class="w-12 h-12 text-white opacity-80" />
                  <img
                    v-if="media.thumbnail_path"
                    :src="getMediaThumbnail(media)"
                    :alt="media.filename"
                    class="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <p class="mt-2 text-sm font-medium text-white truncate">{{ media.filename }}</p>
              <p class="text-xs text-gray-400">{{ formatFileSize(media.file_size) }}</p>
            </div>
          </div>

          <!-- List View -->
          <div v-else class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div class="divide-y divide-gray-700">
              <div
                v-for="(media, index) in filteredMedia"
                :key="media.id"
                @click="openMediaViewer(index)"
                class="flex items-center p-4 hover:bg-gray-700 cursor-pointer focus:bg-gray-700 focus:ring-2 focus:ring-primary-500"
                tabindex="0"
                @keydown.enter="openMediaViewer(index)"
              >
                <div class="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                  <img
                    v-if="media.type === 'image'"
                    :src="getMediaThumbnail(media)"
                    :alt="media.filename"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <Icon name="mdi:play-circle" class="w-6 h-6 text-white opacity-80" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-white truncate">{{ media.filename }}</p>
                  <p class="text-xs text-gray-400">
                    {{ media.type }} • {{ formatFileSize(media.file_size) }} • {{ formatDate(media.created_at) }}
                  </p>
                </div>
                <Icon name="mdi:chevron-right" class="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Media Viewer Modal -->
    <MediaViewer
      v-if="showMediaViewer"
      :media="filteredMedia"
      :current-index="currentMediaIndex"
      :slideshow-active="slideshowActive"
      @close="closeMediaViewer"
      @next="nextMedia"
      @previous="previousMedia"
      @toggle-slideshow="toggleSlideshow"
    />

    <!-- Upload Modal -->
    <UploadModal
      v-if="showUploadModal"
      :folder-id="currentFolderId"
      @close="showUploadModal = false"
      @uploaded="handleMediaUploaded"
    />

    <!-- Create Folder Modal -->
    <CreateFolderModal
      v-if="showCreateFolderModal"
      :parent-folder-id="currentFolderId"
      @close="showCreateFolderModal = false"
      @created="handleFolderCreated"
    />
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})

const { $api } = useNuxtApp()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Reactive data
const loading = ref(true)
const viewMode = ref('grid')
const searchQuery = ref('')
const mediaTypeFilter = ref('')
const showUserMenu = ref(false)
const showMediaViewer = ref(false)
const showUploadModal = ref(false)
const showCreateFolderModal = ref(false)
const currentMediaIndex = ref(0)
const slideshowActive = ref(false)

const folders = ref([])
const media = ref([])
const breadcrumbs = ref([])
const currentFolderId = ref(null)

// Computed properties
const userInitials = computed(() => {
  return authStore.user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'
})

const currentPath = computed(() => {
  return breadcrumbs.value.map(b => b.name).join(' / ')
})

const filteredFolders = computed(() => {
  return folders.value.filter(folder => {
    return !searchQuery.value || 
           folder.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  })
})

const filteredMedia = computed(() => {
  return media.value.filter(item => {
    const matchesSearch = !searchQuery.value || 
                         item.filename.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = !mediaTypeFilter.value || item.type === mediaTypeFilter.value
    return matchesSearch && matchesType
  })
})

const hasContent = computed(() => {
  return filteredFolders.value.length > 0 || filteredMedia.value.length > 0
})

const hasMedia = computed(() => {
  return filteredMedia.value.length > 0
})

// Methods
const loadContent = async () => {
  try {
    loading.value = true
    
    // Load folders
    const foldersResponse = await $api('/folders', {
      query: { parent_id: currentFolderId.value }
    })
    folders.value = foldersResponse.folders || []

    // Load media
    const mediaResponse = await $api('/media', {
      query: { folder_id: currentFolderId.value }
    })
    media.value = mediaResponse.media || []

    // Load breadcrumbs if in a folder
    if (currentFolderId.value) {
      const breadcrumbResponse = await $api(`/folders/${currentFolderId.value}/breadcrumbs`)
      breadcrumbs.value = breadcrumbResponse.breadcrumbs || []
    } else {
      breadcrumbs.value = []
    }
  } catch (error) {
    console.error('Error loading content:', error)
  } finally {
    loading.value = false
  }
}

const navigateToFolder = (folderId) => {
  currentFolderId.value = folderId
  router.push(folderId ? `/?folder=${folderId}` : '/')
  loadContent()
}

const openMediaViewer = (index) => {
  currentMediaIndex.value = index
  showMediaViewer.value = true
}

const closeMediaViewer = () => {
  showMediaViewer.value = false
  slideshowActive.value = false
}

const nextMedia = () => {
  if (currentMediaIndex.value < filteredMedia.value.length - 1) {
    currentMediaIndex.value++
  } else {
    currentMediaIndex.value = 0
  }
}

const previousMedia = () => {
  if (currentMediaIndex.value > 0) {
    currentMediaIndex.value--
  } else {
    currentMediaIndex.value = filteredMedia.value.length - 1
  }
}

const startSlideshow = () => {
  if (hasMedia.value) {
    currentMediaIndex.value = 0
    showMediaViewer.value = true
    slideshowActive.value = true
  }
}

const toggleSlideshow = () => {
  slideshowActive.value = !slideshowActive.value
}

const getMediaThumbnail = (mediaItem) => {
  const baseUrl = useRuntimeConfig().public.apiBase || 'http://localhost:3001/api'
  return `${baseUrl}/media/${mediaItem.id}/thumbnail`
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const handleMediaUploaded = () => {
  showUploadModal.value = false
  loadContent()
}

const handleFolderCreated = () => {
  showCreateFolderModal.value = false
  loadContent()
}

// Lifecycle
onMounted(() => {
  // Get folder ID from query params
  currentFolderId.value = route.query.folder || null
  loadContent()

  // Close user menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      showUserMenu.value = false
    }
  })
})

// Watch for route changes
watch(() => route.query.folder, (newFolderId) => {
  currentFolderId.value = newFolderId || null
  loadContent()
})
</script>

<style scoped>
.folder-card:focus,
.media-card:focus {
  outline: none;
}

/* TV-friendly focus indicators */
.folder-card:focus .aspect-square,
.media-card:focus .aspect-square {
  @apply ring-4 ring-primary-500 ring-opacity-50;
}
</style>