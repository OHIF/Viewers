import React from 'react';
import AccordionGroup from './AccordionGroup';
import { utils } from '@ohif/core';
import ShowItem from './ShowItem';
import { StudySummaryFromMetadata } from '../components/StudySummaryFromMetadata';

const { filterNot, filterAdditionalFindings } = utils.MeasurementFilters;

export const MeasurementOrAdditionalFindingSets = [
  {
    title: 'Measurements',
    component: ShowItem,
    filter: filterNot(filterAdditionalFindings),
  },
  {
    title: 'Additional Findings',
    component: ShowItem,
    filter: filterAdditionalFindings,
  },
];

/**
 * Groups measurements by study in order to allow display and saving by study
 * @param {Object} servicesManager
 */
export const groupByNamedSets = (items, grouping) => {
  const groups = new Map();
  const { namedSets } = grouping;

  items.forEach(item => {
    for (const namedSet of namedSets) {
      if (namedSet.filter(item)) {
        const name = namedSet.id || namedSet.title;
        console.log('Found item', name, item);
        if (!groups.has(name)) {
          groups.set(name, {
            ...grouping,
            ...namedSet,
            items: [],
          });
        }
        groups.get(name).items.push(item);
        return;
      }
    }
  });

  return groups;
};

export default function StudyMeasurements(props): React.ReactNode {
  const { items, childProps, grouping = {} } = props;

  return (
    <AccordionGroup
      grouping={{
        header: StudySummaryFromMetadata,
        groupingFunction: groupByNamedSets,
        namedSets: MeasurementOrAdditionalFindingSets,
        ...grouping,
      }}
      childProps={childProps}
      items={items}
      component={grouping.component || ShowItem}
    />
  );
}
