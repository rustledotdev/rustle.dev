import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      exclude: ['src/test-setup.ts', '**/*.test.*'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        lite: resolve(__dirname, 'src/lite.ts'),
        server: resolve(__dirname, 'src/server.ts'),
        next: resolve(__dirname, 'src/next.ts'),
        'cli/rustleEngine': resolve(__dirname, 'src/cli/rustleEngine.ts'),
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
        'react',
        'react-dom',
        'react/jsx-runtime',
        // Node.js built-ins
        'fs',
        'path',
        'crypto',
        'util',
        'stream',
        'events',
        'buffer',
        'url',
        'querystring',
        // Node.js packages
        'glob',
        'zod'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
    // Production optimizations
    sourcemap: !isProduction, // Remove source maps in production
    minify: isProduction ? 'terser' : false,
    terserOptions: isProduction ? {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        properties: {
          regex: /^_/, // Mangle private properties starting with _
        },
      },
      format: {
        comments: false, // Remove comments
      },
    } : undefined,
  },
  esbuild: {
    jsx: 'automatic',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    banner: '"use client";',
  },
});
