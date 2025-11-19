import React from 'react';
import { MeasurementTable } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

/**
 * This is a measurement table that is designed to be nested inside
 * the accordion groups.
 */
export default function MeasurementTableNested(props) {
  const { title, items, group, customHeader } = props;
  const { commandsManager } = useSystem();
  const onAction = (e, command, uid) => {
    // For CustomProbe measurements, use the special multi-viewport jump command
    if (command === 'jumpToMeasurement') {
      const measurement = items.find(item => item.uid === uid);
      if (measurement && measurement.toolName === 'CustomProbe') {
        command = 'jumpToCustomProbe';
      }
    }

    commandsManager.run(command, {
      uid,
      annotationUID: uid,
      displayMeasurements: items,
      relocateOnNextClick: command === 'jumpToCustomProbe',
    });
  };

  return (
    <MeasurementTable
      title={title ? title : `Measurements`}
      data={items}
      onAction={onAction}
      {...group}
      key={group.key}
    >
      <MeasurementTable.Header key="measurementTableHeader">
        {customHeader && group.isFirst && customHeader({ ...props, items: props.allItems })}
      </MeasurementTable.Header>
      <MeasurementTable.Body key="measurementTableBody" />
    </MeasurementTable>
  );
}
