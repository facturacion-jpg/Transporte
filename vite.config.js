import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En GitHub Actions el repo se llama "facturacion-jpg/Transporte", así que
// Pages publica en https://facturacion-jpg.github.io/Transporte/
// En local se mantiene la raíz "/" para no romper `npm run dev`.
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.VITE_BASE_PATH || (repoName ? `/${repoName}/` : '/')

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
})
