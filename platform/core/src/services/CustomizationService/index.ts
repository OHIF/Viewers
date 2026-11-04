import CustomizationService from './CustomizationService';

export { GENERAL_MODE_KEY, normalizeCustomizationConfig } from './CustomizationService';
export type {
  CustomizationModule,
  CustomizationPhaseInput,
  DefaultResourceLoad,
  LoadResource,
  LoadResourceRequest,
  ModePhaseCustomizations,
  PhasedCustomizationConfig,
} from './customizationUrlTypes';

export default CustomizationService;
