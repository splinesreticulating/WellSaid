import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

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
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts,svelte}'],
      exclude: [
        'src/app.html',
        'src/hooks.server.ts',
        'src/service-worker.ts',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/**/constants.ts',
        'src/lib/server/db.ts', // Example: if db setup is hard to test directly
        'src/routes/**/+layout*.svelte',
        'src/routes/**/+error.svelte',
        'src/lib/components/ui', // Exclude all UI components from ShadCN/ui if not testing them directly
        'src/lib/utils.ts', // if it's the shadcn utils file and not tested directly
      ],
      all: true, // Report coverage for all files, not just tested ones
    }
  },
});
