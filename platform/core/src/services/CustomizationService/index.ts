import CustomizationService from './CustomizationService';

export { GENERAL_MODE_KEY, normalizeCustomizationConfig } from './CustomizationService';
export type {
  CustomizationModule,
  CustomizationPhaseInput,
  ModePhaseCustomizations,
  PhasedCustomizationConfig,
} from './customizationUrlTypes';
export {
  CUSTOMIZATION_FUNCTION_POLICY_KEY,
  DEFAULT_FUNCTION_PARAMS,
  customizationFunctionPolicyDefaults,
  findFunctionSignature,
  getCustomizationFunctionPolicy,
  isFunctionAttributeDenied,
} from './functionPolicy';
export type {
  CustomizationFunctionPolicy,
  FunctionSignature,
  FunctionSignatureRegistry,
} from './functionPolicy';

export default CustomizationService;
