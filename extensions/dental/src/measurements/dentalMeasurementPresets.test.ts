import {
  DENTAL_MEASUREMENT_PRESETS,
  getDentalMeasurementPreset,
} from './dentalMeasurementPresets';

describe('dental measurement presets', () => {
  it.each([
    ['pa-length', 'PA length'],
    ['crown-width', 'Crown width'],
    ['root-length', 'Root length'],
  ])('maps %s to the Length tool', (presetId, label) => {
    expect(getDentalMeasurementPreset(presetId as never)).toEqual(
      expect.objectContaining({
        label,
        toolName: 'Length',
        unit: 'mm',
      })
    );
  });

  it('maps Canal angle to the Angle tool', () => {
    expect(getDentalMeasurementPreset('canal-angle')).toEqual(
      expect.objectContaining({
        label: 'Canal angle',
        toolName: 'Angle',
        unit: '°',
      })
    );
  });

  it('defines unique preset ids', () => {
    const ids = DENTAL_MEASUREMENT_PRESETS.map(preset => preset.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
