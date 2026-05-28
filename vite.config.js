import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    {
      name: 'exclude-audio-from-public',
      closeBundle() {
        const audioDir = path.resolve('dist/audio')
        if (fs.existsSync(audioDir)) {
          console.log(`[vite-plugin] Removing audio directory: ${audioDir}`)
          fs.rmSync(audioDir, { recursive: true, force: true })
        }
      }
    }
  ]
})
