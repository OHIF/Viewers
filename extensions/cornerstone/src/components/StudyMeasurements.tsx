import React from 'react';
import { utils } from '@ohif/core';

import AccordionGroup from './AccordionGroup';
import { StudySummaryFromMetadata } from '../components/StudySummaryFromMetadata';
import MeasurementsOrAdditionalFindings from './MeasurementsOrAdditionalFindings';

const { filterMeasurementsByStudyUID, filterAnd } = utils.MeasurementFilters;

/**
 * Groups measurements by study in order to allow display and saving by study
 * @param {Object} servicesManager
 */
export const groupByStudy = (items, grouping, childProps) => {
  const groups = new Map();
  const { displaySetService } = childProps.servicesManager.services;

  const getItemStudyInstanceUID = item => {
    const displaySet = displaySetService.getDisplaySetByUID(item.displaySetInstanceUID);
    return displaySet.instances[0].StudyInstanceUID;
  };

  const measurementFilter = grouping.measurementFilter || childProps.measurementFilter;

  items.forEach(item => {
    const studyUID = getItemStudyInstanceUID(item);
    if (!groups.has(studyUID)) {
      const filter = filterMeasurementsByStudyUID(studyUID);
      const groupMeasurementFilter = measurementFilter
        ? filterAnd(measurementFilter, filter)
        : filter;

      const items = [];
      const group = {
        ...grouping,
        items,
        displayMeasurements: items,
        headerProps: {
          ...grouping.headerProps,
          items,
          StudyInstanceUID: studyUID,
        },
        filter,
        measurementFilter: groupMeasurementFilter,
      };
      groups.set(studyUID, group);
    }
    groups.get(studyUID).items.push(item);
  });

  return groups;
};

export default function StudyMeasurements(props): React.ReactNode {
  const { items, childProps, grouping = {} } = props;

  // Need to merge defaults on the component props to ensure they get passed to hcildren
  return (
    <AccordionGroup
      grouping={{
        groupingFunction: groupByStudy,
        header: StudySummaryFromMetadata,
        ...grouping,
      }}
      childProps={childProps}
      items={items}
      component={grouping.component || MeasurementsOrAdditionalFindings}
    />
  );
}
