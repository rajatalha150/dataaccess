<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-700">
        <h2 class="text-xl font-semibold text-white">Upload Media</h2>
        <button
          @click="$emit('close')"
          class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 focus:ring-2 focus:ring-primary-500"
        >
          <Icon name="mdi:close" class="w-4 h-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <!-- Upload Area -->
        <div
          @drop="handleDrop"
          @dragover.prevent
          @dragenter.prevent
          @dragleave="handleDragLeave"
          :class="[
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragging 
              ? 'border-primary-500 bg-primary-500 bg-opacity-10' 
              : 'border-gray-600 hover:border-gray-500'
          ]"
        >
          <Icon name="mdi:cloud-upload" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-white mb-2">
            {{ isDragging ? 'Drop files here' : 'Upload your media files' }}
          </h3>
          <p class="text-gray-400 mb-4">
            Drag and drop files here, or click to select files
          </p>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*,video/*"
            @change="handleFileSelect"
            class="hidden"
          />
          <button
            @click="$refs.fileInput.click()"
            class="btn-primary focus:ring-2 focus:ring-primary-500"
            :disabled="uploading"
          >
            <Icon name="mdi:file-plus" class="w-5 h-5 mr-2" />
            Select Files
          </button>
        </div>

        <!-- Selected Files -->
        <div v-if="selectedFiles.length > 0" class="mt-6">
          <h4 class="text-lg font-medium text-white mb-4">Selected Files</h4>
          <div class="space-y-3">
            <div
              v-for="(file, index) in selectedFiles"
              :key="index"
              class="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                  <Icon
                    :name="file.type.startsWith('image/') ? 'mdi:image' : 'mdi:video'"
                    class="w-5 h-5 text-gray-300"
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-white">{{ file.name }}</p>
                  <p class="text-xs text-gray-400">{{ formatFileSize(file.size) }}</p>
                </div>
              </div>
              
              <!-- Upload Progress -->
              <div v-if="uploadProgress[index] !== undefined" class="flex items-center space-x-2">
                <div class="w-20 bg-gray-600 rounded-full h-2">
                  <div
                    class="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${uploadProgress[index]}%` }"
                  ></div>
                </div>
                <span class="text-xs text-gray-400">{{ uploadProgress[index] }}%</span>
              </div>
              
              <!-- Remove Button -->
              <button
                v-else
                @click="removeFile(index)"
                class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500"
                :disabled="uploading"
              >
                <Icon name="mdi:close" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Upload Status -->
        <div v-if="uploadStatus.length > 0" class="mt-6">
          <h4 class="text-lg font-medium text-white mb-4">Upload Results</h4>
          <div class="space-y-2">
            <div
              v-for="(status, index) in uploadStatus"
              :key="index"
              :class="[
                'flex items-center space-x-2 p-3 rounded-lg text-sm',
                status.success 
                  ? 'bg-green-500 bg-opacity-20 text-green-400' 
                  : 'bg-red-500 bg-opacity-20 text-red-400'
              ]"
            >
              <Icon
                :name="status.success ? 'mdi:check-circle' : 'mdi:alert-circle'"
                class="w-4 h-4"
              />
              <span>{{ status.message }}</span>
            </div>
          </div>
        </div>

        <!-- Error Messages -->
        <div v-if="error" class="mt-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4">
          <div class="flex items-center">
            <Icon name="mdi:alert-circle" class="w-5 h-5 text-red-400 mr-2" />
            <span class="text-red-400 text-sm">{{ error }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-6 border-t border-gray-700">
        <div class="text-sm text-gray-400">
          {{ selectedFiles.length }} file{{ selectedFiles.length !== 1 ? 's' : '' }} selected
        </div>
        <div class="flex space-x-3">
          <button
            @click="$emit('close')"
            class="btn-secondary focus:ring-2 focus:ring-gray-500"
            :disabled="uploading"
          >
            Cancel
          </button>
          <button
            @click="uploadFiles"
            :disabled="selectedFiles.length === 0 || uploading"
            class="btn-primary focus:ring-2 focus:ring-primary-500"
          >
            <Icon v-if="uploading" name="mdi:loading" class="w-5 h-5 mr-2 animate-spin" />
            {{ uploading ? 'Uploading...' : 'Upload Files' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  folderId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['close', 'uploaded'])

const { $api } = useNuxtApp()

// Reactive data
const selectedFiles = ref([])
const uploading = ref(false)
const uploadProgress = ref({})
const uploadStatus = ref([])
const error = ref('')
const isDragging = ref(false)

// Methods
const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  
  const files = Array.from(event.dataTransfer.files)
  addFiles(files)
}

const handleDragLeave = (event) => {
  // Only set isDragging to false if we're leaving the drop zone entirely
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragging.value = false
  }
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  addFiles(files)
}

const addFiles = (files) => {
  const validFiles = files.filter(file => {
    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return false
    }
    
    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      return false
    }
    
    return true
  })
  
  selectedFiles.value = [...selectedFiles.value, ...validFiles]
  error.value = ''
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) return
  
  try {
    uploading.value = true
    uploadStatus.value = []
    error.value = ''
    
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const file = selectedFiles.value[i]
      
      try {
        // Create FormData
        const formData = new FormData()
        formData.append('files', file)
        if (props.folderId) {
          formData.append('folder_id', props.folderId)
        }
        
        // Upload with progress tracking
        uploadProgress.value[i] = 0
        
        const response = await $fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
          onUploadProgress: (progress) => {
            uploadProgress.value[i] = Math.round((progress.loaded / progress.total) * 100)
          }
        })
        
        uploadProgress.value[i] = 100
        uploadStatus.value.push({
          success: true,
          message: `${file.name} uploaded successfully`
        })
        
      } catch (uploadError) {
        console.error('Upload error:', uploadError)
        uploadStatus.value.push({
          success: false,
          message: `Failed to upload ${file.name}: ${uploadError.data?.message || 'Unknown error'}`
        })
      }
    }
    
    // Clear selected files after upload
    selectedFiles.value = []
    uploadProgress.value = {}
    
    // Emit uploaded event to refresh parent
    emit('uploaded')
    
  } catch (err) {
    console.error('Upload error:', err)
    error.value = err.data?.message || 'Failed to upload files'
  } finally {
    uploading.value = false
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Drag and drop event listeners
onMounted(() => {
  // Prevent default drag behaviors on document
  const preventDefault = (e) => e.preventDefault()
  
  document.addEventListener('dragenter', preventDefault)
  document.addEventListener('dragover', preventDefault)
  document.addEventListener('dragleave', preventDefault)
  document.addEventListener('drop', preventDefault)
})

onUnmounted(() => {
  const preventDefault = (e) => e.preventDefault()
  
  document.removeEventListener('dragenter', preventDefault)
  document.removeEventListener('dragover', preventDefault)
  document.removeEventListener('dragleave', preventDefault)
  document.removeEventListener('drop', preventDefault)
})
</script>

<style scoped>
/* Custom scrollbar for upload area */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #374151;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>