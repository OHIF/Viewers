export const performCustomizations = customizationService => {
  // Set the custom SegmentationTable
  customizationService.addModeCustomizations([
    // To disable editing in the SegmentationTable
    {
      id: 'PanelSegmentation.disableEditing',
      disableEditing: true,
    },
    // To disable editing in the MeasurementTable
    // {
    //   id: 'PanelMeasurement.disableEditing',
    //   disableEditing: true,
    // },
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
