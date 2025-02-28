import React from 'react';
import { useSystem } from '@ohif/core';
import { Accordion } from '@ohif/ui-next';

export const CloneChildren = cloneProps => {
  const { group, groupChildren, groups } = cloneProps;
  const { component: ChildComponent, componentProps } = group;
  if (groupChildren) {
    return React.Children.map(groupChildren, child =>
      React.cloneElement(child, { ...group, group, ...cloneProps })
    );
  }
  return (
    <ChildComponent
      groups={groups}
      {...cloneProps}
      {...componentProps}
      {...group}
      key={group.key}
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

  if (!children) {
    return (
      <>
        {[...groups.entries()].map(([key, group]) => (
          <Component
            {...group}
            {...componentProps}
            groups={groups}
            group={group}
            key={key}
          />
        ))}
      </>
    );
  }

  const valueArr =
    (Array.isArray(defaultValue) && defaultValue) || (defaultValue && [defaultValue]) || [];

  return (
    <Accordion
      type={type || 'multiple'}
      className="text-white"
      defaultValue={valueArr}
    >
      {[...groups.entries()].map(([key, group]) => (
        <CloneChildren
          group={group}
          groups={groups}
          groupChildren={children}
          componentProps={componentProps}
          key={group.key}
        />
      ))}
    </Accordion>
  );
}

export { AccordionGroup };
