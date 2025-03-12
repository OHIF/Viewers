import React from 'react';
import { useSystem } from '@ohif/core';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ohif/ui-next';

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
  Content: typeof Content;
}

/**
 * Searches for the required type from the provided allChildren list and
 * renders them.
 */
export const CloneChildren = props => {
  const { group, allChildren, children, type, defaultTypes } = props;

  const { subType } = group;

  const foundDefault = allChildren.find(child => {
    if ((type && child.type === type) || defaultTypes?.indexOf(child.type) === -1) {
      if (!subType || child.props.subType === subType) {
        return child;
      }
    }
  });

  if (foundDefault) {
    return React.cloneElement(foundDefault, { ...props, ...group });
  }

  if (!children) {
    throw new Error(`No children defined for ${props.name} CloneChildren in group ${group?.name}`);
  }
  return React.Children.map(children, child => React.cloneElement(child, { ...props, ...group }));
};

/** Used to exclude defaults */
const DEFAULT_TYPES = [Item, Content, Trigger];

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
  const { grouping, items, children, sourceChildren, type } = props;
  const childProps = useSystem();
  let defaultValue = props.defaultValue;
  const groups = grouping.groupingFunction(items, grouping, childProps);

  if (!defaultValue) {
    const defaultGroup = groups.values().find(group => group.isSelected);
    defaultValue = defaultGroup?.key || defaultGroup?.title;
  }

  const valueArr =
    (Array.isArray(defaultValue) && defaultValue) || (defaultValue && [defaultValue]) || [];
  const sourceChildrenArr = sourceChildren ? React.Children.toArray(sourceChildren) : [];
  const childrenArr = children ? React.Children.toArray(children) : [];
  const allChildren = sourceChildrenArr.concat(childrenArr);

  return (
    <Accordion
      type={type || 'multiple'}
      className="text-white"
      defaultValue={valueArr}
    >
      {[...groups.entries()].map(([key, group]) => {
        return (
          <CloneChildren
            allChildren={allChildren}
            group={group}
            type={Item}
            key={group.key}
            name="AccordionGroup.Item"
          >
            <AccordionItem
              key={group.key + '-i'}
              value={group.key}
            >
              <AccordionTrigger
                value={group.key}
                key={group.key + '-t'}
              >
                <CloneChildren
                  allChildren={allChildren}
                  group={group}
                  type={Trigger}
                  name="AccordionGroup.Trigger"
                />
              </AccordionTrigger>
              <AccordionContent key={group.key + '-c'}>
                <CloneChildren
                  allChildren={allChildren}
                  group={group}
                  type={Content}
                  defaultTypes={DEFAULT_TYPES}
                  name="AccordionGroup.Content"
                />
              </AccordionContent>
            </AccordionItem>
          </CloneChildren>
        );
      })}
    </Accordion>
  );
}

function Item(props) {
  const { children, group } = props;
  console.log('Creating item', props.name, group?.name);
  return React.cloneElement(children, { ...group, ...props });
}

function Content(props) {
  const { children, group } = props;
  console.log('Creating content', props.name, group?.name);
  return React.cloneElement(children, { ...group, ...props });
}

function Trigger(props) {
  const { children, group } = props;
  console.log('Creating Trigger', props.name, group?.name);
  return React.cloneElement(children, { ...group, ...props });
}

AccordionGroup.Item = Item;
AccordionGroup.Content = Content;
AccordionGroup.Trigger = Trigger;

export default AccordionGroup;
