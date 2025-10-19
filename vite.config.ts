import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/clinic_wound_image_annotator/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
