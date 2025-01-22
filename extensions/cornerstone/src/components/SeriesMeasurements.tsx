import React from 'react';
import AccordionGroup from './AccordionGroup';
import MeasurementTableNested from './MeasurementTableNested';

/**
 * Groups measurements by study in order to allow display and saving by study
 * @param {Object} servicesManager
 */
export const groupByDisplaySet = (items, grouping, childProps) => {
  const groups = new Map();
  const { displaySetService } = childProps.servicesManager.services;

  items.forEach(item => {
    const { displaySetInstanceUID } = item;

    if (!groups.has(displaySetInstanceUID)) {
      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
      groups.set(displaySetInstanceUID, {
        header: null,
        isExpanded: false,
        ...grouping,
        items: [],
        title: displaySet.SeriesDescription,
      });
    }
    groups.get(displaySetInstanceUID).items.push(item);
  });

  return groups;
};

export default function SeriesMeasurements(props): React.ReactNode {
  const { items, childProps, grouping = {} } = props;

  // Need to merge defaults on the component props to ensure they get passed to hcildren
  return (
    <AccordionGroup
      grouping={{
        groupingFunction: groupByDisplaySet,
        ...grouping,
      }}
      childProps={childProps}
      items={items}
      component={grouping.component || MeasurementTableNested}
    />
  );
}
