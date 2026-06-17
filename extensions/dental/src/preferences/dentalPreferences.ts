import { DEFAULT_TOOTH_ID, ToothNumberingSystem } from '../tooth/toothIdentity';

export type DentalThemePreference = 'standard' | 'dental';

export type DentalPreferences = {
  selectedToothId: string;
  numberingSystem: ToothNumberingSystem;
  theme: DentalThemePreference;
};

export const DENTAL_PREFERENCES_STORAGE_KEY = 'ohif.dental.preferences.v1';

export const DEFAULT_DENTAL_PREFERENCES: DentalPreferences = {
  selectedToothId: DEFAULT_TOOTH_ID,
  numberingSystem: 'Universal',
  theme: 'standard',
};

export function normalizeDentalPreferences(value: unknown): DentalPreferences {
  if (!value || typeof value !== 'object') {
    return DEFAULT_DENTAL_PREFERENCES;
  }

  const candidate = value as Partial<DentalPreferences>;

  return {
    selectedToothId:
      typeof candidate.selectedToothId === 'string'
        ? candidate.selectedToothId
        : DEFAULT_DENTAL_PREFERENCES.selectedToothId,
    numberingSystem: candidate.numberingSystem === 'FDI' ? 'FDI' : 'Universal',
    theme: candidate.theme === 'dental' ? 'dental' : 'standard',
  };
}
