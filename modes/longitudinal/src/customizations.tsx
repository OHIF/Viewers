import React from 'react';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuLabel,
  Icons,
} from '@ohif/ui-next';

export const performCustomizations = customizationService => {
  // Set the custom SegmentationTable
  customizationService.setCustomizations(
    [
      // To disable editing in the SegmentationTable
      {
        id: 'PanelSegmentation.disableEditing',
        disableEditing: true,
      },
      // to only show current study in the panel study browser
      // {
      //   id: 'PanelStudyBrowser.studyMode',
      //   mode: 'primary',
      // },
      // To disable editing in the MeasurementTable
      // {
      //   id: 'PanelMeasurement.disableEditing',
      //   disableEditing: true,
      // },
      {
        id: 'measurementLabels',
        labelOnMeasure: true,
        exclusive: true,
        items: [
          { value: 'Head', label: 'Head' },
          { value: 'Shoulder', label: 'Shoulder' },
          { value: 'Knee', label: 'Knee' },
          { value: 'Toe', label: 'Toe' },
        ],
      },
      /**
       * Custom Dropdown Menu Item
       */
      // {
      //   id: 'PanelSegmentation.CustomDropdownMenuContent',
      //   content: ({
      //     activeSegmentation,
      //     onSegmentationAdd,
      //     onSegmentationRemoveFromViewport,
      //     onSegmentationEdit,
      //     onSegmentationDelete,
      //     allowExport,
      //     storeSegmentation,
      //     onSegmentationDownload,
      //     onSegmentationDownloadRTSS,
      //     t,
      //   }) => (
      //     <DropdownMenuContent align="start">
      //       <DropdownMenuItem onClick={() => onSegmentationDelete(activeSegmentation.id)}>
      //         <Icons.Delete className="text-red-600" />
      //         <span className="pl-2 text-red-600">{t('My Custom Dropdown Menu Item')}</span>
      //       </DropdownMenuItem>
      //     </DropdownMenuContent>
      //   ),
      // },
    ],
    customizationService.Scope.Mode
  );
};
