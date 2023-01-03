import { metaData, utilities } from '@cornerstonejs/core';

import OHIF from '@ohif/core';
import dcmjs from 'dcmjs';

import dicomRTSSExport from './utils/dicomRTSSExport';

const { log } = OHIF;

const commandsModule = ({
  servicesManager,
  commandsManager,
  extensionManager,
}) => {
  const actions = {
    exportRTSS: ({}) => {
      console.log('dicom-rtss exportRTSS');

      // Grab Segmentations
      const { SegmentationService } = servicesManager.services;
      const segmentations = SegmentationService.getSegmentations();

      // Convert to RTSS and prepare blob for download
      dicomRTSSExport(segmentations, true);
    },
    uploadRTSS: ({}) => {
      console.log('dicom-rtss uploadRTSS');

      // Grab Segmentations
      const { SegmentationService } = servicesManager.services;
      const segmentations = SegmentationService.getSegmentations();

      // Convert to RTSS and then upload
      dicomRTSSExport(segmentations, false).then(rtss => {
        const dataSources = extensionManager.getDataSources();
        const dataSource = dataSources[0];
        console.log('upload rtss');
        const { StudyInstanceUID } = rtss;

        let shouldReplace = false;

        //await dataSource.store.dicom(rtss);
        if (shouldReplace) {
          // NOTE: not implemented - replace if segmentations editted was
          // from existing RTSS

          //if (StudyInstanceUID) {
          //  dataSource.deleteStudyMetadataPromise(StudyInstanceUID);
          //}
        } else {
          dataSource.store.dicom(rtss); // need save confirmation
        }
      });
    },
  };

  const definitions = {
    exportRTSS: {
      commandFn: actions.exportRTSS,
      storeContexts: [],
      options: {},
    },
    uploadRTSS: {
      commandFn: actions.uploadRTSS,
      storeContexts: [],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'DICOM_RTSS',
  };
};

export default commandsModule;
