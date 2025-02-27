import React from 'react';

import AccordionGroup from './AccordionGroup';
import MeasurementTableNested from './MeasurementTableNested';

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

  return groups;
};

export default function SitesAndFindings(props): React.ReactNode {
  const { items, childProps, grouping = {}, sitesMap, componentProps = {}, component } = props;

  if (!componentProps.componentProps || !componentProps.component) {
    return;
  }

  const namedSets = Array.from(sitesMap).map(([, site]: any) => {
    return {
      title: site.CodeMeaning,
      component: componentProps.component,
      componentProps: { ...componentProps.componentProps, site },
      filter: item => {
        return item?.site?.CodeMeaning === site.CodeMeaning;
      },
    };
  });

  return (
    <AccordionGroup
      grouping={{
        groupingFunction: groupByNamedSets,
        namedSets,
        component: MeasurementTableNested,
        ...grouping,
      }}
      childProps={childProps}
      items={items}
    />
  );
}
