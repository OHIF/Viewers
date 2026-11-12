import getDicomWebClient from './dicomWebClient';

/**
 * Loads and displays DICOM Microscopy Bulk Simple Annotations.
 *
 * This utility function:
 * 1. Retrieves series metadata from a DICOMweb server using study and series instance UIDs
 * 2. Converts metadata into MicroscopyBulkSimpleAnnotations objects
 * 3. Adds annotations to the viewer in groups (identified by AnnotationGroupUID)
 * 4. Applies a consistent yellow color ([255, 234, 0]) to all annotation groups
 * 5. Makes the annotation groups visible in the viewer
 *
 * @param {Object} params - The parameters object
 * @param {Object} params.microscopyService - Service for handling microscopy operations
 * @param {Object} params.displaySet - The display set containing metadata
 * @param {Object} params.extensionManager - Manager for extensions
 * @param {Object} params.servicesManager - Manager for services
 * @returns {Promise} A promise that resolves with the loaded display set
 */
export default function loadAnnotation({
  microscopyService,
  displaySet,
  extensionManager,
  servicesManager,
}) {
  const { uiNotificationService } = servicesManager.services;
  return new Promise(async (resolve, reject) => {
    try {
      displaySet.isLoading = true;
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
        .then(async retrievedMetadata => {
          const annotations = retrievedMetadata.map(
            metadata =>
              new dicomMicroscopyModule.metadata.MicroscopyBulkSimpleAnnotations({ metadata })
          );

          uiNotificationService.show({
            message: 'Loading annotations...',
            type: 'info',
          });

          await Promise.all(
            annotations.map(async ann => {
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
                });
              } catch (error) {
                console.error('failed to add annotation groups:', error);
                uiNotificationService.show({
                  title: 'Error loading annotations',
                  message: error.message,
                  type: 'error',
                });
              }
            })
          );

          displaySet.isLoaded = true;
          displaySet.isLoading = false;
          resolve(displaySet);
        });
    } catch (error) {
      console.error('Error loading annotation:', error);
      reject(error);
    }
  });
}
