<template>
  <div class="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
    <!-- Close Button -->
    <button
      @click="$emit('close')"
      class="absolute top-4 right-4 z-60 w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 focus:ring-2 focus:ring-primary-500"
    >
      <Icon name="mdi:close" class="w-6 h-6" />
    </button>

    <!-- Navigation Controls -->
    <button
      v-if="media.length > 1"
      @click="$emit('previous')"
      class="absolute left-4 top-1/2 transform -translate-y-1/2 z-60 w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 focus:ring-2 focus:ring-primary-500"
    >
      <Icon name="mdi:chevron-left" class="w-6 h-6" />
    </button>

    <button
      v-if="media.length > 1"
      @click="$emit('next')"
      class="absolute right-4 top-1/2 transform -translate-y-1/2 z-60 w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 focus:ring-2 focus:ring-primary-500"
    >
      <Icon name="mdi:chevron-right" class="w-6 h-6" />
    </button>

    <!-- Media Content -->
    <div class="w-full h-full flex items-center justify-center p-4">
      <div class="max-w-full max-h-full">
        <!-- Image Display -->
        <img
          v-if="currentMedia?.type === 'image'"
          :src="getMediaUrl(currentMedia)"
          :alt="currentMedia.filename"
          class="max-w-full max-h-full object-contain"
          @load="handleImageLoad"
        />

        <!-- Video Display -->
        <video
          v-else-if="currentMedia?.type === 'video'"
          :src="getMediaUrl(currentMedia)"
          controls
          class="max-w-full max-h-full"
          @loadedmetadata="handleVideoLoad"
          @ended="handleVideoEnded"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>

    <!-- Bottom Controls -->
    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
      <div class="flex items-center justify-between">
        <!-- Media Info -->
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-white mb-1">{{ currentMedia?.filename }}</h3>
          <div class="flex items-center space-x-4 text-sm text-gray-300">
            <span>{{ currentIndex + 1 }} of {{ media.length }}</span>
            <span>{{ formatFileSize(currentMedia?.file_size) }}</span>
            <span v-if="currentMedia?.dimensions">{{ currentMedia.dimensions }}</span>
            <span>{{ formatDate(currentMedia?.created_at) }}</span>
          </div>
        </div>

        <!-- Control Buttons -->
        <div class="flex items-center space-x-2">
          <!-- Slideshow Toggle -->
          <button
            v-if="media.length > 1 && hasImages"
            @click="$emit('toggle-slideshow')"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:ring-2 focus:ring-primary-500',
              slideshowActive 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            ]"
          >
            <Icon :name="slideshowActive ? 'mdi:pause' : 'mdi:play'" class="w-4 h-4 mr-2" />
            {{ slideshowActive ? 'Pause' : 'Slideshow' }}
          </button>

          <!-- Download Button -->
          <button
            @click="downloadMedia"
            class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 focus:ring-2 focus:ring-primary-500"
          >
            <Icon name="mdi:download" class="w-4 h-4 mr-2" />
            Download
          </button>

          <!-- Info Toggle -->
          <button
            @click="showInfo = !showInfo"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:ring-2 focus:ring-primary-500',
              showInfo 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            ]"
          >
            <Icon name="mdi:information" class="w-4 h-4 mr-2" />
            Info
          </button>
        </div>
      </div>

      <!-- Progress Bar for Slideshow -->
      <div v-if="slideshowActive && currentMedia?.type === 'image'" class="mt-4">
        <div class="w-full bg-gray-700 rounded-full h-1">
          <div
            class="bg-primary-500 h-1 rounded-full transition-all duration-100"
            :style="{ width: `${slideshowProgress}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Media Info Panel -->
    <div
      v-if="showInfo"
      class="absolute top-0 right-0 w-80 h-full bg-black bg-opacity-90 p-6 overflow-y-auto"
    >
      <div class="space-y-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Media Information</h3>
          <button
            @click="showInfo = false"
            class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 focus:ring-2 focus:ring-primary-500"
          >
            <Icon name="mdi:close" class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-3 text-sm">
          <div>
            <label class="block text-gray-400 mb-1">Filename</label>
            <p class="text-white break-all">{{ currentMedia?.filename }}</p>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">File Size</label>
            <p class="text-white">{{ formatFileSize(currentMedia?.file_size) }}</p>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">Type</label>
            <p class="text-white capitalize">{{ currentMedia?.type }}</p>
          </div>

          <div v-if="currentMedia?.mime_type">
            <label class="block text-gray-400 mb-1">MIME Type</label>
            <p class="text-white">{{ currentMedia.mime_type }}</p>
          </div>

          <div v-if="currentMedia?.dimensions">
            <label class="block text-gray-400 mb-1">Dimensions</label>
            <p class="text-white">{{ currentMedia.dimensions }}</p>
          </div>

          <div v-if="currentMedia?.duration">
            <label class="block text-gray-400 mb-1">Duration</label>
            <p class="text-white">{{ formatDuration(currentMedia.duration) }}</p>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">Uploaded</label>
            <p class="text-white">{{ formatDate(currentMedia?.created_at) }}</p>
          </div>

          <div v-if="currentMedia?.tags && currentMedia.tags.length > 0">
            <label class="block text-gray-400 mb-1">Tags</label>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="tag in currentMedia.tags"
                :key="tag"
                class="px-2 py-1 bg-primary-600 text-white text-xs rounded"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Keyboard Instructions -->
    <div class="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg p-3 text-xs text-gray-300">
      <div class="space-y-1">
        <div><kbd class="bg-gray-700 px-1 rounded">←→</kbd> Navigate</div>
        <div><kbd class="bg-gray-700 px-1 rounded">Space</kbd> Slideshow</div>
        <div><kbd class="bg-gray-700 px-1 rounded">Esc</kbd> Close</div>
        <div><kbd class="bg-gray-700 px-1 rounded">I</kbd> Info</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  media: {
    type: Array,
    required: true
  },
  currentIndex: {
    type: Number,
    required: true
  },
  slideshowActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'next', 'previous', 'toggle-slideshow'])

// Reactive data
const showInfo = ref(false)
const slideshowProgress = ref(0)
const slideshowTimer = ref(null)
const slideshowInterval = ref(null)

// Computed properties
const currentMedia = computed(() => {
  return props.media[props.currentIndex]
})

const hasImages = computed(() => {
  return props.media.some(item => item.type === 'image')
})

// Methods
const getMediaUrl = (media) => {
  const baseUrl = useRuntimeConfig().public.apiBase || 'http://localhost:3001/api'
  return `${baseUrl}/media/${media.id}/stream`
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString()
}

const formatDuration = (seconds) => {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const downloadMedia = () => {
  const link = document.createElement('a')
  link.href = getMediaUrl(currentMedia.value)
  link.download = currentMedia.value.filename
  link.click()
}

const handleImageLoad = () => {
  if (props.slideshowActive) {
    startSlideshowTimer()
  }
}

const handleVideoLoad = () => {
  // Videos don't participate in slideshow
  if (props.slideshowActive) {
    emit('toggle-slideshow')
  }
}

const handleVideoEnded = () => {
  // Auto-advance to next media when video ends
  if (props.media.length > 1) {
    emit('next')
  }
}

const startSlideshowTimer = () => {
  clearSlideshowTimer()
  
  if (!props.slideshowActive || currentMedia.value?.type !== 'image') {
    return
  }

  const duration = 5000 // 5 seconds per image
  const updateInterval = 50 // Update progress every 50ms
  let elapsed = 0

  slideshowInterval.value = setInterval(() => {
    elapsed += updateInterval
    slideshowProgress.value = (elapsed / duration) * 100

    if (elapsed >= duration) {
      clearSlideshowTimer()
      emit('next')
    }
  }, updateInterval)
}

const clearSlideshowTimer = () => {
  if (slideshowInterval.value) {
    clearInterval(slideshowInterval.value)
    slideshowInterval.value = null
  }
  slideshowProgress.value = 0
}

// Keyboard navigation
const handleKeydown = (event) => {
  switch (event.key) {
    case 'Escape':
      emit('close')
      break
    case 'ArrowLeft':
      emit('previous')
      break
    case 'ArrowRight':
      emit('next')
      break
    case ' ':
      event.preventDefault()
      emit('toggle-slideshow')
      break
    case 'i':
    case 'I':
      showInfo.value = !showInfo.value
      break
  }
}

// Watchers
watch(() => props.slideshowActive, (active) => {
  if (active && currentMedia.value?.type === 'image') {
    startSlideshowTimer()
  } else {
    clearSlideshowTimer()
  }
})

watch(() => props.currentIndex, () => {
  if (props.slideshowActive && currentMedia.value?.type === 'image') {
    startSlideshowTimer()
  } else {
    clearSlideshowTimer()
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  
  if (props.slideshowActive && currentMedia.value?.type === 'image') {
    startSlideshowTimer()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  clearSlideshowTimer()
})
</script>

<style scoped>
kbd {
  font-family: monospace;
  font-size: 0.75rem;
}

/* Ensure video controls are visible */
video::-webkit-media-controls {
  filter: brightness(1.2);
}

/* TV-friendly focus styles */
button:focus {
  outline: none;
}
</style>