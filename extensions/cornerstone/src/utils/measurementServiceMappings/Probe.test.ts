import Probe from './Probe';
import Length from './Length';
import measurementsCustomization from '../../customizations/measurementsCustomization';

jest.mock('./utils/getIsLocked', () => ({ getIsLocked: () => false }));
jest.mock('./utils/getIsVisible', () => ({ getIsVisible: () => true }));
jest.mock('./utils/getSOPInstanceAttributes', () => ({
  __esModule: true,
  default: () => ({
    SOPInstanceUID: '1.2.3.4',
    SeriesInstanceUID: '1.2.3',
    StudyInstanceUID: '1.2',
    frameNumber: 1,
  }),
}));

const displaySet = {
  displaySetInstanceUID: 'ds-1',
  SeriesNumber: 7,
  isMultiFrame: false,
  instances: [{ SOPInstanceUID: '1.2.3.4', InstanceNumber: 3 }],
};

const displaySetService = {
  getDisplaySetForSOPInstanceUID: () => displaySet,
  getDisplaySetsForSeries: () => [displaySet],
};

function probeAnnotation({ value, modalityUnit, label = '' }) {
  return {
    annotation: {
      annotationUID: 'uid-probe',
      metadata: {
        toolName: 'Probe',
        referencedImageId: 'wadors:image',
        FrameOfReferenceUID: 'for-1',
      },
      data: {
        label,
        handles: { points: [[1, 2, 3]] },
        cachedStats: { 'imageId:wadors:image': { value, modalityUnit } },
      },
    },
  };
}

function lengthAnnotation() {
  return {
    annotation: {
      annotationUID: 'uid-length',
      metadata: {
        toolName: 'Length',
        referencedImageId: 'wadors:image',
        FrameOfReferenceUID: 'for-1',
      },
      data: {
        label: '',
        handles: {
          points: [
            [0, 0, 0],
            [3, 4, 0],
          ],
        },
        cachedStats: { 'imageId:wadors:image': { length: 5, unit: 'mm' } },
      },
    },
  };
}

/**
 * A customizationService holding the shipped defaults, with `valueLabel` (when given)
 * set on `cornerstone.measurements.probeValueLabel` the way a mode would set it.
 */
function customizationServiceWith(overrides?: { valueLabel?: unknown }) {
  const values: Record<string, unknown> = { ...measurementsCustomization };
  if (overrides && 'valueLabel' in overrides) {
    values['cornerstone.measurements.probeValueLabel'] = overrides.valueLabel;
  }
  return { getCustomization: (id: string) => values[id] };
}

const map = (tool, detail, customizationService) =>
  tool.toMeasurement(detail, displaySetService, {}, () => 'value', customizationService);

describe('Probe measurement mapping - probeValueLabel customization', () => {
  it('ships cornerstone.measurements.probeValueLabel off by default', () => {
    expect(measurementsCustomization).toHaveProperty(
      ['cornerstone.measurements.probeValueLabel'],
      null
    );
  });

  it('is its own id: cornerstone.measurements gets no Probe key (a mode sets it with a plain value)', () => {
    expect(measurementsCustomization['cornerstone.measurements']).not.toHaveProperty('Probe');
  });

  it('by default renders exactly what upstream renders (no label)', () => {
    const m = map(Probe, probeAnnotation({ value: [158, 113, 150] }), customizationServiceWith());
    expect(m.displayText.primary).toEqual(['158, 113, 150 ']);
    expect(m.displayText.secondary).toEqual(['S: 7 I: 3']);
  });

  it('keeps working when no customizationService is given', () => {
    const m = map(Probe, probeAnnotation({ value: [158, 113, 150] }), undefined);
    expect(m.displayText.primary).toEqual(['158, 113, 150 ']);
  });

  it('with a string label, prefixes it and leaves the three numbers identical', () => {
    const off = map(Probe, probeAnnotation({ value: [158, 113, 150] }), customizationServiceWith());
    const on = map(
      Probe,
      probeAnnotation({ value: [158, 113, 150] }),
      customizationServiceWith({ valueLabel: 'RGB' })
    );
    expect(on.displayText.primary).toEqual(['RGB: 158, 113, 150 ']);
    expect(on.displayText.primary[0]).toBe(`RGB: ${off.displayText.primary[0]}`);
    expect(on.displayText.secondary).toEqual(off.displayText.secondary);
  });

  it('keeps the unit after the value: "Pixel: 45.0 HU" on a CT (roundNumber gives 45.0)', () => {
    const m = map(
      Probe,
      probeAnnotation({ value: 45, modalityUnit: 'HU' }),
      customizationServiceWith({ valueLabel: 'Pixel' })
    );
    expect(m.displayText.primary).toEqual(['Pixel: 45.0 HU']);
  });

  it('accepts a function that decides the label per value', () => {
    const valueLabel = ({ value }) => (Array.isArray(value) ? 'RGB' : 'Pixel');
    const rgb = map(
      Probe,
      probeAnnotation({ value: [158, 113, 150] }),
      customizationServiceWith({ valueLabel })
    );
    const ct = map(
      Probe,
      probeAnnotation({ value: 45, modalityUnit: 'HU' }),
      customizationServiceWith({ valueLabel })
    );
    expect(rgb.displayText.primary).toEqual(['RGB: 158, 113, 150 ']);
    expect(ct.displayText.primary).toEqual(['Pixel: 45.0 HU']);
  });

  it('a function returning nothing leaves the text unlabelled', () => {
    const m = map(
      Probe,
      probeAnnotation({ value: 45, modalityUnit: 'HU' }),
      customizationServiceWith({ valueLabel: () => undefined })
    );
    expect(m.displayText.primary).toEqual(['45.0 HU']);
  });

  it('does not touch the measurement label (shown as the empty label in the panel)', () => {
    const m = map(
      Probe,
      probeAnnotation({ value: [158, 113, 150], label: '' }),
      customizationServiceWith({ valueLabel: 'RGB' })
    );
    expect(m.label).toBe('');
  });

  it('does not change the CSV report', () => {
    const detail = probeAnnotation({ value: 45, modalityUnit: 'HU' });
    const off = map(Probe, detail, customizationServiceWith()).getReport();
    const on = map(Probe, detail, customizationServiceWith({ valueLabel: 'Pixel' })).getReport();
    expect(on).toEqual(off);
  });

  it('negative control: a Length measurement is the same with the label on', () => {
    const off = map(Length, lengthAnnotation(), customizationServiceWith());
    const on = map(Length, lengthAnnotation(), customizationServiceWith({ valueLabel: 'RGB' }));
    expect(on.displayText).toEqual(off.displayText);
    expect(on.displayText.primary.join(' ')).not.toContain('RGB');
  });
});
