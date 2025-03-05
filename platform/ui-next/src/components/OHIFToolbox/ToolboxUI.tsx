import React from 'react';
import classnames from 'classnames';

import { PanelSection } from '../../components';
import { ToolSettings } from '../OHIFToolSettings';

const ItemsPerRow = 4;

/**
 * Just refactoring from the toolbox component to make it more readable
 */
function ToolboxUI(props: withAppTypes) {
  const { toolbarButtons = [], numRows, servicesManager, title, useCollapsedPanel = true } = props;
  const { toolbarService } = servicesManager.services;

  const findActiveToolOptions = toolbarButtons => {
    for (const tool of toolbarButtons) {
      if (tool.componentProps.isActive) {
        return tool.componentProps.options;
      }

      if (tool.componentProps.buttonSection) {
        const buttonProps = toolbarService.getButtonPropsInButtonSection(
          tool.componentProps.buttonSection
        );

        const activeTool = buttonProps.find(item => item.isActive);
        if (!activeTool) {
          continue;
        }

        return activeTool?.options;
      }

      return null;
    }
  };

  const activeToolOptions = findActiveToolOptions(toolbarButtons);

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

              const onInteraction = ({ itemId }) => {
                props.onInteraction({
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
                    {...props}
                    id={id}
                    servicesManager={servicesManager}
                    onInteraction={onInteraction}
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
