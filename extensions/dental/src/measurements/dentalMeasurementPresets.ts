export type DentalMeasurementPresetId =
  | 'pa-length'
  | 'canal-angle'
  | 'crown-width'
  | 'root-length';

export type DentalMeasurementToolName = 'Length' | 'Angle';

export type DentalMeasurementPreset = {
  id: DentalMeasurementPresetId;
  label: string;
  unit: 'mm' | '°';
  toolName: DentalMeasurementToolName;
};

export const DENTAL_MEASUREMENT_PRESETS: readonly DentalMeasurementPreset[] = [
  {
    id: 'pa-length',
    label: 'PA length',
    unit: 'mm',
    toolName: 'Length',
  },
  {
    id: 'canal-angle',
    label: 'Canal angle',
    unit: '°',
    toolName: 'Angle',
  },
  {
    id: 'crown-width',
    label: 'Crown width',
    unit: 'mm',
    toolName: 'Length',
  },
  {
    id: 'root-length',
    label: 'Root length',
    unit: 'mm',
    toolName: 'Length',
  },
];

export function getDentalMeasurementPreset(
  presetId: DentalMeasurementPresetId
): DentalMeasurementPreset {
  const preset = DENTAL_MEASUREMENT_PRESETS.find(candidate => candidate.id === presetId);

  if (!preset) {
    throw new Error(`Unknown dental measurement preset: ${presetId}`);
  }

  return preset;
}
