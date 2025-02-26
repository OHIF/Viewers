import React from 'react';

const nullComponent = () => null;

export default function AccordionGroup(props) {
  const { grouping, component, items, header, childProps } = props;
  const groups = grouping.groupingFunction(items, grouping, childProps);
  return [...groups.entries()].map(([key, group]) => {
    const Header = (group.header ?? header) || nullComponent;
    const Component = group.component ?? component;
    return (
      <>
        <Header
          {...childProps}
          {...group}
          {...group.headerProps}
          childProps={childProps}
          items={group.items}
          key="accordion-header-{key}"
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
