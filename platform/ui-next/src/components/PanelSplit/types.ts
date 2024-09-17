// src/components/PanelSplit/types.ts

export interface Property {
  key: string;
  label: string;
  type: 'slider' | 'boolean' | string; // Extend types as needed
  value: any;
  min?: number;
  max?: number;
  step?: number;
}

export interface Item {
  id: number;
  name: string;
  controlsAll?: boolean; // Indicates if the item is the master
  series?: string; // Optional, only for non-master items
  properties: Property[];
}
