import React from 'react';
import { MeasurementTable } from '@ohif/ui-next';

export default function ShowItem(props) {
  const { title, items, childProps } = props;
  const { commandsManager, displayMeasurements } = childProps;
  const onAction = (e, command, uid) => {
    commandsManager.run(command, { uid, annotationUID: uid, displayMeasurements });
  };

  return (
    <MeasurementTable
      {...childProps}
      title={title ? title : `Measurements`}
      data={items}
      onAction={onAction}
    >
      <MeasurementTable.Body />
    </MeasurementTable>
  );
}
