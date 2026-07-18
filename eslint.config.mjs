// Minimal flat config dedicated to React Compiler health (run via
// `pnpm lint:compiler`). eslint-plugin-react-hooks v7 ships the
// compiler-powered rules; every diagnostic it reports marks a component
// the compiler bails out on (or memoization it cannot preserve), which is
// exactly the "do not hand-remove memoization here" list for the cleanup
// waves. Deliberately not wired into the legacy .eslintrc.json world.
import reactHooks from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';

const hooksPreset = reactHooks.configs['recommended-latest'] ?? reactHooks.configs.recommended;

export default [
  {
    ignores: ['**/coverage/**', '**/dist/**', '**/build/**', 'platform/docs/**'],
  },
  {
    files: [
      'platform/app/src/**/*.{js,jsx,ts,tsx}',
      'platform/core/src/**/*.{js,jsx,ts,tsx}',
      'platform/i18n/src/**/*.{js,jsx,ts,tsx}',
      'platform/ui-next/src/**/*.{js,jsx,ts,tsx}',
      'extensions/*/src/**/*.{js,jsx,ts,tsx}',
      'modes/*/src/**/*.{js,jsx,ts,tsx}',
    ],
    ignores: ['**/*.test.*', '**/__tests__/**', '**/__mocks__/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...hooksPreset.rules,
      // The formal gate for the memoization-removal codemods: a file is only
      // eligible when the compiler provably preserves its manual memoization.
      'react-hooks/preserve-manual-memoization': 'error',
    },
  },
];
