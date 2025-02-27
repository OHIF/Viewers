import React from 'react';
import { useSystem } from '@ohif/core';
import { Accordion } from '@ohif/ui-next';

export const CloneChildren = cloneProps => {
  const { group, groupChildren, groups } = cloneProps;
  const { component: ChildComponent, componentProps } = group;
  if (groupChildren) {
    return React.Children.map(groupChildren, child => React.cloneElement(child, cloneProps));
  }
  return (
    <ChildComponent
      groups={groups}
      {...cloneProps}
      {...componentProps}
    />
  );
};

export default function AccordionGroup(props) {
  const { grouping, items, children, type, componentProps, component: Component } = props;
  const childProps = useSystem();
  let defaultValue = props.defaultValue;
  const groups = grouping.groupingFunction(items, grouping, childProps);

  if (!defaultValue) {
    const defaultGroup = groups.values().find(group => group.isSelected);
    defaultValue = defaultGroup?.key || defaultGroup?.title;
  }

  if (Component) {
    return (
      <>
        {[...groups.entries()].map(([key, group]) => (
          <Component
            key={key}
            {...componentProps}
            {...group}
            groups={groups}
            group={group}
          />
        ))}
      </>
    );
  }

  return (
    <Accordion
      type={type || 'multiple'}
      className="text-white"
      defaultValue={
        (Array.isArray(defaultValue) && defaultValue) || (defaultValue && [defaultValue]) || []
      }
    >
      {[...groups.entries()].map(([key, group]) => (
        <CloneChildren
          {...group}
          key={key}
          group={group}
          groups={groups}
          groupChildren={children}
          componentProps={componentProps}
        />
      ))}
    </Accordion>
  );
}

export { AccordionGroup };
