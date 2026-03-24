import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,             // Để sử dụng describe, it, expect mà không cần import
    environment: 'jsdom',      // Giả lập trình duyệt
    setupFiles: './src/test/setup.js', // File setup môi trường
    coverage: {
      provider: 'v8',          // Hoặc 'istanbul' để đạt mục tiêu 80% coverage
      reporter: ['text', 'json', 'html'],
    },
  },
})
