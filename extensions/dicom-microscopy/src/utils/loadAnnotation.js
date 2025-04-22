import getDicomWebClient from './dicomWebClient';

export default function loadAnnotation({
  microscopyService,
  displaySet,
  extensionManager,
  servicesManager,
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const { metadata } = displaySet;
      console.debug('Loading annotation for display set:', displaySet.metadata);

      const dicomMicroscopyModule = await microscopyService.importDicomMicroscopyViewer();

      const client = getDicomWebClient({
        extensionManager,
        servicesManager,
      });

      const managedViewers = microscopyService.getManagedViewersForStudy(
        displaySet.StudyInstanceUID
      );
      const managedViewer = managedViewers[0];

      client
        .retrieveSeriesMetadata({
          studyInstanceUID: metadata.StudyInstanceUID,
          seriesInstanceUID: metadata.SeriesInstanceUID,
        })
        .then(retrievedMetadata => {
          const annotations = retrievedMetadata.map(metadata => {
            return new dicomMicroscopyModule.metadata.MicroscopyBulkSimpleAnnotations({
              metadata,
            });
          });

          annotations.forEach(ann => {
            try {
              managedViewer.viewer.addAnnotationGroups(ann);
            } catch (error) {
              console.error('failed to add annotation groups:', error);
            }

            // const _buildKey = concept => {
            //   const codingScheme = concept.CodingSchemeDesignator;
            //   const codeValue = concept.CodeValue;
            //   return `${codingScheme}-${codeValue}`;
            // };

            // ann.AnnotationGroupSequence.forEach(item => {
            //   const annotationGroupUID = item.AnnotationGroupUID;
            //   const finding = item.AnnotationPropertyTypeCodeSequence[0];
            //   const key = _buildKey(finding);
            //   const style = this.roiStyles[key];
            //   if (style != null && style.fill != null) {
            //     managedViewer.viewer.setAnnotationGroupStyle(annotationGroupUID, {
            //       color: style.fill.color,
            //     });
            //   }
            // });
          });

          displaySet.isLoaded = true;
          resolve(displaySet);
        });
    } catch (error) {
      console.error('Error loading annotation:', error);
      reject(error);
    }
  });
}
