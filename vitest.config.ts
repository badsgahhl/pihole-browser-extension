import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing/vitest-plugin'

export default defineConfig({
  plugins: [WxtVitest()],
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
