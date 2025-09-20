<template>
  <div class="fixed inset-0 bg-black z-50">
    <!-- Close Button -->
    <button
      @click="$emit('close')"
      class="absolute top-4 right-4 z-60 w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 focus:ring-2 focus:ring-primary-500"
    >
      <Icon name="mdi:close" class="w-6 h-6" />
    </button>

    <!-- Movie Info Overlay (shown initially) -->
    <div
      v-if="showInfo"
      class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-40 flex flex-col justify-end p-8"
    >
      <div class="max-w-4xl">
        <h1 class="text-4xl font-bold text-white mb-4">{{ movie.title }}</h1>
        
        <div class="flex items-center space-x-6 mb-4 text-lg text-gray-300">
          <span v-if="movie.year">{{ movie.year }}</span>
          <span v-if="movie.genre">{{ movie.genre }}</span>
          <div v-if="movie.rating" class="flex items-center space-x-1">
            <Icon name="mdi:star" class="w-5 h-5 text-yellow-400" />
            <span>{{ movie.rating }}</span>
          </div>
          <span v-if="movie.duration">{{ formatDuration(movie.duration) }}</span>
        </div>

        <p v-if="movie.description" class="text-gray-300 text-lg mb-8 max-w-3xl leading-relaxed">
          {{ movie.description }}
        </p>

        <div class="flex items-center space-x-4">
          <button
            @click="startMovie"
            class="btn-primary text-lg px-8 py-4 focus:ring-4 focus:ring-primary-500"
          >
            <Icon name="mdi:play" class="w-6 h-6 mr-3" />
            Play Movie
          </button>
          
          <button
            @click="showInfo = false"
            class="btn-secondary text-lg px-8 py-4 focus:ring-4 focus:ring-gray-500"
          >
            <Icon name="mdi:information" class="w-6 h-6 mr-3" />
            Hide Info
          </button>
        </div>
      </div>
    </div>

    <!-- Video Player -->
    <video
      ref="videoPlayer"
      :src="movieUrl"
      class="w-full h-full object-contain"
      :controls="showControls"
      @loadedmetadata="handleVideoLoaded"
      @timeupdate="handleTimeUpdate"
      @ended="handleVideoEnded"
      @play="handlePlay"
      @pause="handlePause"
      @click="toggleControls"
    >
      Your browser does not support the video tag.
    </video>

    <!-- Custom Controls Overlay -->
    <div
      v-if="showCustomControls"
      class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 z-50"
    >
      <!-- Progress Bar -->
      <div class="mb-4">
        <div class="flex items-center justify-between text-sm text-gray-300 mb-2">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
        <div
          class="w-full bg-gray-700 rounded-full h-2 cursor-pointer"
          @click="seekTo"
        >
          <div
            class="bg-primary-500 h-2 rounded-full transition-all duration-100"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <!-- Play/Pause -->
          <button
            @click="togglePlayPause"
            class="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500"
          >
            <Icon :name="isPlaying ? 'mdi:pause' : 'mdi:play'" class="w-6 h-6" />
          </button>

          <!-- Skip Backward -->
          <button
            @click="skipBackward"
            class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 focus:ring-2 focus:ring-gray-500"
          >
            <Icon name="mdi:rewind-10" class="w-5 h-5" />
          </button>

          <!-- Skip Forward -->
          <button
            @click="skipForward"
            class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 focus:ring-2 focus:ring-gray-500"
          >
            <Icon name="mdi:fast-forward-10" class="w-5 h-5" />
          </button>

          <!-- Volume Control -->
          <div class="flex items-center space-x-2">
            <button
              @click="toggleMute"
              class="w-8 h-8 flex items-center justify-center text-white hover:text-primary-400 focus:ring-2 focus:ring-primary-500 rounded"
            >
              <Icon :name="isMuted ? 'mdi:volume-off' : 'mdi:volume-high'" class="w-5 h-5" />
            </button>
            <input
              v-model="volume"
              type="range"
              min="0"
              max="100"
              class="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              @input="updateVolume"
            />
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Playback Speed -->
          <select
            v-model="playbackRate"
            @change="updatePlaybackRate"
            class="bg-gray-700 text-white text-sm rounded px-2 py-1 border-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>

          <!-- Fullscreen -->
          <button
            @click="toggleFullscreen"
            class="w-8 h-8 flex items-center justify-center text-white hover:text-primary-400 focus:ring-2 focus:ring-primary-500 rounded"
          >
            <Icon :name="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Indicator -->
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40"
    >
      <div class="text-center">
        <Icon name="mdi:loading" class="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <p class="text-white text-lg">Loading movie...</p>
      </div>
    </div>

    <!-- Keyboard Instructions -->
    <div
      v-if="showKeyboardHelp"
      class="absolute top-4 left-4 bg-black bg-opacity-70 rounded-lg p-4 text-sm text-gray-300 z-50"
    >
      <h3 class="text-white font-semibold mb-2">Keyboard Controls</h3>
      <div class="space-y-1">
        <div><kbd class="bg-gray-700 px-1 rounded">Space</kbd> Play/Pause</div>
        <div><kbd class="bg-gray-700 px-1 rounded">←→</kbd> Skip 10s</div>
        <div><kbd class="bg-gray-700 px-1 rounded">↑↓</kbd> Volume</div>
        <div><kbd class="bg-gray-700 px-1 rounded">F</kbd> Fullscreen</div>
        <div><kbd class="bg-gray-700 px-1 rounded">M</kbd> Mute</div>
        <div><kbd class="bg-gray-700 px-1 rounded">Esc</kbd> Exit</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  movie: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

// Reactive data
const videoPlayer = ref(null)
const loading = ref(true)
const showInfo = ref(true)
const showControls = ref(false)
const showCustomControls = ref(false)
const showKeyboardHelp = ref(false)
const isPlaying = ref(false)
const isMuted = ref(false)
const isFullscreen = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(100)
const playbackRate = ref(1)

let controlsTimeout = null

// Computed properties
const movieUrl = computed(() => {
  const baseUrl = useRuntimeConfig().public.apiBase || 'http://localhost:3001/api'
  return `${baseUrl}/movies/${props.movie.id}/stream`
})

const progress = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
})

// Methods
const startMovie = () => {
  showInfo.value = false
  showCustomControls.value = true
  if (videoPlayer.value) {
    videoPlayer.value.play()
  }
}

const togglePlayPause = () => {
  if (videoPlayer.value) {
    if (isPlaying.value) {
      videoPlayer.value.pause()
    } else {
      videoPlayer.value.play()
    }
  }
}

const skipBackward = () => {
  if (videoPlayer.value) {
    videoPlayer.value.currentTime = Math.max(0, videoPlayer.value.currentTime - 10)
  }
}

const skipForward = () => {
  if (videoPlayer.value) {
    videoPlayer.value.currentTime = Math.min(duration.value, videoPlayer.value.currentTime + 10)
  }
}

const toggleMute = () => {
  if (videoPlayer.value) {
    videoPlayer.value.muted = !videoPlayer.value.muted
    isMuted.value = videoPlayer.value.muted
  }
}

const updateVolume = () => {
  if (videoPlayer.value) {
    videoPlayer.value.volume = volume.value / 100
    isMuted.value = volume.value === 0
  }
}

const updatePlaybackRate = () => {
  if (videoPlayer.value) {
    videoPlayer.value.playbackRate = parseFloat(playbackRate.value)
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const toggleControls = () => {
  if (!showInfo.value) {
    showCustomControls.value = !showCustomControls.value
    resetControlsTimeout()
  }
}

const resetControlsTimeout = () => {
  clearTimeout(controlsTimeout)
  if (showCustomControls.value && isPlaying.value) {
    controlsTimeout = setTimeout(() => {
      showCustomControls.value = false
    }, 3000)
  }
}

const seekTo = (event) => {
  if (videoPlayer.value && duration.value > 0) {
    const rect = event.target.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = clickX / rect.width
    videoPlayer.value.currentTime = percentage * duration.value
  }
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDuration = (minutes) => {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

// Event handlers
const handleVideoLoaded = () => {
  loading.value = false
  if (videoPlayer.value) {
    duration.value = videoPlayer.value.duration
    volume.value = videoPlayer.value.volume * 100
  }
}

const handleTimeUpdate = () => {
  if (videoPlayer.value) {
    currentTime.value = videoPlayer.value.currentTime
  }
}

const handlePlay = () => {
  isPlaying.value = true
  resetControlsTimeout()
}

const handlePause = () => {
  isPlaying.value = false
  clearTimeout(controlsTimeout)
}

const handleVideoEnded = () => {
  isPlaying.value = false
  showCustomControls.value = true
  clearTimeout(controlsTimeout)
}

// Keyboard controls
const handleKeydown = (event) => {
  switch (event.key) {
    case 'Escape':
      if (isFullscreen.value) {
        toggleFullscreen()
      } else {
        emit('close')
      }
      break
    case ' ':
      event.preventDefault()
      if (!showInfo.value) {
        togglePlayPause()
      }
      break
    case 'ArrowLeft':
      event.preventDefault()
      skipBackward()
      break
    case 'ArrowRight':
      event.preventDefault()
      skipForward()
      break
    case 'ArrowUp':
      event.preventDefault()
      volume.value = Math.min(100, volume.value + 10)
      updateVolume()
      break
    case 'ArrowDown':
      event.preventDefault()
      volume.value = Math.max(0, volume.value - 10)
      updateVolume()
      break
    case 'f':
    case 'F':
      toggleFullscreen()
      break
    case 'm':
    case 'M':
      toggleMute()
      break
    case '?':
      showKeyboardHelp.value = !showKeyboardHelp.value
      break
  }
}

// Mouse movement handler
const handleMouseMove = () => {
  if (!showInfo.value) {
    showCustomControls.value = true
    resetControlsTimeout()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })

  // Show keyboard help initially
  setTimeout(() => {
    showKeyboardHelp.value = true
    setTimeout(() => {
      showKeyboardHelp.value = false
    }, 5000)
  }, 2000)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', handleMouseMove)
  clearTimeout(controlsTimeout)
  
  // Exit fullscreen if active
  if (document.fullscreenElement) {
    document.exitFullscreen()
  }
})
</script>

<style scoped>
/* Custom slider styles */
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}

kbd {
  font-family: monospace;
  font-size: 0.75rem;
}

/* Hide default video controls */
video::-webkit-media-controls {
  display: none !important;
}

video::-moz-media-controls {
  display: none !important;
}

/* TV-friendly focus styles */
button:focus,
select:focus,
input:focus {
  outline: none;
}
</style>