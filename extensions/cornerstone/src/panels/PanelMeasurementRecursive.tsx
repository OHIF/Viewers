import React, { useEffect, useRef } from 'react';
import { CommandsManager, ServicesManager, utils } from '@ohif/core';
import { MeasurementTable } from '@ohif/ui-next';
import debounce from 'lodash.debounce';
import { useMeasurements } from '../hooks/useMeasurements';
import { StudySummaryFromMetadata } from '../components/StudySummaryFromMetadata';
import { PanelAccordion } from '../components/CollapsibleStudySummaryFromMetadata';

const { groupByStudy, groupIntoSingleGroup } = utils.MeasurementGroupings;

export type withAppAndFilters = withAppTypes & {
  measurementFilter: (item) => boolean;
  groupingFunction?: ({
    servicesManager,
    commandsManager,
  }: {
    servicesManager?: ServicesManager;
    commandsManager?: CommandsManager;
  }) => (groupedMeasurements: Map<string, object[]>, item) => Map<string, object[]>;
  title: string;
};

const { filterAdditionalFindings, filterAny } = utils.MeasurementFilters;

export default function PanelMeasurement({
  servicesManager,
  commandsManager,
  customHeader,
  measurementFilter = filterAny,
  groupingFunction,
  title,
}: withAppAndFilters): React.ReactNode {
  const measurementsPanelRef = useRef(null);

  const { measurementService } = servicesManager.services;

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

  const additionalFilter = filterAdditionalFindings(measurementService);

  const nodeSchema = {
    id: 'root',
    groupingFunction: groupByStudy,
    shouldShowFallback: ({ items }) => items.length === 0,
    fallback: (
      <div className="text-primary-light mb-1 flex flex-1 items-center px-2 py-2 text-base">
        No measurements recursive
      </div>
    ),
    content: ({ items }) => {
      return ({ children }) => (
        <PanelAccordion
          header={<StudySummaryFromMetadata StudyInstanceUID={items?.[0]?.referenceStudyUID} />}
        >
          {children}
        </PanelAccordion>
      );
    },
    nodes: [
      {
        id: 'measurements',
        filterFunction: item => !additionalFilter(item) && measurementFilter(item),
        shouldShowFallback: ({ filteredItems }) => filteredItems.length === 0,
        content:
          ({ filteredItems }) =>
          () => (
            <MeasurementTable
              title={title ? title : `Measurements`}
              data={filteredItems}
              {...onArgs}
            >
              <MeasurementTable.Body />
            </MeasurementTable>
          ),
      },
      {
        id: 'additionalFindings',
        filterFunction: item => additionalFilter(item) && measurementFilter(item),
        shouldShowFallback: ({ filteredItems }) => filteredItems.length === 0,
        fallback: <></>,
        content:
          ({ filteredItems }) =>
          () => (
            <MeasurementTable
              key="additional"
              data={filteredItems}
              title={`Additional Findings`}
              {...onArgs}
            >
              <MeasurementTable.Body />
            </MeasurementTable>
          ),
      },
    ],
  };

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

  const onArgs = {
    onClick: jumpToImage,
    onDelete: removeMeasurement,
    onToggleVisibility: toggleVisibilityMeasurement,
    onToggleLocked: toggleLockMeasurement,
    onRename: renameMeasurement,
  };

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

type Node = {
  id: string;
  content: React.ReactNode;
  shouldShowFallback: boolean;
  fallback?: React.ReactNode;
  nodes?: Node[];
};

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
