<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-700">
        <h2 class="text-2xl font-bold text-white">Add New Movie</h2>
        <button
          @click="$emit('close')"
          class="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 hover:text-white focus:ring-2 focus:ring-primary-500"
        >
          <Icon name="mdi:close" class="w-6 h-6" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Movie File Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Movie File *
          </label>
          <div
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
            :class="[
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragging ? 'border-primary-500 bg-primary-500 bg-opacity-10' : 'border-gray-600 hover:border-gray-500'
            ]"
          >
            <input
              ref="fileInput"
              type="file"
              accept="video/*"
              @change="handleFileSelect"
              class="hidden"
            />
            
            <div v-if="!selectedFile">
              <Icon name="mdi:cloud-upload" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-300 text-lg mb-2">Drop movie file here or click to browse</p>
              <p class="text-gray-500 text-sm">Supports MP4, AVI, MKV, MOV files</p>
              <button
                type="button"
                @click="$refs.fileInput.click()"
                class="btn-primary mt-4"
              >
                Choose File
              </button>
            </div>

            <div v-else class="text-left">
              <div class="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                <div class="flex items-center space-x-3">
                  <Icon name="mdi:file-video" class="w-8 h-8 text-primary-400" />
                  <div>
                    <p class="text-white font-medium">{{ selectedFile.name }}</p>
                    <p class="text-gray-400 text-sm">{{ formatFileSize(selectedFile.size) }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="removeFile"
                  class="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white"
                >
                  <Icon name="mdi:close" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Movie Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Title -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              required
              class="input-field"
              placeholder="Enter movie title"
            />
          </div>

          <!-- Year -->
          <div>
            <label for="year" class="block text-sm font-medium text-gray-300 mb-2">
              Release Year
            </label>
            <input
              id="year"
              v-model="form.year"
              type="number"
              min="1900"
              :max="new Date().getFullYear() + 5"
              class="input-field"
              placeholder="2023"
            />
          </div>

          <!-- Genre -->
          <div>
            <label for="genre" class="block text-sm font-medium text-gray-300 mb-2">
              Genre
            </label>
            <select
              id="genre"
              v-model="form.genre"
              class="input-field"
            >
              <option value="">Select genre</option>
              <option value="Action">Action</option>
              <option value="Adventure">Adventure</option>
              <option value="Animation">Animation</option>
              <option value="Comedy">Comedy</option>
              <option value="Crime">Crime</option>
              <option value="Documentary">Documentary</option>
              <option value="Drama">Drama</option>
              <option value="Family">Family</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Horror">Horror</option>
              <option value="Mystery">Mystery</option>
              <option value="Romance">Romance</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Thriller">Thriller</option>
              <option value="War">War</option>
              <option value="Western">Western</option>
            </select>
          </div>

          <!-- Rating -->
          <div>
            <label for="rating" class="block text-sm font-medium text-gray-300 mb-2">
              Rating (1-10)
            </label>
            <input
              id="rating"
              v-model="form.rating"
              type="number"
              min="1"
              max="10"
              step="0.1"
              class="input-field"
              placeholder="8.5"
            />
          </div>

          <!-- Duration -->
          <div>
            <label for="duration" class="block text-sm font-medium text-gray-300 mb-2">
              Duration (minutes)
            </label>
            <input
              id="duration"
              v-model="form.duration"
              type="number"
              min="1"
              class="input-field"
              placeholder="120"
            />
          </div>

          <!-- Director -->
          <div>
            <label for="director" class="block text-sm font-medium text-gray-300 mb-2">
              Director
            </label>
            <input
              id="director"
              v-model="form.director"
              type="text"
              class="input-field"
              placeholder="Director name"
            />
          </div>
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="4"
            class="input-field resize-none"
            placeholder="Enter movie description..."
          ></textarea>
        </div>

        <!-- Cast -->
        <div>
          <label for="cast" class="block text-sm font-medium text-gray-300 mb-2">
            Cast (comma-separated)
          </label>
          <input
            id="cast"
            v-model="form.cast"
            type="text"
            class="input-field"
            placeholder="Actor 1, Actor 2, Actor 3"
          />
        </div>

        <!-- Poster Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Movie Poster (optional)
          </label>
          <div class="flex items-center space-x-4">
            <input
              ref="posterInput"
              type="file"
              accept="image/*"
              @change="handlePosterSelect"
              class="hidden"
            />
            
            <div v-if="posterPreview" class="relative">
              <img
                :src="posterPreview"
                alt="Poster preview"
                class="w-24 h-36 object-cover rounded-lg"
              />
              <button
                type="button"
                @click="removePoster"
                class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white text-xs"
              >
                <Icon name="mdi:close" class="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              @click="$refs.posterInput.click()"
              class="btn-secondary"
            >
              <Icon name="mdi:image" class="w-5 h-5 mr-2" />
              {{ posterPreview ? 'Change Poster' : 'Upload Poster' }}
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-900 border border-red-700 rounded-lg p-4">
          <div class="flex items-center">
            <Icon name="mdi:alert-circle" class="w-5 h-5 text-red-400 mr-2" />
            <p class="text-red-300">{{ error }}</p>
          </div>
        </div>

        <!-- Upload Progress -->
        <div v-if="uploading" class="bg-gray-700 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-300">Uploading movie...</span>
            <span class="text-gray-300">{{ uploadProgress }}%</span>
          </div>
          <div class="w-full bg-gray-600 rounded-full h-2">
            <div
              class="bg-primary-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-secondary"
            :disabled="uploading"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="!selectedFile || !form.title || uploading"
          >
            <Icon v-if="uploading" name="mdi:loading" class="w-5 h-5 mr-2 animate-spin" />
            <Icon v-else name="mdi:plus" class="w-5 h-5 mr-2" />
            {{ uploading ? 'Adding Movie...' : 'Add Movie' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['close', 'movieAdded'])

// Reactive data
const selectedFile = ref(null)
const selectedPoster = ref(null)
const posterPreview = ref(null)
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref('')

const form = reactive({
  title: '',
  year: null,
  genre: '',
  rating: null,
  duration: null,
  director: '',
  description: '',
  cast: ''
})

// File input refs
const fileInput = ref(null)
const posterInput = ref(null)

// Methods
const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  
  const files = Array.from(event.dataTransfer.files)
  const videoFile = files.find(file => file.type.startsWith('video/'))
  
  if (videoFile) {
    selectedFile.value = videoFile
    // Auto-fill title from filename
    if (!form.title) {
      form.title = videoFile.name.replace(/\.[^/.]+$/, '').replace(/[._-]/g, ' ')
    }
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    // Auto-fill title from filename
    if (!form.title) {
      form.title = file.name.replace(/\.[^/.]+$/, '').replace(/[._-]/g, ' ')
    }
  }
}

const handlePosterSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedPoster.value = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      posterPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const removeFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const removePoster = () => {
  selectedPoster.value = null
  posterPreview.value = null
  if (posterInput.value) {
    posterInput.value.value = ''
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleSubmit = async () => {
  if (!selectedFile.value || !form.title) {
    error.value = 'Please select a movie file and enter a title'
    return
  }

  try {
    uploading.value = true
    uploadProgress.value = 0
    error.value = ''

    const formData = new FormData()
    formData.append('movie', selectedFile.value)
    
    if (selectedPoster.value) {
      formData.append('poster', selectedPoster.value)
    }

    // Add movie metadata
    Object.keys(form).forEach(key => {
      if (form[key] !== null && form[key] !== '') {
        formData.append(key, form[key])
      }
    })

    const { $api } = useNuxtApp()
    
    const response = await $api('/movies', {
      method: 'POST',
      body: formData,
      onUploadProgress: (progressEvent) => {
        uploadProgress.value = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
      }
    })

    emit('movieAdded', response)
    emit('close')
    
    // Show success message
    useNuxtApp().$toast?.success('Movie added successfully!')
    
  } catch (err) {
    console.error('Error adding movie:', err)
    error.value = err.data?.message || 'Failed to add movie. Please try again.'
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// Drag and drop handlers
const handleDragEnter = () => {
  isDragging.value = true
}

const handleDragLeave = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragging.value = false
  }
}

// Auto-extract metadata from filename
watch(() => form.title, (newTitle) => {
  if (newTitle && !form.year) {
    // Try to extract year from title
    const yearMatch = newTitle.match(/\((\d{4})\)|\b(\d{4})\b/)
    if (yearMatch) {
      form.year = parseInt(yearMatch[1] || yearMatch[2])
      // Remove year from title
      form.title = newTitle.replace(/\s*\(?\d{4}\)?\s*/g, '').trim()
    }
  }
})

// Keyboard shortcuts
const handleKeydown = (event) => {
  if (event.key === 'Escape' && !uploading.value) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.input-field {
  @apply w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent;
}

.btn-primary {
  @apply inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply inline-flex items-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* TV-friendly focus styles */
button:focus,
input:focus,
select:focus,
textarea:focus {
  outline: none;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #374151;
}

::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>