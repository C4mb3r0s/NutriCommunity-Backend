import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended
})

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'src/db/migrations/**'
    ]
  },

  js.configs.recommended,

  // Use eslint-config-standard within ESLint Flat Config.
  ...compat.extends('standard'),

  // Recommended TypeScript rules.
  ...tseslint.configs.recommended,

  {
    files: [
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
      '**/*.ts',
      '**/*.mts',
      '**/*.cts'
    ],

    languageOptions: {
      globals: globals.node,
      parserOptions: {
        sourceType: 'module'
      }
    },

    rules: {
      // TypeScript checks undefined variables.
      'no-undef': 'off',

      // Allow underscore-prefixed names for unused parameters.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  }
)
