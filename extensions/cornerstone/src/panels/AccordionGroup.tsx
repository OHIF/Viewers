import React from 'react';

export default function AccordionGroup(props) {
  const { grouping, component, items, header, childProps } = props;
  const groups = grouping.groupingFunction(items, grouping, childProps);
  return [...groups.entries()].map(([key, group]) => {
    const Header = group.header ?? header;
    const Component = group.component ?? component;
    return (
      <>
        <Header
          {...childProps}
          {...group.headerProps}
          group={group}
        />
        <Component
          {...childProps}
          {...group}
          {...group.componentProps}
          childProps={childProps}
          items={group.items}
          key="accordion-{key}"
          group={group}
        />
      </>
    );
  });
}
