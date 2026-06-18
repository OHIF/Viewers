import { DentalMeasurement } from './dentalMeasurement';

export type DentalMeasurementSort = 'createdAt' | 'label' | 'toothId' | 'value';

export type DentalMeasurementFilters = {
  label: string;
  toothId: string;
  unit: string;
};

export function filterDentalMeasurements(
  measurements: DentalMeasurement[],
  filters: DentalMeasurementFilters
): DentalMeasurement[] {
  return measurements.filter(measurement => {
    return (
      (!filters.label || measurement.label === filters.label) &&
      (!filters.toothId || measurement.toothId === filters.toothId) &&
      (!filters.unit || measurement.unit === filters.unit)
    );
  });
}

export function sortDentalMeasurements(
  measurements: DentalMeasurement[],
  sortBy: DentalMeasurementSort
): DentalMeasurement[] {
  return [...measurements].sort((left, right) => {
    if (sortBy === 'createdAt') {
      return right.createdAt.localeCompare(left.createdAt);
    }

    if (sortBy === 'value') {
      return (left.value ?? Number.NEGATIVE_INFINITY) - (right.value ?? Number.NEGATIVE_INFINITY);
    }

    return String(left[sortBy]).localeCompare(String(right[sortBy]));
  });
}
