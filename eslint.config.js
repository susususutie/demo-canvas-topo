import globals from 'globals'
import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import ts from '@typescript-eslint/eslint-plugin'
import reactRefresh from 'eslint-plugin-react-refresh'
import hooksPlugin from 'eslint-plugin-react-hooks'

const myJsTsRules = {
  indent: ['error', 2],
  'arrow-body-style': ['warn', 'as-needed'],
  // 不加`;` 除非 `;(function() { ... })()`
  semi: ['warn', 'never', { beforeStatementContinuationChars: 'always' }],
  quotes: ['warn', 'single'],
  'no-unused-vars': 'warn',
  'comma-spacing': 'warn',
  'comma-dangle': ['warn', 'only-multiline'],
}

export default [
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-refresh': reactRefresh,
      'react-hooks': hooksPlugin,
      '@typescript-eslint': ts,
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      ...js.configs.recommended.rules,
      ...ts.configs['eslint-recommended'].rules, // 此处禁用了部分eslint内置rules
      // 此处禁用了eslint的`no-loss-of-precision`与`no-unused-vars`rules, 增加了一些`@typescript-eslint`开头的rules
      ...ts.configs['recommended'].rules,
      '@typescript-eslint/no-explicit-any': 'off',
      ...myJsTsRules,
    },
  },
  {
    files: ['eslint.config.js'],
    rules: {
      ...js.configs.recommended.rules,
      ...myJsTsRules,
    },
  },
  {
    files: ['vite.config.ts'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: { '@typescript-eslint': ts },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs['eslint-recommended'].rules, // 此处禁用了部分eslint内置rules
      //此处禁用了eslint的`no-loss-of-precision`与`no-unused-vars`rules, 增加了一些`@typescript-eslint`开头的rules
      ...ts.configs['recommended'].rules,
      ...myJsTsRules,
    },
  },
]
