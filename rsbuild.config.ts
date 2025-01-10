import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';

import path from 'path';

const SRC_DIR = path.resolve(__dirname, './platform/app/src');

export default defineConfig({
  source: {
    entry: {
      app: `${SRC_DIR}/index.js`,
    },
  },
  plugins: [pluginReact(), pluginNodePolyfill()],
  tools: {
    rspack: {
      experiments: {
        asyncWebAssembly: true,
      },
      module: {
        rules: [
          {
            test: /\.wasm$/,
            type: 'asset/resource',
          },
        ],
      },
    },
  },
  resolve: {
    alias: {
      // Viewer project
      '@': path.resolve(__dirname, './platform/app/src'),
      '@components': path.resolve(__dirname, './platform/app/src/components'),
      '@hooks': path.resolve(__dirname, './platform/app/src/hooks'),
      '@routes': path.resolve(__dirname, './platform/app/src/routes'),
      '@state': path.resolve(__dirname, './platform/app/src/state'),
      'dicom-microscopy-viewer':
        'dicom-microscopy-viewer/dist/dynamic-import/dicomMicroscopyViewer.min.js',
    },
  },
});
