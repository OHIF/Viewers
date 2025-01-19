/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { cloneElement } from 'react';
import { utils } from '@ohif/core';

type Node = {
  id: string;
  content: React.JSX.Element;
  shouldShowFallback?: boolean;
  fallback?: React.JSX.Element;
};

type NodeSchema = any;

const { groupIntoSingleGroup } = utils.MeasurementGroupings;
const { filterAny } = utils.MeasurementFilters;

const processItems = ({ items, nodeSchema, servicesManager }) => {
  const filterFunction = nodeSchema.filterFunction ?? filterAny;
  const groupingFunction = (nodeSchema.groupingFunction ?? groupIntoSingleGroup)({
    servicesManager,
  });
  const filteredItems = items.filter(filterFunction);
  const groupedItems = groupingFunction(filteredItems);

  return { groupedItems, filteredItems };
};

const generateNodes = ({ groupedItems, filteredItems, nodeSchema }) => {
  if (groupedItems.length === 0) {
    return [
      {
        ...nodeSchema,
        content: nodeSchema.content({ filteredItems, items: [] }),
        shouldShowFallback: nodeSchema.shouldShowFallback({ filteredItems, items: [] }),
      },
    ];
  }

  return groupedItems.map((arrayOfGroupedAndFilteredItems, i) => ({
    ...nodeSchema,
    content: nodeSchema.content({ filteredItems, items: arrayOfGroupedAndFilteredItems }),
    shouldShowFallback: nodeSchema.shouldShowFallback({
      filteredItems,
      items: arrayOfGroupedAndFilteredItems,
    }),
    id: `${nodeSchema.id}-${i}`,
  }));
};

const getWrappedChildren = ({ children, items }) => {
  if (!children) {
    return <></>;
  }

  if (!Array.isArray(children)) {
    return cloneElement(children, { items });
  }

  return children.map(child => cloneElement(child, { items }));
};

export default function NodeComponent({
  nodeSchema,
  servicesManager,
  items,
  children,
}: {
  nodeSchema: NodeSchema;
  servicesManager: any;
  items?: any[];
  children?: React.JSX.Element | React.JSX.Element[];
}): React.JSX.Element {
  if (!items) {
    console.warn('Missing items in NodeComponent.');
    return;
  }

  const { groupedItems, filteredItems } = processItems({ items, nodeSchema, servicesManager });
  const nodes: Node[] = generateNodes({ groupedItems, filteredItems, nodeSchema });

  return (
    <ul className="w-full grow">
      {nodes.map((node, i) => {
        if (node.shouldShowFallback && node.fallback) {
          return node.fallback;
        }

        const wrappedChildren = getWrappedChildren({ children, items: groupedItems[i] });
        return (
          <li
            key={node.id}
            className="w-full"
          >
            <span className="flex w-full grow items-center gap-1.5 py-1">
              <node.content>{wrappedChildren}</node.content>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
