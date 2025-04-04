import React from 'react';
import classnames from 'classnames';

import { PanelSection } from '../../components';
import { ToolSettings } from '../OHIFToolSettings';

const ItemsPerRow = 4;

interface ToolbarButton {
  id: string;
  Component: React.ComponentType<{
    id: string;
    onInteraction: (details: { itemId: string }) => void;
    size: string;
  }>;
  componentProps: {
    isActive?: boolean;
    buttonSection?: string;
    options?: unknown;
  };
}

interface ToolboxProps {
  toolbarButtons: ToolbarButton[];
  numRows: number;
  title?: string;
  useCollapsedPanel?: boolean;
  onInteraction?: (details: { itemId: string }) => void;
  activeToolOptions?: unknown;
}

function ToolboxUI(props: ToolboxProps) {
  const {
    toolbarButtons = [],
    numRows,
    title,
    useCollapsedPanel = true,
    onInteraction,
    activeToolOptions,
  } = props;

  const render = () => {
    return (
      <>
        <div className="flex flex-col">
          <div className="bg-muted mt-0.5 flex flex-wrap space-x-2 py-2 px-1">
            {toolbarButtons.map((toolDef, index) => {
              if (!toolDef) {
                return null;
              }

              const { id, Component, componentProps } = toolDef;
              const isLastRow = Math.floor(index / ItemsPerRow) + 1 === numRows;

              const toolClasses = `ml-1 ${isLastRow ? '' : 'mb-2'}`;

              const handleInteraction = ({ itemId }: { itemId: string }) => {
                onInteraction?.({
                  itemId,
                });
              };

              return (
                <div
                  key={id}
                  className={classnames({
                    [toolClasses]: true,
                  })}
                >
                  <Component
                    {...componentProps}
                    id={id}
                    onInteraction={handleInteraction}
                    size="toolbox"
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-primary-dark h-auto px-2">
          {activeToolOptions && <ToolSettings options={activeToolOptions} />}
        </div>
      </>
    );
  };

  return (
    <>
      {useCollapsedPanel ? (
        <PanelSection>
          <PanelSection.Header>
            <span>{title}</span>
          </PanelSection.Header>
          <PanelSection.Content className="flex-shrink-0">{render()}</PanelSection.Content>
        </PanelSection>
      ) : (
        render()
      )}
    </>
  );
}

export { ToolboxUI };
