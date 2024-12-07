import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import UnoCSS from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
    cssMinify: false,
  },
  plugins: [
    react(),
    UnoCSS(
      {
        mode: 'per-module',
      }
      // {
      //   presets: [], // don't use preset
      //   rules:[
      //     [/^m-(\d+)$/,   ([, d]) => ({ margin: `${+d}px` })],
      //     [/^p-(\d+)$/,   ([, d]) => ({ padding: `${d}px` })],
      //     [/^gap-(\d+)$/, ([, d]) => ({ gap: `${d}px` })],
      //     ['flex', { display: 'flex' }],
      //     ['flex', { display: 'flex' }],
      //   ]
      // }
    ),
  ],
})
