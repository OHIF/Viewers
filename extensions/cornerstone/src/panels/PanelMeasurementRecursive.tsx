import React, { useEffect, useRef } from 'react';
import debounce from 'lodash.debounce';
import { useMeasurements } from '../hooks/useMeasurements';

type Node = {
  id: string;
  content: React.ReactNode;
  shouldShowFallback: boolean;
  fallback?: React.ReactNode;
  nodes?: Node[];
};

export type withAppAndFilters = withAppTypes & {
  measurementFilter: (item) => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getNodeSchema: ({ onArgs }: any) => any;
};

const { groupIntoSingleGroup } = utils.MeasurementGroupings;
const { filterAny } = utils.MeasurementFilters;

export default function PanelMeasurement({
  servicesManager,
  commandsManager,
  measurementFilter = filterAny,
  getNodeSchema,
}: withAppAndFilters): React.ReactNode {
  const measurementsPanelRef = useRef(null);

  const displayMeasurements = useMeasurements(servicesManager, {
    measurementFilter,
  });

  useEffect(() => {
    if (displayMeasurements.length > 0) {
      debounce(() => {
        measurementsPanelRef.current.scrollTop = measurementsPanelRef.current.scrollHeight;
      }, 300)();
    }
  }, [displayMeasurements.length]);

  const bindCommand = (name: string | string[], options?) => {
    return (uid: string) => {
      commandsManager.run(name, { ...options, uid });
    };
  };

  const jumpToImage = bindCommand('jumpToMeasurement', { displayMeasurements });
  const removeMeasurement = bindCommand('removeMeasurement');
  const renameMeasurement = bindCommand(['jumpToMeasurement', 'renameMeasurement'], {
    displayMeasurements,
  });
  const toggleLockMeasurement = bindCommand('toggleLockMeasurement');
  const toggleVisibilityMeasurement = bindCommand('toggleVisibilityMeasurement');

  const onArgs = {
    onClick: jumpToImage,
    onDelete: removeMeasurement,
    onToggleVisibility: toggleVisibilityMeasurement,
    onToggleLocked: toggleLockMeasurement,
    onRename: renameMeasurement,
  };

  const nodeSchema = getNodeSchema({ onArgs });

  const generateNodes = ({ items, nodeSchema }) => {
    const filterFunction = nodeSchema.filterFunction ?? filterAny;
    const groupingFunction = (nodeSchema.groupingFunction ?? groupIntoSingleGroup)({
      servicesManager,
    });
    const filteredItems = items.filter(filterFunction);
    const groupedItems = groupingFunction(filteredItems);

    if (groupedItems.length === 0) {
      const { nodes, ...nodeSchemaWithoutChildrenNodes } = nodeSchema;
      return [
        {
          ...nodeSchemaWithoutChildrenNodes,
          content: nodeSchema.content({ filteredItems, items: [] }),
          shouldShowFallback: nodeSchema.shouldShowFallback({ filteredItems, items: [] }),
        },
      ];
    }

    return groupedItems.map((arrayOfGroupedAndFilteredItems, i) => {
      const result = {
        ...nodeSchema,
        content: nodeSchema.content({ filteredItems, items: arrayOfGroupedAndFilteredItems }),
        shouldShowFallback: nodeSchema.shouldShowFallback({
          filteredItems,
          items: arrayOfGroupedAndFilteredItems,
        }),
        nodes: nodeSchema.nodes?.flatMap(node =>
          generateNodes({ items: arrayOfGroupedAndFilteredItems, nodeSchema: node })
        ),
        id: `${nodeSchema.id}-${i}`,
      };
      if (result.nodes === undefined) {
        delete result.nodes;
      }
      return result;
    });
  };

  const nodes = generateNodes({ items: displayMeasurements, nodeSchema });

  return (
    <>
      <div
        className="invisible-scrollbar w-max overflow-y-auto overflow-x-hidden"
        ref={measurementsPanelRef}
        data-cy={'measurements-panel'}
      >
        {nodes.map(node => (
          <ul key={node.id}>
            <RecursiveStructure node={node} />
          </ul>
        ))}
      </div>
    </>
  );
}

function RecursiveStructure({ node }: { node: Node }) {
  const hasChildren = Array.isArray(node.nodes);

  if (node.shouldShowFallback && node.fallback) {
    return node.fallback;
  }

  return (
    <li
      key={node.id}
      className="w-full"
    >
      <span className="flex w-full grow items-center gap-1.5 py-1">
        <node.content>
          {hasChildren && (
            <ul className="w-full grow">
              {node.nodes?.map(node => (
                <RecursiveStructure
                  node={node}
                  key={node.id}
                />
              ))}
            </ul>
          )}
        </node.content>
      </span>
    </li>
  );
}
