import React from 'react';
import {
  MeasurementsPanel,
  Button,
  ButtonGroup,
  Icon,
  IconButton,
} from '@ohif/ui';

export default function MeasurementTable({ servicesManager, commandsManager }) {
  const { MeasurementService } = servicesManager.services;

  console.error('MeasurementTable rendering!!!!!!!!!!!!!');

  const actionButtons = (
    <React.Fragment>
      <ButtonGroup onClick={() => alert('Export')}>
        <Button
          className="text-white border-primary-main bg-black text-base py-2 px-2"
          size="initial"
          color="inherit"
        >
          Export
        </Button>
        <IconButton
          className="bg-black border-primary-main px-2 text-white px-2"
          color="inherit"
          size="initial"
        >
          <Icon name="arrow-down" />
        </IconButton>
      </ButtonGroup>
      <Button
        className="text-white border border-primary-main bg-black text-base py-2 px-2 ml-2"
        variant="outlined"
        size="initial"
        color="inherit"
        onClick={() => alert('Create Report')}
      >
        Create Report
      </Button>
    </React.Fragment>
  );

  const descriptionData = {
    date: '07-Sep-2010',
    modality: 'CT',
    description: 'CHEST/ABD/PELVIS W CONTRAST',
  };

  const activeMeasurementItem = 0;

  const measurementTableData = {
    title: 'Measurements',
    amount: 10,
    data: new Array(10).fill({}).map((el, i) => ({
      id: i + 1,
      label: 'Label short description',
      displayText: '24.0 x 24.0 mm (S:4, I:22)',
      isActive: activeMeasurementItem === i + 1,
    })),
    onClick: id => setActiveMeasurementItem(s => (s === id ? null : id)),
    onEdit: id => alert(`Edit: ${id}`),
  };

  return (
    <MeasurementsPanel
      descriptionData={descriptionData}
      measurementTableData={measurementTableData}
      actionButtons={actionButtons}
    />
  );
}
