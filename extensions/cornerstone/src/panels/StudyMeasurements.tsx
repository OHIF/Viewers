import React from 'react';
import AccordionGroup from './AccordionGroup';
import ShowItem from './ShowItem';
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

  return items => {
    const groups = new Map();
    items.forEach(item => {
      const studyUID = getItemStudyInstanceUID(item);
      if (!groups.has(studyUID)) {
        groups.set(studyUID, {
          items: [],
        });
      }
      groups.get(studyUID).items.push(item);
    });

    return groups;
  };
};

export default function StudyMeasurements(props): React.ReactNode {
  const { items, title = 'Measurements', grouping = {} } = props;

  // Need to merge defaults on the content props to ensure they get passed to hcildren
  return (
    <AccordionGroup
      grouping={{
        groupingFunction: grouping.groupingFunction || groupByStudy(props),
        component: ShowItem,
        componentProps: { ...props, ...grouping.componentProps },
      }}
      items={items}
    />
  );
}
