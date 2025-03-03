import React from 'react';
import { MeasurementTable, DataRow } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

/**
 * This is a measurement table that is designed to be nested inside
 * the accordion groups.
 */
export default function MeasurementTableNested(props) {
  const { title, items, group } = props;
  const { commandsManager } = useSystem();
  const onAction = (e, command, uid) => {
    commandsManager.run(command, { uid, annotationUID: uid, displayMeasurements: items });
  };

  return (
    <MeasurementTable
      title={title ? title : `Measurements`}
      data={items}
      onAction={onAction}
      {...group}
      key={group.key}
    >
      <MeasurementTable.Body>
        <DataRow />
      </MeasurementTable.Body>
    </MeasurementTable>
  );
}
