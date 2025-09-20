<template>
  <div>
    <!-- TV Remote Handler for global navigation -->
    <TVRemoteHandler
      @navigate="handleNavigation"
      @select="handleSelect"
      @back="handleBack"
      @home="handleHome"
      @search="handleSearch"
      @upload="handleUpload"
      @newFolder="handleNewFolder"
      @toggleView="handleToggleView"
      @slideshow="handleSlideshow"
      @playPause="handlePlayPause"
      @skipForward="handleSkipForward"
      @skipBackward="handleSkipBackward"
      @volumeUp="handleVolumeUp"
      @volumeDown="handleVolumeDown"
    />
    
    <!-- Main app content -->
    <NuxtPage />
  </div>
</template>

<script setup>
// Global navigation handlers
const router = useRouter()
const route = useRoute()

const handleNavigation = (data) => {
  // Handle spatial navigation
  console.log('Navigation:', data)
}

const handleSelect = (data) => {
  // Handle selection
  console.log('Select:', data)
}

const handleBack = () => {
  // Handle back navigation
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const handleHome = () => {
  router.push('/')
}

const handleSearch = () => {
  // Focus search input if available
  const searchInput = document.querySelector('input[type="search"], .search-input')
  if (searchInput) {
    searchInput.focus()
  }
}

const handleUpload = () => {
  // Trigger upload modal if on gallery page
  if (route.path === '/') {
    const uploadBtn = document.querySelector('.upload-btn, [data-action="upload"]')
    if (uploadBtn) {
      uploadBtn.click()
    }
  }
}

const handleNewFolder = () => {
  // Trigger new folder modal if on gallery page
  if (route.path === '/') {
    const newFolderBtn = document.querySelector('.new-folder-btn, [data-action="new-folder"]')
    if (newFolderBtn) {
      newFolderBtn.click()
    }
  }
}

const handleToggleView = () => {
  // Toggle view mode if on gallery page
  const viewToggle = document.querySelector('.view-toggle, [data-action="toggle-view"]')
  if (viewToggle) {
    viewToggle.click()
  }
}

const handleSlideshow = () => {
  // Start slideshow if on gallery page
  const slideshowBtn = document.querySelector('.slideshow-btn, [data-action="slideshow"]')
  if (slideshowBtn) {
    slideshowBtn.click()
  }
}

const handlePlayPause = () => {
  // Handle media play/pause
  const video = document.querySelector('video')
  const audio = document.querySelector('audio')
  
  if (video && !video.paused) {
    video.pause()
  } else if (video) {
    video.play()
  } else if (audio && !audio.paused) {
    audio.pause()
  } else if (audio) {
    audio.play()
  }
}

const handleSkipForward = () => {
  // Skip forward in media
  const video = document.querySelector('video')
  const audio = document.querySelector('audio')
  
  if (video) {
    video.currentTime = Math.min(video.duration, video.currentTime + 10)
  } else if (audio) {
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10)
  }
}

const handleSkipBackward = () => {
  // Skip backward in media
  const video = document.querySelector('video')
  const audio = document.querySelector('audio')
  
  if (video) {
    video.currentTime = Math.max(0, video.currentTime - 10)
  } else if (audio) {
    audio.currentTime = Math.max(0, audio.currentTime - 10)
  }
}

const handleVolumeUp = () => {
  // Increase volume
  const video = document.querySelector('video')
  const audio = document.querySelector('audio')
  
  if (video) {
    video.volume = Math.min(1, video.volume + 0.1)
  } else if (audio) {
    audio.volume = Math.min(1, audio.volume + 0.1)
  }
}

const handleVolumeDown = () => {
  // Decrease volume
  const video = document.querySelector('video')
  const audio = document.querySelector('audio')
  
  if (video) {
    video.volume = Math.max(0, video.volume - 0.1)
  } else if (audio) {
    audio.volume = Math.max(0, audio.volume - 0.1)
  }
}
</script>