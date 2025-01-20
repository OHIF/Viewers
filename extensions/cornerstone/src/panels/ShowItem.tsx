import React from 'react';
import { MeasurementTable } from '@ohif/ui-next';

export default function ShowItem(props) {
  const { title, items, group } = props;

  return (
    <MeasurementTable
      title={title ? title : `Measurements`}
      data={items}
    >
      <MeasurementTable.Header />
      <MeasurementTable.Body />
    </MeasurementTable>
  );
}
