import { DentalMeasurement } from './dentalMeasurement';

export type DentalMeasurementExport = {
  schemaVersion: 1;
  studyInstanceUID: string;
  patientId?: string;
  exportedAt: string;
  measurements: Array<{
    annotationUID: string;
    presetId: DentalMeasurement['presetId'];
    label: string;
    unit: DentalMeasurement['unit'];
    value: number | null;
    toothId: string;
    note: string | null;
    toolName: DentalMeasurement['toolName'];
    viewportId?: string;
    displaySetInstanceUID?: string;
    referenceSeriesUID?: string;
    geometry?: {
      points: number[][];
    };
    createdAt: string;
    updatedAt: string;
  }>;
};

type DentalMeasurementExportContext = {
  studyInstanceUID: string;
  patientId?: string | null;
  exportedAt?: string;
};

export function createDentalMeasurementExport(
  context: DentalMeasurementExportContext,
  measurements: DentalMeasurement[]
): DentalMeasurementExport {
  return {
    schemaVersion: 1,
    studyInstanceUID: context.studyInstanceUID,
    ...(context.patientId ? { patientId: context.patientId } : {}),
    exportedAt: context.exportedAt || new Date().toISOString(),
    measurements: measurements.map(measurement => ({
      annotationUID: measurement.annotationUID,
      presetId: measurement.presetId,
      label: measurement.label,
      unit: measurement.unit,
      value: measurement.value,
      toothId: measurement.toothId,
      note: measurement.note,
      toolName: measurement.toolName,
      ...(measurement.viewportId ? { viewportId: measurement.viewportId } : {}),
      ...(measurement.displaySetInstanceUID
        ? { displaySetInstanceUID: measurement.displaySetInstanceUID }
        : {}),
      ...(measurement.referenceSeriesUID
        ? { referenceSeriesUID: measurement.referenceSeriesUID }
        : {}),
      ...(measurement.points ? { geometry: { points: measurement.points } } : {}),
      createdAt: measurement.createdAt,
      updatedAt: measurement.updatedAt,
    })),
  };
}

export function createDentalMeasurementExportFilename(
  studyInstanceUID: string,
  exportedAt = new Date()
): string {
  const timestamp = [
    exportedAt.getUTCFullYear(),
    String(exportedAt.getUTCMonth() + 1).padStart(2, '0'),
    String(exportedAt.getUTCDate()).padStart(2, '0'),
    '-',
    String(exportedAt.getUTCHours()).padStart(2, '0'),
    String(exportedAt.getUTCMinutes()).padStart(2, '0'),
    String(exportedAt.getUTCSeconds()).padStart(2, '0'),
  ].join('');

  return `dental-measurements-${studyInstanceUID}-${timestamp}.json`;
}
