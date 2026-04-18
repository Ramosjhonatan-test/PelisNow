import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import obfuscator from 'rollup-plugin-javascript-obfuscator'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      ...obfuscator({
        options: {
          debugProtection: true,
          debugProtectionInterval: 4000,
          disableConsoleOutput: true,
          identifierNamesGenerator: 'hexadecimal',
          log: false,
          renameGlobals: false,
          selfDefending: true,
          splitStrings: true,
          stringArray: true,
          stringArrayThreshold: 0.75,
          unicodeEscapeSequence: false
        },
      }),
      apply: 'build'
    }
  ],
})
