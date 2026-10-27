import getSopClassHandlerModule from './getSopClassHandlerModule';

const [pdfHandler] = getSopClassHandlerModule();
const pdf = SOPInstanceUID => ({
  SOPInstanceUID,
  SOPClassUID: '1.2.840.10008.5.1.4.1.1.104.1',
  Modality: 'DOC',
  SeriesInstanceUID: '1.2.3',
  StudyInstanceUID: '1.2',
});

describe('dicom-pdf extendDisplaySet', () => {
  // A split rule groups a revision chain into one display set, with the
  // active revision named by `activeSopInstanceUid`.
  it.each([
    ['the instance that activeSopInstanceUid names', 'pdf-2', 'pdf-2'],
    ['the last instance without activeSopInstanceUid', undefined, 'pdf-3'],
  ])('loads %s', (_label, activeSopInstanceUid, expected) => {
    const displaySet = {
      instances: [pdf('pdf-1'), pdf('pdf-2'), pdf('pdf-3')],
      activeSopInstanceUid,
    };
    pdfHandler.extendDisplaySet(displaySet, {});
    expect(displaySet.instance.SOPInstanceUID).toBe(expected);
    expect(displaySet.SOPInstanceUID).toBe(expected);
  });
});
