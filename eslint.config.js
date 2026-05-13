import js from '@eslint/js';
import eslintComments from 'eslint-plugin-eslint-comments';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'playwright-report/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'eslint-comments': eslintComments,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        document: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        sessionStorage: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // any is an error — legacy violations are suppressed per-file with
      // eslint-disable comments until they are progressively typed.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Upgrade exhaustive-deps from the plugin default (warn) to error
      // so missing hook dependencies are caught before they reach review
      'react-hooks/exhaustive-deps': 'error',
      'eslint-comments/require-description': 'error',
      'no-case-declarations': 'off',
      'no-undef': 'off',
    },
  },
  prettier,
);
