import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/duta-uinssc/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      'next/link': path.resolve(__dirname, 'src/components/Link.jsx'),
      'next/image': path.resolve(__dirname, 'src/components/Image.jsx'),
      'next/navigation': path.resolve(__dirname, 'src/lib/router.js'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
  },
});
