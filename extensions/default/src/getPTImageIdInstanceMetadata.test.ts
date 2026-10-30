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

import dcmjs from '@dcmjs-org/dcmjs';
import { calculateSUVScalingFactors } from '@cornerstonejs/calculate-suv';
import getPTImageIdInstanceMetadata from './getPTImageIdInstanceMetadata';
import combineFrameInstance from '../../../platform/core/src/utils/combineFrameInstance';

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
    inst.RadiopharmaceuticalInformationSequence = inst.RadiopharmaceuticalInformationSequence[0];
    mockGet.mockReturnValue(inst);
    expect(getPTImageIdInstanceMetadata('img:1').RadionuclideHalfLife).toBe(6586.2);
  });

  it('populates PhilipsPETPrivateGroup when the private tags are numbers', () => {
    const inst = baseInstance();
    inst['70530010'] = 'Philips PET Private Group';
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
    inst['70530010'] = 'Philips PET Private Group';
    inst['70531000'] = { BulkDataURI: 'http://x/bulk/70531000' };
    inst['70531009'] = { BulkDataURI: 'http://x/bulk/70531009' };
    mockGet.mockReturnValue(inst);
    // Neither tag coerces to a number, so the group is not attached at all -
    // an object can never reach calculate-suv.
    expect(getPTImageIdInstanceMetadata('img:1').PhilipsPETPrivateGroup).toBeUndefined();
  });

  it('reads the Philips scale factors from a dcmjs 1.0 naturalized dataset', () => {
    // dcmjs 1.0 gives a private element as a list, also for one value.
    const naturalized = dcmjs.data.DicomMetaDictionary.naturalizeDataset({
      '70530010': { vr: 'LO', Value: ['Philips PET Private Group'] },
      '70531000': { vr: 'DS', Value: [0.00038] },
      '70531009': { vr: 'DS', Value: [1.881732] },
    });
    mockGet.mockReturnValue(Object.assign(naturalized, baseInstance()));
    expect(getPTImageIdInstanceMetadata('img:1').PhilipsPETPrivateGroup).toEqual({
      SUVScaleFactor: 0.00038,
      ActivityConcentrationScaleFactor: 1.881732,
    });
  });

  it('reads the Philips scale factors of a multi-frame PT through combineFrameInstance', () => {
    const naturalized = dcmjs.data.DicomMetaDictionary.naturalizeDataset({
      '70530010': { vr: 'LO', Value: ['Philips PET Private Group'] },
      '70531000': { vr: 'DS', Value: [0.00038] },
      '70531009': { vr: 'DS', Value: [1.881732] },
    });
    const multiFrame = Object.assign(naturalized, baseInstance(), {
      NumberOfFrames: 2,
      SharedFunctionalGroupsSequence: [{}],
      PerFrameFunctionalGroupsSequence: [{}, {}],
    });
    mockGet.mockReturnValue(combineFrameInstance(2, multiFrame));
    expect(getPTImageIdInstanceMetadata('img:1').PhilipsPETPrivateGroup).toEqual({
      SUVScaleFactor: 0.00038,
      ActivityConcentrationScaleFactor: 1.881732,
    });
  });

  it('gives SUV factors when CorrectedImage is one backslash-joined value', () => {
    // A static DICOMweb source writes the CorrectedImage values as one string.
    const naturalized = dcmjs.data.DicomMetaDictionary.naturalizeDataset({
      '00280051': { vr: 'CS', Value: ['DECY\\ATTN\\SCAT'] },
    });
    const inst = { ...baseInstance(), Units: 'BQML' };
    delete inst.CorrectedImage;
    mockGet.mockReturnValue(Object.assign(naturalized, inst));
    const result = getPTImageIdInstanceMetadata('img:1');
    expect(result.CorrectedImage).toEqual(['DECY', 'ATTN', 'SCAT']);
    expect(calculateSUVScalingFactors([result])[0].suvbw).toBeGreaterThan(0);
  });

  it('uses the GE post-injection date time of a dcmjs 1.0 naturalized dataset for decay', () => {
    // The series time is after the acquisition time, so calculate-suv takes the
    // scan time from (0009,100D) when it is present.
    const inst = { ...baseInstance(), Units: 'BQML', SeriesTime: '130000' };
    const naturalized = dcmjs.data.DicomMetaDictionary.naturalizeDataset({
      '00090010': { vr: 'LO', Value: ['GEMS_PETD_01'] },
      '0009100D': { vr: 'DT', Value: ['20130606113000.00'] },
    });
    mockGet.mockReturnValue(Object.assign(naturalized, inst));
    const result = getPTImageIdInstanceMetadata('img:1');
    expect(result.GEPrivatePostInjectionDateTime).toBe('20130606113000.00');

    // Scan time 11:30 in place of the acquisition time 12:00: 1800 s less decay.
    const withGE = calculateSUVScalingFactors([result])[0].suvbw;
    mockGet.mockReturnValue(inst);
    const withoutGE = calculateSUVScalingFactors([getPTImageIdInstanceMetadata('img:1')])[0].suvbw;
    expect(withGE / withoutGE).toBeCloseTo(Math.pow(2, -1800 / 6586.2), 10);
  });

  it('coerces a numeric DS string private tag to a number', () => {
    const inst = baseInstance();
    inst['70530010'] = ['Philips PET Private Group'];
    inst['70531000'] = '0.00038';
    mockGet.mockReturnValue(inst);
    expect(getPTImageIdInstanceMetadata('img:1').PhilipsPETPrivateGroup.SUVScaleFactor).toBe(
      0.00038
    );
  });
});
