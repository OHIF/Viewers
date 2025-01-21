import React from 'react';
import AccordionGroup from './AccordionGroup';
import { SeriesSummaryFromMetadata } from '../components/SeriesSummaryFromMetadata';
import MeasurementsOrAdditionalFindings from './MeasurementsOrAdditionalFindings';
/**
 * Groups measurements by study in order to allow display and saving by study
 * @param {Object} servicesManager
 */
export const groupByDisplaySet = (items, grouping, childProps) => {
  const groups = new Map();
  const { displaySetService } = childProps.servicesManager.services;

  items.forEach(item => {
    const { displaySetInstanceUID } = item;
    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

    if (!groups.has(displaySetInstanceUID)) {
      groups.set(displaySetInstanceUID, {
        header: SeriesSummaryFromMetadata,
        ...grouping,
        items: [],
        headerProps: {
          ...grouping.headerProps,
          displaySet,
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
        header: SeriesSummaryFromMetadata,
        ...grouping,
      }}
      childProps={childProps}
      items={items}
      component={grouping.component || MeasurementsOrAdditionalFindings}
    />
  );
}
