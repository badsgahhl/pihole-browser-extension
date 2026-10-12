import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing/vitest-plugin'

export default defineConfig({
  // WxtVitest wires the fake browser and WXT's aliases; the Vue plugin is not part of it.
  plugins: [WxtVitest(), vue()],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/lib/api/pihole/**',
        'src/components/ui/**',
        'src/test/**',
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/entrypoints/**/main.ts',
        'src/public/**'
      ],
      reporter: ['text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      reportOnFailure: true
    }
  }
})
