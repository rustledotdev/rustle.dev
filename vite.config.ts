import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      exclude: ['src/test-setup.ts', '**/*.test.*', 'src/cli/ci-deprecated.ts'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        engine: resolve(__dirname, 'src/engine/engine.ts'),
        next: resolve(__dirname, 'src/next/index.ts'),
        vite: resolve(__dirname, 'src/vite/index.ts'),
        config: resolve(__dirname, 'src/config/index.ts'),
        cli: resolve(__dirname, 'src/cli/manual.ts'),
        ci: resolve(__dirname, 'src/cli/ci.ts'),
      },
      name: 'RustleDev',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'js';
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: [
        'react', 'react-dom', 'react/jsx-runtime',
        // Node built-ins used by the engine/plugin
        'fs', 'path', 'crypto', 'os', 'stream', 'events', 'util', 'child_process', 'assert',
        // Native and server-only deps used by extractors/plugins
        '@swc/core',
        // Next.js middleware/server modules should be external
        'next', 'next/server'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
      onwarn(warning, warn) {
        // Silence rollup warning about module-level directives like 'use client' in bundled files
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && /use client/.test(String(warning.message))) {
          return;
        }
        warn(warning);
      },
    },
    sourcemap: true,
    minify: false,
  },
  esbuild: {
    jsx: 'automatic',
  },
});
