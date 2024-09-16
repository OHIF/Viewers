import { addIcon } from '@ohif/ui';
import DownloadStudySeriesDialog from './DownloadStudySeriesDialog';
import { ReactComponent as downloadIcon } from '../assets/icons/download.svg';

import { id } from './id';

const extension = {
  id,
  preRegistration: () => {
    addIcon('download', downloadIcon);
  },
  onModeEnter: ({ servicesManager }) => {
    const { toolbarService, UIModalService, viewportGridService, displaySetService } =
      servicesManager.services;

    const moreTools = [
      {
        id: 'downloadStudySeries',
        uiType: 'ohif.radioGroup',
        props: {
          icon: 'download',
          label: 'Download Study/Series',
          commands: () => {
            const { activeViewportId, viewports } = viewportGridService.getState();
            const activeViewportSpecificData = viewports.get(activeViewportId);
            const displaySets = displaySetService.activeDisplaySets;

            const activeDisplaySetUID = activeViewportSpecificData.displaySetInstanceUIDs[0];
            const activeDisplaySet = displaySets.find(ds => ds.uid === activeDisplaySetUID);

            if (!activeDisplaySet) {
              console.error('No display set found.');
              return;
            }

            const { StudyInstanceUID, SeriesInstanceUID } = activeDisplaySet;

            UIModalService.show({
              content: DownloadStudySeriesDialog,
              contentProps: {
                StudyInstanceUID,
                SeriesInstanceUID,
              },
              containerDimensions: 'w-[70%] max-w-[700px]',
              title: 'Download Study/Series',
            });
          },
        },
      },
    ];

    toolbarService.addButtons([...moreTools]);
    toolbarService.createButtonSection('primary', ['downloadStudySeries']);
  },
};

export default extension;
