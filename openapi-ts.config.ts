import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  // The leading ./ matters: a bare "a/b" path is read as a Hey API platform shorthand.
  input: './api-spec/pihole-api.bundled.json',
  output: {
    path: 'src/lib/api/pihole',
    clean: true
  },
  plugins: ['@hey-api/client-fetch', '@hey-api/typescript', '@hey-api/sdk']
})
