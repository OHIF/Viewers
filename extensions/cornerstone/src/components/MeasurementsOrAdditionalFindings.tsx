import React from 'react';
import AccordionGroup from './AccordionGroup';
import { utils } from '@ohif/core';
import MeasurementTableNested from './MeasurementTableNested';
import { StudySummaryFromMetadata } from '../components/StudySummaryFromMetadata';

const { filterNot, filterAdditionalFindings } = utils.MeasurementFilters;

export const MeasurementOrAdditionalFindingSets = [
  {
    title: 'Measurements',
    component: MeasurementTableNested,
    filter: filterNot(filterAdditionalFindings),
  },
  {
    title: 'Additional Findings',
    component: MeasurementTableNested,
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

  for (const namedSet of namedSets) {
    const name = namedSet.id || namedSet.title;
    groups.set(name, {
      ...grouping,
      ...namedSet,
      items: [],
    });
  }
  items.forEach(item => {
    for (const namedSet of namedSets) {
      if (namedSet.filter(item)) {
        const name = namedSet.id || namedSet.title;
        groups.get(name).items.push(item);
        return;
      }
    }
  });
  for (const namedSet of namedSets) {
    const name = namedSet.id || namedSet.title;
    if (!groups.get(name).items.length) {
      groups.delete(name);
    }
  }

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
      component={grouping.component || MeasurementTableNested}
    />
  );
}
