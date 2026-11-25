import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@bidilens/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      'vite-plugin-bidilens': fileURLToPath(
        new URL('./packages/vite-plugin/src/index.ts', import.meta.url),
      ),
      vscode: fileURLToPath(
        new URL('./packages/vscode/src/__tests__/__mocks__/vscode.ts', import.meta.url),
      ),
      '@': fileURLToPath(new URL('./packages/web/src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['packages/**/*.{test,spec}.ts'],
  },
});
