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

      const { SegmentationService } = servicesManager.services;
      const segmentations = SegmentationService.getSegmentations();

      dicomRTSSExport(segmentations, true);
    },
    uploadRTSS: ({}) => {
      console.log('dicom-rtss uploadRTSS');

      const { SegmentationService } = servicesManager.services;
      const segmentations = SegmentationService.getSegmentations();

      dicomRTSSExport(segmentations, false).then(rtss => {
        const dataSources = extensionManager.getDataSources();
        const dataSource = dataSources[0];
        console.log('upload rtss');
        const { StudyInstanceUID } = rtss;
        //log.info(naturalizedReport);

        //await dataSource.store.dicom(rtss);
        if (true) {
          dataSource.store.dicom(rtss); // need save confirmation
        }

        //if (StudyInstanceUID) {
        //  dataSource.deleteStudyMetadataPromise(StudyInstanceUID);
        //}
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
