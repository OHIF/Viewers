import {
  DentalMeasurementPreset,
  DentalMeasurementPresetId,
  DentalMeasurementToolName,
} from './dentalMeasurementPresets';

export type DentalMeasurement = {
  annotationUID: string;
  presetId: DentalMeasurementPresetId;
  label: string;
  unit: DentalMeasurementPreset['unit'];
  value: number | null;
  toothId: string;
  note: string | null;
  toolName: DentalMeasurementToolName;
  referenceStudyUID?: string;
  referenceSeriesUID?: string;
  displaySetInstanceUID?: string;
  viewportId?: string;
  points?: number[][];
  createdAt: string;
  updatedAt: string;
};

export function getMeasurementValue(measurement: Record<string, any>): number | null {
  const statistic = Object.values(measurement.data || {}).find(
    value => value && typeof value === 'object'
  ) as Record<string, unknown> | undefined;
  const value = measurement.toolName === 'Angle' ? statistic?.angle : statistic?.length;

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function createDentalMeasurement({
  measurement,
  preset,
  toothId,
  note,
  viewportId,
  createdAt = new Date().toISOString(),
}: {
  measurement: Record<string, any>;
  preset: DentalMeasurementPreset;
  toothId: string;
  note: string;
  viewportId?: string;
  createdAt?: string;
}): DentalMeasurement {
  return {
    annotationUID: measurement.uid,
    presetId: preset.id,
    label: preset.label,
    unit: preset.unit,
    value: getMeasurementValue(measurement),
    toothId,
    note: note.trim() || null,
    toolName: preset.toolName,
    referenceStudyUID: measurement.referenceStudyUID,
    referenceSeriesUID: measurement.referenceSeriesUID,
    displaySetInstanceUID: measurement.displaySetInstanceUID,
    viewportId,
    points: measurement.points,
    createdAt,
    updatedAt: createdAt,
  };
}

export function updateDentalMeasurement(
  dentalMeasurement: DentalMeasurement,
  measurement: Record<string, any>,
  updatedAt = new Date().toISOString()
): DentalMeasurement {
  return {
    ...dentalMeasurement,
    value: getMeasurementValue(measurement),
    points: measurement.points || dentalMeasurement.points,
    updatedAt,
  };
}
