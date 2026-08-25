import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const sharedRollupOutput = {
  chunkFileNames: 'assets/[name]-[hash].js',
  entryFileNames: 'assets/[name]-[hash].js',
  assetFileNames: 'assets/[name]-[hash][extname]',
}

function manualChunks(id) {
  if (!id.includes('node_modules')) return

  if (
    id.includes('react-dom') ||
    id.includes('react-router') ||
    /[/\\]react[/\\]/.test(id)
  ) {
    return 'vendor-react'
  }

  if (id.includes('lucide-react')) {
    return 'vendor-icons'
  }

  if (id.includes('@tinymce') || id.includes('tinymce')) {
    return 'vendor-tinymce'
  }

  return 'vendor'
}

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 5173,
      strictPort: false,
    },

    preview: {
      port: 4173,
      strictPort: false,
    },

    build: {
      target: 'es2020',
      sourcemap: !isProduction,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          ...sharedRollupOutput,
          manualChunks: isProduction ? manualChunks : undefined,
        },
      },
    },

    esbuild: {
      jsx: 'automatic',
    },

    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{js,jsx}'],
      restoreMocks: true,
      setupFiles: ['./src/test/setup.js'],
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
      rollupOptions: {
        output: {
          ...sharedRollupOutput,
        },
      },
    },
  }
})
