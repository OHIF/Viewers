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

  describe('the overlay plane module', () => {
    it('reads an overlay that dcmjs named by keyword', () => {
      // What dcmjs >= 0.50 makes of group 6000 in DICOMweb metadata.
      const instance = {
        OverlayRows: 512,
        OverlayColumns: 256,
        OverlayType: 'G',
        OverlayOrigin: [1, 1],
        OverlayBitsAllocated: 1,
        OverlayBitPosition: 0,
        OverlayData: { BulkDataURI: 'http://localhost/bulk/overlay-6000' },
      };

      const { overlays } = metadataProvider.getTagFromInstance('overlayPlaneModule', instance);

      expect(overlays).toHaveLength(1);
      expect(overlays[0]).toMatchObject({
        rows: 512,
        columns: 256,
        type: 'G',
        x: 1,
        y: 1,
        pixelData: { BulkDataURI: 'http://localhost/bulk/overlay-6000' },
      });
    });

    it('reads overlays that dcmjs kept under their tag', () => {
      // dcmjs < 0.50 keeps the hex tag as the key.
      const instance = {
        '60000010': 512,
        '60000011': 256,
        '60000040': 'G',
        '60000050': [1, 1],
        '60003000': { BulkDataURI: 'http://localhost/bulk/overlay-6000' },
        '60020010': 64,
        '60020011': 32,
        '60020040': 'R',
        '60020050': [5, 7],
        '60023000': { BulkDataURI: 'http://localhost/bulk/overlay-6002' },
      };

      const { overlays } = metadataProvider.getTagFromInstance('overlayPlaneModule', instance);

      expect(overlays).toMatchObject([
        { rows: 512, columns: 256, type: 'G', x: 1, y: 1 },
        { rows: 64, columns: 32, type: 'R', x: 5, y: 7 },
      ]);
    });
  });
});
