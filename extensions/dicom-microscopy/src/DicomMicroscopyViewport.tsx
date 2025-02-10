import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cleanDenaturalizedDataset } from '@ohif/extension-default';

import './DicomMicroscopyViewport.css';
import ViewportOverlay from './components/ViewportOverlay';
import getDicomWebClient from './utils/dicomWebClient';
import dcmjs from 'dcmjs';
import { useAppConfig } from '@state';

function DicomMicroscopyViewport({
  activeViewportId,
  setViewportActive,
  displaySets,
  viewportId,
  dataSource,
  servicesManager,
  extensionManager,
  resizeRef,
}: {
  activeViewportId: string;
  setViewportActive: Function;
  displaySets: any[];
  viewportId: string;
  dataSource: any;
  servicesManager: any;
  extensionManager: any;
  resizeRef: any;
}) {
  const [appConfig] = useAppConfig();
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [managedViewer, setManagedViewer] = useState(null);
  const overlayElement = useRef();
  const container = useRef();
  const { microscopyService, customizationService } = servicesManager.services;

  // install the microscopy renderer into the web page.
  // you should only do this once.
  const installOpenLayersRenderer = useCallback(
    async (container, displaySet) => {
      const loadViewer = async metadata => {
        const dicomMicroscopyModule = await microscopyService.importDicomMicroscopyViewer();
        const { viewer: DicomMicroscopyViewer, metadata: metadataUtils } = dicomMicroscopyModule;

        const microscopyViewer = DicomMicroscopyViewer.VolumeImageViewer;

        const client = getDicomWebClient({
          extensionManager: extensionManager,
          servicesManager: servicesManager,
        });

        // Parse, format, and filter metadata
        const volumeImages: any[] = [];

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
      if (displaySet.Modality === 'SR') {
        // for SR displaySet, let's load the actual image displaySet
        smDisplaySet = displaySet.getSourceDisplaySet();
      }
      console.log('Loading viewer metadata', smDisplaySet);

      await loadViewer(smDisplaySet.others);

      if (displaySet.Modality === 'SR') {
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

    // loading SR
    if (displaySet.Modality === 'SR') {
      const referencedDisplaySet = displaySet.getSourceDisplaySet();
      displaySet.load(referencedDisplaySet);
    }
  }, [managedViewer, displaySets, microscopyService]);

  function setViewportActiveHandler() {
    if (viewportId !== activeViewportId) {
      setViewportActive(viewportId);
    }
  }

  const style = { width: '100%', height: '100%' };
  const displaySet = displaySets[0];
  const firstInstance = displaySet.firstInstance || displaySet.instance;
  const LoadingIndicatorProgress = customizationService.getCustomization(
    'ui.loadingIndicatorProgress'
  );

  return (
    <div className={'DicomMicroscopyViewer'} style={style} onClick={setViewportActiveHandler}>
      <div style={{ ...style, display: 'none' }}>
        <div style={{ ...style }} ref={overlayElement}>
          <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            {displaySet && firstInstance.imageId && (
              <ViewportOverlay
                config={appConfig}
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
