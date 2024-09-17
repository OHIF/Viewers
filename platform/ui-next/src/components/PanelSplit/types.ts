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
  controlsAll?: boolean; // Renamed from isMaster
  properties: Property[];
}
