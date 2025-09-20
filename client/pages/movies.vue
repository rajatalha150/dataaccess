<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo and Title -->
          <div class="flex items-center space-x-4">
            <NuxtLink to="/" class="flex items-center space-x-4 hover:opacity-80 focus:ring-2 focus:ring-primary-500 rounded-lg p-2">
              <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Icon name="mdi:play-circle" class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 class="text-2xl font-bold text-white">Movies</h1>
                <p class="text-gray-400 text-sm">Your personal movie collection</p>
              </div>
            </NuxtLink>
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

            <!-- Add Movie Button -->
            <button
              @click="showAddMovieModal = true"
              class="btn-primary focus:ring-2 focus:ring-primary-500"
            >
              <Icon name="mdi:plus" class="w-5 h-5 mr-2" />
              Add Movie
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
                    to="/"
                    class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                  >
                    <Icon name="mdi:image-multiple" class="w-4 h-4 mr-2 inline" />
                    Media Library
                  </NuxtLink>
                  <NuxtLink
                    v-if="authStore.isAdmin"
                    to="/admin"
                    class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                  >
                    <Icon name="mdi:cog" class="w-4 h-4 mr-2 inline" />
                    Admin Panel
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
      <!-- Filters and Search -->
      <div class="mb-8 flex flex-wrap items-center gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-64">
          <div class="relative">
            <Icon name="mdi:magnify" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search movies..."
              class="input-field pl-10"
            />
          </div>
        </div>

        <!-- Genre Filter -->
        <select v-model="genreFilter" class="input-field min-w-32">
          <option value="">All Genres</option>
          <option v-for="genre in availableGenres" :key="genre" :value="genre">
            {{ genre }}
          </option>
        </select>

        <!-- Year Filter -->
        <select v-model="yearFilter" class="input-field min-w-32">
          <option value="">All Years</option>
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>

        <!-- Sort Options -->
        <select v-model="sortBy" class="input-field min-w-40">
          <option value="title">Sort by Title</option>
          <option value="year">Sort by Year</option>
          <option value="rating">Sort by Rating</option>
          <option value="added">Sort by Date Added</option>
        </select>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Icon name="mdi:loading" class="w-8 h-8 text-primary-500 animate-spin" />
        <span class="ml-3 text-gray-400">Loading movies...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredMovies.length === 0" class="text-center py-12">
        <Icon name="mdi:movie-open" class="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-400 mb-2">No movies found</h3>
        <p class="text-gray-500 mb-6">Add some movies to your collection to get started</p>
        <button
          @click="showAddMovieModal = true"
          class="btn-primary focus:ring-2 focus:ring-primary-500"
        >
          <Icon name="mdi:plus" class="w-5 h-5 mr-2" />
          Add Your First Movie
        </button>
      </div>

      <!-- Movies Grid -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        <div
          v-for="movie in filteredMovies"
          :key="movie.id"
          @click="openMoviePlayer(movie)"
          class="movie-card group cursor-pointer focus:ring-2 focus:ring-primary-500 rounded-lg"
          tabindex="0"
          @keydown.enter="openMoviePlayer(movie)"
        >
          <!-- Movie Poster -->
          <div class="aspect-[2/3] bg-gray-800 rounded-lg border border-gray-700 overflow-hidden group-hover:border-primary-500 transition-colors relative">
            <img
              v-if="movie.poster_url"
              :src="movie.poster_url"
              :alt="movie.title"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="mdi:movie" class="w-16 h-16 text-gray-600" />
            </div>
            
            <!-- Play Overlay -->
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
              <Icon name="mdi:play-circle" class="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <!-- Rating Badge -->
            <div v-if="movie.rating" class="absolute top-2 right-2 bg-black bg-opacity-70 rounded px-2 py-1">
              <div class="flex items-center space-x-1">
                <Icon name="mdi:star" class="w-3 h-3 text-yellow-400" />
                <span class="text-xs text-white">{{ movie.rating }}</span>
              </div>
            </div>
          </div>

          <!-- Movie Info -->
          <div class="mt-3">
            <h3 class="text-sm font-medium text-white truncate">{{ movie.title }}</h3>
            <p class="text-xs text-gray-400 mt-1">{{ movie.year }}</p>
            <p v-if="movie.genre" class="text-xs text-gray-500 truncate">{{ movie.genre }}</p>
          </div>
        </div>
      </div>

      <!-- Movies List -->
      <div v-else class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="divide-y divide-gray-700">
          <div
            v-for="movie in filteredMovies"
            :key="movie.id"
            @click="openMoviePlayer(movie)"
            class="flex items-center p-4 hover:bg-gray-700 cursor-pointer focus:bg-gray-700 focus:ring-2 focus:ring-primary-500"
            tabindex="0"
            @keydown.enter="openMoviePlayer(movie)"
          >
            <!-- Poster Thumbnail -->
            <div class="w-16 h-24 bg-gray-700 rounded-lg overflow-hidden mr-4 flex-shrink-0">
              <img
                v-if="movie.poster_url"
                :src="movie.poster_url"
                :alt="movie.title"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <Icon name="mdi:movie" class="w-8 h-8 text-gray-600" />
              </div>
            </div>

            <!-- Movie Details -->
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-medium text-white truncate">{{ movie.title }}</h3>
              <div class="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                <span>{{ movie.year }}</span>
                <span v-if="movie.genre">{{ movie.genre }}</span>
                <div v-if="movie.rating" class="flex items-center space-x-1">
                  <Icon name="mdi:star" class="w-4 h-4 text-yellow-400" />
                  <span>{{ movie.rating }}</span>
                </div>
              </div>
              <p v-if="movie.description" class="text-sm text-gray-500 mt-2 line-clamp-2">
                {{ movie.description }}
              </p>
            </div>

            <!-- Play Button -->
            <div class="ml-4">
              <Icon name="mdi:play-circle" class="w-8 h-8 text-primary-400" />
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Movie Player Modal -->
    <MoviePlayer
      v-if="showMoviePlayer"
      :movie="selectedMovie"
      @close="closeMoviePlayer"
    />

    <!-- Add Movie Modal -->
    <AddMovieModal
      v-if="showAddMovieModal"
      @close="showAddMovieModal = false"
      @added="handleMovieAdded"
    />
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})

const { $api } = useNuxtApp()
const authStore = useAuthStore()
const router = useRouter()

// Reactive data
const loading = ref(true)
const viewMode = ref('grid')
const searchQuery = ref('')
const genreFilter = ref('')
const yearFilter = ref('')
const sortBy = ref('title')
const showUserMenu = ref(false)
const showMoviePlayer = ref(false)
const showAddMovieModal = ref(false)
const selectedMovie = ref(null)

const movies = ref([])

// Computed properties
const userInitials = computed(() => {
  return authStore.user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'
})

const filteredMovies = computed(() => {
  let filtered = movies.value.filter(movie => {
    const matchesSearch = !searchQuery.value || 
                         movie.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         (movie.description && movie.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchesGenre = !genreFilter.value || movie.genre === genreFilter.value
    const matchesYear = !yearFilter.value || movie.year === parseInt(yearFilter.value)
    
    return matchesSearch && matchesGenre && matchesYear
  })

  // Sort movies
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'year':
        return (b.year || 0) - (a.year || 0)
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'added':
        return new Date(b.created_at) - new Date(a.created_at)
      default: // title
        return a.title.localeCompare(b.title)
    }
  })

  return filtered
})

const availableGenres = computed(() => {
  const genres = [...new Set(movies.value.map(m => m.genre).filter(Boolean))]
  return genres.sort()
})

const availableYears = computed(() => {
  const years = [...new Set(movies.value.map(m => m.year).filter(Boolean))]
  return years.sort((a, b) => b - a)
})

// Methods
const loadMovies = async () => {
  try {
    loading.value = true
    const response = await $api('/movies')
    movies.value = response.movies || []
  } catch (error) {
    console.error('Error loading movies:', error)
  } finally {
    loading.value = false
  }
}

const openMoviePlayer = (movie) => {
  selectedMovie.value = movie
  showMoviePlayer.value = true
}

const closeMoviePlayer = () => {
  showMoviePlayer.value = false
  selectedMovie.value = null
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const handleMovieAdded = () => {
  showAddMovieModal.value = false
  loadMovies()
}

// Lifecycle
onMounted(() => {
  loadMovies()

  // Close user menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      showUserMenu.value = false
    }
  })
})
</script>

<style scoped>
.movie-card:focus {
  outline: none;
}

/* TV-friendly focus indicators */
.movie-card:focus .aspect-\[2\/3\] {
  @apply ring-4 ring-primary-500 ring-opacity-50;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>