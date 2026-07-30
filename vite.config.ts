import { fileURLToPath, URL } from 'node:url'
import PackageJson from './package.json'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'

import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? `/${PackageJson.name}/` : '/',
  plugins: [
    vue(),
    svgLoader(),
    AutoImport({
      imports: [
        'vue', 'vue-router', 'pinia',
        {
          'naive-ui': [
            'useMessage',
          ]
        }
      ],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      dirs: ['src/components'],
      deep: true,
      resolvers: [NaiveUiResolver()],
      dts: 'src/components.d.ts',
      directoryAsNamespace: false,
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
