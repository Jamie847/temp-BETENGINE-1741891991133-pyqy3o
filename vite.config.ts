import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    },
    sourcemap: true
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  }
});
