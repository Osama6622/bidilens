import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { bidilensPlugin } from 'vite-plugin-bidilens';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    // Dogfooding our own Vite plugin: fails build if physical CSS ever leaks into @bidilens/web
    bidilensPlugin({ failOnError: true }),
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@bidilens/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 4200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue'],
          'vendor-sass': ['sass'],
          'vendor-codemirror': [
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/commands',
            '@codemirror/language',
            '@codemirror/lang-html',
            '@codemirror/lang-sass',
            '@lezer/highlight',
          ],
        },
      },
    },
  },
});
