<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center px-4">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo and Title -->
      <div class="text-center">
        <div class="mx-auto h-20 w-20 bg-primary-600 rounded-full flex items-center justify-center mb-6">
          <Icon name="mdi:play-circle" class="w-12 h-12 text-white" />
        </div>
        <h2 class="text-4xl font-bold text-white mb-2">Welcome Back</h2>
        <p class="text-gray-400 text-lg">Sign in to access your media library</p>
      </div>

      <!-- Login Form -->
      <div class="bg-gray-800 rounded-xl p-8 border border-gray-700">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input-field"
              placeholder="Enter your email"
              :disabled="loading"
            />
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="input-field pr-12"
                placeholder="Enter your password"
                :disabled="loading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                :disabled="loading"
              >
                <Icon :name="showPassword ? 'mdi:eye-off' : 'mdi:eye'" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Remember Me -->
          <div class="flex items-center">
            <input
              id="remember"
              v-model="form.remember"
              type="checkbox"
              class="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
              :disabled="loading"
            />
            <label for="remember" class="ml-2 text-sm text-gray-300">
              Remember me
            </label>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4">
            <div class="flex items-center">
              <Icon name="mdi:alert-circle" class="w-5 h-5 text-red-400 mr-2" />
              <span class="text-red-400 text-sm">{{ error }}</span>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn-primary w-full focus:ring-4 focus:ring-primary-500"
            :disabled="loading"
          >
            <Icon v-if="loading" name="mdi:loading" class="w-5 h-5 mr-2 animate-spin" />
            {{ loading ? 'Signing In...' : 'Sign In' }}
          </button>
        </form>

        <!-- Additional Info -->
        <div class="mt-6 pt-6 border-t border-gray-700 text-center">
          <p class="text-gray-400 text-sm">
            Need access? Contact your administrator to create an account.
          </p>
        </div>
      </div>

      <!-- TV Remote Instructions -->
      <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 class="text-lg font-semibold text-white mb-3 flex items-center">
          <Icon name="mdi:remote-tv" class="w-5 h-5 mr-2 text-primary-400" />
          TV Remote Navigation
        </h3>
        <div class="grid grid-cols-2 gap-4 text-sm text-gray-300">
          <div class="flex items-center">
            <Icon name="mdi:arrow-up-down" class="w-4 h-4 mr-2 text-gray-400" />
            Navigate fields
          </div>
          <div class="flex items-center">
            <Icon name="mdi:keyboard-return" class="w-4 h-4 mr-2 text-gray-400" />
            Select/Submit
          </div>
          <div class="flex items-center">
            <Icon name="mdi:arrow-left-right" class="w-4 h-4 mr-2 text-gray-400" />
            Toggle options
          </div>
          <div class="flex items-center">
            <Icon name="mdi:backspace" class="w-4 h-4 mr-2 text-gray-400" />
            Go back
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})

const authStore = useAuthStore()
const router = useRouter()

// Reactive data
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const form = ref({
  email: '',
  password: '',
  remember: false
})

// Handle login
const handleLogin = async () => {
  try {
    loading.value = true
    error.value = ''

    await authStore.login({
      email: form.value.email,
      password: form.value.password
    })

    // Redirect based on user role
    if (authStore.isAdmin) {
      router.push('/admin')
    } else {
      router.push('/')
    }
  } catch (err) {
    console.error('Login error:', err)
    error.value = err.data?.message || 'Invalid email or password'
  } finally {
    loading.value = false
  }
}

// Redirect if already authenticated
onMounted(() => {
  if (authStore.isAuthenticated) {
    if (authStore.isAdmin) {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }
})

// Focus management for TV remotes
onMounted(() => {
  // Auto-focus first input for TV remote navigation
  const emailInput = document.getElementById('email')
  if (emailInput) {
    emailInput.focus()
  }
})
</script>

<style scoped>
/* Additional TV-friendly focus styles */
input:focus,
button:focus {
  @apply ring-4 ring-primary-500 ring-opacity-50;
}

/* Larger touch targets for TV remotes */
.input-field {
  @apply min-h-[3rem];
}

.btn-primary {
  @apply min-h-[3rem];
}
</style>