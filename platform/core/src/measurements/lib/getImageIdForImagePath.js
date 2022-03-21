import studyMetadataManager from '../../utils/studyMetadataManager';

export default function(imagePath, thumbnail = false) {
  const [
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    frameIndex,
  ] = imagePath.split('_');
  const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
  const series = studyMetadata.getSeriesByUID(SeriesInstanceUID);
  const instance = series.getInstanceByUID(SOPInstanceUID);
  return instance.getImageId(frameIndex, thumbnail);
}
