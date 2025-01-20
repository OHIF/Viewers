import React from 'react';

export default function AccordionGroup(props) {
  const { grouping, component: Component, componentProps, items } = props;
  const groups = grouping.groupingFunction(items);
  console.log('Groups=', groups);
  return [...groups.entries()].map(([key, group]) => (
    <Component
      {...props}
      {...componentProps}
      items={group.items}
      key="accordion-{key}"
      group={group}
    />
  ));
}
