<template>
  <div class="tv-remote-handler">
    <!-- Visual focus indicator -->
    <div
      v-if="showFocusIndicator"
      class="fixed pointer-events-none z-50 border-4 border-primary-500 rounded-lg transition-all duration-200"
      :style="focusIndicatorStyle"
    ></div>

    <!-- Remote control help overlay -->
    <div
      v-if="showRemoteHelp"
      class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      @click="showRemoteHelp = false"
    >
      <div class="bg-gray-800 rounded-lg p-8 max-w-2xl mx-4">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-white">Remote Control Guide</h2>
          <button
            @click="showRemoteHelp = false"
            class="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white"
          >
            <Icon name="mdi:close" class="w-6 h-6" />
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
          <div>
            <h3 class="text-lg font-semibold text-white mb-3">Navigation</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span>Arrow Keys</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">↑↓←→</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>Select/Enter</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">Enter</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>Back/Exit</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">Esc</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>Home</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">H</kbd>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-semibold text-white mb-3">Media Controls</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span>Play/Pause</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">Space</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>Skip Forward</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">→</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>Skip Backward</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">←</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>Volume Up/Down</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">↑↓</kbd>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-semibold text-white mb-3">Quick Actions</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span>Search</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">S</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>Upload</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">U</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>New Folder</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">N</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>Toggle View</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">V</kbd>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-semibold text-white mb-3">Slideshow</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span>Start Slideshow</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">F5</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>Next Image</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">→</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>Previous Image</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">←</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>Exit Slideshow</span>
                <kbd class="bg-gray-700 px-2 py-1 rounded text-sm">Esc</kbd>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-6 border-t border-gray-700 text-center">
          <p class="text-gray-400 text-sm">
            Press <kbd class="bg-gray-700 px-2 py-1 rounded text-xs">?</kbd> anytime to show/hide this guide
          </p>
        </div>
      </div>
    </div>

    <!-- Connection status indicator -->
    <div
      v-if="showConnectionStatus"
      class="fixed top-4 right-4 z-40 bg-gray-800 rounded-lg p-3 flex items-center space-x-2"
    >
      <div
        :class="[
          'w-3 h-3 rounded-full',
          isConnected ? 'bg-green-500' : 'bg-red-500'
        ]"
      ></div>
      <span class="text-white text-sm">
        {{ isConnected ? 'Connected' : 'Disconnected' }}
      </span>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits([
  'navigate',
  'select',
  'back',
  'home',
  'search',
  'upload',
  'newFolder',
  'toggleView',
  'slideshow',
  'playPause',
  'skipForward',
  'skipBackward',
  'volumeUp',
  'volumeDown'
])

// Reactive data
const showFocusIndicator = ref(false)
const showRemoteHelp = ref(false)
const showConnectionStatus = ref(false)
const isConnected = ref(true)
const focusIndicatorStyle = ref({})
const currentFocusedElement = ref(null)

// Navigation state
const navigationHistory = ref([])
const currentNavigationIndex = ref(-1)

// Remote control detection
const isRemoteControlActive = ref(false)
const lastKeyTime = ref(0)
const keySequence = ref([])

// Methods
const updateFocusIndicator = (element) => {
  if (!element) {
    showFocusIndicator.value = false
    return
  }

  const rect = element.getBoundingClientRect()
  focusIndicatorStyle.value = {
    left: `${rect.left - 4}px`,
    top: `${rect.top - 4}px`,
    width: `${rect.width + 8}px`,
    height: `${rect.height + 8}px`
  }
  showFocusIndicator.value = true
  currentFocusedElement.value = element
}

const findFocusableElements = () => {
  const selectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '.focusable'
  ].join(', ')

  return Array.from(document.querySelectorAll(selectors))
    .filter(el => {
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden'
    })
}

const navigateToElement = (direction) => {
  const focusableElements = findFocusableElements()
  if (focusableElements.length === 0) return

  const currentIndex = focusableElements.indexOf(document.activeElement)
  let nextIndex

  switch (direction) {
    case 'up':
      nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1
      break
    case 'down':
      nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0
      break
    case 'left':
      // Find element to the left (spatial navigation)
      nextIndex = findSpatialElement(focusableElements, 'left')
      break
    case 'right':
      // Find element to the right (spatial navigation)
      nextIndex = findSpatialElement(focusableElements, 'right')
      break
    default:
      return
  }

  if (nextIndex !== -1 && focusableElements[nextIndex]) {
    focusableElements[nextIndex].focus()
    updateFocusIndicator(focusableElements[nextIndex])
    emit('navigate', { direction, element: focusableElements[nextIndex] })
  }
}

const findSpatialElement = (elements, direction) => {
  const currentElement = document.activeElement
  if (!currentElement) return 0

  const currentRect = currentElement.getBoundingClientRect()
  const currentCenter = {
    x: currentRect.left + currentRect.width / 2,
    y: currentRect.top + currentRect.height / 2
  }

  let bestElement = null
  let bestDistance = Infinity

  elements.forEach((element, index) => {
    if (element === currentElement) return

    const rect = element.getBoundingClientRect()
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }

    // Check if element is in the correct direction
    const isInDirection = direction === 'left' 
      ? center.x < currentCenter.x 
      : center.x > currentCenter.x

    if (!isInDirection) return

    // Calculate distance
    const distance = Math.sqrt(
      Math.pow(center.x - currentCenter.x, 2) + 
      Math.pow(center.y - currentCenter.y, 2)
    )

    if (distance < bestDistance) {
      bestDistance = distance
      bestElement = index
    }
  })

  return bestElement !== null ? bestElement : -1
}

const handleKeyDown = (event) => {
  const now = Date.now()
  
  // Detect remote control usage (rapid key presses)
  if (now - lastKeyTime.value < 100) {
    isRemoteControlActive.value = true
  }
  lastKeyTime.value = now

  // Track key sequence for special commands
  keySequence.value.push(event.key)
  if (keySequence.value.length > 5) {
    keySequence.value.shift()
  }

  // Handle navigation keys
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      navigateToElement('up')
      break
    case 'ArrowDown':
      event.preventDefault()
      navigateToElement('down')
      break
    case 'ArrowLeft':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        emit('skipBackward')
      } else {
        navigateToElement('left')
      }
      break
    case 'ArrowRight':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        emit('skipForward')
      } else {
        navigateToElement('right')
      }
      break
    case 'Enter':
      event.preventDefault()
      if (document.activeElement) {
        document.activeElement.click()
        emit('select', { element: document.activeElement })
      }
      break
    case 'Escape':
      event.preventDefault()
      emit('back')
      break
    case ' ':
      if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault()
        emit('playPause')
      }
      break
    case 'h':
    case 'H':
      if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault()
        emit('home')
      }
      break
    case 's':
    case 'S':
      if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault()
        emit('search')
      }
      break
    case 'u':
    case 'U':
      if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault()
        emit('upload')
      }
      break
    case 'n':
    case 'N':
      if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault()
        emit('newFolder')
      }
      break
    case 'v':
    case 'V':
      if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault()
        emit('toggleView')
      }
      break
    case 'F5':
      event.preventDefault()
      emit('slideshow')
      break
    case '?':
      event.preventDefault()
      showRemoteHelp.value = !showRemoteHelp.value
      break
  }

  // Volume controls (when not in input fields)
  if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    if (event.key === 'ArrowUp' && (event.ctrlKey || event.altKey)) {
      event.preventDefault()
      emit('volumeUp')
    } else if (event.key === 'ArrowDown' && (event.ctrlKey || event.altKey)) {
      event.preventDefault()
      emit('volumeDown')
    }
  }
}

const handleFocusChange = () => {
  const activeElement = document.activeElement
  if (activeElement && activeElement !== document.body) {
    updateFocusIndicator(activeElement)
  } else {
    showFocusIndicator.value = false
  }
}

const initializeFocus = () => {
  // Focus the first focusable element on page load
  nextTick(() => {
    const focusableElements = findFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
      updateFocusIndicator(focusableElements[0])
    }
  })
}

// Connection monitoring
const checkConnection = () => {
  isConnected.value = navigator.onLine
}

const handleConnectionChange = () => {
  checkConnection()
  showConnectionStatus.value = true
  setTimeout(() => {
    showConnectionStatus.value = false
  }, 3000)
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('focusin', handleFocusChange)
  document.addEventListener('focusout', handleFocusChange)
  window.addEventListener('online', handleConnectionChange)
  window.addEventListener('offline', handleConnectionChange)

  initializeFocus()
  checkConnection()

  // Show help on first visit
  const hasSeenHelp = localStorage.getItem('tv-remote-help-seen')
  if (!hasSeenHelp) {
    setTimeout(() => {
      showRemoteHelp.value = true
      localStorage.setItem('tv-remote-help-seen', 'true')
    }, 2000)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('focusin', handleFocusChange)
  document.removeEventListener('focusout', handleFocusChange)
  window.removeEventListener('online', handleConnectionChange)
  window.removeEventListener('offline', handleConnectionChange)
})

// Expose methods for parent components
defineExpose({
  showHelp: () => { showRemoteHelp.value = true },
  hideHelp: () => { showRemoteHelp.value = false },
  focusFirst: initializeFocus,
  navigateTo: navigateToElement
})
</script>

<style scoped>
.tv-remote-handler {
  position: relative;
}

kbd {
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Smooth focus transitions */
.focus-indicator {
  transition: all 0.2s ease;
  pointer-events: none;
}

/* Enhanced visibility for TV screens */
@media screen and (min-width: 1920px) {
  .fixed {
    font-size: 1.1em;
  }
  
  kbd {
    font-size: 0.85rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>