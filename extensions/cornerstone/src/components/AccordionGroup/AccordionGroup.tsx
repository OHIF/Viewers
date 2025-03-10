import React from 'react';
import { useSystem } from '@ohif/core';
import { Accordion } from '@ohif/ui-next';

export type AccordionGrouping = {
  [name: string]: unknown;
};

export type AccordionGroupProps = {
  grouping: AccordionGrouping;
};

interface AccordionGroupComponent extends React.FC<AccordionGroupProps> {
  CloneChildren: typeof CloneChildren;
  Item: typeof Item;
  Trigger: typeof Trigger;
  Body: typeof Body;
}

const typeOfComponent = component =>
  component?.props?.__TYPE ||
  component?.type?.toString().replace('Symbol(react.fragment)', 'react.fragment') ||
  undefined;

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

/**
 * An AccordionGroup is a component that splits a set of items into different
 * groups according to a set of grouping rules.  It then puts the groups
 * into a set of accordion folds selected from the body of the accordion group,
 * looking for matching trigger/content sections according to the type definition
 * in the group with first one found being used.
 *
 * This design allows for easy customization of the component by declaring grouping
 * functions with default grouping setups and then only overriding the specific
 * children needing to be changed.  See the PanelMeasurement for some example
 * possibilities of how to modify the default grouping, or the test-extension
 * measurements panel for a practical, working example.
 */
export function AccordionGroup(props) {
  const { grouping, items, children, type } = props;
  const childProps = useSystem();
  let defaultValue = props.defaultValue;
  const groups = grouping.groupingFunction(items, grouping, childProps);

  if (!defaultValue) {
    const defaultGroup = groups.values().find(group => group.isSelected);
    defaultValue = defaultGroup?.key || defaultGroup?.title;
  }

  const valueArr =
    (Array.isArray(defaultValue) && defaultValue) || (defaultValue && [defaultValue]) || [];

  return (
    <Accordion
      type={type || 'multiple'}
      className="text-white"
      defaultValue={valueArr}
    >
      {[...groups.entries()].map(([key, group]) => {
        const { subType } = group;
        return (
          <FindChild
            source={children}
            type="AccordionGroup.Item"
            subType={subType}
          >
            <AccordionGroup.Item
              key={group.key}
              value={group.key}
            >
              <FindChild
                key={`trigger:${group.key}`}
                source={children}
                type="AccordionGroup.Trigger"
                subType={subType}
              />
              <FindChild
                key={`body:${group.key}`}
                source={children}
                type="AccordionGroup.Body"
                subType={subType}
                useDefault
              />
            </AccordionGroup.Item>
          </FindChild>
        );

        // <CloneChildren
        //   group={group}
        //   groups={groups}
        //   groupChildren={children}
        //   componentProps={componentProps}
        //   key={group.key}
        // />
      })}
    </Accordion>
  );
}

const Item = props => {
  return <span>Hello Item</span>;
};

const Body = props => {
  return <span>Hello Item</span>;
};
const Trigger = props => {
  return <span>Hello Item</span>;
};

AccordionGroup.Item = Item;
AccordionGroup.Body = Body;
AccordionGroup.Trigger = Trigger;

export default AccordionGroup;
