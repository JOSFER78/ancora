import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      '/v1': {
        target: 'https://143-47-35-167.sslip.io/pro/freellmapi',
        changeOrigin: true,
        secure: false
      },
      '/pro/freellmapi': {
        target: 'https://143-47-35-167.sslip.io',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
