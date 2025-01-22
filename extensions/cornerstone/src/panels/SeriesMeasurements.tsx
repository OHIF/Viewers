import React from 'react';
import AccordionGroup from './AccordionGroup';
import ShowItem from './ShowItem';

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
        ...grouping,
        items: [],
        componentProps: {
          title: displaySet.SeriesDescription,
        },
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
      component={grouping.component || ShowItem}
    />
  );
}
