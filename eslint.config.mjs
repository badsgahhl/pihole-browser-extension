import tsParser from '@typescript-eslint/parser'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import pluginVue from 'eslint-plugin-vue'

// Intentionally slim: ESLint only covers eslint-plugin-vue's <template> rules, which Oxlint
// does not have. Everything else is linted by Oxlint (.oxlintrc.json). The TypeScript parser is
// wired in so vue-eslint-parser can read <script lang="ts">; no typescript-eslint rules run here.
export default [
  {
    name: 'app/vue-script-parser',
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue']
      }
    }
  },

  {
    name: 'app/files-to-lint',
    files: ['**/*.vue'],
    rules: {
      'vue/block-order': [
        'error',
        {
          order: ['template', 'script', 'style', 'customBlocks']
        }
      ]
    }
  },

  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/.output/**',
      '**/.wxt/**',
      '**/coverage/**',
      '**/design/**',
      '**/node_modules/**',
      '**/src/components/ui/**'
    ]
  },

  ...pluginVue.configs['flat/recommended'],
  skipFormatting
]
