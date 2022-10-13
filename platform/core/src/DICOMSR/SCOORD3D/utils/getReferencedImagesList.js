import getSequenceAsArray from './getSequenceAsArray';
import { CodeNameCodeSequenceValues } from '../enums';

const getReferencedImagesList = ImagingMeasurementReportContentSequence => {
  const referencedImages = [];

  const ImageLibrary = ImagingMeasurementReportContentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
        CodeNameCodeSequenceValues.ImageLibrary ||
      item.ConceptNameCodeSequence.CodeValue ===
        CodeNameCodeSequenceValues.ImagingMeasurements
  );

  if (!ImageLibrary || !ImageLibrary.ContentSequence) {
    return referencedImages;
  }

  const ImageLibraryGroup = getSequenceAsArray(
    ImageLibrary.ContentSequence
  ).find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
        CodeNameCodeSequenceValues.ImageLibraryGroup ||
      item.ConceptNameCodeSequence.CodeValue ===
        CodeNameCodeSequenceValues.MeasurementGroup
  );

  if (!ImageLibraryGroup || !ImageLibraryGroup.ContentSequence) {
    return referencedImages;
  }

  getSequenceAsArray(ImageLibraryGroup.ContentSequence).forEach(item => {
    const { ReferencedSOPSequence } = item;
    if (ReferencedSOPSequence) {
      const {
        ReferencedSOPClassUID,
        ReferencedSOPInstanceUID,
      } = ReferencedSOPSequence;

      referencedImages.push({
        ReferencedSOPClassUID,
        ReferencedSOPInstanceUID,
      });
    }
  });

  return referencedImages;
};

export default getReferencedImagesList;
