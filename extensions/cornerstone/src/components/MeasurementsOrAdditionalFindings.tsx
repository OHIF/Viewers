import React from 'react';
import AccordionGroup from './AccordionGroup';
import { utils } from '@ohif/core';
import MeasurementTableNested from './MeasurementTableNested';

const { filterNot, filterAdditionalFindings } = utils.MeasurementFilters;

export const MeasurementOrAdditionalFindingSets = [
  {
    title: 'Measurements',
    filter: filterNot(filterAdditionalFindings),
  },
  {
    title: 'Additional Findings',
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
      isFirst: groups.size === 0,
      title: name,
      key: name,
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

export function MeasurementsOrAdditionalFindings(props): React.ReactNode {
  const { items, children, grouping = {}, customHeader, group, actions } = props;

  return (
    <AccordionGroup
      grouping={{
        groupingFunction: groupByNamedSets,
        name: 'measurementsOrAdditional',
        namedSets: MeasurementOrAdditionalFindingSets,
        StudyInstanceUID: group?.StudyInstanceUID,
        ...grouping,
      }}
      items={items}
      sourceChildren={children}
    >
      <AccordionGroup.Accordion noWrapper="true">
        <MeasurementTableNested
          customHeader={customHeader}
          allItems={items}
          actions={actions}
        />
      </AccordionGroup.Accordion>
    </AccordionGroup>
  );
}

export default MeasurementsOrAdditionalFindings;
