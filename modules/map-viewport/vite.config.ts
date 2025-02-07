import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { compilerOptions, transformAssetUrls } from 'vue3-pixi'

const dir = '../../dist/webviews/vmf-editor';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions, // support for custom elements and remove the unknown element warnings
        transformAssetUrls, // support for asset url conversion
      },
    }),
    vueJsx(),
  ],
  build: {
    outDir: dir,
    assetsDir: '.',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
