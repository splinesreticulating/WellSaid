import js from '@eslint/js'
import ts from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import svelte from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
    js.configs.recommended,
    {
        files: ['**/*.{js,ts,mjs}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
            },
            globals: {
                ...globals.node,
                ...globals.browser,
            },
        },
        plugins: {
            '@typescript-eslint': ts,
        },
        rules: {
            ...ts.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: tsParser,
                extraFileExtensions: ['.svelte'],
            },
            globals: {
                ...globals.browser,
            },
        },
        plugins: {
            svelte,
        },
        rules: {
            ...svelte.configs.recommended.rules,
            'svelte/valid-compile': 'error',
            'svelte/no-at-debug-tags': 'warn',
        },
    },
    {
        files: ['tests/**/*.{js,ts}', '**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
                vi: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },
    {
        files: ['vite.config.ts', 'vitest.config.ts', 'svelte.config.js'],
        languageOptions: {
            globals: {
                ...globals.node,
                __dirname: 'readonly',
            },
        },
    },
    {
        ignores: [
            '.svelte-kit/**',
            'build/**',
            'dist/**',
            'node_modules/**',
            'coverage/**',
            '**/*.d.ts',
        ],
    },
    prettier,
]
