import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSystem } from '@ohif/core';
import PanelStudyBrowser from '@ohif/extension-default/src/Panels/StudyBrowser/PanelStudyBrowser';
import { UntrackSeriesModal } from './untrackSeriesModal';
import { useTrackedMeasurements } from '../../getContextModule';

const thumbnailNoImageModalities = ['SR', 'SEG', 'RTSTRUCT', 'RTPLAN', 'RTDOSE', 'PMAP'];

/**
 * Panel component for the Study Browser with tracking capabilities
 */
export default function PanelStudyBrowserTracking({
  getImageSrc,
  getStudiesForPatientByMRN,
  requestDisplaySetCreationForStudy,
  dataSource,
}) {
  const { servicesManager } = useSystem();
  const { displaySetService, uiModalService, measurementService, viewportGridService } =
    servicesManager.services;
  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();
  const { trackedSeries } = trackedMeasurements.context;

  const checkDirtyMeasurements = displaySetInstanceUID => {
    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
    if (displaySet.Modality === 'SR' || displaySet.Modality === 'ANN') {
      const activeViewportId = viewportGridService.getActiveViewportId();
      sendTrackedMeasurementsEvent('CHECK_DIRTY', {
        viewportId: activeViewportId,
        displaySetInstanceUID: displaySetInstanceUID,
      });
    }
  };

  useEffect(() => {
    const subscriptionOndropFired = viewportGridService.subscribe(
      viewportGridService.EVENTS.VIEWPORT_ONDROP_HANDLED,
      ({ eventData }) => {
        checkDirtyMeasurements(eventData.displaySetInstanceUID);
      }
    );

    return () => {
      subscriptionOndropFired.unsubscribe();
    };
  }, []);
  const onClickUntrack = displaySetInstanceUID => {
    const onConfirm = () => {
      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
      sendTrackedMeasurementsEvent('UNTRACK_SERIES', {
        SeriesInstanceUID: displaySet.SeriesInstanceUID,
      });
      const measurements = measurementService.getMeasurements();
      measurements.forEach(m => {
        if (m.referenceSeriesUID === displaySet.SeriesInstanceUID) {
          measurementService.remove(m.uid);
        }
      });
    };

    uiModalService.show({
      title: 'Untrack Series',
      content: UntrackSeriesModal,
      contentProps: {
        onConfirm,
        message: 'Are you sure you want to untrack this series?',
      },
    });
  };

  // Custom mapping function to add tracking data to display sets
  const mapDisplaySetsWithTracking = (
    displaySets,
    displaySetLoadingState,
    thumbnailImageSrcMap,
    viewports
  ) => {
    const thumbnailDisplaySets = [];
    const thumbnailNoImageDisplaySets = [];
    displaySets
      .filter(ds => !ds.excludeFromThumbnailBrowser)
      .forEach(ds => {
        const { thumbnailSrc, displaySetInstanceUID } = ds;
        const componentType = getComponentType(ds);

        const array =
          componentType === 'thumbnailTracked' ? thumbnailDisplaySets : thumbnailNoImageDisplaySets;

        const loadingProgress = displaySetLoadingState?.[displaySetInstanceUID];

        array.push({
          displaySetInstanceUID,
          description: ds.SeriesDescription || '',
          seriesNumber: ds.SeriesNumber,
          modality: ds.Modality,
          seriesDate: ds.SeriesDate ? new Date(ds.SeriesDate).toLocaleDateString() : '',
          numInstances: ds.numImageFrames,
          loadingProgress,
          countIcon: ds.countIcon,
          messages: ds.messages,
          StudyInstanceUID: ds.StudyInstanceUID,
          componentType,
          imageSrc: thumbnailSrc || thumbnailImageSrcMap[displaySetInstanceUID],
          dragData: {
            type: 'displayset',
            displaySetInstanceUID,
          },
          isTracked: trackedSeries.includes(ds.SeriesInstanceUID),
          isHydratedForDerivedDisplaySet: ds.isHydrated,
        });
      });

    return [...thumbnailDisplaySets, ...thumbnailNoImageDisplaySets];
  };

  // Override component type to use tracking specific components
  const getComponentType = ds => {
    if (
      thumbnailNoImageModalities.includes(ds.Modality) ||
      ds.unsupported ||
      ds.thumbnailSrc === null
    ) {
      return 'thumbnailNoImage';
    }
    return 'thumbnailTracked';
  };

  return (
    <PanelStudyBrowser
      getImageSrc={getImageSrc}
      getStudiesForPatientByMRN={getStudiesForPatientByMRN}
      requestDisplaySetCreationForStudy={requestDisplaySetCreationForStudy}
      dataSource={dataSource}
      customMapDisplaySets={mapDisplaySetsWithTracking}
      onClickUntrack={onClickUntrack}
      onDoubleClickThumbnailHandlerCallBack={checkDirtyMeasurements}
    />
  );
}

PanelStudyBrowserTracking.propTypes = {
  dataSource: PropTypes.shape({
    getImageIdsForDisplaySet: PropTypes.func.isRequired,
  }).isRequired,
  getImageSrc: PropTypes.func.isRequired,
  getStudiesForPatientByMRN: PropTypes.func.isRequired,
  requestDisplaySetCreationForStudy: PropTypes.func.isRequired,
};
