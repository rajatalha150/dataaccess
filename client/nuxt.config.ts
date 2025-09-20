// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/icon'
  ],
  css: [
    '~/assets/css/main.css',
    '~/assets/css/tv-optimized.css'
  ],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3001'
    }
  },
  app: {
    head: {
      title: 'Vision Media Hub',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Your personal media streaming hub optimized for TV browsers' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  // Optimize for TV browsers
  experimental: {
    payloadExtraction: false
  },
  nitro: {
    compressPublicAssets: true
  },
  // TV-friendly routing
  router: {
    options: {
      hashMode: false
    }
  }
})