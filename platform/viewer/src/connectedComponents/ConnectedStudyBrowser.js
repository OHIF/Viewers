import OHIF from '@ohif/core';
import { connect } from 'react-redux';
import findDisplaySetByUID from './findDisplaySetByUID';
import { servicesManager } from './../App.js';
import { StudyBrowser } from '../../../ui/src/components/studyBrowser/StudyBrowser';

const { setActiveViewportSpecificData } = OHIF.redux.actions;

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onThumbnailClick: displaySetInstanceUID => {
      let displaySet = findDisplaySetByUID(
        ownProps.studyMetadata,
        displaySetInstanceUID
      );

      const { LoggerService, UINotificationService } = servicesManager.services;

      if (displaySet.isDerived) {
        const { Modality } = displaySet;
        if (Modality === 'SEG' && servicesManager) {
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
            ownProps.studyMetadata,
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
        } else if (Modality !== 'SR') {
          displaySet = displaySet.getSourceDisplaySet(ownProps.studyMetadata);
        }

        if (!displaySet) {
          const error = new Error(
            `Referenced series for ${Modality} dataset not present.`
          );
          const message = `Referenced series for ${Modality} dataset not present.`;
          LoggerService.error({ error, message });
          UINotificationService.show({
            autoClose: false,
            title: 'Fail to load series',
            message,
            type: 'error',
          });
        }
      }

      if (!displaySet) {
        const error = new Error('Source data not present');
        const message = 'Source data not present';
        LoggerService.error({ error, message });
        UINotificationService.show({
          autoClose: false,
          title: 'Fail to load series',
          message,
          type: 'error',
        });
      }

      if (displaySet.isSOPClassUIDSupported === false) {
        const error = new Error('Modality not supported');
        const message = 'Modality not supported';
        LoggerService.error({ error, message });
        UINotificationService.show({
          autoClose: false,
          title: 'Fail to load series',
          message,
          type: 'error',
        });
      }

      dispatch(setActiveViewportSpecificData(displaySet));
    },
  };
};

const ConnectedStudyBrowser = connect(
  null,
  mapDispatchToProps
)(StudyBrowser);

export default ConnectedStudyBrowser;
