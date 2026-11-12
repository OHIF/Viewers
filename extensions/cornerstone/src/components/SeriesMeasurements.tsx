import React from 'react';
import { useActiveViewportDisplaySets, useSystem } from '@ohif/core';

import AccordionGroup from './AccordionGroup';
import PanelAccordionTrigger from './PanelAccordionTrigger';
import MeasurementItems from './MeasurementItems';
import MeasurementsMenu from './MeasurementsMenu';

/**
 * Groups measurements by study in order to allow display and saving by study
 * @param {Object} servicesManager
 */
export const groupByDisplaySet = (items, grouping, childProps) => {
  const groups = new Map();
  const { displaySetService } = childProps.servicesManager.services;
  const { activeDisplaySetInstanceUID } = grouping;

  items.forEach(item => {
    const { displaySetInstanceUID } = item;

    if (!groups.has(displaySetInstanceUID)) {
      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
      groups.set(displaySetInstanceUID, {
        header: null,
        isSelected: displaySetInstanceUID == activeDisplaySetInstanceUID,
        ...grouping,
        items: [],
        key: displaySetInstanceUID,
        title: 'Series Measurements',
        displaySet,
      });
    }
    groups.get(displaySetInstanceUID).items.push(item);
  });

  return groups;
};

export function SeriesMeasurementTrigger(props) {
  const { group, isSelected, displaySet, menu } = props;
  const { SeriesNumber = 1, SeriesDescription } = displaySet;

  return (
    <PanelAccordionTrigger
      text={`Series #${SeriesNumber} ${SeriesDescription}`}
      count={group.items.length}
      isActive={isSelected}
      group={group}
      menu={menu}
      marginLeft="0"
    />
  );
}

export function SeriesMeasurements(props): React.ReactNode {
  const { items, grouping = {}, children } = props;
  const system = useSystem();
  const activeDisplaySets = useActiveViewportDisplaySets(system);
  const activeDisplaySetInstanceUID = activeDisplaySets?.[0]?.displaySetInstanceUID;
  const onClick = (_e, group) => {
    const { items } = group;
    system.commandsManager.run('jumpToMeasurement', {
      uid: items[0].uid,
      displayMeasurements: items,
      group,
    });
  };

  // The content of the accordion group will default to the children of the
  // parent declaration if present, otherwise to MeasurementItems
  return (
    <AccordionGroup
      grouping={{
        groupingFunction: groupByDisplaySet,
        activeDisplaySetInstanceUID,
        ...grouping,
        onClick,
      }}
      items={items}
      sourceChildren={children}
    >
      <AccordionGroup.Trigger asChild={true}>
        <SeriesMeasurementTrigger menu={MeasurementsMenu} />
      </AccordionGroup.Trigger>
      <MeasurementItems />
    </AccordionGroup>
  );
}

export default SeriesMeasurements;
