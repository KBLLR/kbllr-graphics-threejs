import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.js'],
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@core': path.resolve(__dirname, './src/core'),
      '@debug': path.resolve(__dirname, './src/debug'),
      '@materials': path.resolve(__dirname, './src/materials'),
      '@sketches': path.resolve(__dirname, './src/sketches'),
      '@systems': path.resolve(__dirname, './src/systems'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@theatre': path.resolve(__dirname, './node_modules/@theatre'),
    },
  },
});
