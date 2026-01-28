import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    react(),
    // PWA plugin completely removed for development
  ],
  // Explicitly disable any service worker generation
  build: {
    rollupOptions: {
      external: []
    }
  }
})