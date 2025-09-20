<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-700">
        <h2 class="text-xl font-semibold text-white">Create New Folder</h2>
        <button
          @click="$emit('close')"
          class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 focus:ring-2 focus:ring-primary-500"
        >
          <Icon name="mdi:close" class="w-4 h-4" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="createFolder" class="p-6">
        <div class="space-y-4">
          <!-- Folder Name -->
          <div>
            <label for="folderName" class="block text-sm font-medium text-gray-300 mb-2">
              Folder Name
            </label>
            <input
              id="folderName"
              v-model="form.name"
              type="text"
              required
              class="input-field"
              placeholder="Enter folder name"
              :disabled="loading"
              maxlength="255"
            />
          </div>

          <!-- Description -->
          <div>
            <label for="folderDescription" class="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="folderDescription"
              v-model="form.description"
              rows="3"
              class="input-field resize-none"
              placeholder="Enter folder description"
              :disabled="loading"
              maxlength="500"
            ></textarea>
          </div>

          <!-- Parent Folder Info -->
          <div v-if="parentFolderName" class="bg-gray-700 rounded-lg p-3">
            <div class="flex items-center text-sm text-gray-300">
              <Icon name="mdi:folder" class="w-4 h-4 mr-2 text-primary-400" />
              <span>Creating in: <strong class="text-white">{{ parentFolderName }}</strong></span>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mt-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4">
          <div class="flex items-center">
            <Icon name="mdi:alert-circle" class="w-5 h-5 text-red-400 mr-2" />
            <span class="text-red-400 text-sm">{{ error }}</span>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex items-center justify-end space-x-3 mt-6">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-secondary focus:ring-2 focus:ring-gray-500"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary focus:ring-2 focus:ring-primary-500"
            :disabled="loading || !form.name.trim()"
          >
            <Icon v-if="loading" name="mdi:loading" class="w-5 h-5 mr-2 animate-spin" />
            {{ loading ? 'Creating...' : 'Create Folder' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  parentFolderId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['close', 'created'])

const { $api } = useNuxtApp()

// Reactive data
const loading = ref(false)
const error = ref('')
const parentFolderName = ref('')

const form = ref({
  name: '',
  description: ''
})

// Methods
const createFolder = async () => {
  try {
    loading.value = true
    error.value = ''

    const folderData = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || null,
      parent_id: props.parentFolderId || null
    }

    await $api('/folders', {
      method: 'POST',
      body: folderData
    })

    // Reset form
    form.value = {
      name: '',
      description: ''
    }

    // Emit success event
    emit('created')
    
  } catch (err) {
    console.error('Create folder error:', err)
    error.value = err.data?.message || 'Failed to create folder'
  } finally {
    loading.value = false
  }
}

const loadParentFolderInfo = async () => {
  if (!props.parentFolderId) {
    parentFolderName.value = 'Home'
    return
  }

  try {
    const response = await $api(`/folders/${props.parentFolderId}`)
    parentFolderName.value = response.name
  } catch (error) {
    console.error('Error loading parent folder:', error)
    parentFolderName.value = 'Unknown Folder'
  }
}

// Lifecycle
onMounted(() => {
  loadParentFolderInfo()
  
  // Auto-focus the name input
  nextTick(() => {
    const nameInput = document.getElementById('folderName')
    if (nameInput) {
      nameInput.focus()
    }
  })
})
</script>

<style scoped>
/* TV-friendly focus styles */
input:focus,
textarea:focus,
button:focus {
  outline: none;
}
</style>