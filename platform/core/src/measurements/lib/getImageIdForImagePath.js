import studyMetadataManager from '../../utils/studyMetadataManager';

export default function (imagePath, thumbnail = false) {
  const [
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    imageIndex,
  ] = imagePath.split('_');
  const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
  const series = studyMetadata.getSeriesByUID(SeriesInstanceUID);
  const instance = series.getInstanceByUID(SOPInstanceUID);
  return instance.getImageId(imageIndex, thumbnail);
}
