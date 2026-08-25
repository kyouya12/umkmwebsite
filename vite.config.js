import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-lucide'
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react'
            return 'vendor'
          }
        }
      }
    }
  }
})
