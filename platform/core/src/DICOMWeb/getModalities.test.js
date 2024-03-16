import getModalities from './getModalities';

describe('getModalities', () => {
  test('should return an empty object when Modality and ModalitiesInStudy are not present', () => {
    const Modality = null;
    const ModalitiesInStudy = null;

    expect(getModalities(Modality, ModalitiesInStudy)).toEqual({});
  });

  test('should return an empty object when Modality and ModalitiesInStudy are not present', () => {
    const Modality = null;
    const ModalitiesInStudy = null;

    expect(getModalities(Modality, ModalitiesInStudy)).toEqual({});
  });

  test('should return modalities in Study when Modality is not defined', () => {
    const Modality = null;

    const ModalitiesInStudy = {
      Value: ['MOCKED_VALUE'],
      vr: 'MOCKED_VALUE',
    };

    expect(getModalities(Modality, ModalitiesInStudy)).toEqual(ModalitiesInStudy);
  });

  test('should return only the modalitues that exists in ModalitiesInStudy', () => {
    const Modality = {
      Value: ['DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    const ModalitiesInStudy = {
      Value: ['DESIRED_VALUE', 'NOT_DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    expect(getModalities(Modality, ModalitiesInStudy)).toEqual(Modality);
  });

  test('should return the seek Modality when the desired Modality does not exist in ModalitiesInStudy', () => {
    const Modality = {
      Value: ['DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    const ModalitiesInStudy = {
      Value: ['NOT_DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    expect(getModalities(Modality, ModalitiesInStudy)).toEqual(Modality);
  });

  test('should return the seek Modality when the desired Modality does not exist in ModalitiesInStudy VR', () => {
    const Modality = {
      Value: ['DESIRED_VALUE'],
      vr: 'DESIRED_VR',
    };

    const ModalitiesInStudy = {
      Value: ['NOT_DESIRED_VALUE'],
      vr: 'ANOTHER_VR',
    };

    expect(getModalities(Modality, ModalitiesInStudy)).toEqual(ModalitiesInStudy);
  });
});
