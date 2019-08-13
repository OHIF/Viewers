import getModalities from './getModalities';

describe('getModalities', () => {
  test('should return an empty object when modality and modalitiesInStudy are not present', () => {
    const modality = null;
    const modalitiesInStudy = null;

    expect(getModalities(modality, modalitiesInStudy)).toEqual({});
  });

  test('should return an empty object when modality and modalitiesInStudy are not present', () => {
    const modality = null;
    const modalitiesInStudy = null;

    expect(getModalities(modality, modalitiesInStudy)).toEqual({});
  });

  test('should return modalities in Study when modality is not defined', () => {
    const modality = null;

    const modalitiesInStudy = {
      Value: ['MOCKED_VALUE'],
      vr: 'MOCKED_VALUE',
    };

    expect(getModalities(modality, modalitiesInStudy)).toEqual(
      modalitiesInStudy
    );
  });

  test('should return only the modalitues that exists in modalitiesInStudy', () => {
    const modality = {
      Value: ['DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    const modalitiesInStudy = {
      Value: ['DESIRED_VALUE', 'NOT_DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    expect(getModalities(modality, modalitiesInStudy)).toEqual(modality);
  });

  test('should return the seek modality when the desired modality does not exist in modalitiesInStudy', () => {
    const modality = {
      Value: ['DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    const modalitiesInStudy = {
      Value: ['NOT_DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    expect(getModalities(modality, modalitiesInStudy)).toEqual(modality);
  });

  test('should return the seek modality when the desired modality does not exist in modalitiesInStudy VR', () => {
    const modality = {
      Value: ['DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    const modalitiesInStudy = {
      Value: ['NOT_DESIRED_VALUE'],
      vr: 'ANOTHER_VR',
    };

    expect(getModalities(modality, modalitiesInStudy)).toEqual(
      modalitiesInStudy
    );
  });
});
