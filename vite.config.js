import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_PERP_AMM_ENDPOINT.replace(/\/$/, '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/config': {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/config/, '/config'),
        },
        '/api/pricing': {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/pricing/, '/pricing'),
        },
        '/api/trades': {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/trades/, '/trades'),
        },
      },
    },
  }
})
