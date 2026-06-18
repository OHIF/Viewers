import { DentalMeasurement } from './dentalMeasurement';
import { filterDentalMeasurements, sortDentalMeasurements } from './dentalMeasurementList';

const measurements = [
  {
    annotationUID: '2',
    label: 'Canal angle',
    unit: '°',
    value: 30,
    toothId: 'permanent-2',
    createdAt: '2026-06-18T02:00:00.000Z',
  },
  {
    annotationUID: '1',
    label: 'PA length',
    unit: 'mm',
    value: 12,
    toothId: 'permanent-1',
    createdAt: '2026-06-18T01:00:00.000Z',
  },
] as DentalMeasurement[];

describe('dental measurement list', () => {
  it('combines label, tooth, and unit filters', () => {
    expect(
      filterDentalMeasurements(measurements, {
        label: 'PA length',
        toothId: 'permanent-1',
        unit: 'mm',
      })
    ).toEqual([measurements[1]]);
  });

  it('sorts newest measurements first by default field', () => {
    expect(sortDentalMeasurements(measurements, 'createdAt').map(item => item.annotationUID)).toEqual([
      '2',
      '1',
    ]);
  });

  it.each([
    ['label', ['2', '1']],
    ['toothId', ['1', '2']],
    ['value', ['1', '2']],
  ])('sorts by %s', (sortBy, expected) => {
    expect(sortDentalMeasurements(measurements, sortBy as never).map(item => item.annotationUID)).toEqual(
      expected
    );
  });
});
