import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    alias: {
      $lib: resolve('./src/lib')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{js,ts,svelte}'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts,svelte}'],
      exclude: [
        'src/app.html',
        'src/hooks.server.ts',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/routes/**/+layout*.svelte',
        'src/routes/**/+error.svelte',
        'src/lib/utils.ts',
      ],
      all: true,
    }
  },
});
