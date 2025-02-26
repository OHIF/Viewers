import React from 'react';
import { MeasurementTable, DataRow } from '@ohif/ui-next';

/**
 * This is a measurement table that is designed to be nested inside
 * the accordian groups.
 */
export default function MeasurementTableNested(props) {
  const { title, items, childProps, group } = props;
  const { commandsManager, displayMeasurements } = childProps;
  const onAction = (e, command, uid) => {
    commandsManager.run(command, { uid, annotationUID: uid, displayMeasurements });
  };

  console.log('MeasurementTableNested=', group);
  return (
    <MeasurementTable
      title={title ? title : `Measurements`}
      data={items}
      onAction={onAction}
      {...childProps}
      {...group}
    >
      <MeasurementTable.Body>
        <DataRow />
      </MeasurementTable.Body>
    </MeasurementTable>
  );
}
