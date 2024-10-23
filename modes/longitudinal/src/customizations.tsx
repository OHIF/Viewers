export const performCustomizations = customizationService => {
  // Set the custom SegmentationTable
  customizationService.addModeCustomizations([
    {
      id: 'segmentation.panel',
      disableEditing: true,
    },
    //   {
    //     id: 'measurementLabels',
    //     labelOnMeasure: true,
    //     exclusive: true,
    //     items: [
    //       { value: 'Head', label: 'Head' },
    //       { value: 'Shoulder', label: 'Shoulder' },
    //       { value: 'Knee', label: 'Knee' },
    //       { value: 'Toe', label: 'Toe' },
    //     ],
    //   },
  ]);
};
