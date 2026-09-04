import OHIF from '@ohif/core';

import { registerStoredInstanceImageId } from './registerStoredInstanceImageId';

const metadataProvider = OHIF.classes.MetadataProvider;

const UIDS = {
  StudyInstanceUID: '1.2.3',
  SeriesInstanceUID: '1.2.3.4',
  SOPInstanceUID: '1.2.3.4.5',
};

describe('registerStoredInstanceImageId', () => {
  it('gives the instance the imageId the data source would load it with', () => {
    const instance = { ...UIDS };
    const dataSource = {
      getImageIdsForInstance: jest.fn(
        () => 'wadors:/studies/1.2.3/series/1.2.3.4/instances/1.2.3.4.5/frames/1'
      ),
    };

    const imageId = registerStoredInstanceImageId(instance, dataSource);

    expect(imageId).toBe('wadors:/studies/1.2.3/series/1.2.3.4/instances/1.2.3.4.5/frames/1');
    expect(instance.imageId).toBe(imageId);
    expect(dataSource.getImageIdsForInstance).toHaveBeenCalledWith({ instance });
    // Which is what lets the predecessor of a later save be resolved from it.
    expect(metadataProvider.getUIDsFromImageID(imageId)).toMatchObject(UIDS);
  });

  it('does not add the imageId as a stored attribute', () => {
    const instance = { ...UIDS };
    registerStoredInstanceImageId(instance, { getImageIdsForInstance: () => 'wadors:/an-image' });

    expect(Object.keys(instance)).not.toContain('imageId');
    expect(JSON.parse(JSON.stringify(instance)).imageId).toBeUndefined();
  });

  it('falls back to the locally registered instance', () => {
    // Instances with pixel data are registered with the wadouri file manager,
    // which puts that imageId on `url`.
    const instance = { ...UIDS, url: 'dicomfile:3' };

    expect(registerStoredInstanceImageId(instance, {})).toBe('dicomfile:3');
    expect(instance.imageId).toBe('dicomfile:3');
  });

  it('keeps an imageId the instance already has', () => {
    const instance = { ...UIDS, imageId: 'wadors:/already-known', url: 'dicomfile:4' };
    const dataSource = { getImageIdsForInstance: jest.fn() };

    expect(registerStoredInstanceImageId(instance, dataSource)).toBe('wadors:/already-known');
    expect(dataSource.getImageIdsForInstance).not.toHaveBeenCalled();
  });

  it('does nothing when there is no imageId to be had', () => {
    const instance = { ...UIDS };

    expect(registerStoredInstanceImageId(instance, undefined)).toBeUndefined();
    expect(instance.imageId).toBeUndefined();
  });

  it('survives a data source that cannot make an imageId for the instance', () => {
    const instance = { ...UIDS, url: 'dicomfile:5' };
    const dataSource = {
      getImageIdsForInstance: () => {
        throw new Error('not an image instance');
      },
    };

    expect(registerStoredInstanceImageId(instance, dataSource)).toBe('dicomfile:5');
  });
});
