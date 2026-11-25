import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/pedidos': {
        target: 'http://localhost:8000',
        ws: true,
      },
      '/mesas': 'http://localhost:8000',
      '/cardapio': 'http://localhost:8000',
      '/restaurantes': 'http://localhost:8000',
      '/usuarios': 'http://localhost:8000',
      '/estoque': 'http://localhost:8000',
      '/ficha-tecnica': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
      '/ws': {
        target: 'http://localhost:8000',
        ws: true,
      },
    },
  },
})
