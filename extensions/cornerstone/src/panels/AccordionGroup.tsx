import React from 'react';
import ShowItem from './ShowItem';

export default function AccordionGroup(props) {
  const { grouping, component: Component, componentProps, items } = props;
  const groups = grouping.groupingFunction(items);
  console.log('Groups=', groups);
  return [...groups.entries()].map(([key, group]) => (
    <>
      <ShowItem
        {...props}
        {...componentProps}
        items={group.items}
        key={key}
        group={group}
      />
    </>
  ));
}
