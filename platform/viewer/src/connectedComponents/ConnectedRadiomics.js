import { connect } from 'react-redux';
import Viewer from './Radiomics';
import OHIF from '@ohif/core';

const {
  setTimepoints,
  setMeasurements,
  setActiveViewportSpecificData,
} = OHIF.redux.actions;

const getActiveServer = servers => {
  const isActive = a => a.active === true;
  return servers.servers.find(isActive);
};

const mapStateToProps = state => {
  const { viewports, servers, oidc } = state;
  return {
    viewports: viewports.viewportSpecificData,
    activeViewportIndex: viewports.activeViewportIndex,
    activeServer: getActiveServer(servers),
    user: oidc.user,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onTimepointsUpdated: timepoints => {
      dispatch(setTimepoints(timepoints));
    },
    onMeasurementsUpdated: measurements => {
      dispatch(setMeasurements(measurements));
    },

    onThumbnailClick: (displaySetInstanceUID, studyMetadata) => {
      let displaySet = findDisplaySetByUID(
        studyMetadata,
        displaySetInstanceUID
      );

      if (displaySet.isDerived) {
        const { Modality } = displaySet;
        if (Modality === 'SEG' && servicesManager) {
          const {
            LoggerService,
            UINotificationService,
          } = servicesManager.services;
          const onDisplaySetLoadFailureHandler = error => {
            LoggerService.error({ error, message: error.message });
            UINotificationService.show({
              title: 'DICOM Segmentation Loader',
              message: error.message,
              type: 'error',
              autoClose: true,
            });
          };

          const {
            referencedDisplaySet,
            activatedLabelmapPromise,
          } = displaySet.getSourceDisplaySet(
            studyMetadata,
            true,
            onDisplaySetLoadFailureHandler
          );
          displaySet = referencedDisplaySet;

          activatedLabelmapPromise.then(activatedLabelmapIndex => {
            const selectionFired = new CustomEvent(
              'extensiondicomsegmentationsegselected',
              {
                detail: { activatedLabelmapIndex: activatedLabelmapIndex },
              }
            );
            document.dispatchEvent(selectionFired);
          });
        } else {
          displaySet = displaySet.getSourceDisplaySet(studyMetadata);
        }

        if (!displaySet) {
          throw new Error(
            `Referenced series for ${Modality} dataset not present.`
          );
        }

        if (!displaySet) {
          throw new Error('Source data not present');
        }
      }

      dispatch(setActiveViewportSpecificData(displaySet));
    },
  };
};

const ConnectedViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Viewer);

export default ConnectedViewer;
