import React from 'react';
import { useActiveViewportDisplaySets, useSystem, utils } from '@ohif/core';
// import { AccordionContent, AccordionItem, AccordionTrigger } from '@ohif/ui-next';

import { AccordionGroup } from './AccordionGroup';
import MeasurementsOrAdditionalFindings from './MeasurementsOrAdditionalFindings';
import StudySummaryWithActions from './StudySummaryWithActions';

const { MeasurementFilters } = utils;

/**
 * Groups measurements by study in order to allow display and saving by study
 * @param {Object} servicesManager
 */
export const groupByStudy = (items, grouping, childProps) => {
  const groups = new Map();
  const { activeStudyUID } = grouping;
  const { displaySetService } = childProps.servicesManager.services;

  const getItemStudyInstanceUID = item => {
    const displaySet = displaySetService.getDisplaySetByUID(item.displaySetInstanceUID);
    return displaySet.instances[0].StudyInstanceUID;
  };

  let firstSelected, firstGroup;

  items
    .filter(item => item.displaySetInstanceUID)
    .forEach(item => {
      const studyUID = getItemStudyInstanceUID(item);
      if (!groups.has(studyUID)) {
        const items = [];
        const filter = MeasurementFilters.filterAnd(
          MeasurementFilters.filterMeasurementsByStudyUID(studyUID),
          grouping.filter
        );
        const group = {
          ...grouping,
          items,
          displayMeasurements: items,
          key: studyUID,
          isSelected: studyUID === activeStudyUID,
          StudyInstanceUID: studyUID,
          filter,
          measurementFilter: filter,
        };
        if (group.isSelected && !firstSelected) {
          firstSelected = group;
        }
        firstGroup ||= group;
        groups.set(studyUID, group);
      }
      if (!firstSelected && firstGroup) {
        firstGroup.isSelected = true;
      }
      const group = groups.get(studyUID);
      group.items.push(item);
    });

  return groups;
};

export function StudyMeasurements(props): React.ReactNode {
  const { items, grouping = {}, children } = props;

  const system = useSystem();
  const activeDisplaySets = useActiveViewportDisplaySets(system);
  const activeStudyUID = activeDisplaySets?.[0]?.StudyInstanceUID;

  return (
    <AccordionGroup
      grouping={{
        name: 'groupByStudy',
        groupingFunction: groupByStudy,
        activeStudyUID,
        ...grouping,
      }}
      items={items}
      value={[activeStudyUID]}
      sourceChildren={children}
    >
      <AccordionGroup.Trigger>
        <StudySummaryWithActions />
      </AccordionGroup.Trigger>
      <MeasurementsOrAdditionalFindings activeStudyUID={activeStudyUID} />
    </AccordionGroup>
  );
}

export default StudyMeasurements;
