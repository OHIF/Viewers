import getModalities from './getModalities';

describe('getModalities', () => {
  test('should return an empty object when Modality and modalitiesInStudy are not present', () => {
    const Modality = null;
    const modalitiesInStudy = null;

    expect(getModalities(Modality, modalitiesInStudy)).toEqual({});
  });

  test('should return an empty object when Modality and modalitiesInStudy are not present', () => {
    const Modality = null;
    const modalitiesInStudy = null;

    expect(getModalities(Modality, modalitiesInStudy)).toEqual({});
  });

  test('should return modalities in Study when Modality is not defined', () => {
    const Modality = null;

    const modalitiesInStudy = {
      Value: ['MOCKED_VALUE'],
      vr: 'MOCKED_VALUE',
    };

    expect(getModalities(Modality, modalitiesInStudy)).toEqual(
      modalitiesInStudy
    );
  });

  test('should return only the modalitues that exists in modalitiesInStudy', () => {
    const Modality = {
      Value: ['DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    const modalitiesInStudy = {
      Value: ['DESIRED_VALUE', 'NOT_DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    expect(getModalities(Modality, modalitiesInStudy)).toEqual(Modality);
  });

  test('should return the seek Modality when the desired Modality does not exist in modalitiesInStudy', () => {
    const Modality = {
      Value: ['DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    const modalitiesInStudy = {
      Value: ['NOT_DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    expect(getModalities(Modality, modalitiesInStudy)).toEqual(Modality);
  });

  test('should return the seek Modality when the desired Modality does not exist in modalitiesInStudy VR', () => {
    const Modality = {
      Value: ['DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    const modalitiesInStudy = {
      Value: ['NOT_DESIRED_VALUE'],
      vr: 'ANOTHER_VR',
    };

    expect(getModalities(Modality, modalitiesInStudy)).toEqual(
      modalitiesInStudy
    );
  });
});
