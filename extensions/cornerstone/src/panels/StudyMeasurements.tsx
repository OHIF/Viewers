import React from 'react';
import AccordionGroup from './AccordionGroup';
import { StudySummaryFromMetadata } from '../components/StudySummaryFromMetadata';
import MeasurementsOrAdditionalFindings from './MeasurementsOrAdditionalFindings';
/**
 * Groups measurements by study in order to allow display and saving by study
 * @param {Object} servicesManager
 */
export const groupByStudy = ({ servicesManager }) => {
  const { displaySetService } = servicesManager.services;

  const getItemStudyInstanceUID = item => {
    const displaySet = displaySetService.getDisplaySetByUID(item.displaySetInstanceUID);
    return displaySet.instances[0].StudyInstanceUID;
  };

  return (items, grouping) => {
    const groups = new Map();
    items.forEach(item => {
      const studyUID = getItemStudyInstanceUID(item);
      if (!groups.has(studyUID)) {
        groups.set(studyUID, {
          ...grouping,
          items: [],
          headerProps: {
            ...grouping.headerProps,
            StudyInstanceUID: studyUID,
          },
        });
      }
      groups.get(studyUID).items.push(item);
    });

    return groups;
  };
};

export default function StudyMeasurements(props): React.ReactNode {
  const { items, childProps, grouping = {} } = props;

  // Need to merge defaults on the component props to ensure they get passed to hcildren
  return (
    <AccordionGroup
      grouping={{
        header: StudySummaryFromMetadata,
        ...grouping,
        groupingFunction: grouping.groupingFunction || groupByStudy(props),
      }}
      childProps={childProps}
      items={items}
      component={grouping.component || MeasurementsOrAdditionalFindings}
    />
  );
}
