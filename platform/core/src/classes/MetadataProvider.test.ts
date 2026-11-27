import metadataProvider from './MetadataProvider';

beforeEach(() => {
  (
    metadataProvider as unknown as {
      imageURIToUIDs: Map<string, unknown>;
    }
  ).imageURIToUIDs.clear();
});

describe('MetadataProvider', () => {
  it('uses the WADO frame query parameter as the frame number', () => {
    expect(
      metadataProvider.getUIDsFromImageID(
        'dicomweb:http://localhost/wado?requestType=WADO&studyUID=study-wado&seriesUID=series-wado&objectUID=sop-wado&contentType=application/dicom&transferSyntax=*&frame=5'
      )
    ).toEqual({
      StudyInstanceUID: 'study-wado',
      SeriesInstanceUID: 'series-wado',
      SOPInstanceUID: 'sop-wado',
      frameNumber: '5',
    });
  });

  it('uses the frame query parameter for local multiframe imageIds registered by base URL', () => {
    const baseImageId = 'blob:http://localhost/local-multiframe';
    const uids = {
      StudyInstanceUID: 'study-local',
      SeriesInstanceUID: 'series-local',
      SOPInstanceUID: 'sop-local',
    };

    metadataProvider.addImageIdToUIDs(baseImageId, uids);

    expect(metadataProvider.getUIDsFromImageID(`${baseImageId}&frame=3`)).toEqual({
      ...uids,
      frameNumber: '3',
    });
  });

  it('prefers the frame query parameter over stored frame metadata', () => {
    const baseImageId = 'blob:http://localhost/local-multiframe-with-frame-number';
    const uids = {
      StudyInstanceUID: 'study-local-with-frame-number',
      SeriesInstanceUID: 'series-local-with-frame-number',
      SOPInstanceUID: 'sop-local-with-frame-number',
      frameNumber: '1',
    };

    metadataProvider.addImageIdToUIDs(baseImageId, uids);

    expect(metadataProvider.getUIDsFromImageID(`${baseImageId}&frame=4`)).toEqual({
      ...uids,
      frameNumber: '4',
    });
  });

  it('prefers an exact frame imageId mapping before falling back to the base URL', () => {
    const baseImageId = 'blob:http://localhost/local-multiframe-exact-frame';
    metadataProvider.addImageIdToUIDs(baseImageId, {
      StudyInstanceUID: 'study-base',
      SeriesInstanceUID: 'series-base',
      SOPInstanceUID: 'sop-base',
      frameNumber: '1',
    });

    const frameImageId = `${baseImageId}&frame=3`;
    metadataProvider.addImageIdToUIDs(frameImageId, {
      StudyInstanceUID: 'study-frame',
      SeriesInstanceUID: 'series-frame',
      SOPInstanceUID: 'sop-frame',
      frameNumber: '3',
    });

    expect(metadataProvider.getUIDsFromImageID(frameImageId)).toEqual({
      StudyInstanceUID: 'study-frame',
      SeriesInstanceUID: 'series-frame',
      SOPInstanceUID: 'sop-frame',
      frameNumber: '3',
    });
  });

  describe('the module a UID belongs to', () => {
    const instance = {
      SOPInstanceUID: 'sop-general-image',
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.88.33',
      InstanceNumber: '2',
    };

    it('gives the instance number, and no SOP Class UID, for the General Image module', () => {
      // SOPClassUID is not in the General Image module, so this provider must
      // not answer it here. A consumer that reads the pair of UIDs off this
      // module reads the wrong module.
      const generalImage = metadataProvider.getTagFromInstance('generalImageModule', instance);

      expect(generalImage).toMatchObject({
        sopInstanceUID: 'sop-general-image',
        instanceNumber: 2,
      });
      expect(generalImage.sopClassUID).toBeUndefined();
    });

    it('gives both UIDs for the SOP Common module', () => {
      expect(metadataProvider.getTagFromInstance('sopCommonModule', instance)).toEqual({
        sopClassUID: '1.2.840.10008.5.1.4.1.1.88.33',
        sopInstanceUID: 'sop-general-image',
      });
    });
  });

  describe('the Image Plane module of an instance with empty values', () => {
    // A topogram or scout often sends SliceThickness, SliceLocation and
    // SpacingBetweenSlices with no value. Cornerstone derives the z-spacing of a
    // single-image volume with `if (sliceThickness) return sliceThickness`, so an
    // empty array there blanked the viewport once the series became a volume.
    const instance = {
      SOPInstanceUID: 'sop-topogram',
      Rows: 512,
      Columns: 512,
      PixelSpacing: [2, 2],
      ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
      ImagePositionPatient: [0, 0, 0],
      SliceThickness: [],
      SliceLocation: [],
      SpacingBetweenSlices: [],
    };

    it('reports the empty single-valued attributes as absent', () => {
      const imagePlane = metadataProvider.getTagFromInstance('imagePlaneModule', instance);

      expect(imagePlane.sliceThickness).toBeUndefined();
      expect(imagePlane.sliceLocation).toBeUndefined();
      expect(imagePlane.spacingBetweenSlices).toBeUndefined();
    });

    it('still reads the attributes that carry a value', () => {
      const imagePlane = metadataProvider.getTagFromInstance('imagePlaneModule', {
        ...instance,
        SliceThickness: ['0.6'],
        SliceLocation: '-12.5',
        SpacingBetweenSlices: 0.6,
      });

      expect(imagePlane).toMatchObject({
        rows: 512,
        columns: 512,
        sliceThickness: 0.6,
        sliceLocation: -12.5,
        spacingBetweenSlices: 0.6,
      });
    });
  });
});
