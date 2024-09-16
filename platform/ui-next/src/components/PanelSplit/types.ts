export type PropertyType = 'text' | 'number' | 'boolean' | 'slider';

export interface Property {
  key: string;
  label: string;
  type: PropertyType;
  value: string | number | boolean;
  min?: number; // Applicable for 'number' and 'slider' types
  max?: number; // Applicable for 'number' and 'slider' types
  step?: number; // Applicable for 'number' and 'slider' types
}
