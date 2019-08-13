import studyMetadataManager from '../../utils/studyMetadataManager';

export default function(imagePath, thumbnail = false) {
  const [
    studyInstanceUid,
    seriesInstanceUid,
    sopInstanceUid,
    frameIndex,
  ] = imagePath.split('_');
  const studyMetadata = studyMetadataManager.get(studyInstanceUid);
  const series = studyMetadata.getSeriesByUID(seriesInstanceUid);
  const instance = series.getInstanceByUID(sopInstanceUid);
  return instance.getImageId(frameIndex, thumbnail);
}
