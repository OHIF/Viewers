import React from 'react';
import { Button, useSegmentationTableContext } from '@ohif/ui-next';

export const performCustomizations = customizationService => {
  // customizationService.addModeCustomizations([
  // {
  //   id: 'component.SegmentationTableConfig',
  //   content: props => {
  //     const { setRenderFill, activeRepresentation } = useSegmentationTableContext('styles');
  //     return (
  //       <div
  //         className="text-white"
  //         {...props}
  //       >
  //         <Button
  //           onClick={() => {
  //             setRenderFill(activeRepresentation.type, false);
  //           }}
  //         >
  //           set fill to 0
  //         </Button>
  //       </div>
  //     );
  //   },
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
  // ]);
};
