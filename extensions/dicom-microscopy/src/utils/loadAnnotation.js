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

      const dicomMicroscopyModule = await microscopyService.importDicomMicroscopyViewer();

      const client = getDicomWebClient({
        extensionManager,
        servicesManager,
      });

      const viewportId = servicesManager.services.viewportGridService.getActiveViewportId();
      const managedViewers = microscopyService.getManagedViewersForViewport(viewportId);
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

          annotations.forEach(async ann => {
            try {
              await managedViewer.viewer.addAnnotationGroups(ann);

              ann.AnnotationGroupSequence.forEach(item => {
                const annotationGroupUID = item.AnnotationGroupUID;
                managedViewer.viewer.setAnnotationGroupStyle(annotationGroupUID, {
                  color: [255, 234, 0],
                });
              });

              ann.AnnotationGroupSequence.forEach(item => {
                const annotationGroupUID = item.AnnotationGroupUID;
                managedViewer.viewer.showAnnotationGroup(annotationGroupUID);
                window.showit = () => {
                  managedViewer.viewer.showAnnotationGroup(annotationGroupUID);
                };
                window.hideit = () => {
                  managedViewer.viewer.showAnnotationGroup(annotationGroupUID);
                };
              });
            } catch (error) {
              console.error('failed to add annotation groups:', error);
            }
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
