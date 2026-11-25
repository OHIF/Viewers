const mockGet = jest.fn();

// Minimal @ohif/core mock: the real utils.toNumber (used by coerceNumber) and a
// stubbed MetadataProvider.get.
jest.mock('@ohif/core', () => {
  const toNumber = (val: unknown) =>
    Array.isArray(val)
      ? val.map(v => (v !== undefined ? Number(v) : v))
      : val !== undefined
        ? Number(val)
        : val;
  const core = {
    classes: { MetadataProvider: { get: (...args: unknown[]) => mockGet(...args) } },
    utils: { toNumber },
  };
  return { __esModule: true, default: core, utils: core.utils };
});

import getPTImageIdInstanceMetadata from './getPTImageIdInstanceMetadata';

// A valid PT instance with the radiopharmaceutical sequence in dcmjs array form.
const baseInstance = () => ({
  Modality: 'PT',
  Units: 'CNTS',
  CorrectedImage: ['DECY', 'ATTN'],
  SeriesDate: '20130606',
  SeriesTime: '120000',
  AcquisitionDate: '20130606',
  AcquisitionTime: '120000',
  DecayCorrection: 'START',
  PatientWeight: 70,
  RadiopharmaceuticalInformationSequence: [
    {
      RadionuclideHalfLife: 6586.2,
      RadionuclideTotalDose: 370000000,
      RadiopharmaceuticalStartTime: '110000',
    },
  ],
});

afterEach(() => mockGet.mockReset());

describe('getPTImageIdInstanceMetadata', () => {
  it('throws when no metadata is available', () => {
    mockGet.mockReturnValue(undefined);
    expect(() => getPTImageIdInstanceMetadata('img:1')).toThrow('dicom metadata are required');
  });

  it('throws when required metadata is missing', () => {
    const inst = baseInstance();
    delete inst.Units;
    mockGet.mockReturnValue(inst);
    expect(() => getPTImageIdInstanceMetadata('img:1')).toThrow('required metadata are missing');
  });

  it('reads RadionuclideHalfLife/TotalDose from the array-shaped sequence (firstSequenceItem)', () => {
    mockGet.mockReturnValue(baseInstance());
    const result = getPTImageIdInstanceMetadata('img:1');
    expect(result.RadionuclideHalfLife).toBe(6586.2);
    expect(result.RadionuclideTotalDose).toBe(370000000);
  });

  it('still reads the sequence when flattened to a single object', () => {
    const inst = baseInstance();
    // some servers/paths deliver a flattened (non-array) sequence
    inst.RadiopharmaceuticalInformationSequence =
      inst.RadiopharmaceuticalInformationSequence[0];
    mockGet.mockReturnValue(inst);
    expect(getPTImageIdInstanceMetadata('img:1').RadionuclideHalfLife).toBe(6586.2);
  });

  it('populates PhilipsPETPrivateGroup when the private tags are numbers', () => {
    const inst = baseInstance();
    inst['70531000'] = 0.00038;
    inst['70531009'] = 1.881732;
    mockGet.mockReturnValue(inst);
    const result = getPTImageIdInstanceMetadata('img:1');
    expect(result.PhilipsPETPrivateGroup).toEqual({
      SUVScaleFactor: 0.00038,
      ActivityConcentrationScaleFactor: 1.881732,
    });
  });

  it('drops an unresolved bulkdata { BulkDataURI } private tag (coerceNumber backstop)', () => {
    const inst = baseInstance();
    inst['70531000'] = { BulkDataURI: 'http://x/bulk/70531000' };
    inst['70531009'] = { BulkDataURI: 'http://x/bulk/70531009' };
    mockGet.mockReturnValue(inst);
    // Neither tag coerces to a number, so the group is not attached at all -
    // an object can never reach calculate-suv.
    expect(getPTImageIdInstanceMetadata('img:1').PhilipsPETPrivateGroup).toBeUndefined();
  });

  it('coerces a numeric DS string private tag to a number', () => {
    const inst = baseInstance();
    inst['70531000'] = '0.00038';
    mockGet.mockReturnValue(inst);
    expect(getPTImageIdInstanceMetadata('img:1').PhilipsPETPrivateGroup.SUVScaleFactor).toBe(
      0.00038
    );
  });
});
