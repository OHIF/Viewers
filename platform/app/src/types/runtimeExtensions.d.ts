// App-side type augmentation for the runtime extension loader
// (platform/app/src/runtimeExtensionLoader.ts). AppTypes.Config lives in
// platform/core/src/types/AppTypes.ts inside `declare global`; the settled
// decision is zero core changes, so the new config key is added here via
// TypeScript interface merging instead (this file is picked up through the
// root tsconfig.json include of 'platform/**/src/**/*').
//
// Known limitation: `extensions?: string[]` / `modes?: string[]` on
// AppTypes.Config CANNOT be widened from here (interface merging requires
// same-name members to be declared identically), so runtime extension
// descriptor entries remain untyped in AppTypes.Config. That widening to
// `(string | RuntimeExtensionDescriptor)[]` belongs to the separately-flagged
// optional core type fix and is deliberately NOT done in this workstream.

import type { RuntimeExtensionAuditRecord } from '../runtimeExtensionLoader';

declare global {
  namespace AppTypes {
    interface Config {
      /**
       * Extra origins allowed to serve runtime extensions/modes/styles.
       * Same-origin is always implicitly allowed; everything else is denied.
       */
      runtimeExtensionOrigins?: string[];
    }
  }
  interface Window {
    __ohif?: {
      runtimeExtensions?: RuntimeExtensionAuditRecord[];
      runtimeExtensionOrigins?: string[];
    };
  }
}

export {};
