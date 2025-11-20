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
    const measurement = items.find(item => item.uid === uid);

    let resolvedCommand = command;
    if (resolvedCommand === 'jumpToMeasurement' && measurement?.toolName === 'CustomProbe') {
      resolvedCommand = 'jumpToCustomProbe';
    }

    const shouldRelocate =
      resolvedCommand === 'jumpToCustomProbe' && measurement?.isVisible === false;

    commandsManager.run(resolvedCommand, {
      uid,
      annotationUID: uid,
      displayMeasurements: items,
      relocateOnNextClick: shouldRelocate,
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
