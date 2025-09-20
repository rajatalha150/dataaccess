<template>
  <div>
    <AdminLayout>
      <div class="space-y-8">
        <!-- Page Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold text-white mb-2">User Management</h1>
            <p class="text-gray-400 text-lg">Manage system users and permissions</p>
          </div>
          <button
            @click="showCreateModal = true"
            class="btn-primary focus:ring-4 focus:ring-primary-500"
          >
            <Icon name="mdi:plus" class="w-5 h-5 mr-2" />
            Create User
          </button>
        </div>

        <!-- Search and Filters -->
        <div class="card">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Search Users</label>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by name or email..."
                class="input-field"
                @input="debouncedSearch"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Role Filter</label>
              <select v-model="roleFilter" class="input-field" @change="loadUsers">
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Status Filter</label>
              <select v-model="statusFilter" class="input-field" @change="loadUsers">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="card">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-700">
                  <th class="text-left py-4 px-4 text-gray-300 font-medium">User</th>
                  <th class="text-left py-4 px-4 text-gray-300 font-medium">Email</th>
                  <th class="text-left py-4 px-4 text-gray-300 font-medium">Role</th>
                  <th class="text-left py-4 px-4 text-gray-300 font-medium">Status</th>
                  <th class="text-left py-4 px-4 text-gray-300 font-medium">Created</th>
                  <th class="text-left py-4 px-4 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="user in users"
                  :key="user.id"
                  class="border-b border-gray-800 hover:bg-gray-800 transition-colors"
                >
                  <td class="py-4 px-4">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span class="text-white font-semibold text-sm">
                          {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                        </span>
                      </div>
                      <div>
                        <p class="text-white font-medium">{{ user.firstName }} {{ user.lastName }}</p>
                        <p class="text-gray-400 text-sm">ID: {{ user.id.slice(0, 8) }}...</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 px-4 text-gray-300">{{ user.email }}</td>
                  <td class="py-4 px-4">
                    <span
                      class="px-3 py-1 rounded-full text-xs font-medium"
                      :class="user.role === 'admin' ? 'bg-red-500 bg-opacity-20 text-red-400' : 'bg-blue-500 bg-opacity-20 text-blue-400'"
                    >
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="py-4 px-4">
                    <span
                      class="px-3 py-1 rounded-full text-xs font-medium"
                      :class="user.isActive ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-gray-500 bg-opacity-20 text-gray-400'"
                    >
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="py-4 px-4 text-gray-300">{{ formatDate(user.createdAt) }}</td>
                  <td class="py-4 px-4">
                    <div class="flex items-center space-x-2">
                      <button
                        @click="editUser(user)"
                        class="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500 hover:bg-opacity-20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Icon name="mdi:pencil" class="w-4 h-4" />
                      </button>
                      <button
                        @click="toggleUserStatus(user)"
                        class="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500 hover:bg-opacity-20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        <Icon :name="user.isActive ? 'mdi:pause' : 'mdi:play'" class="w-4 h-4" />
                      </button>
                      <button
                        @click="deleteUser(user)"
                        class="p-2 text-red-400 hover:text-red-300 hover:bg-red-500 hover:bg-opacity-20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        :disabled="user.role === 'admin'"
                      >
                        <Icon name="mdi:delete" class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
            <div class="text-gray-400 text-sm">
              Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalUsers) }} of {{ totalUsers }} users
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span class="text-gray-300 px-4">{{ currentPage }} / {{ totalPages }}</span>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <!-- Create/Edit User Modal -->
        <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModals">
          <div class="modal-content" @click.stop>
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold text-white">
                {{ showCreateModal ? 'Create New User' : 'Edit User' }}
              </h2>
              <button @click="closeModals" class="text-gray-400 hover:text-white">
                <Icon name="mdi:close" class="w-6 h-6" />
              </button>
            </div>

            <form @submit.prevent="saveUser" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                  <input
                    v-model="userForm.firstName"
                    type="text"
                    required
                    class="input-field"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                  <input
                    v-model="userForm.lastName"
                    type="text"
                    required
                    class="input-field"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  v-model="userForm.email"
                  type="email"
                  required
                  class="input-field"
                  placeholder="Enter email address"
                />
              </div>

              <div v-if="showCreateModal">
                <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  v-model="userForm.password"
                  type="password"
                  required
                  class="input-field"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select v-model="userForm.role" class="input-field" required>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div class="flex items-center space-x-3">
                <input
                  v-model="userForm.isActive"
                  type="checkbox"
                  id="isActive"
                  class="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                />
                <label for="isActive" class="text-gray-300">Active User</label>
              </div>

              <div class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
                <button type="button" @click="closeModals" class="btn-secondary">
                  Cancel
                </button>
                <button type="submit" class="btn-primary" :disabled="loading">
                  {{ loading ? 'Saving...' : (showCreateModal ? 'Create User' : 'Update User') }}
                </button>
              </div>
            </form>
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
const users = ref([])
const loading = ref(false)
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalUsers = ref(0)
const totalPages = computed(() => Math.ceil(totalUsers.value / pageSize.value))

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingUser = ref(null)

// Form data
const userForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'user',
  isActive: true
})

// Load users
const loadUsers = async () => {
  try {
    loading.value = true
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: pageSize.value
    })

    if (searchQuery.value) params.append('search', searchQuery.value)
    if (roleFilter.value) params.append('role', roleFilter.value)
    if (statusFilter.value) params.append('status', statusFilter.value)

    const response = await $api(`/users?${params}`)
    users.value = response.users
    totalUsers.value = response.pagination.total
  } catch (error) {
    console.error('Error loading users:', error)
  } finally {
    loading.value = false
  }
}

// Debounced search
const debouncedSearch = debounce(() => {
  currentPage.value = 1
  loadUsers()
}, 300)

// User actions
const editUser = (user) => {
  editingUser.value = user
  userForm.value = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  }
  showEditModal.value = true
}

const saveUser = async () => {
  try {
    loading.value = true
    
    if (showCreateModal.value) {
      await $api('/users', {
        method: 'POST',
        body: userForm.value
      })
    } else {
      await $api(`/users/${editingUser.value.id}`, {
        method: 'PUT',
        body: {
          firstName: userForm.value.firstName,
          lastName: userForm.value.lastName,
          email: userForm.value.email,
          role: userForm.value.role,
          isActive: userForm.value.isActive
        }
      })
    }

    closeModals()
    loadUsers()
  } catch (error) {
    console.error('Error saving user:', error)
  } finally {
    loading.value = false
  }
}

const toggleUserStatus = async (user) => {
  try {
    await $api(`/users/${user.id}`, {
      method: 'PUT',
      body: { isActive: !user.isActive }
    })
    loadUsers()
  } catch (error) {
    console.error('Error toggling user status:', error)
  }
}

const deleteUser = async (user) => {
  if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
    return
  }

  try {
    await $api(`/users/${user.id}`, { method: 'DELETE' })
    loadUsers()
  } catch (error) {
    console.error('Error deleting user:', error)
  }
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingUser.value = null
  userForm.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
    isActive: true
  }
}

// Utility functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Watch for page changes
watch(currentPage, () => {
  loadUsers()
})

// Load data on mount
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.card {
  @apply bg-gray-800 rounded-xl p-6 border border-gray-700;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
}

.modal-content {
  @apply bg-gray-800 rounded-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto border border-gray-700;
}
</style>