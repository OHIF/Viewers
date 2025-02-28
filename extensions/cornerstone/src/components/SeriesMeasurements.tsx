import React from 'react';
import { useActiveViewportDisplaySets, useSystem } from '@ohif/core';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@ohif/ui-next';

import AccordionGroup from './AccordionGroup';
import MeasurementTableNested from './MeasurementTableNested';
import PanelAccordionTrigger from './PanelAccordionTrigger';

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

export function SeriesMeasurementItem(props) {
  const { group, isSelected, displaySet, children } = props;
  const { component: ChildComponent = MeasurementTableNested, key } = group;
  const CloneChildren = cloneProps => {
    if (children) {
      return React.Children.map(children, child =>
        React.cloneElement(child, {
          ...group,
          group,
          ...cloneProps,
          key,
        })
      );
    }
    return (
      <ChildComponent
        {...props}
        {...group}
        key={group.key}
      />
    );
  };

  const { SeriesNumber = 1, SeriesDescription } = displaySet;

  return (
    <AccordionItem value={key}>
      <PanelAccordionTrigger
        text={`Series #${SeriesNumber} ${SeriesDescription}`}
        count={group.items.length}
        isActive={isSelected}
        group={group}
      />
      <AccordionContent>
        <CloneChildren />
      </AccordionContent>
    </AccordionItem>
  );
}

export default function SeriesMeasurements(props): React.ReactNode {
  const { items, childProps, grouping = {} } = props;
  const system = useSystem();
  const activeDisplaySets = useActiveViewportDisplaySets(system);
  const activeDisplaySetInstanceUID = activeDisplaySets?.[0]?.displaySetInstanceUID;
  const onClick = (_e, group) => {
    const { items } = group;
    system.commandsManager.run('navigateToMeasurementItems', { items, group });
  };

  // Need to merge defaults on the component props to ensure they get passed to hcildren
  return (
    <AccordionGroup
      grouping={{
        groupingFunction: groupByDisplaySet,
        activeDisplaySetInstanceUID,
        ...grouping,
        onClick,
      }}
      childProps={childProps}
      items={items}
      component={grouping.component || MeasurementTableNested}
    >
      <SeriesMeasurementItem />
    </AccordionGroup>
  );
}
