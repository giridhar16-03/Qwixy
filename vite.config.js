import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const qwixyUrl = env.VITE_QWIXY_API_URL || ''

  const proxy = {}
  if (qwixyUrl) {
    try {
      const parsed = new URL(qwixyUrl)
      const origin = parsed.origin
      const basePath = parsed.pathname.replace(/\/$/, '') || ''
      proxy['/api/qwixy'] = {
        target: origin,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/qwixy/, basePath),
      }
    } catch (e) {
      // fallback: treat as a raw target
      proxy['/api/qwixy'] = {
        target: qwixyUrl,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/qwixy/, ''),
      }
    }
  }

  return defineConfig({
    base: '/Qwixy/',
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(env.VITE_PORT) || 5173,
      strictPort: true,
      proxy,
    },
    
  })
}
