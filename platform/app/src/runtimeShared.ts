// platform/app/src/runtimeShared.ts
// v1 shared-dependency contract for runtime-loaded (UMD) plugins: the host
// assigns its singleton copies to window, keyed by FULL package name. Plugin
// bundles list these as externals (.rspack/pluginExternals.js) and resolve
// them from these globals — e.g. @ohif/ui-next's own UMD build externalizes
// '@ohif/ui-next', which the global assigned here satisfies. MUST stay in
// sync with pluginExternals.hostSharedPackages — enforced by
// runtimeShared.test.js.
//
// Namespace imports are deliberate: consumers get both named exports and the
// bundler's __esModule/default interop, so a plugin's `import React from
// 'react'` resolves window['react'].default and `import { useState }`
// resolves the named export.
//
// Freeze note: every package listed here (and its public API surface) is part
// of the plugin-facing contract from the moment it ships. Runtime plugins
// bind to these globals without being rebuilt against the host, so removing
// an entry, renaming exports, or making breaking API changes in a shared
// package breaks already-published plugins. Treat additions as permanent and
// coordinate any change with a major version of the contract.
//
// @ohif/i18n is shared because runtime extensions dereference it during
// module evaluation (e.g. dicom-pdf). @ohif/ui is intentionally NOT shared:
// it is legacy and a forbidden import for runtime plugins.
import * as react from 'react';
import * as reactDom from 'react-dom';
import * as reactJsxRuntime from 'react/jsx-runtime';
import * as ohifCore from '@ohif/core';
import * as ohifUiNext from '@ohif/ui-next';
import * as ohifI18n from '@ohif/i18n';
import * as ohifExtensionDefault from '@ohif/extension-default';
import * as ohifExtensionCornerstone from '@ohif/extension-cornerstone';
import * as cornerstoneCore from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import * as dcmjs from 'dcmjs';
import * as glMatrix from 'gl-matrix';

const shared: Record<string, unknown> = {
  react,
  'react-dom': reactDom,
  'react/jsx-runtime': reactJsxRuntime,
  '@ohif/core': ohifCore,
  '@ohif/ui-next': ohifUiNext,
  '@ohif/i18n': ohifI18n,
  '@ohif/extension-default': ohifExtensionDefault,
  '@ohif/extension-cornerstone': ohifExtensionCornerstone,
  '@cornerstonejs/core': cornerstoneCore,
  '@cornerstonejs/tools': cornerstoneTools,
  dcmjs,
  'gl-matrix': glMatrix,
};

Object.entries(shared).forEach(([name, mod]) => {
  (window as unknown as Record<string, unknown>)[name] = mod;
});
