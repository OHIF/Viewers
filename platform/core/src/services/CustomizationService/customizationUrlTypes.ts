import type { CustomizationUrlPolicy } from './customizationUrlDefaults';
import type { ValidatedCustomization } from './validate';

export interface CustomizationModule {
  customizations?: {
    global?: Record<string, any>;
    requires?: string | string[];
  };
  global?: Record<string, any>;
  requires?: string | string[];
  [key: string]: any;
}

export interface LoadedCustomization {
  request: ValidatedCustomization;
  module: CustomizationModule;
  url: string;
}

export interface LoadOptions {
  policy?: CustomizationUrlPolicy;
  importFn?: (url: string) => Promise<any>;
  logger?: { warn: (...args: any[]) => void; error: (...args: any[]) => void };
}
