import React from 'react';
import { StudySummary, MeasurementTable } from '@ohif/ui';
import ActionButtons from './ActionButtons.jsx';

export default function PanelMeasurementTable({
  servicesManager,
  commandsManager,
}) {
  const { MeasurementService } = servicesManager.services;

  console.log('MeasurementTable rendering!!!!!!!!!!!!!');

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
    <>
      <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar">
        <StudySummary
          date={descriptionData.date}
          modality={descriptionData.modality}
          description={descriptionData.description}
        />
        <MeasurementTable
          title="Measurements"
          amount={measurementTableData.data.length}
          data={measurementTableData.data}
          onClick={() => { }}
          onEdit={id => alert(`Edit: ${id}`)}
        />
      </div>
      <div className="flex justify-center p-4">
        <ActionButtons />
      </div>
    </>
  );
}
