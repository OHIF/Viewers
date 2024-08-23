import { getImageFlips } from './getImageFlips';

const orientationDirectionVectorMap = {
  L: [1, 0, 0], // Left
  R: [-1, 0, 0], // Right
  P: [0, 1, 0], // Posterior/ Back
  A: [0, -1, 0], // Anterior/ Front
  H: [0, 0, 1], // Head/ Superior
  F: [0, 0, -1], // Feet/ Inferior
};

const getDirectionsFromPatientOrientation = patientOrientation => {
  if (typeof patientOrientation === 'string') {
    patientOrientation = patientOrientation.split('\\');
  }

  return {
    rowDirection: patientOrientation[0],
    columnDirection: patientOrientation[1][0],
  };
};

const getOrientationStringLPS = vector => {
  const sampleVectorDirectionMap = {
    '1,0,0': 'L',
    '-1,0,0': 'R',
    '0,1,0': 'P',
    '0,-1,0': 'A',
    '0,0,1': 'H',
    '0,0,-1': 'F',
  };

  return sampleVectorDirectionMap[vector.toString()];
};

jest.mock('@cornerstonejs/tools ', () => ({
  utilities: { orientation: { getOrientationStringLPS } },
}));
jest.mock('@ohif/core', () => ({
  defaults: { orientationDirectionVectorMap },
  utils: { getDirectionsFromPatientOrientation },
}));

describe('getImageFlips', () => {
  test('should return empty object if none of the parameters are provided', () => {
    const flipsNeeded = getImageFlips({});
    expect(flipsNeeded).toEqual({});
  });

  test('should return empty object if ImageOrientationPatient and PatientOrientation is not provided', () => {
    const ImageLaterality = 'L';
    const flipsNeeded = getImageFlips({
      ImageLaterality,
    });
    expect(flipsNeeded).toEqual({});
  });

  test('should return empty object if ImageLaterality is not privided', () => {
    const ImageOrientationPatient = [0, 1, 0, 0, 0, 1],
      PatientOrientation = ['P', 'H'];
    const flipsNeeded = getImageFlips({
      ImageOrientationPatient,
      PatientOrientation,
    });
    expect(flipsNeeded).toEqual({});
  });

  test('should return { hFlip: false, vFlip: false } if ImageOrientationPatient is [0, 1, 0, 0, 0, -1] and ImageLaterality is R', () => {
    const ImageOrientationPatient = [0, 1, 0, 0, 0, -1],
      PatientOrientation = ['P', 'F'],
      ImageLaterality = 'R';
    const flipsNeeded = getImageFlips({
      ImageOrientationPatient,
      PatientOrientation,
      ImageLaterality,
    });
    expect(flipsNeeded).toEqual({ hFlip: false, vFlip: false });
  });

  test('should return { hFlip: false, vFlip: true } if ImageOrientationPatient is [0, -1, 0, 0, 0, 1] and ImageLaterality is L', () => {
    const ImageOrientationPatient = [0, -1, 0, 0, 0, 1],
      ImageLaterality = 'L';
    const flipsNeeded = getImageFlips({
      ImageOrientationPatient,
      ImageLaterality,
    });
    expect(flipsNeeded).toEqual({ hFlip: false, vFlip: true });
  });

  test('should return { hFlip: true, vFlip: true } if ImageOrientationPatient is [0, -1, 0, -1, 0, 0] and ImageLaterality is R', () => {
    const ImageOrientationPatient = [0, -1, 0, -1, 0, 0],
      ImageLaterality = 'R';
    const flipsNeeded = getImageFlips({
      ImageOrientationPatient,
      ImageLaterality,
    });
    expect(flipsNeeded).toEqual({ hFlip: true, vFlip: true });
  });

  test("should return { hFlip: true, vFlip: true } if ImageOrientationPatient is not present, PatientOrientation is ['P', 'H'] and ImageLaterality is L", () => {
    const PatientOrientation = ['P', 'H'],
      ImageLaterality = 'L';
    const flipsNeeded = getImageFlips({
      PatientOrientation,
      ImageLaterality,
    });
    expect(flipsNeeded).toEqual({ hFlip: true, vFlip: true });
  });

  test("should return { hFlip: true, vFlip: false } if ImageOrientationPatient is not present, PatientOrientation is ['A', 'F'] and ImageLaterality is R", () => {
    const PatientOrientation = ['A', 'F'],
      ImageLaterality = 'R';
    const flipsNeeded = getImageFlips({
      PatientOrientation,
      ImageLaterality,
    });
    expect(flipsNeeded).toEqual({ hFlip: true, vFlip: false });
  });

  test("should return { hFlip: true, vFlip: false } if ImageOrientationPatient is not present, PatientOrientation is ['A', 'FL'] and ImageLaterality is R", () => {
    const PatientOrientation = ['A', 'FL'],
      ImageLaterality = 'R';
    const flipsNeeded = getImageFlips({
      PatientOrientation,
      ImageLaterality,
    });
    expect(flipsNeeded).toEqual({ hFlip: true, vFlip: false });
  });

  test("should return { hFlip: true, vFlip: false } if ImageOrientationPatient ans ImageLaterality is not present, PatientOrientation is ['P', 'FL'] and FrameLaterality is L", () => {
    const PatientOrientation = ['P', 'FL'],
      FrameLaterality = 'L';
    const flipsNeeded = getImageFlips({
      PatientOrientation,
      FrameLaterality,
    });
    expect(flipsNeeded).toEqual({ hFlip: true, vFlip: false });
  });

  test("should return empty object if ImageOrientationPatient is not present, PatientOrientation is ['H', 'R'] and ImageLaterality is R since the orientation is rotated, not flipped", () => {
    const PatientOrientation = ['H', 'R'],
      ImageLaterality = 'R';
    const flipsNeeded = getImageFlips({
      PatientOrientation,
      ImageLaterality,
    });
    expect(flipsNeeded).toEqual({});
  });

  test("should return empty object if ImageOrientationPatient is not present, PatientOrientation is ['F', 'L'] and ImageLaterality is L since the orientation is rotated, not flipped", () => {
    const PatientOrientation = ['F', 'L'],
      ImageLaterality = 'L';
    const flipsNeeded = getImageFlips({
      PatientOrientation,
      ImageLaterality,
    });
    expect(flipsNeeded).toEqual({});
  });
});
