export interface Property {
  key: string;
  label: string;
  type: 'slider' | 'boolean' | string; // Extend types as needed
  value: any;
  min?: number;
  max?: number;
  step?: number;
}

export type DisplayMode = 'Fill & Outline' | 'Outline Only' | 'Fill Only';
export type VisibilityState = 'Visible' | 'Hidden';
export type AvailabilityState = 'loaded' | 'available' | 'not available';

export interface Item {
  id: number;
  name: string;
  controlsAll?: boolean; // Indicates if the item is the master
  series?: string; // Optional, only for non-master items
  displayMode: DisplayMode; // Existing property for display mode
  visibility: VisibilityState; // Existing property for visibility
  availability: AvailabilityState; // New property for availability
  properties: Property[];
}
