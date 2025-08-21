import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cleanDenaturalizedDataset } from '@ohif/extension-default';

import './DicomMicroscopyViewport.css';
import ViewportOverlay from './components/ViewportOverlay';
import getDicomWebClient from './utils/dicomWebClient';
import dcmjs from 'dcmjs';
import { useSystem } from '@ohif/core';

function DicomMicroscopyViewport({
  activeViewportId,
  setViewportActive,
  displaySets,
  viewportId,
  dataSource,
  resizeRef,
}: {
  activeViewportId: string;
  setViewportActive: Function;
  displaySets: any[];
  viewportId: string;
  dataSource: any;
  resizeRef: any;
}) {
  const { servicesManager, extensionManager } = useSystem();
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [managedViewer, setManagedViewer] = useState(null);
  const overlayElement = useRef();
  const container = useRef();
  const { microscopyService, customizationService } = servicesManager.services;

  const overlayData = customizationService.getCustomization('microscopyViewport.overlay');

  // install the microscopy renderer into the web page.
  // you should only do this once.
  const installOpenLayersRenderer = useCallback(
    async (container, displaySet) => {
      const loadViewer = async metadata => {
        const dicomMicroscopyModule = await microscopyService.importDicomMicroscopyViewer();
        const { viewer: DicomMicroscopyViewer, metadata: metadataUtils } = dicomMicroscopyModule;

        const microscopyViewer = DicomMicroscopyViewer.VolumeImageViewer;

        const client = getDicomWebClient({
          extensionManager,
          servicesManager,
        });

        // Parse, format, and filter metadata
        const volumeImages: any[] = [];

        /**
         * This block of code is the original way of loading DICOM into dicom-microscopy-viewer
         * as in their documentation.
         * But we have the metadata already loaded by our loaders.
         * As the metadata for microscopy DIOM files tends to be big and we don't
         * want to double load it, below we have the mechanism to reconstruct the
         * DICOM JSON structure (denaturalized) from naturalized metadata.
         * (NOTE: Our loaders cache only naturalized metadata, not the denaturalized.)
         */
        // {
        //   const retrieveOptions = {
        //     studyInstanceUID: metadata[0].StudyInstanceUID,
        //     seriesInstanceUID: metadata[0].SeriesInstanceUID,
        //   };
        //   metadata = await client.retrieveSeriesMetadata(retrieveOptions);
        //   // Parse, format, and filter metadata
        //   metadata.forEach(m => {
        //     if (
        //       volumeImages.length > 0 &&
        //       m['00200052'].Value[0] != volumeImages[0].FrameOfReferenceUID
        //     ) {
        //       console.warn(
        //         'Expected FrameOfReferenceUID of difference instances within a series to be the same, found multiple different values',
        //         m['00200052'].Value[0]
        //       );
        //       m['00200052'].Value[0] = volumeImages[0].FrameOfReferenceUID;
        //     }
        //     NOTE: depending on different data source, image.ImageType sometimes
        //     is a string, not a string array.
        //     m['00080008'] = transformImageTypeUnnaturalized(m['00080008']);

        //     const image = new metadataUtils.VLWholeSlideMicroscopyImage({
        //       metadata: m,
        //     });
        //     const imageFlavor = image.ImageType[2];
        //     if (imageFlavor === 'VOLUME' || imageFlavor === 'THUMBNAIL') {
        //       volumeImages.push(image);
        //     }
        //   });
        // }

        metadata.forEach(m => {
          // NOTE: depending on different data source, image.ImageType sometimes
          //    is a string, not a string array.
          m.ImageType = typeof m.ImageType === 'string' ? m.ImageType.split('\\') : m.ImageType;

          const inst = cleanDenaturalizedDataset(
            dcmjs.data.DicomMetaDictionary.denaturalizeDataset(m),
            {
              StudyInstanceUID: m.StudyInstanceUID,
              SeriesInstanceUID: m.SeriesInstanceUID,
              dataSourceConfig: dataSource.getConfig(),
            }
          );
          if (!inst['00480105']) {
            // Optical Path Sequence, no OpticalPathIdentifier?
            // NOTE: this is actually a not-well formatted DICOM VL Whole Slide Microscopy Image.
            inst['00480105'] = {
              vr: 'SQ',
              Value: [
                {
                  '00480106': {
                    vr: 'SH',
                    Value: ['1'],
                  },
                },
              ],
            };
          }
          const image = new metadataUtils.VLWholeSlideMicroscopyImage({
            metadata: inst,
          });

          const imageFlavor = image.ImageType[2];
          if (imageFlavor === 'VOLUME' || imageFlavor === 'THUMBNAIL') {
            volumeImages.push(image);
          }
        });

        // format metadata for microscopy-viewer
        const options = {
          client,
          metadata: volumeImages,
          retrieveRendered: false,
          controls: ['overview', 'position'],
        };

        const viewer = new microscopyViewer(options);

        if (overlayElement && overlayElement.current && viewer.addViewportOverlay) {
          viewer.addViewportOverlay({
            element: overlayElement.current,
            coordinates: [0, 0], // TODO: dicom-microscopy-viewer documentation says this can be false to be automatically, but it is not.
            navigate: true,
            className: 'OpenLayersOverlay',
          });
        }

        viewer.render({ container });

        const { StudyInstanceUID, SeriesInstanceUID } = displaySet;

        const managedViewer = microscopyService.addViewer(
          viewer,
          viewportId,
          container,
          StudyInstanceUID,
          SeriesInstanceUID
        );

        managedViewer.addContextMenuCallback((event: Event) => {
          // TODO: refactor this after Bill's changes on ContextMenu feature get merged
          // const roiAnnotationNearBy = this.getNearbyROI(event);
        });

        setViewer(viewer);
        setManagedViewer(managedViewer);
      };

      microscopyService.clearAnnotations();

      let smDisplaySet = displaySet;
      if (displaySet.isOverlayDisplaySet) {
        // for SR displaySet, let's load the actual image displaySet
        smDisplaySet = displaySet.getSourceDisplaySet();
      }
      console.log('Loading viewer metadata', smDisplaySet);

      await loadViewer(smDisplaySet.others);

      if (displaySet.isOverlayDisplaySet && !displaySet.isLoaded && !displaySet.isLoading) {
        displaySet.load(smDisplaySet);
      }
    },
    [dataSource, extensionManager, microscopyService, servicesManager, viewportId]
  );

  useEffect(() => {
    const displaySet = displaySets[0];
    installOpenLayersRenderer(container.current, displaySet).then(() => {
      setIsLoaded(true);
    });

    return () => {
      if (viewer) {
        microscopyService.removeViewer(viewer);
      }
    };
  }, []);

  useEffect(() => {
    const displaySet = displaySets[0];

    microscopyService.clearAnnotations();

    // loading SR - only if not already loaded and not currently loading
    if (displaySet.isOverlayDisplaySet && !displaySet.isLoaded && !displaySet.isLoading) {
      const referencedDisplaySet = displaySet.getSourceDisplaySet();
      displaySet.load(referencedDisplaySet);
    }
  }, [managedViewer, displaySets, microscopyService]);

  const style = { width: '100%', height: '100%' };
  const displaySet = displaySets[0];
  const firstInstance = displaySet.firstInstance || displaySet.instance;
  const LoadingIndicatorProgress = customizationService.getCustomization(
    'ui.loadingIndicatorProgress'
  );

  return (
    <div
      className={'DicomMicroscopyViewer'}
      style={style}
      onClick={() => {
        if (viewportId !== activeViewportId) {
          setViewportActive(viewportId);
        }
      }}
    >
      <div style={{ ...style, display: 'none' }}>
        <div style={{ ...style }} ref={overlayElement}>
          <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            {displaySet && firstInstance.imageId && (
              <ViewportOverlay
                overlayData={overlayData}
                displaySet={displaySet}
                instance={displaySet.instance}
                metadata={displaySet.metadata}
              />
            )}
          </div>
        </div>
      </div>
      <div
        style={style}
        ref={(ref: any) => {
          container.current = ref;
          resizeRef.current = ref;
        }}
      />
      {isLoaded ? null : <LoadingIndicatorProgress className={'h-full w-full bg-black'} />}
    </div>
  );
}

export default DicomMicroscopyViewport;
